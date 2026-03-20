import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Settings2, Bookmark,
  ZoomIn, ZoomOut, AlignJustify, AlignLeft,
  Volume2, VolumeX, Maximize2, Minimize2, ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { chaptersApi, progressApi } from '@/lib/api'
import { useReaderStore } from '@/store/readerStore'
import { applyBionicReading, estimatePages, getPageContent } from '@/lib/utils'
import type { Chapter } from '@/types'

export default function ReaderPage() {
  const { storyId, chapterId } = useParams<{ storyId: string; chapterId: string }>()
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showBookmarkToast, setShowBookmarkToast] = useState(false)
  const pageRef = useRef<HTMLDivElement>(null)

  const {
    currentPage, totalPages, settings,
    setPage, setTotalPages, setChapter: setStoreChapter,
    updateSettings, toggleFocusMode, toggleBionicMode,
    addBookmark, bookmarks
  } = useReaderStore()

  useEffect(() => {
    const load = async () => {
      if (!storyId || !chapterId) return
      setLoading(true)
      try {
        const { data } = await chaptersApi.get(storyId, chapterId)
        setChapter(data)
        setStoreChapter(chapterId)
        const pages = estimatePages(data.content)
        setTotalPages(pages)

        // Restore reading progress
        try {
          const prog = await progressApi.get(storyId)
          if (prog.data?.chapterId === chapterId && prog.data?.pageNumber) {
            setPage(prog.data.pageNumber)
          }
        } catch { /* no saved progress */ }
      } catch {
        // handle error
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [storyId, chapterId])

  // Save progress on page change
  useEffect(() => {
    if (!storyId || !chapterId || !chapter) return
    const timeout = setTimeout(() => {
      progressApi.update(storyId, {
        chapterId,
        chapterNumber: chapter.number,
        pageNumber: currentPage,
        progress: currentPage / totalPages
      }).catch(() => {})
    }, 2000)
    return () => clearTimeout(timeout)
  }, [currentPage, storyId, chapterId])

  const handleBookmarkPage = useCallback(() => {
    if (!chapterId) return
    addBookmark({
      _id: `${chapterId}-${currentPage}`,
      chapterId,
      pageNumber: currentPage,
      createdAt: new Date().toISOString()
    })
    setShowBookmarkToast(true)
    if ('vibrate' in navigator) navigator.vibrate(50)
    setTimeout(() => setShowBookmarkToast(false), 2000)
  }, [chapterId, currentPage, addBookmark])

  const pageContent = chapter
    ? getPageContent(chapter.content, currentPage)
    : ''

  // displayContent is the raw text; bionic rendering is applied inline in the HTML render below
  const displayContent = pageContent

  const isBookmarked = bookmarks.some(
    (b) => b.chapterId === chapterId && b.pageNumber === currentPage
  )

  const fontClass = settings.fontFamily === 'serif' ? 'font-serif' : 'font-sans'
  const lineSpacingStyle = { lineHeight: settings.lineSpacing }

  return (
    <div className={`min-h-screen bg-pampas flex flex-col ${settings.isFocusMode ? 'focus-mode' : ''}`}>
      {/* Top bar */}
      <div className="reader-controls site-header sticky top-0 z-40 flex items-center justify-between px-4 h-12 bg-pampas/90 backdrop-blur-md border-b border-cloudy-200 transition-opacity">
        <Link to={`/story/${storyId}`}>
          <Button size="sm" variant="ghost" className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{chapter?.title ?? 'Back'}</span>
          </Button>
        </Link>

        <div className="flex items-center gap-1">
          {/* Zoom */}
          <Button size="icon" variant="ghost" className="h-8 w-8"
            onClick={() => updateSettings({ zoom: Math.max(0.6, settings.zoom - 0.1) })}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs font-mono text-cloudy-500 w-10 text-center">
            {Math.round(settings.zoom * 100)}%
          </span>
          <Button size="icon" variant="ghost" className="h-8 w-8"
            onClick={() => updateSettings({ zoom: Math.min(1.6, settings.zoom + 0.1) })}>
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* Bookmark current page */}
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleBookmarkPage}>
            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-crail text-crail' : ''}`} />
          </Button>

          {/* Focus mode */}
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={toggleFocusMode}>
            {settings.isFocusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          {/* Settings */}
          <Button size="icon" variant="ghost" className="h-8 w-8"
            onClick={() => setShowSettings(!showSettings)}>
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="reader-controls border-b border-cloudy-200 bg-white overflow-hidden z-30"
          >
            <div className="px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Font family */}
              <div>
                <Label className="text-xs text-cloudy-500 mb-2 block">Font</Label>
                <div className="flex gap-2">
                  {(['serif', 'sans'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => updateSettings({ fontFamily: f })}
                      className={`flex-1 py-1.5 text-sm rounded-lg border transition-colors ${
                        settings.fontFamily === f
                          ? 'border-crail text-crail bg-crail-50'
                          : 'border-cloudy-200'
                      } ${f === 'serif' ? 'font-serif' : 'font-sans'}`}
                    >
                      Aa
                    </button>
                  ))}
                </div>
              </div>

              {/* Font size */}
              <div>
                <Label className="text-xs text-cloudy-500 mb-2 block">
                  Size: {settings.fontSize}px
                </Label>
                <Slider
                  min={12} max={24} step={1}
                  value={[settings.fontSize]}
                  onValueChange={([v]) => updateSettings({ fontSize: v })}
                />
              </div>

              {/* Line spacing */}
              <div>
                <Label className="text-xs text-cloudy-500 mb-2 block">
                  Spacing: {settings.lineSpacing}
                </Label>
                <Slider
                  min={1.2} max={2.4} step={0.1}
                  value={[settings.lineSpacing]}
                  onValueChange={([v]) => updateSettings({ lineSpacing: v })}
                />
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-cloudy-500">Bionic</Label>
                  <Switch
                    checked={settings.isBionicMode}
                    onCheckedChange={toggleBionicMode}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-cloudy-500">Horizontal</Label>
                  <Switch
                    checked={settings.pageTransition === 'horizontal'}
                    onCheckedChange={(v) =>
                      updateSettings({ pageTransition: v ? 'horizontal' : 'vertical' })
                    }
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paper area */}
      <div
        className="flex-1 flex flex-col items-center py-6 px-4 overflow-auto"
        style={{ transform: `scale(${settings.zoom})`, transformOrigin: 'top center' }}
      >
        {loading ? (
          <div className="paper-page animate-pulse">
            <div className="space-y-3">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className={`h-4 bg-cloudy-100 rounded ${i % 7 === 6 ? 'w-2/3' : 'w-full'}`} />
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              ref={pageRef}
              initial={settings.pageTransition === 'horizontal'
                ? { x: 60, opacity: 0 }
                : { y: 20, opacity: 0 }
              }
              animate={{ x: 0, y: 0, opacity: 1 }}
              exit={settings.pageTransition === 'horizontal'
                ? { x: -60, opacity: 0 }
                : { y: -20, opacity: 0 }
              }
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="paper-page relative max-w-full"
            >
              {/* Dog-ear bookmark */}
              {isBookmarked && <div className="dog-ear" />}

              {/* Chapter heading on first page */}
              {currentPage === 1 && chapter && (
                <div className="mb-8 text-center">
                  <p className="text-xs font-medium text-cloudy-400 uppercase tracking-widest mb-2">
                    Chapter {chapter.number}
                  </p>
                  <h2 className={`font-serif text-2xl font-bold ${fontClass}`}>
                    {chapter.title}
                  </h2>
                  {chapter.authorNote && (
                    <p className="mt-3 text-sm text-cloudy-500 italic border-l-2 border-crail-100 pl-3 text-left">
                      Author's note: {chapter.authorNote}
                    </p>
                  )}
                  <div className="mt-6 border-t border-cloudy-200" />
                </div>
              )}

              {/* Page content */}
              <div
                className={`${fontClass} text-foreground leading-relaxed`}
                style={{ fontSize: settings.fontSize, ...lineSpacingStyle }}
                dangerouslySetInnerHTML={{
                  __html: (() => {
                    // Normalize: collapse 3+ newlines to 2, ensure single \n between text becomes \n\n
                    const normalized = displayContent
                      .replace(/\r\n/g, '\n')
                      .replace(/\r/g, '\n')
                      .replace(/\n{3,}/g, '\n\n')
                      .replace(/([^\n])\n([^\n])/g, '$1\n\n$2')
                      .trim()

                    // Split into paragraphs on double newline
                    const paragraphs = normalized
                      .split(/\n\n+/)
                      .map((p) => p.trim())
                      .filter(Boolean)

                    if (paragraphs.length === 0) return ''

                    // Apply bionic reading per paragraph if enabled
                    const rendered = paragraphs.map((p) => {
                      const text = settings.isBionicMode
                        ? p.replace(/\b(\w+)\b/g, (word) => {
                            const half = Math.ceil(word.length / 2)
                            return `<strong>${word.slice(0, half)}</strong>${word.slice(half)}`
                          })
                        : p
                      return `<p class="mt-0 mb-4 last:mb-0">${text}</p>`
                    })

                    return rendered.join('')
                  })()
                }}
              />

              {/* Page number */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                <span className="text-xs text-cloudy-300 font-serif">
                  {currentPage} / {totalPages}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="reader-controls sticky bottom-0 bg-pampas/90 backdrop-blur-md border-t border-cloudy-200 px-4 py-3 flex items-center gap-4 transition-opacity">
        {/* Prev chapter */}
        {chapter?.previousChapter && (
          <Link to={`/read/${storyId}/${chapter.previousChapter}`}>
            <Button size="sm" variant="outline" className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Prev ch
            </Button>
          </Link>
        )}

        {/* Page navigation */}
        <div className="flex-1 flex items-center gap-3">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 shrink-0"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Mini-map scrollbar */}
          <div className="flex-1 h-2 bg-cloudy-200 rounded-full overflow-hidden cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const pct = (e.clientX - rect.left) / rect.width
              setPage(Math.max(1, Math.min(totalPages, Math.round(pct * totalPages))))
            }}
          >
            <motion.div
              className="h-full bg-crail rounded-full"
              animate={{ width: `${(currentPage / totalPages) * 100}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>

          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 shrink-0"
            disabled={currentPage >= totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Next chapter */}
        {chapter?.nextChapter && (
          <Link to={`/read/${storyId}/${chapter.nextChapter}`}>
            <Button size="sm" variant="outline" className="gap-1">
              Next ch <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* Bookmark toast */}
      <AnimatePresence>
        {showBookmarkToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-crail text-white text-sm px-4 py-2 rounded-full shadow-paper-lg"
          >
            Page {currentPage} bookmarked
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}