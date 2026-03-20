import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, Plus, Eye, Sparkles, Timer,
  BookOpen, PanelLeft, X, Check, PenLine
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { storiesApi, chaptersApi, aiApi } from '@/lib/api'
import { debounce } from '@/lib/utils'
import { useUIStore } from '@/store/uiStore'
import type { Story, ChapterListItem } from '@/types'

// ─── New Story Modal ────────────────────────────────────────────────────────
function NewStoryModal({ onCreated }: { onCreated: (id: string) => void }) {
  const { addToast } = useUIStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [genre, setGenre] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!title.trim()) return
    setLoading(true)
    try {
      const form = new FormData()
      form.append('title', title)
      form.append('description', description)
      form.append('genre', genre)
      const { data } = await storiesApi.create(form)
      addToast({ title: 'Story created!', variant: 'success' })
      onCreated(data._id)
    } catch {
      addToast({ title: 'Failed to create story', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-crail-50 border border-crail-100 flex items-center justify-center mx-auto mb-4">
            <PenLine className="h-7 w-7 text-crail" />
          </div>
          <h2 className="font-serif text-2xl font-bold">Start a new story</h2>
          <p className="text-sm text-cloudy-500 mt-1">Give your story a title to begin</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Story title <span className="text-crail">*</span></label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The name of your story…"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Short description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's it about? (optional)"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Genre</label>
            <Input
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Fantasy, Romance, Sci-Fi… (optional)"
            />
          </div>
          <Button
            className="w-full gap-2 mt-2"
            onClick={handleCreate}
            disabled={!title.trim() || loading}
          >
            {loading ? 'Creating…' : <><Check className="h-4 w-4" /> Create story</>}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main WriterPage ────────────────────────────────────────────────────────
export default function WriterPage() {
  const { storyId: paramStoryId } = useParams<{ storyId: string }>()
  const navigate = useNavigate()
  const { addToast } = useUIStore()

  const [storyId, setStoryId] = useState<string | null>(paramStoryId ?? null)
  const [story, setStory] = useState<Story | null>(null)
  const [chapters, setChapters] = useState<ChapterListItem[]>([])
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sprintActive, setSprintActive] = useState(false)
  const [sprintTime, setSprintTime] = useState(0)
  const [sprintGoal] = useState(500)
  const [sprintWords, setSprintWords] = useState(0)
  const sprintRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load story + chapters when storyId is known
  useEffect(() => {
    if (!storyId) return
    const load = async () => {
      try {
        const [storyRes, chapRes] = await Promise.all([
          storiesApi.bySlug(storyId),
          chaptersApi.list(storyId)
        ])
        setStory(storyRes.data)
        const items: ChapterListItem[] = chapRes.data.items ?? []
        setChapters(items)
        // Auto-open last edited chapter
        if (items.length > 0 && !activeChapterId) {
          loadChapter(items[items.length - 1]._id)
        }
      } catch {
        addToast({ title: 'Failed to load story', variant: 'error' })
      }
    }
    load()
  }, [storyId])

  // Sprint timer cleanup
  useEffect(() => () => { if (sprintRef.current) clearInterval(sprintRef.current) }, [])

  const loadChapter = async (chapterId: string) => {
    if (!storyId) return
    try {
      const { data } = await chaptersApi.get(storyId, chapterId)
      setActiveChapterId(data._id)
      setTitle(data.title ?? '')
      setContent(data.content ?? '')
      setWordCount(data.wordCount ?? 0)
      setSidebarOpen(false)
    } catch {
      addToast({ title: 'Failed to load chapter', variant: 'error' })
    }
  }

  const saveChapter = debounce(async () => {
    if (!storyId || !activeChapterId) return
    setSaving(true)
    try {
      await chaptersApi.update(storyId, activeChapterId, { title, content, wordCount })
    } finally {
      setSaving(false)
    }
  }, 1500)

  const handleContentChange = (value: string) => {
    setContent(value)
    const wc = value.trim().split(/\s+/).filter(Boolean).length
    setWordCount(wc)
    if (sprintActive) setSprintWords(wc)
    saveChapter()
  }

  const addChapter = async () => {
    if (!storyId) return
    try {
      const { data } = await chaptersApi.create(storyId, {
        number: chapters.length + 1,
        title: `Chapter ${chapters.length + 1}`,
        content: ''
      })
      setChapters((prev) => [...prev, data])
      setActiveChapterId(data._id)
      setTitle(data.title ?? '')
      setContent('')
      setWordCount(0)
      setSidebarOpen(false)
      addToast({ title: `Chapter ${chapters.length + 1} created`, variant: 'success' })
      setTimeout(() => textareaRef.current?.focus(), 200)
    } catch {
      addToast({ title: 'Failed to create chapter', variant: 'error' })
    }
  }

  const publishChapter = async () => {
    if (!storyId || !activeChapterId) return
    try {
      await chaptersApi.publish(storyId, activeChapterId)
      addToast({ title: 'Chapter published!', variant: 'success' })
      setChapters((prev) =>
        prev.map((c) => c._id === activeChapterId ? { ...c, isPublished: true } : c)
      )
    } catch {
      addToast({ title: 'Failed to publish', variant: 'error' })
    }
  }

  const generateAiTags = async () => {
    if (!content) return
    setAiLoading(true)
    try {
      const { data } = await aiApi.generateTags(content)
      addToast({ title: 'AI tags generated!', description: data.tags?.join(', '), variant: 'success' })
    } catch {
      addToast({ title: 'AI unavailable', variant: 'error' })
    } finally {
      setAiLoading(false)
    }
  }

  const toggleSprint = () => {
    if (sprintActive) {
      setSprintActive(false)
      if (sprintRef.current) clearInterval(sprintRef.current)
      addToast({ title: `Sprint done! ${sprintWords} words`, variant: 'success' })
    } else {
      setSprintActive(true)
      setSprintTime(0)
      setSprintWords(0)
      sprintRef.current = setInterval(() => setSprintTime((t) => t + 1), 1000)
    }
  }

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  // ── Sidebar (chapters list) ───────────────────────────────────────────────
  const Sidebar = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-cloudy-100 shrink-0">
        <span className="text-xs font-semibold text-cloudy-400 uppercase tracking-wide">
          Chapters ({chapters.length})
        </span>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={addChapter}
          >
            <Plus className="h-3 w-3" /> Add chapter
          </Button>
          {/* Mobile close */}
          <button className="sm:hidden ml-1 text-cloudy-400" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Chapter list */}
      <div className="flex-1 overflow-y-auto py-1">
        {chapters.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <BookOpen className="h-8 w-8 text-cloudy-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No chapters yet</p>
            <p className="text-xs text-cloudy-400 mb-4">
              Click "Add chapter" above to start writing
            </p>
            <Button size="sm" className="gap-1 w-full" onClick={addChapter}>
              <Plus className="h-3 w-3" /> New chapter
            </Button>
          </div>
        ) : (
          chapters.map((ch) => (
            <button
              key={ch._id}
              onClick={() => loadChapter(ch._id)}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors border-b border-cloudy-50 last:border-0 ${
                activeChapterId === ch._id
                  ? 'bg-crail-50 text-crail'
                  : 'text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="flex-1 truncate font-medium">
                  Ch. {ch.number}: {ch.title}
                </span>
                {ch.isPublished && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                )}
              </div>
              <span className="text-[11px] text-cloudy-400 mt-0.5 block">
                {(ch.wordCount ?? 0).toLocaleString()} words
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-3 h-12 border-b border-cloudy-200 bg-white shrink-0">
        {/* Back */}
        <Button size="sm" variant="ghost" onClick={() => navigate(-1)} className="gap-1 -ml-1 shrink-0">
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline max-w-[120px] truncate">{story?.title ?? 'Stories'}</span>
        </Button>

        {/* Mobile: chapter panel toggle */}
        {storyId && (
          <Button
            size="icon"
            variant="ghost"
            className="sm:hidden h-8 w-8 shrink-0"
            onClick={() => setSidebarOpen(true)}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        )}

        <div className="flex-1 min-w-0 text-center">
          {storyId && activeChapterId && (
            <span className="text-xs text-cloudy-400 truncate hidden sm:inline">
              {saving ? 'Saving…' : 'Auto-saved'}
            </span>
          )}
        </div>

        {/* Sprint timer badge */}
        {sprintActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1.5 bg-crail-50 border border-crail-100 rounded-full px-2.5 py-1 shrink-0"
          >
            <Timer className="h-3 w-3 text-crail" />
            <span className="text-xs font-mono text-crail">{fmtTime(sprintTime)}</span>
            <span className="text-xs text-cloudy-400">{sprintWords}/{sprintGoal}</span>
          </motion.div>
        )}

        <Button size="sm" variant="ghost" className="gap-1 shrink-0" onClick={toggleSprint}>
          <Timer className="h-4 w-4" />
          <span className="hidden sm:inline">{sprintActive ? 'Stop' : 'Sprint'}</span>
        </Button>

        {storyId && (
          <Button size="sm" variant="ghost" className="gap-1 shrink-0" onClick={generateAiTags} disabled={aiLoading || !content}>
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI</span>
          </Button>
        )}

        {activeChapterId && (
          <Button size="sm" onClick={publishChapter} className="gap-1 shrink-0">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Publish</span>
          </Button>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        {storyId && (
          <aside className="hidden sm:flex flex-col w-56 shrink-0 border-r border-cloudy-200 bg-white overflow-hidden">
            {Sidebar}
          </aside>
        )}

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && storyId && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/30"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-white border-r border-cloudy-200 flex flex-col overflow-hidden"
              >
                {Sidebar}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── Main editor area ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-pampas">
          {/* No story yet — show creation form */}
          {!storyId && (
            <NewStoryModal onCreated={(id) => {
              setStoryId(id)
              navigate(`/write/${id}`, { replace: true })
            }} />
          )}

          {/* Story exists, no chapter selected */}
          {storyId && !activeChapterId && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <BookOpen className="h-12 w-12 text-cloudy-300 mb-4" />
              <h3 className="font-serif text-xl font-semibold mb-2">
                {chapters.length === 0 ? 'No chapters yet' : 'Select a chapter'}
              </h3>
              <p className="text-sm text-cloudy-400 mb-6">
                {chapters.length === 0
                  ? 'Create your first chapter to start writing'
                  : 'Pick a chapter from the sidebar to edit'}
              </p>
              <div className="flex gap-3 flex-wrap justify-center">
                <Button onClick={addChapter} className="gap-2">
                  <Plus className="h-4 w-4" /> New chapter
                </Button>
                {/* Mobile: open sidebar to pick existing */}
                {chapters.length > 0 && (
                  <Button variant="outline" className="gap-2 sm:hidden" onClick={() => setSidebarOpen(true)}>
                    <PanelLeft className="h-4 w-4" /> View chapters
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Chapter editor */}
          {storyId && activeChapterId && (
            <>
              {/* Title + meta bar */}
              <div className="px-4 md:px-8 pt-5 pb-2 bg-pampas">
                <input
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); saveChapter() }}
                  placeholder="Chapter title…"
                  className="w-full text-xl font-serif font-semibold bg-transparent border-0 outline-none text-foreground placeholder:text-cloudy-300 mb-1"
                />
                <div className="flex items-center gap-4 text-xs text-cloudy-400 font-mono">
                  <span>{wordCount.toLocaleString()} words</span>
                  {sprintActive && (
                    <span className={sprintWords >= sprintGoal ? 'text-green-600 font-semibold' : 'text-crail font-semibold'}>
                      Sprint: {sprintWords}/{sprintGoal}
                    </span>
                  )}
                  <span className="ml-auto">{saving ? 'Saving…' : 'Saved'}</span>
                </div>
              </div>

              {/* Paper writing surface */}
              <div className="flex-1 overflow-auto px-4 md:px-8 pb-8 pt-2">
                <div className="max-w-2xl mx-auto bg-white shadow-paper rounded-sm min-h-full">
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder={`Begin Chapter ${chapters.find(c => c._id === activeChapterId)?.number ?? 1} here…\n\nUse double line breaks to separate paragraphs.`}
                    className="w-full min-h-[calc(100vh-220px)] p-6 md:p-10 font-serif text-base resize-none border-0 bg-transparent focus:outline-none text-foreground placeholder:text-cloudy-200"
                    style={{ lineHeight: 1.9 }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}