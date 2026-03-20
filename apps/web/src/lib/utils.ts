import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function formatWordCount(words: number): string {
  if (words >= 1_000) return `${(words / 1_000).toFixed(1)}K words`
  return `${words} words`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export function formatReadTime(words: number): string {
  const mins = Math.ceil(words / 200)
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
  return Math.max(1, Math.ceil(content.length / charsPerPage))
}

export function getPageContent(content: string, page: number, charsPerPage = 2800): string {
  const start = (page - 1) * charsPerPage
  return content.slice(start, start + charsPerPage)
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
