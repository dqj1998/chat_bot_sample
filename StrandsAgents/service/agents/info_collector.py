import json
from typing import Optional

from .types import Profile, KeywordsResult
from .model_provider import build_model

try:
    from strands import Agent
except Exception:
    Agent = None  # type: ignore


class InfoCollector:
    async def extract_keywords(self, prompt: str, profile: Profile) -> KeywordsResult:
        keywords = await self._extract_with_llm(prompt, profile)
        if not keywords:
            tokens = [w.strip(",.?!") for w in prompt.split()]
            keywords = [w for w in tokens if len(w) > 3][:6]
        return KeywordsResult(keywords=list(dict.fromkeys(keywords)))

    async def _extract_with_llm(self, prompt: str, profile: Profile) -> Optional[list[str]]:
        if Agent is None:
            return None
        model = build_model()
        agent = Agent(model=model)
        sys = "Extract 3-8 concise search keywords from the user's question. Output ONLY a JSON array of strings."
        user = f"User role: {profile.get('role')}\nSkills: {profile.get('skills')}\nQuestion: {prompt}"
        resp = await agent.run_async(f"{sys}\n{user}")
        text = str(getattr(resp, "message", "")).strip()
        try:
            data = json.loads(text)
            if isinstance(data, list):
                return [str(x).strip() for x in data if str(x).strip()]
        except Exception:
            return None
        return None
