<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Skeleton from '../components/Skeleton.vue'
import { useAdminStore, type PaymentProviderName } from '../stores/admin'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const adminStore = useAdminStore()
const authStore = useAuthStore()

type Tab = 'payment' | 'site' | 'account'
const activeTab = ref<Tab>('payment')

const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'payment', label: 'Payment', icon: 'fa-solid fa-credit-card' },
    { id: 'site', label: 'Site', icon: 'fa-solid fa-globe' },
    { id: 'account', label: 'Account', icon: 'fa-solid fa-user-shield' },
]

const paymentForm = ref({
    provider: 'paystack' as PaymentProviderName,
    paystackPublicKey: '',
    paystackSecretKey: '',
    flutterwavePublicKey: '',
    flutterwaveSecretKey: '',
    flutterwaveSecretHash: '',
})
const paymentMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)

const siteForm = ref({ siteName: '', siteBanner: '', platformFee: 0 })
const siteMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)

const accountForm = ref({ email: '', password: '', currentPassword: '' })
const accountMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)

const settings = computed(() => adminStore.paymentSettings)
const apiBase = computed(() => (import.meta.env.VITE_API_BASE_URL as string | undefined) || window.location.origin)
const webhooks = computed(() => ({
    paystack: `${apiBase.value}/api/payments/webhook/paystack`,
    flutterwave: `${apiBase.value}/api/payments/webhook/flutterwave`,
}))

const providers: { id: PaymentProviderName; label: string; icon: string; blurb: string }[] = [
    { id: 'paystack', label: 'Paystack', icon: 'fa-solid fa-bolt', blurb: 'Cards, bank transfer & USSD (Nigeria)' },
    { id: 'flutterwave', label: 'Flutterwave', icon: 'fa-solid fa-feather', blurb: 'Cards, mobile money & more (Africa)' },
]

onMounted(async () => {
    const [payment] = await Promise.all([
        adminStore.fetchPaymentSettings().catch(() => null),
        adminStore.fetchSiteSettings().catch(() => null),
    ])

    if (payment) {
        paymentForm.value.provider = payment.provider
        paymentForm.value.paystackPublicKey = payment.paystack.publicKey || ''
        paymentForm.value.flutterwavePublicKey = payment.flutterwave.publicKey || ''
    }

    const site = adminStore.siteSettings
    if (site) {
        siteForm.value.siteName = site.siteName || ''
        siteForm.value.siteBanner = site.siteBanner || ''
        siteForm.value.platformFee = site.platformFee || 0
    }

    accountForm.value.email = authStore.user?.email || ''
})

async function savePayment() {
    paymentMessage.value = null
    try {
        await adminStore.savePaymentSettings({
            provider: paymentForm.value.provider,
            paystackPublicKey: paymentForm.value.paystackPublicKey || undefined,
            paystackSecretKey: paymentForm.value.paystackSecretKey || undefined,
            flutterwavePublicKey: paymentForm.value.flutterwavePublicKey || undefined,
            flutterwaveSecretKey: paymentForm.value.flutterwaveSecretKey || undefined,
            flutterwaveSecretHash: paymentForm.value.flutterwaveSecretHash || undefined,
        })
        // Re-read from the server so the UI reflects exactly what persisted.
        const persisted = await adminStore.fetchPaymentSettings().catch(() => adminStore.paymentSettings)
        paymentForm.value.paystackSecretKey = ''
        paymentForm.value.flutterwaveSecretKey = ''
        paymentForm.value.flutterwaveSecretHash = ''
        paymentMessage.value = { type: 'success', text: maskedSummary(persisted) }
    } catch (e) {
        paymentMessage.value = { type: 'error', text: e instanceof Error ? e.message : 'Unable to save settings.' }
    }
}

function maskedSummary(settings: typeof adminStore.paymentSettings) {
    if (!settings) return 'Payment settings saved.'
    const parts: string[] = [`Provider: ${settings.provider}`]
    parts.push(settings.paystack.secretKeySet ? `Paystack key ${settings.paystack.secretKeyMasked}` : 'Paystack: no secret key')
    parts.push(
        settings.flutterwave.secretKeySet
            ? `Flutterwave key ${settings.flutterwave.secretKeyMasked}`
            : 'Flutterwave: no secret key',
    )
    return `Saved. ${parts.join(' · ')}`
}

const activeProviderConfigured = computed(() => {
    const s = adminStore.paymentSettings
    if (!s) return true
    return s.provider === 'paystack' ? s.paystack.secretKeySet : s.flutterwave.secretKeySet
})

async function saveSite() {
    siteMessage.value = null
    try {
        await adminStore.saveSiteSettings({
            siteName: siteForm.value.siteName,
            siteBanner: siteForm.value.siteBanner,
            platformFee: Number(siteForm.value.platformFee) || 0,
        })
        siteMessage.value = { type: 'success', text: 'Site settings saved.' }
    } catch (e) {
        siteMessage.value = { type: 'error', text: e instanceof Error ? e.message : 'Unable to save site settings.' }
    }
}

function onBannerFile(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    if (file.size > 700_000) {
        siteMessage.value = { type: 'error', text: 'Image is too large. Please use an image under 700KB or paste a URL.' }
        return
    }
    const reader = new FileReader()
    reader.onload = () => {
        siteForm.value.siteBanner = String(reader.result || '')
    }
    reader.readAsDataURL(file)
}

async function saveAccount() {
    accountMessage.value = null
    if (!accountForm.value.currentPassword) {
        accountMessage.value = { type: 'error', text: 'Please enter your current password to confirm.' }
        return
    }
    if (!accountForm.value.email && !accountForm.value.password) {
        accountMessage.value = { type: 'error', text: 'Change your email and/or password before saving.' }
        return
    }
    try {
        await adminStore.updateAccount({
            currentPassword: accountForm.value.currentPassword,
            email: accountForm.value.email || undefined,
            password: accountForm.value.password || undefined,
        })
        accountForm.value.password = ''
        accountForm.value.currentPassword = ''
        accountMessage.value = { type: 'success', text: 'Account credentials updated.' }
    } catch (e) {
        accountMessage.value = { type: 'error', text: e instanceof Error ? e.message : 'Unable to update account.' }
    }
}

function copy(value: string) {
    navigator.clipboard?.writeText(value)
}

async function handleLogout() {
    await authStore.logout()
    router.push('/')
}
</script>

<template>
    <div class="min-h-screen bg-secondary text-white flex flex-col lg:flex-row">
        <aside
            class="w-full lg:w-72 bg-black/40 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col p-6 sm:p-8 lg:sticky top-0 h-auto lg:h-screen z-30">
            <div class="flex items-center gap-3 mb-8 lg:mb-12">
                <img src="/images/logo.jpeg" alt="Logo" class="h-10 w-10 rounded-xl" />
                <span class="text-xl font-black tracking-tighter uppercase italic">OPTIMEDIA ADMIN</span>
            </div>
            <nav class="flex flex-col gap-2 flex-1">
                <button @click="router.push('/admin')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-users-gear text-lg"></i> Users
                </button>
                <button @click="router.push('/admin/logs')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-clock-rotate-left text-lg"></i> Activity Logs
                </button>
                <button @click="router.push('/admin/revenue')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-chart-line text-lg"></i> Revenue
                </button>
                <button @click="router.push('/admin/email')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-envelope text-lg"></i> Email Users
                </button>
                <button @click="router.push('/admin/newsletter')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-envelope-open-text text-lg"></i> Newsletter
                </button>
                <button @click="router.push('/admin/family')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-users-rectangle text-lg"></i> Family Slots
                </button>
                <button @click="router.push('/admin/coupons')"
                    class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-tags text-lg"></i> Coupons
                </button>
                <div
                    class="flex items-center gap-4 px-6 py-4 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 font-bold text-sm tracking-tight">
                    <i class="fa-solid fa-gear text-lg"></i> Settings
                </div>
            </nav>
            <div class="mt-auto pt-6 border-t border-white/5 flex flex-col gap-2">
                <button @click="router.push('/dashboard')"
                    class="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm tracking-tight text-white/40 hover:text-white hover:bg-white/5 transition-all text-left">
                    <i class="fa-solid fa-arrow-left text-lg"></i> Dashboard
                </button>
                <button @click="handleLogout" :disabled="authStore.isLoggingOut"
                    class="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm tracking-tight text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed">
                    <i :class="authStore.isLoggingOut ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-right-from-bracket'"
                        class="text-lg"></i>
                    {{ authStore.isLoggingOut ? 'Logging out...' : 'Logout' }}
                </button>
            </div>
        </aside>

        <main class="flex-1 p-4 sm:p-6 lg:p-8 2xl:p-12 overflow-x-hidden flex flex-col">
            <div class="mb-6">
                <h1 class="text-3xl sm:text-4xl font-black tracking-tight uppercase italic">Settings</h1>
                <p class="text-white/40 text-sm font-medium mt-1">
                    Manage payments, your storefront, and admin credentials.
                </p>
            </div>

            <!-- Tabs -->
            <div class="flex gap-2 mb-8 border-b border-white/10 overflow-x-auto">
                <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
                    class="flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-all -mb-px"
                    :class="activeTab === tab.id ? 'border-primary text-white' : 'border-transparent text-white/40 hover:text-white'">
                    <i :class="tab.icon"></i>{{ tab.label }}
                </button>
            </div>

            <div v-if="adminStore.isSettingsLoading && activeTab === 'payment'" class="max-w-3xl space-y-6">
                <Skeleton width="100%" height="9rem" radius="1.5rem" />
                <Skeleton width="100%" height="16rem" radius="1.5rem" />
            </div>

            <!-- PAYMENT TAB -->
            <div v-else-if="activeTab === 'payment'" class="max-w-3xl space-y-8">
                <div v-if="!activeProviderConfigured"
                    class="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                    <i class="fa-solid fa-triangle-exclamation text-amber-400 mt-0.5"></i>
                    <p class="text-sm font-semibold text-amber-200">
                        No secret key is saved for the active provider
                        ({{ settings?.provider || 'paystack' }}). Checkout will fail until a key is saved below.
                    </p>
                </div>

                <section class="bg-white/5 rounded-3xl border border-white/10 p-6 sm:p-8">
                    <h2 class="text-sm font-black uppercase tracking-widest text-white/60 mb-5">Active Provider</h2>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button v-for="p in providers" :key="p.id" type="button" @click="paymentForm.provider = p.id"
                            class="text-left rounded-2xl border p-5 transition-all"
                            :class="paymentForm.provider === p.id ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10' : 'border-white/10 bg-black/20 hover:border-white/30'">
                            <div class="flex items-center justify-between mb-3">
                                <i :class="p.icon" class="text-xl text-primary"></i>
                                <span v-if="paymentForm.provider === p.id"
                                    class="text-[10px] font-black uppercase tracking-widest text-primary">Active</span>
                            </div>
                            <p class="font-black text-white">{{ p.label }}</p>
                            <p class="text-xs text-white/40 mt-1">{{ p.blurb }}</p>
                        </button>
                    </div>
                </section>

                <section class="bg-white/5 rounded-3xl border border-white/10 p-6 sm:p-8">
                    <div class="flex items-center gap-3 mb-5">
                        <i class="fa-solid fa-bolt text-primary"></i>
                        <h2 class="text-sm font-black uppercase tracking-widest text-white/60">Paystack Keys</h2>
                    </div>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Public Key</label>
                            <input v-model="paymentForm.paystackPublicKey" placeholder="pk_live_..."
                                class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40" />
                        </div>
                        <div>
                            <label class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                                Secret Key
                                <span v-if="settings?.paystack.secretKeySet"
                                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                                    <i class="fa-solid fa-circle-check"></i> Saved · {{ settings.paystack.secretKeyMasked }}
                                </span>
                                <span v-else class="px-2 py-0.5 rounded bg-red-500/15 text-red-300">Not set</span>
                            </label>
                            <input v-model="paymentForm.paystackSecretKey" type="password" autocomplete="new-password"
                                :placeholder="settings?.paystack.secretKeySet ? 'Leave blank to keep current key' : 'sk_live_...'"
                                class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40" />
                        </div>
                    </div>
                </section>

                <section class="bg-white/5 rounded-3xl border border-white/10 p-6 sm:p-8">
                    <div class="flex items-center gap-3 mb-5">
                        <i class="fa-solid fa-feather text-primary"></i>
                        <h2 class="text-sm font-black uppercase tracking-widest text-white/60">Flutterwave Keys</h2>
                    </div>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Public Key</label>
                            <input v-model="paymentForm.flutterwavePublicKey" placeholder="FLWPUBK-..."
                                class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40" />
                        </div>
                        <div>
                            <label class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                                Secret Key
                                <span v-if="settings?.flutterwave.secretKeySet"
                                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                                    <i class="fa-solid fa-circle-check"></i> Saved · {{ settings.flutterwave.secretKeyMasked }}
                                </span>
                                <span v-else class="px-2 py-0.5 rounded bg-red-500/15 text-red-300">Not set</span>
                            </label>
                            <input v-model="paymentForm.flutterwaveSecretKey" type="password" autocomplete="new-password"
                                :placeholder="settings?.flutterwave.secretKeySet ? 'Leave blank to keep current key' : 'FLWSECK-...'"
                                class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40" />
                        </div>
                        <div>
                            <label class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                                Webhook Secret Hash
                                <span v-if="settings?.flutterwave.secretHashSet"
                                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                                    <i class="fa-solid fa-circle-check"></i> Saved · {{ settings.flutterwave.secretHashMasked }}
                                </span>
                                <span v-else class="px-2 py-0.5 rounded bg-red-500/15 text-red-300">Not set</span>
                            </label>
                            <input v-model="paymentForm.flutterwaveSecretHash" type="password" autocomplete="new-password"
                                :placeholder="settings?.flutterwave.secretHashSet ? 'Leave blank to keep current hash' : 'Your Flutterwave webhook hash'"
                                class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40" />
                        </div>
                    </div>
                </section>

                <section class="bg-white/5 rounded-3xl border border-white/10 p-6 sm:p-8">
                    <h2 class="text-sm font-black uppercase tracking-widest text-white/60 mb-5">Webhook URLs</h2>
                    <p class="text-xs text-white/40 mb-4">
                        Add these in each provider's dashboard so payments auto-confirm even if the customer closes the tab.
                    </p>
                    <div class="space-y-3">
                        <div class="flex items-center gap-3 bg-black/30 border border-white/10 rounded-xl px-4 py-3">
                            <span class="text-[10px] font-black uppercase tracking-widest text-white/40 w-24 shrink-0">Paystack</span>
                            <code class="text-xs text-white/80 truncate flex-1">{{ webhooks.paystack }}</code>
                            <button @click="copy(webhooks.paystack)" class="text-white/40 hover:text-white shrink-0" title="Copy">
                                <i class="fa-solid fa-copy"></i>
                            </button>
                        </div>
                        <div class="flex items-center gap-3 bg-black/30 border border-white/10 rounded-xl px-4 py-3">
                            <span class="text-[10px] font-black uppercase tracking-widest text-white/40 w-24 shrink-0">Flutterwave</span>
                            <code class="text-xs text-white/80 truncate flex-1">{{ webhooks.flutterwave }}</code>
                            <button @click="copy(webhooks.flutterwave)" class="text-white/40 hover:text-white shrink-0" title="Copy">
                                <i class="fa-solid fa-copy"></i>
                            </button>
                        </div>
                    </div>
                </section>

                <div v-if="paymentMessage" class="rounded-xl border p-4 text-sm font-semibold"
                    :class="paymentMessage.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-red-500/30 bg-red-500/10 text-red-300'">
                    {{ paymentMessage.text }}
                </div>

                <div class="flex justify-end">
                    <button @click="savePayment" :disabled="adminStore.isSavingSettings"
                        class="bg-primary text-white px-8 py-3.5 rounded-xl font-black uppercase text-xs tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/30 disabled:opacity-60 disabled:cursor-not-allowed">
                        <i v-if="adminStore.isSavingSettings" class="fa-solid fa-spinner fa-spin mr-2"></i>
                        {{ adminStore.isSavingSettings ? 'Saving...' : 'Save Payment Settings' }}
                    </button>
                </div>
            </div>

            <!-- SITE TAB -->
            <div v-else-if="activeTab === 'site'" class="max-w-3xl space-y-8">
                <section class="bg-white/5 rounded-3xl border border-white/10 p-6 sm:p-8 space-y-5">
                    <h2 class="text-sm font-black uppercase tracking-widest text-white/60">Storefront</h2>
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Site Name</label>
                        <input v-model="siteForm.siteName" placeholder="OptiMedia"
                            class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40" />
                    </div>
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                            Platform Charge (₦) — added to every service purchase
                        </label>
                        <input v-model.number="siteForm.platformFee" type="number" min="0" placeholder="0"
                            class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40" />
                        <p class="text-[11px] text-white/40 mt-2">
                            This flat fee is added on top of the service price at checkout for every order.
                        </p>
                    </div>
                </section>

                <section class="bg-white/5 rounded-3xl border border-white/10 p-6 sm:p-8 space-y-5">
                    <h2 class="text-sm font-black uppercase tracking-widest text-white/60">Site Banner</h2>
                    <div class="rounded-2xl overflow-hidden border border-white/10 bg-black/30 h-40 flex items-center justify-center">
                        <img v-if="siteForm.siteBanner" :src="siteForm.siteBanner" alt="Banner preview"
                            class="w-full h-full object-cover" />
                        <p v-else class="text-white/30 text-xs font-bold uppercase tracking-widest">No banner set</p>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Banner URL</label>
                        <input v-model="siteForm.siteBanner" placeholder="https://.../banner.jpg"
                            class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40" />
                    </div>
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Or upload an image (max 700KB)</label>
                        <input type="file" accept="image/*" @change="onBannerFile"
                            class="w-full text-sm text-white/60 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-primary file:text-white file:font-black file:uppercase file:text-xs file:tracking-widest hover:file:brightness-110" />
                    </div>
                </section>

                <div v-if="siteMessage" class="rounded-xl border p-4 text-sm font-semibold"
                    :class="siteMessage.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-red-500/30 bg-red-500/10 text-red-300'">
                    {{ siteMessage.text }}
                </div>

                <div class="flex justify-end">
                    <button @click="saveSite" :disabled="adminStore.isSavingSite"
                        class="bg-primary text-white px-8 py-3.5 rounded-xl font-black uppercase text-xs tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/30 disabled:opacity-60 disabled:cursor-not-allowed">
                        <i v-if="adminStore.isSavingSite" class="fa-solid fa-spinner fa-spin mr-2"></i>
                        {{ adminStore.isSavingSite ? 'Saving...' : 'Save Site Settings' }}
                    </button>
                </div>
            </div>

            <!-- ACCOUNT TAB -->
            <div v-else class="max-w-3xl space-y-8">
                <section class="bg-white/5 rounded-3xl border border-white/10 p-6 sm:p-8 space-y-5">
                    <h2 class="text-sm font-black uppercase tracking-widest text-white/60">Admin Credentials</h2>
                    <p class="text-xs text-white/40">
                        Update the admin login. Changing the email will require re-verification on next login.
                    </p>
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Admin Email</label>
                        <input v-model="accountForm.email" type="email"
                            class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40" />
                    </div>
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">New Password</label>
                        <input v-model="accountForm.password" type="password" autocomplete="new-password"
                            placeholder="Leave blank to keep current password"
                            class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40" />
                    </div>
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Current Password (required)</label>
                        <input v-model="accountForm.currentPassword" type="password" autocomplete="current-password"
                            placeholder="Confirm with your current password"
                            class="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-primary/40" />
                    </div>
                </section>

                <div v-if="accountMessage" class="rounded-xl border p-4 text-sm font-semibold"
                    :class="accountMessage.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-red-500/30 bg-red-500/10 text-red-300'">
                    {{ accountMessage.text }}
                </div>

                <div class="flex justify-end">
                    <button @click="saveAccount" :disabled="adminStore.isSavingAccount"
                        class="bg-primary text-white px-8 py-3.5 rounded-xl font-black uppercase text-xs tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/30 disabled:opacity-60 disabled:cursor-not-allowed">
                        <i v-if="adminStore.isSavingAccount" class="fa-solid fa-spinner fa-spin mr-2"></i>
                        {{ adminStore.isSavingAccount ? 'Updating...' : 'Update Credentials' }}
                    </button>
                </div>
            </div>
        </main>
    </div>
</template>
