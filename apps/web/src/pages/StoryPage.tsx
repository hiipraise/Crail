import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Heart, Bookmark, Share2, BookOpen, Eye, Star,
  ChevronRight, Users, Clock, AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { storiesApi, chaptersApi } from '@/lib/api'
import { formatNumber, formatWordCount, formatDate } from '@/lib/utils'
import type { Story, ChapterListItem } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

export default function StoryPage() {
  const { storyId } = useParams<{ storyId: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { addToast } = useUIStore()
  const [story, setStory] = useState<Story | null>(null)
  const [chapters, setChapters] = useState<ChapterListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!storyId) return
      try {
        const [storyRes, chapRes] = await Promise.all([
          storiesApi.bySlug(storyId),
          chaptersApi.list(storyId)
        ])
        setStory(storyRes.data)
        setChapters(chapRes.data.items ?? [])
      } catch {
        navigate('/explore', { replace: true })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [storyId])

  const handleLike = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    setLiked(!liked)
    try { await storiesApi.like(story!._id) } catch { setLiked(liked) }
  }

  const handleBookmark = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    setBookmarked(!bookmarked)
    addToast({ title: bookmarked ? 'Removed from library' : 'Added to library', variant: 'success' })
    try { await storiesApi.bookmark(story!._id) } catch { setBookmarked(bookmarked) }
  }

  if (loading) return <StoryPageSkeleton />

  if (!story) return null

  const firstChapter = chapters.find((c) => c.isPublished)

  return (
    <div className="pb-24 md:pb-8">
      {/* Cover hero */}
      <div className="relative">
        {story.coverImage && (
          <div className="h-52 overflow-hidden">
            <img src={story.coverImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-pampas via-pampas/60 to-transparent" />
          </div>
        )}

        <div className={`px-4 ${story.coverImage ? '-mt-20 relative z-10' : 'pt-6'}`}>
          <div className="flex gap-4">
            {/* Cover thumbnail */}
            <div className="w-24 h-36 shrink-0 rounded-lg overflow-hidden shadow-paper-lg border-2 border-white">
              {story.coverImage ? (
                <img src={story.coverImage} alt={story.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-crail-100 to-crail-200 flex items-center justify-center">
                  <span className="font-serif text-3xl font-bold text-crail-400">
                    {story.title.slice(0, 1)}
                  </span>
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="flex-1 min-w-0 pt-2">
              <h1 className="font-serif text-xl font-bold leading-tight mb-1">{story.title}</h1>
              <Link to={`/profile/${story.author.username}`} className="flex items-center gap-1.5 mb-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={story.author.avatar} />
                  <AvatarFallback className="text-[8px]">{story.author.displayName.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-crail font-medium">{story.author.displayName}</span>
              </Link>
              <div className="flex flex-wrap gap-1">
                {story.genre.map((g) => (
                  <Badge key={g} variant="genre" className="text-[10px]">{g}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 px-4 mt-4 text-sm text-cloudy-500">
        <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{formatNumber(story.viewCount)}</span>
        <span className="flex items-center gap-1"><Heart className="h-4 w-4" />{formatNumber(story.likeCount)}</span>
        <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" />{story.chapterCount} ch</span>
        <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{formatWordCount(story.wordCount)}</span>
        <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
          story.status === 'completed' ? 'bg-blue-100 text-blue-700' :
          story.status === 'ongoing' ? 'bg-green-100 text-green-700' :
          'bg-amber-100 text-amber-700'
        }`}>{story.status}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 mt-4">
        {firstChapter ? (
          <Link to={`/read/${story._id}/${firstChapter._id}`} className="flex-1">
            <Button className="w-full gap-2">
              <BookOpen className="h-4 w-4" /> Start Reading
            </Button>
          </Link>
        ) : (
          <Button className="flex-1" disabled>No chapters yet</Button>
        )}
        <Button
          size="icon"
          variant={liked ? 'default' : 'outline'}
          onClick={handleLike}
          className={liked ? 'text-white' : ''}
        >
          <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
        </Button>
        <Button
          size="icon"
          variant={bookmarked ? 'default' : 'outline'}
          onClick={handleBookmark}
        >
          <Bookmark className={`h-5 w-5 ${bookmarked ? 'fill-current' : ''}`} />
        </Button>
        <Button size="icon" variant="outline">
          <Share2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Description */}
      <div className="px-4 mt-5">
        <h2 className="font-serif text-base font-semibold mb-2">About</h2>
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
          {story.description}
        </p>
      </div>

      {/* AI Tags */}
      {story.aiTags && story.aiTags.length > 0 && (
        <div className="px-4 mt-4">
          <div className="flex flex-wrap gap-1.5">
            {story.aiTags.map((tag) => (
              <span key={tag} className="text-xs bg-pampas-dark text-cloudy-600 px-2 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <Separator className="mx-4 mt-5" />

      {/* Chapters */}
      <div className="px-4 mt-4">
        <h2 className="font-serif text-base font-semibold mb-3">
          Chapters ({chapters.filter((c) => c.isPublished).length})
        </h2>
        <div className="space-y-1">
          {chapters.filter((c) => c.isPublished).map((chapter) => (
            <Link
              key={chapter._id}
              to={`/read/${story._id}/${chapter._id}`}
              className="flex items-center justify-between py-3 border-b border-cloudy-100 last:border-0"
            >
              <div>
                <p className="text-sm font-medium">Chapter {chapter.number}: {chapter.title}</p>
                <p className="text-xs text-cloudy-400 mt-0.5">
                  {formatWordCount(chapter.wordCount)} · {formatDate(chapter.publishedAt ?? '')}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-cloudy-300 shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Content warning */}
      {story.contentRating !== 'everyone' && (
        <div className="mx-4 mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            This story is rated <strong>{story.contentRating}</strong>. Reader discretion advised.
          </p>
        </div>
      )}
    </div>
  )
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
      <div className="flex gap-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-16" /></div>
      <div className="flex gap-2"><Skeleton className="h-10 flex-1" /><Skeleton className="h-10 w-10" /><Skeleton className="h-10 w-10" /></div>
      <Skeleton className="h-24 w-full" />
    </div>
  )
}
