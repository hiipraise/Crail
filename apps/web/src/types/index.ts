// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  _id: string
  username: string
  email: string
  displayName: string
  avatar?: string
  bio?: string
  followersCount: number
  followingCount: number
  storiesCount: number
  joinedAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

// ─── Story ───────────────────────────────────────────────────────────────────

export type StoryStatus = 'draft' | 'ongoing' | 'completed' | 'hiatus'
export type ContentRating = 'everyone' | 'teen' | 'mature'

export interface Story {
  _id: string
  title: string
  slug: string
  description: string
  summary: string
  coverImage?: string
  coverAnimated?: string
  author: User
  coAuthors?: User[]
  genre: string[]
  tags: string[]
  status: StoryStatus
  contentRating: ContentRating
  language: string
  viewCount: number
  likeCount: number
  commentCount: number
  bookmarkCount: number
  chapterCount: number
  wordCount: number
  isComplete: boolean
  createdAt: string
  updatedAt: string
  lastChapterAt?: string
  aiTags?: string[]
  characters?: Character[]
  locations?: Location[]
}

export interface StoryListItem {
  _id: string
  title: string
  slug: string
  coverImage?: string
  author: Pick<User, '_id' | 'username' | 'displayName' | 'avatar'>
  genre: string[]
  tags: string[]
  status: StoryStatus
  viewCount: number
  likeCount: number
  chapterCount: number
  wordCount: number
  updatedAt: string
}

// ─── Chapter ─────────────────────────────────────────────────────────────────

export interface Chapter {
  _id: string
  storyId: string
  number: number
  title: string
  content: string
  wordCount: number
  isPublished: boolean
  scheduledAt?: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
  authorNote?: string
  previousChapter?: string
  nextChapter?: string
}

export interface ChapterListItem {
  _id: string
  number: number
  title: string
  wordCount: number
  isPublished: boolean
  publishedAt?: string
  scheduledAt?: string
}

// ─── Reading ─────────────────────────────────────────────────────────────────

export interface ReadingProgress {
  _id: string
  userId: string
  storyId: string
  chapterId: string
  chapterNumber: number
  pageNumber: number
  progress: number
  lastReadAt: string
  bookmarks: Bookmark[]
  notes: ReaderNote[]
  highlights: Highlight[]
}

export interface Bookmark {
  _id: string
  chapterId: string
  pageNumber: number
  note?: string
  createdAt: string
}

export interface ReaderNote {
  _id: string
  chapterId: string
  pageNumber: number
  content: string
  position: { x: number; y: number }
  createdAt: string
}

export interface Highlight {
  _id: string
  chapterId: string
  startOffset: number
  endOffset: number
  color: 'yellow' | 'green' | 'pink' | 'blue'
  note?: string
  createdAt: string
}

// ─── Comments ────────────────────────────────────────────────────────────────

export interface Comment {
  _id: string
  storyId: string
  chapterId?: string
  parentId?: string
  author: Pick<User, '_id' | 'username' | 'displayName' | 'avatar'>
  content: string
  likeCount: number
  replies?: Comment[]
  createdAt: string
  updatedAt: string
}

export interface ParagraphReaction {
  _id: string
  chapterId: string
  paragraphIndex: number
  emoji: string
  count: number
  userReacted: boolean
}

// ─── Story Bible ──────────────────────────────────────────────────────────────

export interface Character {
  _id: string
  name: string
  aliases?: string[]
  description: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  avatar?: string
  traits?: string[]
  relationships?: Array<{ characterId: string; type: string }>
}

export interface Location {
  _id: string
  name: string
  description: string
  type: string
  image?: string
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface StoryAnalytics {
  storyId: string
  totalViews: number
  uniqueReaders: number
  averageReadTime: number
  completionRate: number
  chapterDropoff: Array<{ chapterNumber: number; dropRate: number }>
  pageHeatmap: Array<{ pageNumber: number; avgTimeSpent: number }>
  readerLocations: Array<{ country: string; count: number }>
  dailyViews: Array<{ date: string; count: number }>
}

// ─── Version ─────────────────────────────────────────────────────────────────

export interface Version {
  _id: string
  chapterId: string
  versionNumber: number
  title: string
  content: string
  wordCount: number
  branch?: string
  message?: string
  createdAt: string
  createdBy: string
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface ApiError {
  message: string
  code?: string
  field?: string
}

export interface ApiResponse<T> {
  data?: T
  error?: ApiError
  success: boolean
}
