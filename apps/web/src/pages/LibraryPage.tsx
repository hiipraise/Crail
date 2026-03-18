import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Clock, Bookmark, PenLine, Plus, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import StoryRow from '@/components/discovery/StoryRow'
import { Skeleton } from '@/components/ui/skeleton'
import { storiesApi, progressApi } from '@/lib/api'
import type { StoryListItem } from '@/types'

type Tab = 'reading' | 'bookmarks' | 'my-stories'

export default function LibraryPage() {
  const [tab, setTab] = useState<Tab>('reading')
  const [stories, setStories] = useState<StoryListItem[]>([])
  const [myStories, setMyStories] = useState<StoryListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        if (tab === 'reading' || tab === 'bookmarks') {
          const { data } = await storiesApi.list({ type: tab, pageSize: 20 })
          setStories(data.items ?? [])
        } else {
          const { data } = await storiesApi.list({ mine: true, pageSize: 50 })
          setMyStories(data.items ?? [])
        }
      } catch { /* silent */ } finally {
        setLoading(false)
      }
    }
    load()
  }, [tab])

  const tabs = [
    { id: 'reading' as Tab, icon: Clock, label: 'Reading' },
    { id: 'bookmarks' as Tab, icon: Bookmark, label: 'Bookmarks' },
    { id: 'my-stories' as Tab, icon: PenLine, label: 'My Stories' }
  ]

  return (
    <div className="pb-24 md:pb-8">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="font-serif text-2xl font-bold">My Library</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cloudy-200 px-4">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === id
                ? 'border-crail text-crail'
                : 'border-transparent text-cloudy-400'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 mt-4 space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-white border border-cloudy-200 shimmer" />
          ))
        ) : tab === 'my-stories' ? (
          <>
            <Link to="/write">
              <Button className="w-full gap-2 mb-4">
                <Plus className="h-4 w-4" /> Start a new story
              </Button>
            </Link>
            {myStories.length === 0 ? (
              <EmptyState
                icon={PenLine}
                title="No stories yet"
                description="Start writing your first story today"
              />
            ) : (
              myStories.map((s, i) => (
                <Link key={s._id} to={`/write/${s._id}`}>
                  <StoryRow story={s} index={i} />
                </Link>
              ))
            )}
          </>
        ) : stories.length === 0 ? (
          <EmptyState
            icon={tab === 'reading' ? BookOpen : Bookmark}
            title={tab === 'reading' ? 'Nothing in progress' : 'No bookmarks yet'}
            description={tab === 'reading'
              ? 'Start reading a story to see it here'
              : 'Bookmark stories to find them later'
            }
          />
        ) : (
          stories.map((s, i) => <StoryRow key={s._id} story={s} index={i} />)
        )}
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, title, description }: {
  icon: React.ElementType; title: string; description: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-16"
    >
      <div className="w-16 h-16 rounded-full bg-pampas-dark flex items-center justify-center mx-auto mb-4">
        <Icon className="h-8 w-8 text-cloudy-300" />
      </div>
      <h3 className="font-serif text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-cloudy-400">{description}</p>
      <Link to="/explore" className="inline-block mt-4">
        <Button variant="outline" className="gap-2">
          <TrendingUp className="h-4 w-4" /> Explore stories
        </Button>
      </Link>
    </motion.div>
  )
}
