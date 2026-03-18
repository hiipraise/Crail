import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/types'
import { apiClient } from '@/lib/api'

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  login: (identifier: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, displayName: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
  clearError: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (identifier, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await apiClient.post('/auth/login', { identifier, password })
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false })
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { detail?: string } } })
            ?.response?.data?.detail ?? 'Login failed'
          set({ error: msg, isLoading: false })
          throw err
        }
      },

      register: async (username, email, password, displayName) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await apiClient.post('/auth/register', {
            username, email, password, displayName
          })
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false })
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { detail?: string } } })
            ?.response?.data?.detail ?? 'Registration failed'
          set({ error: msg, isLoading: false })
          throw err
        }
      },

      logout: () => {
        delete apiClient.defaults.headers.common['Authorization']
        set({ user: null, token: null, isAuthenticated: false })
      },

      refreshToken: async () => {
        const { token } = get()
        if (!token) return
        try {
          const { data } = await apiClient.post('/auth/refresh', { token })
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          set({ token: data.token, user: data.user })
        } catch {
          get().logout()
        }
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null
        }))
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'crail-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated })
    }
  )
)
