from fastapi import APIRouter
from app.api.v1 import projects, use_cases, prompts, playground, datasets, evaluations, exports

api_router = APIRouter()

api_router.include_router(projects.router)
api_router.include_router(use_cases.router)
api_router.include_router(prompts.router)
api_router.include_router(playground.router)
api_router.include_router(datasets.router)
api_router.include_router(evaluations.router)
api_router.include_router(exports.router)


@api_router.get("/")
async def root():
    return {"message": "Prompt Playground API v1"}
