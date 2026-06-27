<script setup lang="ts">
import { ref } from 'vue'

const pricingPlans = [
    {
        name: 'Netflix Premium',
        price: '2,500',
        originalPrice: '4,000',
        description: '4K Ultra HD + HDR, 4 screens.',
        features: ['Official Account', 'Full Warranty', 'Instant Activation', 'Mobile/TV/PC'],
        cta: 'Get Started',
        popular: false,
        icon: 'fa-brands fa-netflix'
    },
    {
        name: 'Spotify Premium',
        price: '1,000',
        originalPrice: '1,600',
        description: 'Ad-free music, 6 accounts.',
        features: ['Your Own Account', 'High Quality Audio', 'Offline Playback', 'Unlimited Skips'],
        cta: 'Get Started',
        popular: true,
        icon: 'fa-brands fa-spotify'
    },
    {
        name: 'Amazon Prime',
        price: '2,000',
        originalPrice: '2,300',
        description: 'Prime Video + Free Delivery.',
        features: ['Global Access', 'No Ads on Video', 'Exclusive Originals', '4K Streaming'],
        cta: 'Get Started',
        popular: false,
        icon: 'fa-brands fa-amazon'
    }
]

const faqs = ref([
    {
        question: 'How do I pay in NGN?',
        answer: 'We support all Nigerian payment methods including Bank Transfer, USSD, and Card payments via Paystack or Flutterwave integrations.',
        open: false
    },
    {
        question: 'Are there hidden charges?',
        answer: 'No. The price you see is exactly what you pay per month. No maintenance or service fees.',
        open: false
    },
    {
        question: 'How long does activation take?',
        answer: 'Activation is typically instant for Spotify and Netflix, and takes up to 30 minutes for other services.',
        open: false
    }
])

function toggleFaq(index: number) {
    faqs.value[index].open = !faqs.value[index].open
}
</script>

<template>
    <div class="landing-page overflow-hidden">
        <!-- Hero Section -->
        <section
            class="relative min-h-[90vh] flex items-center justify-center bg-secondary text-white overflow-hidden text-center xxl:text-left">
            <div class="absolute inset-0 z-0">
                <img src="/images/ads/ad1.jpeg" alt="Background"
                    class="w-full h-full object-cover opacity-15 grayscale hover:grayscale-0 transition-all duration-1000 scale-105" />
                <div class="absolute inset-0 bg-gradient-to-tr from-secondary via-secondary/80 to-primary/20"></div>
            </div>

            <div class="container mx-auto px-10 relative z-10">
                <div class="inline-block animate-bounce-slow mb-10">
                    <div class="p-1.5 bg-gradient-to-br from-primary to-tertiary rounded-[2.8rem] shadow-2xl">
                        <img src="/images/logo.jpeg" alt="Logo"
                            class="w-36 h-36 rounded-[2.5rem] border-4 border-white/10" />
                    </div>
                </div>
                <h1 class="text-7xl md:text-[8rem] font-black tracking-tighter mb-10 leading-[0.8]">
                    PREMIUM FOR <br />
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary italic">LESS
                        THE PRICE.</span>
                </h1>
                <p class="text-xl md:text-2xl text-white/70 max-w-4xl mx-auto mb-14 leading-relaxed font-bold">
                    Quality entertainment shouldn't break the bank. <br />
                    Get official <span class="text-white underline decoration-primary">Netflix, Prime Video, Spotify,
                        Apple Music, and YouTube+ YouTube Music</span>
                    at local NGN rates.
                </p>
                <div class="flex flex-col sm:flex-row gap-8 justify-center items-center">
                    <button
                        class="bg-primary text-white px-12 py-6 rounded-2xl text-xl font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-3xl shadow-primary/40 group flex items-center gap-4">
                        Get Started
                        <i class="fa-solid fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
                    </button>
                    <a href="#pricing"
                        class="text-white/60 hover:text-white transition-all font-black uppercase tracking-[0.1em] text-lg flex items-center gap-2 group">
                        View Plans
                        <i class="fa-solid fa-chevron-down group-hover:translate-y-2 transition-transform"></i>
                    </a>
                </div>
            </div>

            <!-- Brand Bar -->
            <div class="absolute bottom-0 left-0 right-0 py-8 bg-black/40 border-t border-white/5 backdrop-blur-xl">
                <div
                    class="container mx-auto px-10 flex flex-wrap justify-center gap-10 md:gap-24 opacity-60 grayscale contrast-125 hover:opacity-80 transition-opacity">
                    <i class="fa-brands fa-netflix text-4xl"></i>
                    <i class="fa-brands fa-spotify text-4xl"></i>
                    <i class="fa-brands fa-youtube text-4xl"></i>
                    <i class="fa-brands fa-amazon text-4xl"></i>
                    <i class="fa-brands fa-apple text-4xl"></i>
                </div>
            </div>
        </section>

        <!-- About Section -->
        <section id="about" class="py-32 bg-background border-b border-muted">
            <div class="container mx-auto px-10">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                    <div class="relative group">
                        <div
                            class="absolute -inset-4 bg-gradient-to-br from-primary to-tertiary rounded-[4rem] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity">
                        </div>
                        <div
                            class="relative bg-secondary p-16 rounded-[4rem] text-white shadow-3xl overflow-hidden border border-white/5">
                            <h3 class="text-6xl font-black mb-12 leading-tight uppercase italic tracking-tighter">WHY WE
                                <br />DO THIS.
                            </h3>
                            <p class="text-white/60 text-xl mb-12 leading-relaxed font-bold">
                                Streaming platforms are charging native Nigerians dollar-equivalent rates. We bridge
                                that gap using bulk corporate licensing and regional arbitrage to give you <span
                                    class="text-primary italic">fair local pricing</span>.
                            </p>
                            <div class="space-y-8">
                                <div class="flex items-center gap-6">
                                    <div
                                        class="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-white/10">
                                        <i class="fa-solid fa-check text-primary text-3xl"></i>
                                    </div>
                                    <div>
                                        <h4 class="font-black uppercase tracking-widest text-sm mb-1">Local Payments
                                        </h4>
                                        <p class="text-white/40 text-sm">Pay in NGN without dollar cards.</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-6">
                                    <div
                                        class="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-white/10">
                                        <iconify-icon icon="lucide:check" class="text-primary text-3xl"></iconify-icon>
                                    </div>
                                    <div>
                                        <h4 class="font-black uppercase tracking-widest text-sm mb-1">Guaranteed Subs
                                        </h4>
                                        <p class="text-white/40 text-sm">Full duration warranty for every plan.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 gap-12">
                        <div
                            class="bg-card p-10 rounded-[3rem] border border-muted shadow-sm hover:translate-x-4 transition-all duration-500">
                            <div class="flex items-center gap-6 mb-8">
                                <img src="/images/ads/ad1.jpeg" class="w-24 h-24 rounded-2xl object-cover grayscale" />
                                <h4 class="text-2xl font-black uppercase italic text-secondary">The Noise</h4>
                            </div>
                            <p class="text-secondary/60 font-bold leading-relaxed">Most people settle for ad-supported
                                tiers or low-quality streaming because premium is too expensive. We remove that barrier.
                            </p>
                        </div>
                        <div
                            class="bg-card p-10 rounded-[3rem] border border-muted shadow-sm hover:translate-x-4 transition-all duration-500">
                            <div class="flex items-center gap-6 mb-8">
                                <img src="/images/ads/ad2.jpeg" class="w-24 h-24 rounded-2xl object-cover grayscale" />
                                <h4 class="text-2xl font-black uppercase italic text-secondary">The Privacy</h4>
                            </div>
                            <p class="text-secondary/60 font-bold leading-relaxed">Free trials and cracked apps steal
                                your data. Our official premium access keeps your account secure and private.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Pricing Section -->
        <section id="pricing" class="py-32 bg-muted/20">
            <div class="container mx-auto px-10">
                <div class="text-center mb-24">
                    <h2 class="text-6xl font-black text-secondary mb-6 uppercase italic tracking-tighter">NGN DEALS
                        <span class="text-primary">YOU CAN'T IGNORE</span>
                    </h2>
                    <p class="text-secondary/50 text-2xl font-black uppercase tracking-widest">Compare & Save Today</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-7xl mx-auto">
                    <div v-for="plan in pricingPlans" :key="plan.name"
                        class="relative bg-card p-12 rounded-[4rem] border-2 transition-all duration-700 hover:-translate-y-6 hover:shadow-4xl"
                        :class="plan.popular ? 'border-primary ring-[12px] ring-primary/5 shadow-3xl shadow-primary/20 scale-105 z-10' : 'border-muted'">
                        <div v-if="plan.popular"
                            class="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white px-10 py-3 rounded-full text-xs font-black tracking-[0.3em] uppercase shadow-2xl">
                            BEST SELLER
                        </div>

                        <div class="mb-12">
                            <div
                                class="w-20 h-20 bg-secondary text-white rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl ring-4 ring-white/5">
                                <i :class="plan.icon" class="text-4xl"
                                    :style="{ color: plan.popular ? 'var(--primary)' : 'white' }"></i>
                            </div>
                            <h3 class="text-3xl font-black text-secondary mb-2 uppercase tracking-tight italic">{{
                                plan.name }}</h3>
                            <p class="text-secondary/40 font-bold text-sm tracking-wide">{{ plan.description }}</p>
                        </div>

                        <div class="mb-12">
                            <div class="flex items-baseline gap-2 mb-2">
                                <span class="text-7xl font-black text-secondary leading-none">₦{{ plan.price }}</span>
                                <span
                                    class="text-secondary/30 font-black uppercase text-xs tracking-widest">/month</span>
                            </div>
                            <div class="flex items-center gap-3 font-black text-sm">
                                <span class="text-secondary/30 line-through decoration-red-500/50 decoration-2">₦{{
                                    plan.originalPrice }}</span>
                                <span
                                    class="text-tertiary bg-tertiary/10 px-3 py-1 rounded-lg uppercase tracking-tighter">Save
                                    ₦{{ (parseInt(plan.originalPrice.replace(',', '')) -
                                        parseInt(plan.price.replace(',', ''))).toLocaleString() }}</span>
                            </div>
                        </div>

                        <ul class="space-y-6 mb-14">
                            <li v-for="feature in plan.features" :key="feature"
                                class="flex items-center gap-4 text-secondary/70 font-black text-sm tracking-tight">
                                <i class="fa-solid fa-circle-check text-primary text-2xl"></i>
                                {{ feature }}
                            </li>
                        </ul>

                        <button
                            class="w-full py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-sm transition-all shadow-lg"
                            :class="plan.popular ? 'bg-primary text-white shadow-2xl shadow-primary/30 hover:brightness-110 active:scale-95' : 'bg-muted text-secondary hover:bg-secondary hover:text-white'">
                            {{ plan.cta }}
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- FAQ Section -->
        <section class="py-32 bg-background">
            <div class="container mx-auto px-10 max-w-5xl">
                <h2 class="text-5xl font-black text-secondary text-center mb-20 italic uppercase tracking-tighter">NO
                    BS. JUST <span class="text-tertiary">ANSWERS</span></h2>
                <div class="space-y-6">
                    <div v-for="(faq, index) in faqs" :key="index"
                        class="border-4 border-muted rounded-[3rem] overflow-hidden bg-card transition-all"
                        :class="faq.open ? 'border-primary/20 shadow-2xl scale-[1.02]' : 'hover:border-primary/10'">
                        <button @click="toggleFaq(index)"
                            class="w-full px-12 py-10 flex justify-between items-center text-left transition-all"
                            :class="faq.open ? 'bg-primary text-white' : 'hover:bg-muted/10 bg-card'">
                            <span class="text-2xl font-black uppercase tracking-tight"
                                :class="faq.open ? 'text-white' : 'text-secondary'">{{ faq.question }}</span>
                            <i class="text-3xl transition-transform"
                                :class="faq.open ? 'fa-solid fa-minus rotate-180 text-white' : 'fa-solid fa-plus text-primary'"></i>
                        </button>
                        <div v-show="faq.open"
                            class="px-12 py-10 text-secondary/60 text-xl font-bold leading-relaxed animate-fade-in border-t-2 border-muted/50">
                            {{ faq.answer }}
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Detailed Footer -->
        <footer id="contact" class="bg-secondary text-white pt-32 pb-16 relative overflow-hidden">
            <div class="absolute -left-20 -bottom-20 w-[60rem] h-[60rem] bg-primary/5 rounded-full blur-[120px]"></div>
            <div class="container mx-auto px-10 relative z-10">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-24 mb-24 border-b-2 border-white/5 pb-24">
                    <div class="col-span-1 md:col-span-1">
                        <div class="flex items-center gap-4 mb-12">
                            <img src="/images/logo.jpeg" alt="Logo"
                                class="h-14 w-14 object-contain rounded-2xl shadow-2xl border-2 border-white/10" />
                            <span class="text-4xl font-black tracking-tighter uppercase italic">optiMedia</span>
                        </div>
                        <p class="text-white/40 leading-relaxed font-black mb-12 text-sm uppercase tracking-widest">
                            Revolutionizing access to premium digital services for the Nigerian market.
                        </p>
                        <div class="flex gap-6">
                            <a href="#"
                                class="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-primary transition-all border border-white/5 shadow-2xl">
                                <i class="fa-brands fa-x-twitter text-2xl"></i>
                            </a>
                            <a href="#"
                                class="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-primary transition-all border border-white/5 shadow-2xl">
                                <i class="fa-brands fa-whatsapp text-2xl"></i>
                            </a>
                            <a href="#"
                                class="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-primary transition-all border border-white/5 shadow-2xl">
                                <i class="fa-brands fa-instagram text-2xl"></i>
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 class="text-xs font-black uppercase tracking-[0.4em] text-primary mb-12">Catalogue</h4>
                        <ul class="space-y-6 text-white/50 font-black text-xs uppercase tracking-widest">
                            <li><a href="#" class="hover:text-primary transition-colors">Netflix Hub</a></li>
                            <li><a href="#" class="hover:text-primary transition-colors">Spotify Deck</a></li>
                            <li><a href="#" class="hover:text-primary transition-colors">Prime Lounge</a></li>
                            <li><a href="#" class="hover:text-primary transition-colors">YouTube Pro</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 class="text-xs font-black uppercase tracking-[0.4em] text-primary mb-12">Resources</h4>
                        <ul class="space-y-6 text-white/50 font-black text-xs uppercase tracking-widest">
                            <li><a href="#about" class="hover:text-primary transition-colors">Our Edge</a></li>
                            <li><a href="#" class="hover:text-primary transition-colors">Security Audit</a></li>
                            <li><a href="#" class="hover:text-primary transition-colors">Agent Portal</a></li>
                            <li><a href="#" class="hover:text-primary transition-colors">Status Feed</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 class="text-xs font-black uppercase tracking-[0.4em] text-primary mb-12">Newsletter</h4>
                        <p class="text-white/40 text-xs font-black mb-8 uppercase tracking-widest">Stay updated on new
                            deals.</p>
                        <div class="bg-white/5 p-3 rounded-2xl border border-white/5 flex gap-3 shadow-inner">
                            <input type="email" placeholder="YOUR EMAIL"
                                class="bg-transparent border-none px-4 py-3 text-xs w-full outline-none font-black placeholder:text-white/10" />
                            <button
                                class="bg-primary px-6 py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all font-black text-[11px] uppercase tracking-tighter">SUB</button>
                        </div>
                    </div>
                </div>

                <div
                    class="flex flex-col md:flex-row justify-between items-center text-white/10 text-[11px] font-black uppercase tracking-[0.3em]">
                    <p>&copy; 2026 optiMedia Advanced Agentic Coding. Built for the elite.</p>
                    <div class="flex gap-12 mt-8 md:mt-0">
                        <span class="text-primary hover:text-white transition-colors cursor-pointer">Verified</span>
                        <span class="hover:text-white transition-colors cursor-pointer">Encrypted</span>
                        <span class="hover:text-white transition-colors cursor-pointer">Local</span>
                    </div>
                </div>
            </div>
        </footer>
    </div>
</template>

<style scoped>
.animate-bounce-slow {
    animation: bounce-slow 4s infinite ease-in-out;
}

@keyframes bounce-slow {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-30px);
    }
}

.animate-fade-in {
    animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(30px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.landing-page {
    scroll-behavior: smooth;
}

/* Custom scrollbar */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: #0f172a;
}

::-webkit-scrollbar-thumb {
    background: #6366f1;
    border-radius: 20px;
}

::-webkit-scrollbar-thumb:hover {
    background: #4f46e5;
}
</style>