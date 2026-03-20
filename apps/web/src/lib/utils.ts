import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Guard against undefined/null — backend may return snake_case fields
export function formatNumber(n: number | undefined | null): string {
  if (n === undefined || n === null || isNaN(Number(n))) return '0'
  const num = Number(n)
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}

export function formatWordCount(words: number | undefined | null): string {
  const n = Number(words ?? 0)
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K words`
  return `${n} words`
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  const now = new Date()
  const days = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export function formatReadTime(words: number | undefined | null): string {
  const mins = Math.ceil(Number(words ?? 0) / 200)
  if (mins < 60) return `${mins} min read`
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  return rem ? `${hrs}h ${rem}m read` : `${hrs}h read`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function applyBionicReading(text: string): string {
  return text.replace(/\b(\w+)\b/g, (word) => {
    const half = Math.ceil(word.length / 2)
    return `<b>${word.slice(0, half)}</b>${word.slice(half)}`
  })
}

export function estimatePages(content: string, charsPerPage = 2800): number {
  return Math.max(1, Math.ceil((content ?? '').length / charsPerPage))
}

export function getPageContent(content: string, page: number, charsPerPage = 2800): string {
  const start = (page - 1) * charsPerPage
  return (content ?? '').slice(start, start + charsPerPage)
}

export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

export function getGenreColor(genre: string): string {
  const colors: Record<string, string> = {
    Fantasy: '#7C3AED',
    'Sci-Fi': '#2563EB',
    Romance: '#DB2777',
    Horror: '#DC2626',
    Mystery: '#D97706',
    Thriller: '#059669',
    Historical: '#92400E',
    Contemporary: '#0891B2',
    Adventure: '#65A30D',
    Drama: '#C15F3C'
  }
  return colors[genre] ?? '#B1ADA1'
}

// ── Normalize snake_case API response to camelCase ────────────────────────
// The FastAPI backend returns snake_case; this maps the common fields.
export function normalizeStory(raw: Record<string, any>) {
  return {
    ...raw,
    _id:          raw._id          ?? raw.id,
    coverImage:   raw.coverImage   ?? raw.cover_image,
    viewCount:    raw.viewCount    ?? raw.view_count    ?? 0,
    likeCount:    raw.likeCount    ?? raw.like_count    ?? 0,
    commentCount: raw.commentCount ?? raw.comment_count ?? 0,
    bookmarkCount:raw.bookmarkCount?? raw.bookmark_count?? 0,
    chapterCount: raw.chapterCount ?? raw.chapter_count ?? 0,
    wordCount:    raw.wordCount    ?? raw.word_count    ?? 0,
    isComplete:   raw.isComplete   ?? raw.is_complete   ?? false,
    isPublished:  raw.isPublished  ?? raw.is_published  ?? false,
    contentRating:raw.contentRating?? raw.content_rating?? 'everyone',
    createdAt:    raw.createdAt    ?? raw.created_at,
    updatedAt:    raw.updatedAt    ?? raw.updated_at,
    lastChapterAt:raw.lastChapterAt?? raw.last_chapter_at,
    aiTags:       raw.aiTags       ?? raw.ai_tags       ?? [],
    author: raw.author ? normalizeUser(raw.author) : undefined,
  }
}

export function normalizeUser(raw: Record<string, any>) {
  return {
    ...raw,
    _id:          raw._id          ?? raw.id,
    displayName:  raw.displayName  ?? raw.display_name  ?? raw.username ?? '',
    avatar:       raw.avatar,
    followersCount: raw.followersCount ?? raw.followers_count ?? 0,
    followingCount: raw.followingCount ?? raw.following_count ?? 0,
    storiesCount:   raw.storiesCount   ?? raw.stories_count   ?? 0,
    joinedAt:     raw.joinedAt     ?? raw.joined_at,
  }
}

export function normalizeChapter(raw: Record<string, any>) {
  return {
    ...raw,
    _id:          raw._id          ?? raw.id,
    storyId:      raw.storyId      ?? raw.story_id,
    wordCount:    raw.wordCount    ?? raw.word_count    ?? 0,
    isPublished:  raw.isPublished  ?? raw.is_published  ?? false,
    authorNote:   raw.authorNote   ?? raw.author_note,
    scheduledAt:  raw.scheduledAt  ?? raw.scheduled_at,
    publishedAt:  raw.publishedAt  ?? raw.published_at,
    createdAt:    raw.createdAt    ?? raw.created_at,
    updatedAt:    raw.updatedAt    ?? raw.updated_at,
    previousChapter: raw.previousChapter ?? raw.previous_chapter,
    nextChapter:  raw.nextChapter  ?? raw.next_chapter,
  }
}