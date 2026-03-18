from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB]
    # Create indexes
    await db.users.create_index("username", unique=True)
    await db.users.create_index("email", unique=True)
    await db.stories.create_index("slug", unique=True)
    await db.stories.create_index([("title", "text"), ("description", "text")])
    await db.stories.create_index("author_id")
    await db.stories.create_index("genre")
    await db.stories.create_index([("view_count", -1)])
    await db.stories.create_index([("like_count", -1)])
    await db.chapters.create_index([("story_id", 1), ("number", 1)])
    await db.progress.create_index([("user_id", 1), ("story_id", 1)], unique=True)
    await db.comments.create_index([("story_id", 1), ("created_at", -1)])
    print("✓ MongoDB connected")


async def close_db():
    global client
    if client:
        client.close()


def get_db():
    return db
