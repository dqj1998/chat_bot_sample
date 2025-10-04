from __future__ import annotations

from .types import IntermediateInfo, Profile
from .model_provider import build_model

try:
    from strands import Agent
except Exception:
    Agent = None  # type: ignore


class ResponseBuilder:
    async def build_response(self, info: IntermediateInfo, profile: Profile) -> str:
        if Agent is not None:
            model = build_model()
            agent = Agent(model=model)
            sys = (
                "You are a helpful assistant. Tailor the answer to the user's role and skills. "
                "Summarize briefly and include a 'Recommended contact' section with the selected person, "
                "their department, and preferred contact."
            )
            user = (
                f"Role: {profile.get('role')}\n"
                f"Skills: {profile.get('skills')}\n"
                f"Selected person: {info.selected_person}\n"
                f"Search summary: {info.search_summary}\n"
                "Provide a concise markdown answer."
            )
            resp = await agent.run_async(f"{sys}\n{user}")
            text = str(getattr(resp, "message", "")).strip()
            if text:
                return text

        person = info.selected_person
        parts = [
            f"## 回答（{profile.get('role') or 'ユーザー'}向け）",
            "- 入力内容に基づき、社内情報を要約しました。",
            "",
            "### 推奨コンタクト",
            f"- 氏名: {person['name']}",
            f"- 所属: {person['department']}",
            f"- 連絡先: {person['contact']['type']}: {person['contact']['value']}",
            "",
            "### 参考情報",
        ]
        for item in info.search_summary:
            parts.append(f"- {item.get('title','')}: {item.get('snippet','')}")
        return "\n".join(parts)
