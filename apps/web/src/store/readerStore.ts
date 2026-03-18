import { create } from 'zustand'
import type { Bookmark, Highlight, ReaderNote } from '@/types'

type FontFamily = 'serif' | 'sans'
type PageTransition = 'vertical' | 'horizontal'
type HighlightColor = 'yellow' | 'green' | 'pink' | 'blue'

interface ReaderSettings {
  fontFamily: FontFamily
  fontSize: number
  lineSpacing: number
  zoom: number
  pageTransition: PageTransition
  isFocusMode: boolean
  isBionicMode: boolean
  isAudioPlaying: boolean
  ambientAudio: string | null
}

interface ReaderStore {
  // Current position
  currentPage: number
  totalPages: number
  currentChapterId: string | null

  // Settings
  settings: ReaderSettings

  // Annotations
  bookmarks: Bookmark[]
  highlights: Highlight[]
  notes: ReaderNote[]

  // Audio
  audioProgress: number
  isNarrating: boolean

  // Actions
  setPage: (page: number) => void
  setTotalPages: (total: number) => void
  setChapter: (chapterId: string) => void
  updateSettings: (updates: Partial<ReaderSettings>) => void
  toggleFocusMode: () => void
  toggleBionicMode: () => void
  addBookmark: (bookmark: Bookmark) => void
  removeBookmark: (id: string) => void
  addHighlight: (highlight: Highlight) => void
  removeHighlight: (id: string) => void
  addNote: (note: ReaderNote) => void
  updateNote: (id: string, content: string) => void
  removeNote: (id: string) => void
  setAudioProgress: (progress: number) => void
  setNarrating: (narrating: boolean) => void
  setAmbientAudio: (audio: string | null) => void
}

const DEFAULT_SETTINGS: ReaderSettings = {
  fontFamily: 'serif',
  fontSize: 16,
  lineSpacing: 1.8,
  zoom: 1,
  pageTransition: 'vertical',
  isFocusMode: false,
  isBionicMode: false,
  isAudioPlaying: false,
  ambientAudio: null
}

export const useReaderStore = create<ReaderStore>((set) => ({
  currentPage: 1,
  totalPages: 1,
  currentChapterId: null,
  settings: DEFAULT_SETTINGS,
  bookmarks: [],
  highlights: [],
  notes: [],
  audioProgress: 0,
  isNarrating: false,

  setPage: (page) => set({ currentPage: page }),
  setTotalPages: (total) => set({ totalPages: total }),
  setChapter: (chapterId) => set({ currentChapterId: chapterId, currentPage: 1 }),
  updateSettings: (updates) =>
    set((state) => ({ settings: { ...state.settings, ...updates } })),
  toggleFocusMode: () =>
    set((state) => ({
      settings: { ...state.settings, isFocusMode: !state.settings.isFocusMode }
    })),
  toggleBionicMode: () =>
    set((state) => ({
      settings: { ...state.settings, isBionicMode: !state.settings.isBionicMode }
    })),
  addBookmark: (bookmark) =>
    set((state) => ({ bookmarks: [...state.bookmarks, bookmark] })),
  removeBookmark: (id) =>
    set((state) => ({ bookmarks: state.bookmarks.filter((b) => b._id !== id) })),
  addHighlight: (highlight) =>
    set((state) => ({ highlights: [...state.highlights, highlight] })),
  removeHighlight: (id) =>
    set((state) => ({ highlights: state.highlights.filter((h) => h._id !== id) })),
  addNote: (note) =>
    set((state) => ({ notes: [...state.notes, note] })),
  updateNote: (id, content) =>
    set((state) => ({
      notes: state.notes.map((n) => (n._id === id ? { ...n, content } : n))
    })),
  removeNote: (id) =>
    set((state) => ({ notes: state.notes.filter((n) => n._id !== id) })),
  setAudioProgress: (progress) => set({ audioProgress: progress }),
  setNarrating: (narrating) => set({ isNarrating: narrating }),
  setAmbientAudio: (audio) =>
    set((state) => ({ settings: { ...state.settings, ambientAudio: audio } }))
}))
