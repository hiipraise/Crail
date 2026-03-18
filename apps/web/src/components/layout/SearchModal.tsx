import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Clock, TrendingUp, BookOpen } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { storiesApi } from '@/lib/api'
import { useUIStore } from '@/store/uiStore'
import { debounce } from '@/lib/utils'
import type { StoryListItem } from '@/types'

const RECENT_KEY = 'crail_recent_searches'

function getRecent(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(RECENT_KEY) ?? '[]')
  } catch {
    return []
  }
}

function addRecent(q: string) {
  const prev = getRecent().filter((s) => s !== q)
  sessionStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, 6)))
}

export default function SearchModal() {
  const { isSearchOpen, closeSearch } = useUIStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<StoryListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isSearchOpen) {
      setRecent(getRecent())
      setQuery('')
      setResults([])
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isSearchOpen])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [closeSearch])

  const doSearch = debounce(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const { data } = await storiesApi.list({ q, pageSize: 8 })
      setResults(data.items ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, 300)

  const handleChange = (value: string) => {
    setQuery(value)
    doSearch(value)
  }

  const handleSelect = (q: string) => {
    addRecent(q)
    closeSearch()
  }

  const popular = ['Fantasy', 'Romance', 'Sci-Fi', 'Horror', 'Mystery']

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={closeSearch}
          />

          {/* Modal panel */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-50 bg-white shadow-paper-lg max-h-[80vh] overflow-hidden flex flex-col rounded-b-2xl"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-cloudy-200">
              <Search className="h-5 w-5 text-cloudy-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Search stories, authors, tags…"
                className="flex-1 text-base bg-transparent focus:outline-none placeholder:text-cloudy-300"
              />
              {query && (
                <button onClick={() => handleChange('')} className="text-cloudy-400">
                  <X className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={closeSearch}
                className="text-sm text-cloudy-500 font-medium ml-1 shrink-0"
              >
                Cancel
              </button>
            </div>

            {/* Results / suggestions */}
            <div className="flex-1 overflow-y-auto">
              {/* Search results */}
              {query && (
                <div className="py-2">
                  {loading ? (
                    <div className="space-y-2 px-4 py-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 items-center">
                          <div className="w-10 h-14 rounded-lg shimmer shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-4 w-3/4 shimmer rounded" />
                            <div className="h-3 w-1/2 shimmer rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : results.length > 0 ? (
                    <>
                      <p className="px-4 py-1 text-xs font-semibold text-cloudy-400 uppercase tracking-wide">Stories</p>
                      {results.map((story) => (
                        <Link
                          key={story._id}
                          to={`/story/${story.slug}`}
                          onClick={() => handleSelect(query)}
                          className="flex items-center gap-3 px-4 py-3 border-b border-cloudy-50 last:border-0"
                        >
                          <div className="w-10 h-14 shrink-0 rounded-lg overflow-hidden bg-pampas-dark">
                            {story.coverImage ? (
                              <img src={story.coverImage} alt={story.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-crail-50 flex items-center justify-center">
                                <span className="text-crail font-serif font-bold text-sm">
                                  {story.title.slice(0, 1)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{story.title}</p>
                            <p className="text-xs text-cloudy-500">{story.author.displayName}</p>
                            <div className="flex gap-1 mt-0.5">
                              {story.genre.slice(0, 2).map((g) => (
                                <Badge key={g} variant="genre" className="text-[10px] px-1.5 py-0">{g}</Badge>
                              ))}
                            </div>
                          </div>
                          <BookOpen className="h-4 w-4 text-cloudy-300 shrink-0" />
                        </Link>
                      ))}
                      <Link
                        to={`/explore?q=${encodeURIComponent(query)}`}
                        onClick={() => handleSelect(query)}
                        className="block px-4 py-3 text-sm text-crail font-medium text-center"
                      >
                        See all results for "{query}"
                      </Link>
                    </>
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-cloudy-400">No stories found for "{query}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Empty state — recent + popular */}
              {!query && (
                <div className="py-4">
                  {recent.length > 0 && (
                    <div className="mb-4">
                      <p className="px-4 py-1 text-xs font-semibold text-cloudy-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> Recent
                      </p>
                      {recent.map((q) => (
                        <button
                          key={q}
                          onClick={() => handleChange(q)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground"
                        >
                          <Clock className="h-4 w-4 text-cloudy-300 shrink-0" />
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                  <div>
                    <p className="px-4 py-1 text-xs font-semibold text-cloudy-400 uppercase tracking-wide flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3" /> Popular genres
                    </p>
                    <div className="flex flex-wrap gap-2 px-4 py-2">
                      {popular.map((g) => (
                        <button
                          key={g}
                          onClick={() => handleChange(g)}
                          className="text-sm px-3 py-1.5 bg-pampas-dark rounded-full text-foreground font-medium"
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
