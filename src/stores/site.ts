import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiFetch } from '../lib/api'

export const useSiteStore = defineStore('site', () => {
    const siteName = ref('OptiMedia')
    const siteBanner = ref('')
    const platformFee = ref(0)
    const loaded = ref(false)

    async function fetchSite() {
        try {
            const response = await apiFetch<{ siteName: string; siteBanner: string; platformFee: number }>('/api/site')
            siteName.value = response.siteName || 'OptiMedia'
            siteBanner.value = response.siteBanner || ''
            platformFee.value = Number(response.platformFee) || 0
        } catch {
            // Keep defaults on failure.
        } finally {
            loaded.value = true
        }
    }

    function applyLocal(siteNameValue?: string, siteBannerValue?: string) {
        if (siteNameValue) siteName.value = siteNameValue
        if (siteBannerValue !== undefined) siteBanner.value = siteBannerValue
    }

    return { siteName, siteBanner, platformFee, loaded, fetchSite, applyLocal }
})
