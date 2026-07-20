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

    if (!authStore.isHydrated && authStore.token) {
        try {
            await authStore.fetchCurrentUser()
        } catch {
            authStore.isHydrated = true
        }
    }

    if (guestOnly && authStore.isAuthenticated) {
        return authStore.isAdmin ? '/admin' : '/dashboard'
    }

    if (needsAuth && !authStore.isAuthenticated) {
        return '/login'
    }

    if (needsAdmin && !authStore.isAdmin) {
        return '/dashboard'
    }

    return true
})

export default router
