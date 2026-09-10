import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('../views/Home.vue')
    },
    {
        path: '/subscriptions',
        name: 'Subscriptions',
        component: () => import('../views/Subscriptions.vue'),
        meta: { hideNavbar: true, hideFooter: true }
    },
    {
        path: '/subscriptions/:name',
        name: 'SubscriptionDetail',
        component: () => import('../views/SubscriptionDetail.vue'),
        meta: { hideNavbar: true, hideFooter: true }
    },
    {
        path: '/admin',
        name: 'AdminDashboard',
        component: () => import('../views/AdminDashboard.vue'),
        meta: { hideNavbar: true, hideFooter: true, requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/logs',
        name: 'AdminActivityLogs',
        component: () => import('../views/AdminActivityLogs.vue'),
        meta: { hideNavbar: true, hideFooter: true, requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/email',
        name: 'AdminEmailUsers',
        component: () => import('../views/AdminEmailUsers.vue'),
        meta: { hideNavbar: true, hideFooter: true, requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/revenue',
        name: 'AdminRevenue',
        component: () => import('../views/AdminRevenue.vue'),
        meta: { hideNavbar: true, hideFooter: true, requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/newsletter',
        name: 'AdminNewsletter',
        component: () => import('../views/AdminNewsletter.vue'),
        meta: { hideNavbar: true, hideFooter: true, requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/family',
        name: 'AdminFamily',
        component: () => import('../views/AdminFamily.vue'),
        meta: { hideNavbar: true, hideFooter: true, requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/settings',
        name: 'AdminSettings',
        component: () => import('../views/AdminSettings.vue'),
        meta: { hideNavbar: true, hideFooter: true, requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/coupons',
        name: 'AdminCoupons',
        component: () => import('../views/AdminCoupons.vue'),
        meta: { hideNavbar: true, hideFooter: true, requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/Login.vue'),
        meta: { hideNavbar: true, hideFooter: true, guestOnly: true }
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('../views/Register.vue'),
        meta: { hideNavbar: true, hideFooter: true, guestOnly: true }
    },
    {
        path: '/forgot-password',
        name: 'ForgotPassword',
        component: () => import('../views/ForgotPassword.vue'),
        meta: { hideNavbar: true, hideFooter: true }
    },
    {
        path: '/reset-password',
        name: 'ResetPassword',
        component: () => import('../views/ResetPassword.vue'),
        meta: { hideNavbar: true, hideFooter: true }
    },

    {
    path: '/verify-email',
    name: 'VerifyEmail',
    component: () => import('../views/VerifyEmail.vue'),
    meta: { hideNavbar: true, hideFooter: true }
  },

    {
        path: '/dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { hideNavbar: true, hideFooter: true, requiresAuth: true },
        children: [
            {
                path: '',
                name: 'DashboardHome',
                component: () => import('../views/dashboard/DashboardHome.vue')
            },
            {
                path: 'history',
                name: 'UsageHistory',
                component: () => import('../views/dashboard/UsageHistory.vue')
            },
            {
                path: 'settings',
                name: 'Settings',
                component: () => import('../views/dashboard/Settings.vue')
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach(async (to) => {
    const authStore = useAuthStore()
    const needsAuth = to.matched.some((record) => record.meta.requiresAuth)
    const needsAdmin = to.matched.some((record) => record.meta.requiresAdmin)
    const guestOnly = to.matched.some((record) => record.meta.guestOnly)

    if (!authStore.isHydrated) {
        try {
            await authStore.fetchCurrentUser()
        } catch {
            authStore.isHydrated = true
        }
    }

    if (guestOnly && authStore.isAuthenticated) {
        if (!authStore.isAdmin && !authStore.user?.emailVerified) {
            return { path: '/verify-email', query: { email: authStore.user?.email } }
        }
        return authStore.isAdmin ? '/admin' : '/dashboard'
    }

    if (needsAuth && !authStore.isAuthenticated) {
        return '/login'
    }

    if (needsAuth && authStore.isAuthenticated && !authStore.isAdmin && !authStore.user?.emailVerified) {
        return { path: '/verify-email', query: { email: authStore.user?.email } }
    }

    if (needsAdmin && !authStore.isAdmin) {
        return '/dashboard'
    }

    return true
})

// A stale cached index.html can point at hashed chunks that were removed by a
// newer deploy, so a lazy route import fails. Recover by reloading once to pull
// the fresh HTML (guarded to avoid a reload loop).
router.onError((error, to) => {
    const message = String((error as Error)?.message || '')
    const isChunkLoadError =
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('Importing a module script failed') ||
        message.includes('error loading dynamically imported module')

    if (!isChunkLoadError) return

    const key = 'optimedia:chunk-reload'
    if (sessionStorage.getItem(key)) return

    sessionStorage.setItem(key, '1')
    window.location.assign(to.fullPath || window.location.pathname)
})

router.afterEach(() => {
    sessionStorage.removeItem('optimedia:chunk-reload')
})

export default router
