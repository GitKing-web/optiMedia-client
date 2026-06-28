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
        meta: { hideNavbar: true, hideFooter: true }
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/Login.vue'),
        meta: { hideNavbar: true, hideFooter: true }
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('../views/Register.vue'),
        meta: { hideNavbar: true, hideFooter: true }
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { hideNavbar: true, hideFooter: true }
    }
]



const router = createRouter({
    history: createWebHistory(),
    routes,

})
export default router