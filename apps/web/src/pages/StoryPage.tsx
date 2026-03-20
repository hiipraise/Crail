import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart,
  Bookmark,
  Share2,
  BookOpen,
  Eye,
  ChevronRight,
  Clock,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { storiesApi, chaptersApi } from "@/lib/api";
import { formatNumber, formatWordCount, formatDate } from "@/lib/utils";
import type { Story, ChapterListItem } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";

/** Normalize a raw chapter doc from API (snake_case → camelCase) */
function normalizeChapter(raw: Record<string, any>): ChapterListItem {
  return {
    _id: raw._id,
    number: raw.number,
    title: raw.title ?? "",
    wordCount: raw.wordCount ?? raw.word_count ?? 0,
    isPublished: raw.isPublished ?? raw.is_published ?? false,
    publishedAt: raw.publishedAt ?? raw.published_at,
    scheduledAt: raw.scheduledAt ?? raw.scheduled_at,
  };
}

/** Normalize a raw story doc from API */
function normalizeStory(raw: Record<string, any>): Story {
  return {
    ...raw,
    coverImage: raw.coverImage ?? raw.cover_image,
    viewCount: raw.viewCount ?? raw.view_count ?? 0,
    likeCount: raw.likeCount ?? raw.like_count ?? 0,
    commentCount: raw.commentCount ?? raw.comment_count ?? 0,
    bookmarkCount: raw.bookmarkCount ?? raw.bookmark_count ?? 0,
    chapterCount: raw.chapterCount ?? raw.chapter_count ?? 0,
    wordCount: raw.wordCount ?? raw.word_count ?? 0,
    contentRating: raw.contentRating ?? raw.content_rating ?? "everyone",
    isPublished: raw.isPublished ?? raw.is_published ?? false,
    aiTags: raw.aiTags ?? raw.ai_tags ?? [],
    genre: raw.genre ?? [],
    tags: raw.tags ?? [],
    author: raw.author
      ? {
          ...raw.author,
          displayName:
            raw.author.displayName ??
            raw.author.display_name ??
            raw.author.username ??
            "",
        }
      : {
          _id: "",
          username: "",
          displayName: "Unknown",
          email: "",
          followersCount: 0,
          followingCount: 0,
          storiesCount: 0,
          joinedAt: "",
        },
  } as unknown as Story;
}

export default function StoryPage() {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { addToast } = useUIStore();
  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<ChapterListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!storyId) return;
      setLoading(true);
      try {
        // 1. Fetch story by slug
        const storyRes = await storiesApi.bySlug(storyId);
        const fetched = normalizeStory(storyRes.data);
        setStory(fetched);

        // 2. Fetch chapters using the real _id (never the slug)
        const chapRes = await chaptersApi.list(fetched._id);
        const rawItems: Record<string, any>[] =
          chapRes.data.items ?? chapRes.data ?? [];
        setChapters(rawItems.map(normalizeChapter));
      } catch (err) {
        console.error("StoryPage load error:", err);
        navigate("/explore", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [storyId]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setLiked(!liked);
    try {
      await storiesApi.like(story!._id);
    } catch {
      setLiked(liked);
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setBookmarked(!bookmarked);
    addToast({
      title: bookmarked ? "Removed from library" : "Added to library",
      variant: "success",
    });
    try {
      await storiesApi.bookmark(story!._id);
    } catch {
      setBookmarked(bookmarked);
    }
  };

  if (loading) return <StoryPageSkeleton />;
  if (!story) return null;

  const isAuthor = user && story.author && user._id === story.author._id;
  // Author sees all chapters; readers only see published ones
  const visibleChapters = isAuthor
    ? chapters
    : chapters.filter((c) => c.isPublished);

  const firstChapter =
    visibleChapters.find((c) => c.isPublished) ??
    (isAuthor ? visibleChapters[0] : null);

  return (
    <div className="pb-24 md:pb-8">
      {/* Cover hero */}
      <div className="relative">
        {story.coverImage && (
          <div className="h-52 overflow-hidden">
            <img
              src={story.coverImage}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-pampas via-pampas/60 to-transparent" />
          </div>
        )}

        <div
          className={`px-4 ${story.coverImage ? "-mt-20 relative z-10" : "pt-6"}`}
        >
          <div className="flex gap-4">
            <div className="w-24 h-36 shrink-0 rounded-lg overflow-hidden shadow-paper-lg border-2 border-white">
              {story.coverImage ? (
                <img
                  src={story.coverImage}
                  alt={story.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-crail-100 to-crail-200 flex items-center justify-center">
                  <span className="font-serif text-3xl font-bold text-crail-400">
                    {story.title?.slice(0, 1) ?? "?"}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pt-2">
              <h1 className="font-serif text-xl font-bold leading-tight mb-1">
                {story.title}
              </h1>
              {story.author && (
                <Link
                  to={`/profile/${story.author.username}`}
                  className="flex items-center gap-1.5 mb-2"
                >
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={story.author.avatar} />
                    <AvatarFallback className="text-[8px]">
                      {(story.author.displayName ?? "?").slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-crail font-medium">
                    {story.author.displayName}
                  </span>
                </Link>
              )}
              <div className="flex flex-wrap gap-1">
                {story.genre.map((g) => (
                  <Badge key={g} variant="genre" className="text-[10px]">
                    {g}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 px-4 mt-4 text-sm text-cloudy-500">
        <span className="flex items-center gap-1">
          <Eye className="h-4 w-4" />
          {formatNumber(story.viewCount)}
        </span>
        <span className="flex items-center gap-1">
          <Heart className="h-4 w-4" />
          {formatNumber(story.likeCount)}
        </span>
        <span className="flex items-center gap-1">
          <BookOpen className="h-4 w-4" />
          {story.chapterCount ?? chapters.length} ch
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {formatWordCount(story.wordCount)}
        </span>
        <span
          className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
            story.status === "completed"
              ? "bg-blue-100 text-blue-700"
              : story.status === "ongoing"
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
          }`}
        >
          {story.status ?? "draft"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 mt-4">
        {firstChapter ? (
          <Link
            to={`/read/${story._id}/${firstChapter._id}`}
            className="flex-1"
          >
            <Button className="w-full gap-2">
              <BookOpen className="h-4 w-4" /> Start Reading
            </Button>
          </Link>
        ) : (
          <Button className="flex-1" disabled>
            {isAuthor ? "Add a chapter to begin" : "No chapters yet"}
          </Button>
        )}
        <Button
          size="icon"
          variant={liked ? "default" : "outline"}
          onClick={handleLike}
        >
          <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
        </Button>
        <Button
          size="icon"
          variant={bookmarked ? "default" : "outline"}
          onClick={handleBookmark}
        >
          <Bookmark className={`h-5 w-5 ${bookmarked ? "fill-current" : ""}`} />
        </Button>
        <Button size="icon" variant="outline">
          <Share2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Author link to editor */}
      {isAuthor && (
        <div className="px-4 mt-3">
          <Link to={`/write/${story._id}`}>
            <Button variant="outline" size="sm" className="w-full gap-2">
              Continue writing
            </Button>
          </Link>
        </div>
      )}

      {/* Description */}
      {story.description && (
        <div className="px-4 mt-5">
          <h2 className="font-serif text-base font-semibold mb-2">About</h2>
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
            {story.description}
          </p>
        </div>
      )}

      {/* AI Tags */}
      {story.aiTags && story.aiTags.length > 0 && (
        <div className="px-4 mt-4 flex flex-wrap gap-1.5">
          {story.aiTags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-pampas-dark text-cloudy-600 px-2 py-1 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <Separator className="mx-4 mt-5" />

      {/* Chapters list */}
      <div className="px-4 mt-4">
        <h2 className="font-serif text-base font-semibold mb-3">
          Chapters ({visibleChapters.length})
          {isAuthor &&
            chapters.length > 0 &&
            !chapters.every((c) => c.isPublished) && (
              <span className="ml-2 text-xs font-normal text-cloudy-400">
                ({chapters.filter((c) => !c.isPublished).length} unpublished)
              </span>
            )}
        </h2>

        {visibleChapters.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-cloudy-400">
              {isAuthor
                ? "No chapters yet. Go to the writer to add one."
                : "No published chapters yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {visibleChapters.map((chapter) => {
              const wc = chapter.wordCount ?? (chapter as any).word_count ?? 0;
              const published =
                chapter.isPublished ?? (chapter as any).is_published ?? false;
              const pubDate =
                chapter.publishedAt ?? (chapter as any).published_at;

              return (
                <Link
                  key={chapter._id}
                  to={`/read/${story._id}/${chapter._id}`}
                  className="flex items-center justify-between py-3 border-b border-cloudy-100 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        Chapter {chapter.number}: {chapter.title}
                      </p>
                      {!published && (
                        <span className="shrink-0 flex items-center gap-0.5 text-[10px] text-cloudy-400 bg-pampas-dark px-1.5 py-0.5 rounded-full">
                          <Lock className="h-2.5 w-2.5" /> Draft
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-cloudy-400 mt-0.5">
                      {formatWordCount(wc)}
                      {pubDate ? ` · ${formatDate(pubDate)}` : ""}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-cloudy-300 shrink-0 ml-2" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Content warning */}
      {story.contentRating && story.contentRating !== "everyone" && (
        <div className="mx-4 mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Rated <strong>{story.contentRating}</strong>. Reader discretion
            advised.
          </p>
        </div>
      )}
    </div>
  );
}

function StoryPageSkeleton() {
  return (
    <div className="px-4 pb-24 pt-6 space-y-4">
      <div className="flex gap-4">
        <Skeleton className="w-24 h-36 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="space-y-3 pt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
