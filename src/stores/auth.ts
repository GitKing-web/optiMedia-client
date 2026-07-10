import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiFetch, ApiError } from '../lib/api'

export interface UserProfile {
    id: string
    name: string
    email: string
    avatar?: string
    whatsapp?: string
    role?: 'user' | 'admin'
}

interface AuthResponse {
    token: string
    user: UserProfile
}

interface MeResponse {
    user: UserProfile
    dashboard?: unknown
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref<UserProfile | null>(null)
    const token = ref<string | null>(localStorage.getItem('token'))
    const isAdmin = ref(false)
    const isHydrated = ref(false)
    const isLoading = ref(false)
    const authError = ref<string | null>(null)

    const isAuthenticated = computed(() => !!token.value)

    function setUser(profile: UserProfile, administrative: boolean = false) {
        user.value = profile
        isAdmin.value = administrative
    }

    function setToken(newToken: string | null) {
        token.value = newToken
        if (newToken) {
            localStorage.setItem('token', newToken)
        } else {
            localStorage.removeItem('token')
        }
    }

    function logout() {
        user.value = null
        token.value = null
        isAdmin.value = false
        localStorage.removeItem('token')
    }

    async function login(identifier: string, password: string) {
        isLoading.value = true
        authError.value = null

        try {
            const response = await apiFetch<AuthResponse>('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ identifier, password })
            })

            setToken(response.token)
            setUser(response.user, response.user.role === 'admin')
            return response
        } catch (error) {
            if (error instanceof ApiError) {
                authError.value = error.message
            } else {
                authError.value = 'Unable to log in right now'
            }
            throw error
        } finally {
            isLoading.value = false
        }
    }

    async function register(payload: { name: string; email: string; whatsapp: string; password: string }) {
        isLoading.value = true
        authError.value = null

        try {
            const response = await apiFetch<AuthResponse>('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify(payload)
            })

            setToken(response.token)
            setUser(response.user, response.user.role === 'admin')
            return response
        } catch (error) {
            if (error instanceof ApiError) {
                authError.value = error.message
            } else {
                authError.value = 'Unable to register right now'
            }
            throw error
        } finally {
            isLoading.value = false
        }
    }

    async function fetchCurrentUser() {
        if (!token.value) {
            isHydrated.value = true
            return null
        }

        isLoading.value = true

        try {
            const response = await apiFetch<MeResponse>('/api/auth/me', {
                authToken: token.value
            })

            setUser(response.user, response.user.role === 'admin')
            return response.user
        } catch (error) {
            logout()
            throw error
        } finally {
            isLoading.value = false
            isHydrated.value = true
        }
    }

    return {
        user,
        token,
        isAdmin,
        isAuthenticated,
        isLoading,
        isHydrated,
        authError,
        setUser,
        setToken,
        login,
        register,
        fetchCurrentUser,
        logout
    }
})
