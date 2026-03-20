import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Clock, TrendingUp, BookOpen, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { storiesApi, usersApi } from '@/lib/api'
import { useUIStore } from '@/store/uiStore'
import type { StoryListItem } from '@/types'

const RECENT_KEY = 'crail_recent_searches'
const POPULAR_GENRES = ['Fantasy', 'Sci-Fi', 'Romance', 'Horror', 'Mystery']

function getRecent(): string[] {
  try { return JSON.parse(sessionStorage.getItem(RECENT_KEY) ?? '[]') }
  catch { return [] }
}
function addRecent(q: string) {
  const prev = getRecent().filter((s) => s !== q)
  sessionStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, 6)))
}

interface UserResult {
  _id: string
  username: string
  displayName?: string
  display_name?: string
  avatar?: string
  storiesCount?: number
  stories_count?: number
}

export default function SearchModal() {
  const { isSearchOpen, closeSearch } = useUIStore()
  const [query, setQuery] = useState('')
  const [stories, setStories] = useState<StoryListItem[]>([])
  const [users, setUsers] = useState<UserResult[]>([])
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isSearchOpen) {
      setRecent(getRecent())
      setQuery('')
      setStories([])
      setUsers([])
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [isSearchOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSearch() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [closeSearch])

  const doSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) { setStories([]); setUsers([]); return }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const [storyRes, userRes] = await Promise.allSettled([
          storiesApi.list({ q, pageSize: 6 }),
          usersApi.search(q)
        ])
        setStories(storyRes.status === 'fulfilled' ? (storyRes.value.data.items ?? []) : [])
        setUsers(userRes.status === 'fulfilled' ? (userRes.value.data.items ?? []) : [])
      } finally {
        setLoading(false)
      }
    }, 280)
  }, [])

  const handleChange = (value: string) => {
    setQuery(value)
    doSearch(value)
  }

  const handleSelect = (q: string) => {
    addRecent(q)
    closeSearch()
  }

  const hasResults = stories.length > 0 || users.length > 0

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={closeSearch}
          />

          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-50 bg-white shadow-paper-lg rounded-b-2xl max-h-[80vh] overflow-hidden flex flex-col"
          >
            {/* Input bar */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-cloudy-100 shrink-0">
              <Search className="h-5 w-5 text-cloudy-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Search stories, authors, genres…"
                className="flex-1 text-base bg-transparent focus:outline-none placeholder:text-cloudy-300 text-foreground"
              />
              {query && (
                <button onClick={() => handleChange('')} className="text-cloudy-400 shrink-0">
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

            {/* Results */}
            <div className="flex-1 overflow-y-auto">
              {/* Loading shimmer */}
              {loading && (
                <div className="space-y-2 px-4 py-3">
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
              )}

              {/* Results when query + not loading */}
              {query && !loading && (
                <>
                  {/* Users section */}
                  {users.length > 0 && (
                    <div className="py-2">
                      <p className="px-4 py-1.5 text-xs font-semibold text-cloudy-400 uppercase tracking-wide flex items-center gap-1.5">
                        <User className="h-3 w-3" /> Authors
                      </p>
                      {users.map((u) => {
                        const name = u.displayName ?? u.display_name ?? u.username
                        const count = u.storiesCount ?? u.stories_count ?? 0
                        return (
                          <Link
                            key={u._id}
                            to={`/profile/${u.username}`}
                            onClick={() => handleSelect(query)}
                            className="flex items-center gap-3 px-4 py-2.5"
                          >
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={u.avatar} />
                              <AvatarFallback className="text-xs">{name.slice(0, 1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{name}</p>
                              <p className="text-xs text-cloudy-400">@{u.username} · {count} {count === 1 ? 'story' : 'stories'}</p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}

                  {/* Stories section */}
                  {stories.length > 0 && (
                    <div className="py-2">
                      <p className="px-4 py-1.5 text-xs font-semibold text-cloudy-400 uppercase tracking-wide flex items-center gap-1.5">
                        <BookOpen className="h-3 w-3" /> Stories
                      </p>
                      {stories.map((story) => {
                        const cover = story.coverImage ?? (story as any).cover_image
                        const author = (story.author ?? {}) as any
                        const authorName = author.displayName ?? author.display_name ?? author.username ?? ''
                        const genre = story.genre ?? []
                        return (
                          <Link
                            key={story._id}
                            to={`/story/${story.slug ?? story._id}`}
                            onClick={() => handleSelect(query)}
                            className="flex items-center gap-3 px-4 py-3 border-b border-cloudy-50 last:border-0"
                          >
                            <div className="w-10 h-14 shrink-0 rounded-lg overflow-hidden bg-pampas-dark">
                              {cover ? (
                                <img src={cover} alt={story.title} className="w-full h-full object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                              ) : (
                                <div className="w-full h-full bg-crail-50 flex items-center justify-center">
                                  <span className="text-crail font-serif font-bold text-sm">
                                    {story.title?.slice(0, 1) ?? '?'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{story.title}</p>
                              <p className="text-xs text-cloudy-500">{authorName}</p>
                              {genre.length > 0 && (
                                <div className="flex gap-1 mt-0.5">
                                  {genre.slice(0, 2).map((g: string) => (
                                    <Badge key={g} variant="genre" className="text-[10px] px-1.5 py-0">{g}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </Link>
                        )
                      })}

                      <Link
                        to={`/explore?q=${encodeURIComponent(query)}`}
                        onClick={() => handleSelect(query)}
                        className="block px-4 py-3 text-sm text-crail font-medium text-center"
                      >
                        See all results for "{query}"
                      </Link>
                    </div>
                  )}

                  {/* Nothing found */}
                  {!hasResults && (
                    <div className="px-4 py-10 text-center">
                      <p className="text-sm text-cloudy-400">No results for "{query}"</p>
                      <p className="text-xs text-cloudy-300 mt-1">Try a different word or browse genres below</p>
                    </div>
                  )}
                </>
              )}

              {/* Empty state — no query yet */}
              {!query && !loading && (
                <div className="py-3">
                  {recent.length > 0 && (
                    <div className="mb-2">
                      <p className="px-4 py-1.5 text-xs font-semibold text-cloudy-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> Recent
                      </p>
                      {recent.map((q) => (
                        <button key={q} onClick={() => handleChange(q)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground">
                          <Clock className="h-4 w-4 text-cloudy-300 shrink-0" />
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="px-4 py-1.5 text-xs font-semibold text-cloudy-400 uppercase tracking-wide flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3" /> Popular genres
                  </p>
                  <div className="flex flex-wrap gap-2 px-4 py-2">
                    {POPULAR_GENRES.map((g) => (
                      <button key={g} onClick={() => handleChange(g)}
                        className="text-sm px-3 py-1.5 bg-pampas-dark rounded-full text-foreground font-medium">
                        {g}
                      </button>
                    ))}
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