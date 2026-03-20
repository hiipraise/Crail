import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, Plus, Eye, Sparkles, Timer,
  BookOpen, PanelLeft, X, Check, PenLine, Pencil
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { storiesApi, chaptersApi, aiApi } from '@/lib/api'
import { debounce } from '@/lib/utils'
import { useUIStore } from '@/store/uiStore'
import type { Story, ChapterListItem } from '@/types'

// ─── New Story Modal ─────────────────────────────────────────────────────────
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
            <Input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="The name of your story…" autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Short description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What's it about? (optional)" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Genre</label>
            <Input value={genre} onChange={(e) => setGenre(e.target.value)}
              placeholder="Fantasy, Romance, Sci-Fi… (optional)" />
          </div>
          <Button className="w-full gap-2 mt-2" onClick={handleCreate}
            disabled={!title.trim() || loading}>
            {loading ? 'Creating…' : <><Check className="h-4 w-4" /> Create story</>}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── New Chapter Modal ───────────────────────────────────────────────────────
function NewChapterModal({
  chapterNumber,
  onConfirm,
  onCancel
}: {
  chapterNumber: number
  onConfirm: (title: string) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(`Chapter ${chapterNumber}`)

  const handleSubmit = () => {
    if (!title.trim()) return
    onConfirm(title.trim())
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="bg-white rounded-2xl shadow-paper-lg p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-crail-50 flex items-center justify-center shrink-0">
            <BookOpen className="h-4 w-4 text-crail" />
          </div>
          <div>
            <h3 className="font-serif font-semibold text-base">New chapter</h3>
            <p className="text-xs text-cloudy-400">Chapter {chapterNumber}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Chapter title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Beginning, Arrival, Part One…"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit()
                if (e.key === 'Escape') onCancel()
              }}
            />
            <p className="text-xs text-cloudy-400 mt-1">
              You can change this at any time from the editor.
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
            <Button className="flex-1 gap-1" onClick={handleSubmit}
              disabled={!title.trim()}>
              <Plus className="h-4 w-4" /> Create
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Rename Chapter Modal ────────────────────────────────────────────────────
function RenameChapterModal({
  currentTitle,
  onConfirm,
  onCancel
}: {
  currentTitle: string
  onConfirm: (title: string) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(currentTitle)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="bg-white rounded-2xl shadow-paper-lg p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-serif font-semibold text-base mb-4">Rename chapter</h3>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && title.trim()) onConfirm(title.trim())
            if (e.key === 'Escape') onCancel()
          }}
        />
        <div className="flex gap-2 mt-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button className="flex-1" onClick={() => title.trim() && onConfirm(title.trim())}
            disabled={!title.trim()}>
            <Check className="h-4 w-4 mr-1" /> Save
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main WriterPage ─────────────────────────────────────────────────────────
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

  // Modal states
  const [showNewChapter, setShowNewChapter] = useState(false)
  const [renamingChapterId, setRenamingChapterId] = useState<string | null>(null)
  const renamingChapter = chapters.find((c) => c._id === renamingChapterId)

  // Sprint
  const [sprintActive, setSprintActive] = useState(false)
  const [sprintTime, setSprintTime] = useState(0)
  const [sprintGoal] = useState(500)
  const [sprintWords, setSprintWords] = useState(0)
  const sprintRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
        if (items.length > 0 && !activeChapterId) {
          loadChapter(items[items.length - 1]._id)
        }
      } catch {
        addToast({ title: 'Failed to load story', variant: 'error' })
      }
    }
    load()
  }, [storyId])

  useEffect(() => () => {
    if (sprintRef.current) clearInterval(sprintRef.current)
  }, [])

  const loadChapter = async (chapterId: string) => {
    if (!storyId) return
    try {
      const { data } = await chaptersApi.get(storyId, chapterId)
      setActiveChapterId(data._id)
      setTitle(data.title ?? '')
      setContent(data.content ?? '')
      setWordCount(data.wordCount ?? data.word_count ?? 0)
      setSidebarOpen(false)
    } catch {
      addToast({ title: 'Failed to load chapter', variant: 'error' })
    }
  }

  const saveChapter = debounce(async () => {
    if (!storyId || !activeChapterId) return
    setSaving(true)
    try {
      await chaptersApi.update(storyId, activeChapterId, {
        title,
        content,
        word_count: wordCount
      })
      // Keep sidebar in sync
      setChapters((prev) =>
        prev.map((c) => c._id === activeChapterId ? { ...c, title, content, word_count: wordCount } : c)
      )
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

  // Called when user confirms the new-chapter modal
  const createChapter = async (chapterTitle: string) => {
    if (!storyId) return
    setShowNewChapter(false)
    try {
      const { data } = await chaptersApi.create(storyId, {
        number: chapters.length + 1,
        title: chapterTitle,
        content: ''
      })
      setChapters((prev) => [...prev, data])
      setActiveChapterId(data._id)
      setTitle(chapterTitle)
      setContent('')
      setWordCount(0)
      setSidebarOpen(false)
      addToast({ title: `"${chapterTitle}" created`, variant: 'success' })
      setTimeout(() => textareaRef.current?.focus(), 200)
    } catch {
      addToast({ title: 'Failed to create chapter', variant: 'error' })
    }
  }

  // Called when user renames a chapter from the sidebar
  const renameChapter = async (chapterId: string, newTitle: string) => {
    if (!storyId) return
    setRenamingChapterId(null)
    try {
      await chaptersApi.update(storyId, chapterId, { title: newTitle })
      setChapters((prev) =>
        prev.map((c) => c._id === chapterId ? { ...c, title: newTitle } : c)
      )
      // If it's the active chapter, update the editor title too
      if (chapterId === activeChapterId) setTitle(newTitle)
      addToast({ title: 'Chapter renamed', variant: 'success' })
    } catch {
      addToast({ title: 'Failed to rename', variant: 'error' })
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

  const fmtTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  // ── Sidebar ────────────────────────────────────────────────────────────────
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
            onClick={() => setShowNewChapter(true)}
          >
            <Plus className="h-3 w-3" /> Add
          </Button>
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
              Add your first chapter to start writing
            </p>
            <Button size="sm" className="gap-1 w-full" onClick={() => setShowNewChapter(true)}>
              <Plus className="h-3 w-3" /> New chapter
            </Button>
          </div>
        ) : (
          chapters.map((ch) => {
            const chWordCount = (ch as any).wordCount ?? (ch as any).word_count ?? 0
            const chPublished = (ch as any).isPublished ?? (ch as any).is_published ?? false
            const isActive = activeChapterId === ch._id

            return (
              <div
                key={ch._id}
                className={`group relative flex items-stretch border-b border-cloudy-50 last:border-0 ${
                  isActive ? 'bg-crail-50' : ''
                }`}
              >
                {/* Chapter button */}
                <button
                  onClick={() => loadChapter(ch._id)}
                  className={`flex-1 text-left px-3 py-2.5 text-sm transition-colors ${
                    isActive ? 'text-crail' : 'text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 pr-6">
                    <span className="flex-1 truncate font-medium">{ch.title}</span>
                    {chPublished && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                    )}
                  </div>
                  <span className="text-[11px] text-cloudy-400 mt-0.5 block">
                    Ch. {ch.number} · {chWordCount.toLocaleString()} words
                  </span>
                </button>

                {/* Rename button — shown on hover or if active */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setRenamingChapterId(ch._id)
                  }}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-cloudy-300 transition-opacity ${
                    isActive
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100'
                  }`}
                  title="Rename chapter"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* Modals */}
      <AnimatePresence>
        {showNewChapter && (
          <NewChapterModal
            chapterNumber={chapters.length + 1}
            onConfirm={createChapter}
            onCancel={() => setShowNewChapter(false)}
          />
        )}
        {renamingChapterId && renamingChapter && (
          <RenameChapterModal
            currentTitle={renamingChapter.title}
            onConfirm={(t) => renameChapter(renamingChapterId, t)}
            onCancel={() => setRenamingChapterId(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-3 h-12 border-b border-cloudy-200 bg-white shrink-0">
        <Button size="sm" variant="ghost" onClick={() => navigate(-1)}
          className="gap-1 -ml-1 shrink-0">
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline max-w-[120px] truncate">
            {story?.title ?? 'Stories'}
          </span>
        </Button>

        {storyId && (
          <Button size="icon" variant="ghost"
            className="sm:hidden h-8 w-8 shrink-0"
            onClick={() => setSidebarOpen(true)}>
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

        {sprintActive && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="flex items-center gap-1.5 bg-crail-50 border border-crail-100 rounded-full px-2.5 py-1 shrink-0">
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
          <Button size="sm" variant="ghost" className="gap-1 shrink-0"
            onClick={generateAiTags} disabled={aiLoading || !content}>
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
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/30"
                onClick={() => setSidebarOpen(false)} />
              <motion.div
                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-white border-r border-cloudy-200 flex flex-col overflow-hidden">
                {Sidebar}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── Main editor ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-pampas">
          {!storyId && (
            <NewStoryModal onCreated={(id) => {
              setStoryId(id)
              navigate(`/write/${id}`, { replace: true })
            }} />
          )}

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
                <Button onClick={() => setShowNewChapter(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> New chapter
                </Button>
                {chapters.length > 0 && (
                  <Button variant="outline" className="gap-2 sm:hidden"
                    onClick={() => setSidebarOpen(true)}>
                    <PanelLeft className="h-4 w-4" /> View chapters
                  </Button>
                )}
              </div>
            </div>
          )}

          {storyId && activeChapterId && (
            <>
              {/* Title bar — inline editing with pencil icon */}
              <div className="px-4 md:px-8 pt-5 pb-2 bg-pampas">
                <div className="flex items-center gap-2 mb-1">
                  <input
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); saveChapter() }}
                    placeholder="Chapter title…"
                    className="flex-1 text-xl font-serif font-semibold bg-transparent border-0 outline-none text-foreground placeholder:text-cloudy-300"
                  />
                  <button
                    onClick={() => setRenamingChapterId(activeChapterId)}
                    className="text-cloudy-300 p-1 rounded-lg shrink-0"
                    title="Rename chapter"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-4 text-xs text-cloudy-400 font-mono">
                  <span>{wordCount.toLocaleString()} words</span>
                  {sprintActive && (
                    <span className={sprintWords >= sprintGoal
                      ? 'text-green-600 font-semibold'
                      : 'text-crail font-semibold'}>
                      Sprint: {sprintWords}/{sprintGoal}
                    </span>
                  )}
                  <span className="ml-auto">{saving ? 'Saving…' : 'Saved'}</span>
                </div>
              </div>

              {/* Paper */}
              <div className="flex-1 overflow-auto px-4 md:px-8 pb-8 pt-2">
                <div className="max-w-2xl mx-auto bg-white shadow-paper rounded-sm min-h-full">
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    onPaste={(e) => {
                      e.preventDefault()
                      const pasted = e.clipboardData.getData('text/plain')
                      // Normalize line breaks:
                      // - \r\n (Windows) → \n
                      // - Single \n between non-empty lines → \n\n (paragraph break)
                      // - Already double \n → keep
                      // - More than 2 consecutive \n → collapse to 2
                      const normalized = pasted
                        .replace(/\r\n/g, '\n')          // Windows line endings
                        .replace(/\r/g, '\n')             // old Mac line endings
                        .replace(/\n{3,}/g, '\n\n')       // collapse 3+ newlines to 2
                        .replace(/([^\n])\n([^\n])/g, '$1\n\n$2') // single \n between text → double
                        .trim()

                      // Insert at cursor position
                      const el = e.currentTarget
                      const start = el.selectionStart
                      const end = el.selectionEnd
                      const newValue = content.slice(0, start) + normalized + content.slice(end)
                      handleContentChange(newValue)

                      // Restore cursor after the pasted content
                      requestAnimationFrame(() => {
                        el.selectionStart = start + normalized.length
                        el.selectionEnd = start + normalized.length
                      })
                    }}
                    placeholder={`Begin "${title || `Chapter ${chapters.find(c => c._id === activeChapterId)?.number ?? 1}`}" here…\n\nUse double line breaks to separate paragraphs.`}
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