import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import StoryCard from '@/components/discovery/StoryCard'
import StoryCardSkeleton from '@/components/discovery/StoryCardSkeleton'
import { storiesApi } from '@/lib/api'
import { debounce } from '@/lib/utils'
import type { StoryListItem } from '@/types'

const GENRES = ['Fantasy', 'Sci-Fi', 'Romance', 'Horror', 'Mystery', 'Thriller', 'Historical', 'Contemporary', 'Adventure', 'Drama']
const SORT_OPTIONS = [
  { value: 'trending', label: 'Trending' },
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'completed', label: 'Completed' }
]

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [stories, setStories] = useState<StoryListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const sort = searchParams.get('sort') ?? 'trending'
  const genre = searchParams.get('genre') ?? ''
  const query = searchParams.get('q') ?? ''

  const load = useCallback(async (reset = false) => {
    setLoading(true)
    try {
      const currentPage = reset ? 1 : page
      const { data } = await storiesApi.list({ sort, genre, q: query, page: currentPage, pageSize: 12 })
      setStories(reset ? data.items : (prev) => [...prev, ...data.items])
      setHasMore(data.hasMore)
      if (reset) setPage(2)
      else setPage((p) => p + 1)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [sort, genre, query, page])

  useEffect(() => { load(true) }, [sort, genre, query])

  const handleSearch = debounce((value: string) => {
    setSearchParams((p) => { p.set('q', value); return p })
  }, 400)

  return (
    <div className="pb-24 md:pb-8">
      {/* Search bar */}
      <div className="sticky top-14 z-30 bg-pampas/90 backdrop-blur-md border-b border-cloudy-200 px-4 py-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cloudy-400" />
            <Input
              placeholder="Search stories, authors, tags…"
              defaultValue={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
            {query && (
              <button
                onClick={() => setSearchParams((p) => { p.delete('q'); return p })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cloudy-400"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            size="icon"
            variant={showFilters ? 'default' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Sort tabs */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
          {SORT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSearchParams((p) => { p.set('sort', value); return p })}
              className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                sort === value
                  ? 'bg-crail text-white'
                  : 'bg-white border border-cloudy-200 text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Genre filters */}
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-4 py-3 border-b border-cloudy-200 bg-white"
        >
          <p className="text-xs font-semibold text-cloudy-400 uppercase tracking-wide mb-2">Genre</p>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => setSearchParams((p) => {
                  genre === g ? p.delete('genre') : p.set('genre', g)
                  return p
                })}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  genre === g
                    ? 'bg-crail text-white border-crail'
                    : 'bg-white border-cloudy-200 text-foreground'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Active filters */}
      {(genre || query) && (
        <div className="px-4 py-2 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-cloudy-400">Filters:</span>
          {genre && (
            <Badge variant="secondary" className="gap-1 cursor-pointer"
              onClick={() => setSearchParams((p) => { p.delete('genre'); return p })}>
              {genre} <X className="h-3 w-3" />
            </Badge>
          )}
          {query && (
            <Badge variant="secondary" className="gap-1 cursor-pointer"
              onClick={() => setSearchParams((p) => { p.delete('q'); return p })}>
              "{query}" <X className="h-3 w-3" />
            </Badge>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {stories.map((story, i) => (
            <StoryCard key={story._id} story={story} index={i} />
          ))}
          {loading && Array.from({ length: 8 }).map((_, i) => <StoryCardSkeleton key={`sk-${i}`} />)}
        </div>

        {!loading && stories.length === 0 && (
          <div className="text-center py-16">
            <p className="font-serif text-lg text-cloudy-400 mb-2">No stories found</p>
            <p className="text-sm text-cloudy-400">Try adjusting your search or filters</p>
          </div>
        )}

        {hasMore && !loading && (
          <div className="flex justify-center mt-6">
            <Button variant="outline" onClick={() => load()}>Load more</Button>
          </div>
        )}
      </div>
    </div>
  )
}
