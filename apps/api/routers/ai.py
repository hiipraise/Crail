from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import httpx
import asyncio
import io
from bson import ObjectId

from database import get_db
from utils.auth import get_current_user
from utils.serializers import serialize_doc
from config import settings

router = APIRouter()

try:
    from groq import Groq
    groq_client = Groq(api_key=settings.GROQ_API_KEY)
except Exception:
    groq_client = None


class TagRequest(BaseModel):
    content: str


class GrammarRequest(BaseModel):
    content: str


class PreviouslyRequest(BaseModel):
    storyId: str
    upToChapter: int


class CoverRequest(BaseModel):
    summary: str


def groq_chat(messages: list, max_tokens: int = 1000) -> str:
    if not groq_client:
        raise HTTPException(status_code=503, detail="AI service unavailable")
    try:
        response = groq_client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=messages,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI error: {str(e)}")


@router.post("/tags")
async def generate_tags(body: TagRequest, current_user=Depends(get_current_user)):
    content = body.content[:3000]  # Limit context
    result = groq_chat([
        {"role": "system", "content": "You are a story tagging assistant. Generate 5-10 relevant hashtag-style tags for the given story excerpt. Return only a JSON array of strings, no explanation. Examples: [\"SlowBurn\", \"ChosenOne\", \"Grimdark\", \"MagicSystem\"]"},
        {"role": "user", "content": f"Tag this story excerpt:\n\n{content}"}
    ])
    try:
        import json
        tags = json.loads(result)
    except Exception:
        tags = [t.strip().strip('"').lstrip("#") for t in result.split(",") if t.strip()]
    return {"tags": tags}


@router.post("/grammar")
async def grammar_check(body: GrammarRequest, current_user=Depends(get_current_user)):
    content = body.content[:3000]
    result = groq_chat([
        {"role": "system", "content": "You are a creative writing editor. Analyze the text for grammar, tone, pacing, and style. Return a JSON object with keys: 'issues' (array of {line, issue, suggestion}), 'tone', 'readability_score' (1-10), 'suggestions' (array of strings)."},
        {"role": "user", "content": content}
    ], max_tokens=1500)
    try:
        import json
        return json.loads(result)
    except Exception:
        return {"raw": result}


@router.post("/previously")
async def previously_on(body: PreviouslyRequest, current_user=Depends(get_current_user)):
    db = get_db()
    # Gather last few chapter contents
    chapters = await db.chapters.find(
        {"story_id": body.storyId, "is_published": True, "number": {"$lte": body.upToChapter}}
    ).sort("number", -1).limit(3).to_list(3)

    combined = "\n\n".join(
        f"Chapter {c['number']}: {c['title']}\n{c['content'][:800]}" for c in reversed(chapters)
    )

    result = groq_chat([
        {"role": "system", "content": "You write brief 'Previously on...' recaps for serialized fiction. Write 2-4 sentences summarizing the key plot points. Be engaging and avoid spoiling too much. Write in present tense."},
        {"role": "user", "content": f"Write a 'Previously on...' for these chapters:\n\n{combined}"}
    ])
    return {"summary": result}


@router.post("/analyze/{story_id}")
async def analyze_story(story_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    story = await db.stories.find_one({"_id": ObjectId(story_id)})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    # Get first few chapters for analysis
    chapters = await db.chapters.find(
        {"story_id": story_id, "is_published": True}
    ).sort("number", 1).limit(3).to_list(3)

    content = f"Title: {story['title']}\n\nDescription: {story.get('description', '')}\n\n"
    for c in chapters:
        content += f"Chapter {c['number']}: {c['title']}\n{c['content'][:1000]}\n\n"

    result = groq_chat([
        {"role": "system", "content": "You are a literary analysis AI. Analyze the story and return a JSON object with: 'theme' (main themes), 'tone' (narrative tone), 'pacing' (slow/medium/fast), 'strengths' (array of 3 strengths), 'improvements' (array of 3 suggestions), 'target_audience', 'comparable_works' (similar published works)."},
        {"role": "user", "content": content}
    ], max_tokens=1500)

    try:
        import json
        return json.loads(result)
    except Exception:
        return {"analysis": result}


@router.post("/cover")
async def generate_cover(body: CoverRequest, current_user=Depends(get_current_user)):
    """Generate story cover using Pollinations.ai (free, no API key)."""
    # Build a prompt from the summary
    prompt_text = groq_chat([
        {"role": "system", "content": "Generate a short, vivid image generation prompt (max 20 words) for a book cover based on this story summary. Focus on mood, setting, and visual elements. No text in image."},
        {"role": "user", "content": body.summary[:500]}
    ], max_tokens=60)

    import urllib.parse
    encoded = urllib.parse.quote(prompt_text.strip())
    image_url = f"{settings.POLLINATIONS_BASE}/{encoded}?width=400&height=600&seed={hash(body.summary) % 10000}"

    return {
        "prompt": prompt_text,
        "url": image_url,
        "animated": None  # GIF support can be added via stable diffusion
    }


@router.get("/tts/{chapter_id}")
async def text_to_speech(chapter_id: str):
    """Generate TTS audio using edge-tts (free, no API key needed)."""
    db = get_db()
    chapter = await db.chapters.find_one({"_id": ObjectId(chapter_id)})
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    content = chapter.get("content", "")[:5000]  # Limit for demo

    try:
        import edge_tts
        communicate = edge_tts.Communicate(content, voice="en-US-JennyNeural")
        audio_buffer = io.BytesIO()

        async def write_audio():
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_buffer.write(chunk["data"])

        await write_audio()
        audio_buffer.seek(0)

        return StreamingResponse(
            audio_buffer,
            media_type="audio/mpeg",
            headers={"Content-Disposition": f"inline; filename=chapter-{chapter_id}.mp3"}
        )
    except ImportError:
        raise HTTPException(status_code=503, detail="TTS service not available")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")
