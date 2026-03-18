// Shared constants and types used across frontend and (if needed) backend tooling

export const GENRES = [
  'Fantasy', 'Sci-Fi', 'Romance', 'Horror', 'Mystery',
  'Thriller', 'Historical', 'Contemporary', 'Adventure', 'Drama'
] as const

export const CONTENT_RATINGS = ['everyone', 'teen', 'mature'] as const

export const STORY_STATUSES = ['draft', 'ongoing', 'completed', 'hiatus'] as const

export const THEME = {
  crail: '#C15F3C',
  cloudy: '#B1ADA1',
  pampas: '#F4F3EE',
} as const
