import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000
})

// Request interceptor — attach token
apiClient.interceptors.request.use((config) => {
  const raw = sessionStorage.getItem('crail-auth')
  if (raw) {
    try {
      const { state } = JSON.parse(raw)
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`
      }
    } catch { /* ignore */ }
  }
  return config
})

// Response interceptor — handle 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('crail-auth')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── API functions ────────────────────────────────────────────────────────────

export const authApi = {
  login: (identifier: string, password: string) =>
    apiClient.post('/auth/login', { identifier, password }),
  register: (data: { username: string; email: string; password: string; displayName: string }) =>
    apiClient.post('/auth/register', data),
  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }),
  refreshToken: (token: string) =>
    apiClient.post('/auth/refresh', { token })
}

export const storiesApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/stories', { params }),
  trending: () => apiClient.get('/stories/trending'),
  featured: () => apiClient.get('/stories/featured'),
  bySlug: (slug: string) => apiClient.get(`/stories/${slug}`),
  create: (data: FormData) =>
    apiClient.post('/stories', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) =>
    apiClient.patch(`/stories/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => apiClient.delete(`/stories/${id}`),
  like: (id: string) => apiClient.post(`/stories/${id}/like`),
  bookmark: (id: string) => apiClient.post(`/stories/${id}/bookmark`),
  analytics: (id: string) => apiClient.get(`/stories/${id}/analytics`)
}

export const chaptersApi = {
  list: (storyId: string) => apiClient.get(`/stories/${storyId}/chapters`),
  get: (storyId: string, chapterId: string) =>
    apiClient.get(`/stories/${storyId}/chapters/${chapterId}`),
  create: (storyId: string, data: unknown) =>
    apiClient.post(`/stories/${storyId}/chapters`, data),
  update: (storyId: string, chapterId: string, data: unknown) =>
    apiClient.patch(`/stories/${storyId}/chapters/${chapterId}`, data),
  publish: (storyId: string, chapterId: string) =>
    apiClient.post(`/stories/${storyId}/chapters/${chapterId}/publish`),
  schedule: (storyId: string, chapterId: string, scheduledAt: string) =>
    apiClient.post(`/stories/${storyId}/chapters/${chapterId}/schedule`, { scheduledAt }),
  versions: (storyId: string, chapterId: string) =>
    apiClient.get(`/stories/${storyId}/chapters/${chapterId}/versions`),
  restoreVersion: (storyId: string, chapterId: string, versionId: string) =>
    apiClient.post(`/stories/${storyId}/chapters/${chapterId}/versions/${versionId}/restore`)
}

export const progressApi = {
  get: (storyId: string) => apiClient.get(`/progress/${storyId}`),
  update: (storyId: string, data: unknown) =>
    apiClient.put(`/progress/${storyId}`, data)
}

export const commentsApi = {
  list: (storyId: string, chapterId?: string) =>
    apiClient.get(`/stories/${storyId}/comments`, { params: { chapterId } }),
  create: (storyId: string, data: unknown) =>
    apiClient.post(`/stories/${storyId}/comments`, data),
  like: (commentId: string) => apiClient.post(`/comments/${commentId}/like`),
  delete: (commentId: string) => apiClient.delete(`/comments/${commentId}`)
}

export const aiApi = {
  analyze: (storyId: string) => apiClient.post(`/ai/analyze/${storyId}`),
  generateTags: (content: string) => apiClient.post('/ai/tags', { content }),
  grammarCheck: (content: string) => apiClient.post('/ai/grammar', { content }),
  previouslySummary: (storyId: string, upToChapter: number) =>
    apiClient.post('/ai/previously', { storyId, upToChapter }),
  generateCover: (summary: string) => apiClient.post('/ai/cover', { summary }),
  tts: (chapterId: string) => apiClient.get(`/ai/tts/${chapterId}`, { responseType: 'blob' })
}

export const usersApi = {
  profile: (username: string) => apiClient.get(`/users/${username}`),
  stories: (username: string) => apiClient.get(`/users/${username}/stories`),
  follow: (username: string) => apiClient.post(`/users/${username}/follow`),
  updateProfile: (data: FormData) =>
    apiClient.patch('/users/me', data, { headers: { 'Content-Type': 'multipart/form-data' } })
}
