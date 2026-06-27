import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserProfile {
    id: string
    name: string
    email: string
    avatar?: string
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref<UserProfile | null>(null)
    const token = ref<string | null>(localStorage.getItem('token'))
    const isAdmin = ref(false)

    const isAuthenticated = computed(() => !!token.value)

    function setUser(profile: UserProfile, administrative: boolean = false) {
        user.value = profile
        isAdmin.value = administrative
    }

    function login(newToken: string) {
        token.value = newToken
        localStorage.setItem('token', newToken)
    }

    function logout() {
        user.value = null
        token.value = null
        isAdmin.value = false
        localStorage.removeItem('token')
    }

    return {
        user,
        token,
        isAdmin,
        isAuthenticated,
        setUser,
        login,
        logout
    }
})
