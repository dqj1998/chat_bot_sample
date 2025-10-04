from typing import TypedDict, List, Dict, Any, Optional

Profile = Dict[str, Optional[str]]

class KeywordsResult(TypedDict):
    keywords: List[str]

class SearchResult(TypedDict):
    title: str
    snippet: str
    authors: List[str]
    department: str
    tags: List[str]

class IntermediateInfo(TypedDict):
    selected_person: Dict[str, Any]
    search_summary: List[Dict[str, Any]]
from __future__ import annotations
from typing import List, Dict, Optional, TypedDict, Any
from pydantic import BaseModel


Profile = Dict[str, Optional[str]]


class KeywordsResult(BaseModel):
    keywords: List[str]


class SearchResult(TypedDict):
    title: str
    snippet: str
    authors: List[str]
    department: str
    tags: List[str]


class PersonContact(TypedDict):
    type: str
    value: str


class SelectedPerson(TypedDict):
    name: str
    department: str
    contact: PersonContact


class IntermediateInfo(BaseModel):
    selected_person: SelectedPerson
    search_summary: List[Dict[str, str]]
