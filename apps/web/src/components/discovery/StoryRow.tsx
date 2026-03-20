import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, Heart, BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatNumber, formatDate } from '@/lib/utils'
import type { StoryListItem } from '@/types'

interface Props {
  story: StoryListItem
  index?: number
  rank?: number
}

export default function StoryRow({ story, index = 0, rank }: Props) {
  // Normalize snake_case fallbacks
  const viewCount    = story.viewCount    ?? (story as any).view_count    ?? 0
  const likeCount    = story.likeCount    ?? (story as any).like_count    ?? 0
  const chapterCount = story.chapterCount ?? (story as any).chapter_count ?? 0
  const coverImage   = story.coverImage   ?? (story as any).cover_image
  const updatedAt    = story.updatedAt    ?? (story as any).updated_at    ?? ''
  const genre        = story.genre        ?? []
  const slug         = story.slug         ?? story._id
  const author       = story.author       ?? {} as any
  const displayName  = author.displayName ?? (author as any).display_name ?? 'Unknown'
  const avatar       = author.avatar

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link to={`/story/${slug}`} className="group block">
        <div className="flex gap-3 p-3 rounded-xl bg-white border border-cloudy-200 shadow-card">
          {rank !== undefined && (
            <div className="w-6 shrink-0 flex items-start pt-1">
              <span className="text-sm font-bold text-cloudy-300 font-mono">{rank}</span>
            </div>
          )}

          {/* Cover */}
          <div className="w-14 h-20 shrink-0 rounded-lg overflow-hidden bg-pampas-dark">
            {coverImage ? (
              <img
                src={coverImage}
                alt={story.title}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-crail-50 to-crail-100">
                <span className="font-serif text-xl font-bold text-crail-200">
                  {story.title?.slice(0, 1) ?? '?'}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-serif font-semibold text-sm leading-snug line-clamp-2 mb-1">
              {story.title}
            </h3>

            <div className="flex items-center gap-1.5 mb-1.5">
              <Avatar className="h-4 w-4">
                <AvatarImage src={avatar} />
                <AvatarFallback className="text-[8px]">
                  {displayName.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-cloudy-500">{displayName}</span>
              {updatedAt && (
                <>
                  <span className="text-cloudy-300 text-xs">·</span>
                  <span className="text-xs text-cloudy-400">{formatDate(updatedAt)}</span>
                </>
              )}
            </div>

            {genre.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {genre.slice(0, 2).map((g: string) => (
                  <Badge key={g} variant="genre" className="text-[10px] px-1.5 py-0">{g}</Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 text-[11px] text-cloudy-400">
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatNumber(viewCount)}</span>
              <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{formatNumber(likeCount)}</span>
              <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{chapterCount}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}