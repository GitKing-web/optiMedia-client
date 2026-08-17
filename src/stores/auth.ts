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
    emailVerified?: boolean
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
    const isAdmin = ref(false)
    const isHydrated = ref(false)
    const isLoading = ref(false)
    const isLoggingOut = ref(false)
    const authError = ref<string | null>(null)

    let fetchingUser = false
    let currentUserPromise: Promise<UserProfile | null> | null = null

    const isAuthenticated = computed(() => !!user.value)

    function setUser(profile: UserProfile, administrative: boolean = false) {
        user.value = profile
        isAdmin.value = administrative || profile.role === 'admin'
    }

    async function logout() {
        if (isLoggingOut.value) return
        isLoggingOut.value = true
        try {
            await apiFetch('/api/auth/logout', { method: 'POST' })
        } catch {
        } finally {
            user.value = null
            isAdmin.value = false
            isLoggingOut.value = false
        }
    }

    async function login(identifier: string, password: string) {
        isLoading.value = true
        authError.value = null

        try {
            const response = await apiFetch<AuthResponse>('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ identifier, password })
            })

            setUser(response.user, response.user.role === 'admin')
            isHydrated.value = true
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

            setUser(response.user, response.user.role === 'admin')
            isHydrated.value = true
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

    async function sendVerificationOtp() {
        return apiFetch<{ message: string }>('/api/auth/send-otp', { method: 'POST' })
    }

    async function verifyEmail(code: string) {
        const response = await apiFetch<{ message: string; user: UserProfile }>('/api/auth/verify-email', {
            method: 'POST',
            body: JSON.stringify({ code })
        })

        if (user.value) {
            user.value = { ...user.value, emailVerified: true }
        }
        return response
    }

    async function fetchCurrentUser(): Promise<UserProfile | null> {
        if (fetchingUser && currentUserPromise) return currentUserPromise
        fetchingUser = true
        isLoading.value = true

        const promise = (async (): Promise<UserProfile | null> => {
            try {
                const response = await apiFetch<MeResponse>('/api/auth/me')

                setUser(response.user, response.user.role === 'admin')
                return response.user
            } catch (error) {
                user.value = null
                isAdmin.value = false
                throw error
            } finally {
                isLoading.value = false
                isHydrated.value = true
            }
        })()

        currentUserPromise = promise
        try {
            return await promise
        } finally {
            currentUserPromise = null
            fetchingUser = false
        }
    }

    return {
        user,
        isAdmin,
        isAuthenticated,
        isLoading,
        isLoggingOut,
        isHydrated,
        authError,
        setUser,
        login,
        register,
        sendVerificationOtp,
        verifyEmail,
        fetchCurrentUser,
        logout
    }
})
