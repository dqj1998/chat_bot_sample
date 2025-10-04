import os
from dataclasses import dataclass
from typing import List, Dict, Any

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "people_graph.txt")


@dataclass
class Person:
    name: str
    department: str
    preferred_contact: Dict[str, str]
    expertise: List[str]
    influences: Dict[str, float]


class PeopleGraph:
    def __init__(self, people: List[Person]):
        self.people = people
        self._by_name = {p.name: p for p in people}

    @classmethod
    def from_file(cls, path: str = DATA_PATH) -> "PeopleGraph":
        people: List[Person] = []
        if not os.path.exists(path):
            return cls(people)
        chunks: List[str] = []
        with open(path, "r", encoding="utf-8") as f:
            block: List[str] = []
            for line in f:
                line = line.rstrip("\n")
                if line.strip() == "---":
                    if block:
                        chunks.append("\n".join(block))
                        block = []
                else:
                    block.append(line)
            if block:
                chunks.append("\n".join(block))

        for ch in chunks:
            lines = [l.strip() for l in ch.splitlines() if l.strip()]
            name = department = ""
            preferred_contact: Dict[str, str] = {}
            expertise: List[str] = []
            influences: Dict[str, float] = {}
            i = 0
            while i < len(lines):
                line = lines[i]
                if line.startswith("name:"):
                    name = line.split(":", 1)[1].strip()
                elif line.startswith("department:"):
                    department = line.split(":", 1)[1].strip()
                elif line.startswith("preferred_contact:"):
                    val = line.split(":", 1)[1].strip()
                    if ":" in val:
                        t, v = val.split(":", 1)
                        preferred_contact = {"type": t.strip(), "value": v.strip()}
                elif line.startswith("contacts:"):
                    i += 1
                    while i < len(lines) and lines[i].startswith("-"):
                        i += 1
                    i -= 1
                elif line.startswith("influences:"):
                    i += 1
                    while i < len(lines) and lines[i].startswith("-"):
                        item = lines[i][1:].strip()
                        if ":" in item:
                            n, s = item.split(":", 1)
                            try:
                                influences[n.strip()] = float(s.strip())
                            except Exception:
                                pass
                        i += 1
                    i -= 1
                elif line.startswith("expertise:"):
                    val = line.split(":", 1)[1].strip()
                    expertise = [x.strip() for x in val.split(",") if x.strip()]
                i += 1
            if name:
                people.append(Person(name=name, department=department, preferred_contact=preferred_contact, expertise=expertise, influences=influences))
        return cls(people)

    def rank_candidates(self, results: List[Any], keywords: List[str]) -> List[Person]:
        kws = {k.lower() for k in keywords}
        scored: List[tuple[Person, float]] = []
        for p in self.people:
            expertise_score = sum(1 for e in p.expertise if e.lower() in kws)
            dept_bonus = 0.5 if any(getattr(r, "department", "").lower() == p.department.lower() for r in results) else 0
            influence = sum(self._by_name.get(n, Person(n, "", {}, [], {})).influences.get(p.name, 0.0) for n in p.influences.keys())
            score = expertise_score + dept_bonus + 0.1 * influence
            scored.append((p, score))
        scored.sort(key=lambda x: x[1], reverse=True)
        return [p for p, _ in scored] if scored else []

    def fallback(self) -> Person:
        return self.people[0] if self.people else Person(name="TBD", department="TBD", preferred_contact={"type": "email", "value": "tbd@example.com"}, expertise=[], influences={})
from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, List, Tuple
import os
import re

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
GRAPH_PATH = os.path.join(DATA_DIR, "people_graph.txt")


@dataclass
class GraphPerson:
    name: str
    department: str
    contacts: List[Tuple[str, str]]
    preferred_contact: Tuple[str, str]
    influences: Dict[str, float]
    expertise: List[str]


class PeopleGraph:
    def __init__(self, people: Dict[str, GraphPerson]):
        self.people = people

    @classmethod
    def from_file(cls, path: str = GRAPH_PATH) -> "PeopleGraph":
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
        blocks = [b.strip() for b in text.split("---") if b.strip()]
        people: Dict[str, GraphPerson] = {}
        for block in blocks:
            name = _extract_line_value(block, r"^name:\s*(.+)$")
            department = _extract_line_value(block, r"^department:\s*(.+)$")
            preferred_raw = _extract_line_value(block, r"^preferred_contact:\s*(.+)$")
            contacts = _extract_list_pairs(block, r"^\s*-\s*([a-zA-Z]+):\s*(.+)$", section="contacts:")
            infl_pairs = _extract_list_pairs(block, r"^\s*-\s*([^:]+):\s*([0-9.]+)$", section="influences:")
            influences = {k.strip(): float(v) for k, v in infl_pairs}
            expertise_line = _extract_line_value(block, r"^expertise:\s*(.+)$")
            expertise = [x.strip() for x in (expertise_line or "").split(",") if x.strip()]
            pref = ("unknown", "")
            if preferred_raw and ":" in preferred_raw:
                t, v = preferred_raw.split(":", 1)
                pref = (t.strip(), v.strip())
            gp = GraphPerson(
                name=name or "Unknown",
                department=department or "",
                contacts=contacts,
                preferred_contact=pref,
                influences=influences,
                expertise=expertise,
            )
            people[gp.name] = gp
        return cls(people)

    def rank_candidates(self, results: List[dict], keywords: List[str]) -> List[GraphPerson]:
        kw = {k.lower() for k in keywords}
        scores: List[tuple[float, GraphPerson]] = []
        centrality = {p.name: sum(p.influences.values()) for p in self.people.values()}
        for p in self.people.values():
            exp_overlap = len({e.lower() for e in p.expertise} & kw)
            dept_bonus = 0.5 if any(p.department.lower() in (r.get("department", "").lower()) for r in results) else 0.0
            score = exp_overlap + centrality.get(p.name, 0.0) + dept_bonus
            scores.append((score, p))
        scores.sort(key=lambda x: x[0], reverse=True)
        return [p for _, p in scores]


def _extract_line_value(block: str, pattern: str) -> str | None:
    for line in block.splitlines():
        m = re.match(pattern, line.strip())
        if m:
            return m.group(1).strip()
    return None


def _extract_list_pairs(block: str, item_pattern: str, section: str) -> List[tuple[str, str]]:
    items: List[tuple[str, str]] = []
    lines = block.splitlines()
    in_section = False
    for line in lines:
        if line.strip().startswith(section):
            in_section = True
            continue
        if in_section:
            if line.strip().startswith("-"):
                m = re.match(item_pattern, line.strip())
                if m:
                    items.append((m.group(1).strip(), m.group(2).strip()))
            else:
                if line.strip() != "":
                    in_section = False
    return items
