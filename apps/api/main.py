# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from database import connect_db, close_db
from routers import auth, stories, chapters, progress, comments, comment_actions, users, ai, media

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="Crail API",
    version="1.0.0",
    description="Story writing and reading platform API",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://crail.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(stories.router, prefix="/stories", tags=["stories"])
app.include_router(chapters.router, prefix="/stories/{story_id}/chapters", tags=["chapters"])
app.include_router(progress.router, prefix="/progress", tags=["progress"])
app.include_router(comments.router, prefix="/stories/{story_id}/comments", tags=["comments"])
app.include_router(comment_actions.router, prefix="/comments", tags=["comments"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(media.router, prefix="/media", tags=["media"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "crail-api"}
