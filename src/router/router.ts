import { createRouter, createWebHistory } from 'vue-router'

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
    routes,
})

// Global Session Guards Logic
// router.beforeEach((to, from, next) => {
//     const token = localStorage.getItem('token');
//     const user = JSON.parse(localStorage.getItem('user') || '{}');

//     // Prevent authorized user instances from hitting guest landing pages
//     if (to.meta.guestOnly || to.path === '/') {
//         if (token) {
//             return next('/dashboard')
//         }
//     }

//     // Traverse the complete routing record match path array to catch parent auth requirements
//     if (to.matched.some(record => record.meta.requiresAuth) && !token) {
//         return next('/login');
//     }

//     // Isolate administration clearance parameters
//     if (to.matched.some(record => record.meta.requiresAdmin)) {
//         if (!token || !user.isAdmin) {
//             return next('/dashboard');
//         }
//     }
    
//     next();
// })

export default router