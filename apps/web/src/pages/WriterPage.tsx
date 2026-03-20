import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Save, ChevronLeft, Plus, Trash2, Eye, Clock,
  Sparkles, GitBranch, BookOpen, History, Timer
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { storiesApi, chaptersApi, aiApi } from '@/lib/api'
import { debounce } from '@/lib/utils'
import { useUIStore } from '@/store/uiStore'
import type { Story, ChapterListItem } from '@/types'

export default function WriterPage() {
  const { storyId } = useParams<{ storyId: string }>()
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const [story, setStory] = useState<Story | null>(null)
  const [chapters, setChapters] = useState<ChapterListItem[]>([])
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [sprintActive, setSprintActive] = useState(false)
  const [sprintTime, setSprintTime] = useState(0)
  const [sprintGoal] = useState(500)
  const [sprintWords, setSprintWords] = useState(0)
  const sprintRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!storyId) return
    const load = async () => {
      const [storyRes, chapRes] = await Promise.all([
        storiesApi.bySlug(storyId),
        chaptersApi.list(storyId)
      ])
      setStory(storyRes.data)
      setChapters(chapRes.data.items ?? [])
    }
    load().catch(() => {})
  }, [storyId])

  const loadChapter = async (chapterId: string) => {
    if (!storyId) return
    try {
      const { data } = await chaptersApi.get(storyId, chapterId)
      setActiveChapterId(data._id)
      setTitle(data.title)
      setContent(data.content)
      setWordCount(data.wordCount)
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
      setTitle(data.title)
      setContent(data.content ?? '')
      setWordCount(data.wordCount ?? 0)
      addToast({ title: 'Chapter created', variant: 'success' })
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
      addToast({ title: 'AI tags generated!', description: data.tags.join(', '), variant: 'success' })
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
      addToast({ title: `Sprint complete! ${sprintWords} words written`, variant: 'success' })
    } else {
      setSprintActive(true)
      setSprintTime(0)
      setSprintWords(0)
      sprintRef.current = setInterval(() => setSprintTime((t) => t + 1), 1000)
    }
  }

  useEffect(() => () => {
    if (sprintRef.current) clearInterval(sprintRef.current)
  }, [])

  const formatSprintTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Writer toolbar */}
      <div className="flex items-center gap-2 px-4 h-12 border-b border-cloudy-200 bg-white shrink-0">
        <Button size="sm" variant="ghost" onClick={() => navigate(-1)} className="gap-1 -ml-2">
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{story?.title ?? 'Stories'}</span>
        </Button>

        <div className="flex-1" />

        {/* Sprint timer */}
        {sprintActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 bg-crail-50 border border-crail-100 rounded-full px-3 py-1"
          >
            <Timer className="h-3 w-3 text-crail" />
            <span className="text-xs font-mono text-crail">{formatSprintTime(sprintTime)}</span>
            <span className="text-xs text-cloudy-400">{sprintWords}/{sprintGoal}</span>
          </motion.div>
        )}

        {saving && <span className="text-xs text-cloudy-400">Saving…</span>}

        <Button size="sm" variant="ghost" className="gap-1" onClick={toggleSprint}>
          <Timer className="h-4 w-4" />
          <span className="hidden sm:inline">{sprintActive ? 'Stop' : 'Sprint'}</span>
        </Button>

        <Button size="sm" variant="ghost" className="gap-1" onClick={generateAiTags} disabled={aiLoading}>
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">AI</span>
        </Button>

        {activeChapterId && (
          <Button size="sm" onClick={publishChapter} className="gap-1">
            <Eye className="h-4 w-4" />
            Publish
          </Button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chapter sidebar */}
        <aside className="w-56 shrink-0 border-r border-cloudy-200 bg-white flex-col overflow-hidden hidden sm:flex">
          <div className="flex items-center justify-between px-3 py-2 border-b border-cloudy-100">
            <span className="text-xs font-semibold text-cloudy-400 uppercase tracking-wide">Chapters</span>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={addChapter}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {chapters.map((ch) => (
              <button
                key={ch._id}
                onClick={() => {
                  loadChapter(ch._id)
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  activeChapterId === ch._id
                    ? 'bg-crail-50 text-crail font-medium'
                    : 'text-foreground'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="flex-1 truncate">Ch. {ch.number}: {ch.title}</span>
                  {ch.isPublished && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                  )}
                </div>
                <span className="text-[11px] text-cloudy-400">
                  {ch.wordCount.toLocaleString()} words
                </span>
              </button>
            ))}
            {chapters.length === 0 && (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-cloudy-400 mb-2">No chapters yet</p>
                <Button size="sm" variant="outline" onClick={addChapter} className="w-full gap-1">
                  <Plus className="h-3 w-3" /> New chapter
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden bg-pampas">
          {activeChapterId ? (
            <>
              {/* Chapter title */}
              <div className="px-6 pt-6 pb-3">
                <Input
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); saveChapter() }}
                  placeholder="Chapter title…"
                  className="text-xl font-serif font-semibold border-0 bg-transparent px-0 focus-visible:ring-0 text-foreground placeholder:text-cloudy-300"
                />
              </div>

              {/* Word count */}
              <div className="px-6 pb-2">
                <span className="text-xs text-cloudy-400 font-mono">
                  {wordCount.toLocaleString()} words
                  {sprintActive && (
                    <span className={`ml-3 font-semibold ${sprintWords >= sprintGoal ? 'text-green-500' : 'text-crail'}`}>
                      Sprint: {sprintWords}/{sprintGoal}
                    </span>
                  )}
                </span>
              </div>

              {/* Content area — A4-like */}
              <div className="flex-1 overflow-auto px-4 md:px-8 pb-8">
                <div className="max-w-2xl mx-auto bg-white shadow-paper rounded-sm min-h-full">
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="Begin your story here…

Use double line breaks to separate paragraphs."
                    className="w-full h-full min-h-[calc(100vh-200px)] p-8 md:p-12 font-serif text-base leading-relaxed resize-none border-0 bg-transparent focus:outline-none text-foreground placeholder:text-cloudy-200"
                    style={{ lineHeight: 1.8 }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <BookOpen className="h-12 w-12 text-cloudy-300 mb-4" />
              <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                {chapters.length === 0 ? 'Start your story' : 'Select a chapter'}
              </h3>
              <p className="text-sm text-cloudy-400 mb-4">
                {chapters.length === 0
                  ? 'Create your first chapter to begin writing'
                  : 'Choose a chapter from the sidebar to edit'}
              </p>
              {chapters.length === 0 && (
                <Button onClick={addChapter} className="gap-2">
                  <Plus className="h-4 w-4" /> New Chapter
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
