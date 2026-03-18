import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, Heart, BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatNumber, formatWordCount, formatDate } from '@/lib/utils'
import type { StoryListItem } from '@/types'

interface Props {
  story: StoryListItem
  index?: number
}

const statusColors = {
  ongoing: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  hiatus: 'bg-amber-100 text-amber-700',
  draft: 'bg-cloudy-100 text-cloudy-500'
}

export default function StoryCard({ story, index = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link to={`/story/${story.slug}`} className="group block">
        <div className="bg-white rounded-xl border border-cloudy-200 shadow-card overflow-hidden">
          {/* Cover */}
          <div className="relative aspect-[3/4] overflow-hidden bg-pampas-dark">
            {story.coverImage ? (
              <img
                src={story.coverImage}
                alt={story.title}
                className="w-full h-full object-cover transition-transform duration-500 group-active:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-crail-50 to-crail-100">
                <span className="font-serif text-4xl font-bold text-crail-200">
                  {story.title.slice(0, 1)}
                </span>
              </div>
            )}

            {/* Status badge */}
            <div className="absolute top-2 left-2">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[story.status]}`}>
                {story.status}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="p-3">
            <h3 className="font-serif font-semibold text-sm leading-tight line-clamp-2 mb-1">
              {story.title}
            </h3>

            {/* Author */}
            <div className="flex items-center gap-1.5 mb-2">
              <Avatar className="h-4 w-4">
                <AvatarImage src={story.author.avatar} />
                <AvatarFallback className="text-[8px]">
                  {story.author.displayName.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-cloudy-500 truncate">{story.author.displayName}</span>
            </div>

            {/* Genre tags */}
            {story.genre.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {story.genre.slice(0, 2).map((g) => (
                  <Badge key={g} variant="genre" className="text-[10px] px-1.5 py-0">
                    {g}
                  </Badge>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-3 text-[11px] text-cloudy-400">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {formatNumber(story.viewCount)}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {formatNumber(story.likeCount)}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {story.chapterCount}ch
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
