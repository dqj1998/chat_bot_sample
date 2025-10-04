from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional, List, Any
from agents.info_collector import InfoCollector
from agents.people_finder import PeopleFinder
from agents.response_builder import ResponseBuilder
from agents.search_client import SearchClient

app = FastAPI()

class RunRequest(BaseModel):
    chatId: str
    prompt: str
    profile: Dict[str, Optional[str]]

class SearchRequest(BaseModel):
    keywords: List[str]

@app.post("/search")
async def search(req: SearchRequest):
    results = await SearchClient().search(req.keywords)
    return results

@app.post("/agents/run")
async def run_agents(req: RunRequest):
    try:
        info = await InfoCollector().extract_keywords(req.prompt, req.profile)
        results = await SearchClient().search(info["keywords"])
        intermediate = await PeopleFinder().select_person(results, info["keywords"])
        content = await ResponseBuilder().build_response(intermediate, req.profile)
        return {
            "content": content,
            "debug": {
                "keywords": info["keywords"],
                "selected_person": intermediate["selected_person"],
                "search_summary": intermediate["search_summary"],
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
from __future__ import annotations

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Any

from agents.info_collector import InfoCollector
from agents.people_finder import PeopleFinder
from agents.response_builder import ResponseBuilder
from agents.search_client import SearchClient
from agents.types import SearchResult, IntermediateInfo


app = FastAPI()


class SearchRequest(BaseModel):
    keywords: List[str]


@app.post("/search")
async def search(req: SearchRequest) -> List[SearchResult]:
    results = await SearchClient().search(req.keywords or [])
    return results


class RunRequest(BaseModel):
    chatId: str
    prompt: str
    profile: Dict[str, Optional[str]]


@app.post("/agents/run")
async def run_agents(req: RunRequest) -> Dict[str, Any]:
    try:
        info = await InfoCollector().extract_keywords(req.prompt, req.profile)
        results = await SearchClient().search(info.keywords)
        intermediate: IntermediateInfo = await PeopleFinder().select_person(results, info.keywords)
        content = await ResponseBuilder().build_response(intermediate, req.profile)
        return {
            "content": content,
            "debug": {
                "keywords": info.keywords,
                "selected_person": intermediate.selected_person,
                "search_summary": intermediate.search_summary,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
