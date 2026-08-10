import {
  ArrowRight,
  BarChart3,
  Bot,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  Compass,
  FileText,
  Layers3,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import kaivoWordmarkWhite from './assets/brand/KAIVO-Brand-Pack/01_Logos/Primary/KAIVO-Primary-white.svg'
import kaivoIconWhite from './assets/brand/KAIVO-Brand-Pack/02_Icons/Selected/KAIVO-Icon-Primary-white.svg'
import { KaivoIntro } from './components/intro/KaivoIntro'
import { AIService } from './lib/ai'
import { getPermissionsForRole, hasPermission } from './lib/permissions'
import { getSupabaseStatusMessage } from './lib/supabase'
import type { ActivityLog, Business, ContentItem, PermissionName, ProductItem } from './types/saas'

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4'

const capabilities = ['Create', 'Manage', 'Publish', 'Grow']

const initialContent: ContentItem[] = [
  {
    id: 1,
    title: 'Winter experience campaign',
    channel: 'Instagram',
    status: 'Published',
    updated: 'Today, 09:42',
  },
  {
    id: 2,
    title: 'New menu launch',
    channel: 'Website',
    status: 'Scheduled',
    updated: 'Tomorrow, 08:00',
  },
  {
    id: 3,
    title: 'Behind the brand',
    channel: 'LinkedIn',
    status: 'Draft',
    updated: 'Edited 2h ago',
  },
]

const initialProducts: ProductItem[] = [
  { id: 1, name: 'Chef Signature Set', category: 'Dining', price: 'R299', status: 'Live' },
  { id: 2, name: 'Weekend Brunch', category: 'Events', price: 'R189', status: 'Draft' },
]

const initialActivity: ActivityLog[] = [
  { id: 1, actor: 'Ava', action: 'generated', detail: 'A new AI caption draft for the weekend special' },
  { id: 2, actor: 'Mina', action: 'published', detail: 'Instagram stories for the new launch' },
  { id: 3, actor: 'Admin', action: 'added', detail: 'A new staff member for social operations' },
]

const initialBusinesses: Business[] = [
  {
    id: 'biz-1',
    name: 'KAIVO Demo Restaurant',
    tradingName: 'Lumen House',
    industry: 'Hospitality',
    businessType: 'Restaurant',
    plan: 'Growth',
    status: 'active',
    ownerEmail: 'owner@lumenhouse.co.za',
    city: 'Cape Town',
    country: 'South Africa',
    timezone: 'Africa/Johannesburg',
    currency: 'ZAR',
    accentColor: '#C7A566',
    createdAt: '2025-01-14',
    lastLogin: 'Today',
    staffCount: 7,
    socialConnections: 3,
    aiUsage: 142,
  },
  {
    id: 'biz-2',
    name: 'Northline Studio',
    tradingName: 'Northline Studio',
    industry: 'Creative',
    businessType: 'Agency',
    plan: 'Pro',
    status: 'pending',
    ownerEmail: 'owner@northline.studio',
    city: 'Johannesburg',
    country: 'South Africa',
    timezone: 'Africa/Johannesburg',
    currency: 'ZAR',
    accentColor: '#5B5CE2',
    createdAt: '2025-07-01',
    lastLogin: '2 days ago',
    staffCount: 4,
    socialConnections: 2,
    aiUsage: 81,
  },
]

type AppRoute =
  | 'home'
  | 'login'
  | 'admin'
  | 'admin/businesses'
  | 'dashboard'
  | 'dashboard/ai'
  | 'dashboard/ai/writer'
  | 'dashboard/ai/images'
  | 'dashboard/content'
  | 'dashboard/social'
  | 'dashboard/calendar'
  | 'dashboard/brand'
  | 'dashboard/products'
  | 'dashboard/staff'
  | 'dashboard/analytics'
  | 'dashboard/files'
  | 'dashboard/settings'

type DashboardModule =
  | 'overview'
  | 'ai'
  | 'content'
  | 'social'
  | 'calendar'
  | 'brand'
  | 'products'
  | 'staff'
  | 'analytics'
  | 'files'
  | 'settings'

type AdminSection = 'overview' | 'businesses' | 'customers' | 'subscriptions' | 'ai' | 'social' | 'activity' | 'support' | 'settings'

type AuthRole = 'super_admin' | 'owner'

type UserSession = {
  email: string
  role: AuthRole
  fullName: string
  businessName?: string
  permissions: PermissionName[]
}

function VideoBackground({ subdued = false }: { subdued?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let frame = 0
    let replayTimer = 0

    const updateOpacity = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        const fadeDuration = 0.5
        const timeUntilEnd = Math.max(0, video.duration - video.currentTime)
        const fadeIn = Math.min(1, video.currentTime / fadeDuration)
        const fadeOut = Math.min(1, timeUntilEnd / fadeDuration)
        video.style.opacity = String(Math.min(fadeIn, fadeOut) * (subdued ? 0.4 : 1))
      }
      frame = window.requestAnimationFrame(updateOpacity)
    }

    const replay = () => {
      video.style.opacity = '0'
      replayTimer = window.setTimeout(() => {
        video.currentTime = 0
        void video.play()
      }, 100)
    }

    const start = () => {
      video.style.opacity = '0'
      void video.play()
    }

    video.addEventListener('loadedmetadata', start)
    video.addEventListener('ended', replay)
    if (video.readyState >= 1) start()
    frame = window.requestAnimationFrame(updateOpacity)

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(replayTimer)
      video.removeEventListener('loadedmetadata', start)
      video.removeEventListener('ended', replay)
    }
  }, [subdued])

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#05030d]" aria-hidden="true">
      <div className="pipe-fallback absolute inset-0" />
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover opacity-0"
        src={VIDEO_URL}
        autoPlay
        muted
        playsInline
        preload="auto"
      />
    </div>
  )
}

function BrandMark({ className = '' }: { className?: string }) {
  return <img src={kaivoWordmarkWhite} alt="KAIVO" className={className} />
}

export function HomePage({ onOpenLogin }: { onOpenLogin: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const scrollTo = (id: string) => {
    setMobileOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <motion.div
      key="home"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#05030d] text-[#f6f4f2]"
    >
      <main>
        <section className="relative flex min-h-screen flex-col overflow-hidden">
          <VideoBackground />

          <header className="relative z-30 px-5 pt-3 sm:px-8">
            <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between">
              <button onClick={() => scrollTo('top')} aria-label="KAIVO home">
                <BrandMark className="h-[22px] w-auto sm:h-[26px]" />
              </button>

              <nav className="hidden items-center gap-9 text-sm text-white/72 md:flex">
                <button onClick={() => scrollTo('about')} className="nav-link flex items-center gap-1.5">
                  Platform <ChevronDown className="size-3.5" />
                </button>
                <button onClick={() => scrollTo('workflow')} className="nav-link">
                  Solutions
                </button>
                <button onClick={() => scrollTo('about')} className="nav-link">
                  About
                </button>
              </nav>

              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenLogin}
                  className="liquid-glass hidden rounded-full px-5 py-2.5 text-sm text-white transition hover:bg-white/10 sm:inline-flex"
                >
                  Sign in
                </button>
                <button
                  onClick={() => setMobileOpen((open) => !open)}
                  className="liquid-glass grid size-10 place-items-center rounded-full md:hidden"
                  aria-label="Toggle navigation"
                  aria-expanded={mobileOpen}
                >
                  {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
                </button>
              </div>
            </div>
            <div className="nav-divider mx-auto max-w-[1440px]" />

            <AnimatePresence>
              {mobileOpen && (
                <motion.nav
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="liquid-glass absolute left-5 right-5 top-[82px] z-40 rounded-2xl p-4 md:hidden"
                >
                  {['about', 'workflow'].map((id) => (
                    <button
                      key={id}
                      onClick={() => scrollTo(id)}
                      className="block w-full rounded-xl px-4 py-3 text-left capitalize text-white/75 hover:bg-white/5 hover:text-white"
                    >
                      {id === 'workflow' ? 'Solutions' : 'About KAIVO'}
                    </button>
                  ))}
                  <button
                    onClick={onOpenLogin}
                    className="mt-2 w-full rounded-xl bg-white px-4 py-3 text-left font-medium text-[#080510]"
                  >
                    Sign in to KAIVO
                  </button>
                </motion.nav>
              )}
            </AnimatePresence>
          </header>

          <div id="top" className="relative z-10 flex flex-1 items-center justify-center overflow-visible px-4 py-12 text-center sm:px-5">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[48vh] w-[min(80vw,984px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#05030d]/90 blur-[82px]" />

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative mx-auto max-w-[1240px]"
            >
              <h1 className="hero-title font-heading font-normal leading-[0.95] tracking-[-0.055em]">
                <span className="text-[#f7f5f1]">Run </span>
                <span className="hero-gradient">Better.</span>
              </h1>
              <p className="mx-auto mt-7 max-w-lg text-base leading-7 text-[#e2dfe8]/72 sm:text-lg sm:leading-8">
                Run your business. Elevate experiences.
                <br />
                Operate your company, staff, content and social brand from one intelligent platform.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => scrollTo('about')}
                  className="liquid-glass group inline-flex items-center gap-3 rounded-full px-7 py-3.5 text-sm text-white transition hover:bg-white/10"
                >
                  Explore the platform
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={onOpenLogin}
                  className="rounded-full bg-white px-7 py-3.5 text-sm font-medium text-[#080510] transition hover:bg-white/88"
                >
                  Open secure workspace
                </button>
              </div>
            </motion.div>
          </div>

          <div className="relative z-10 px-5 pb-8 sm:px-8 sm:pb-10">
            <div className="mx-auto flex max-w-5xl items-center gap-8 sm:gap-12">
              <p className="hidden shrink-0 text-sm leading-5 text-white/42 sm:block">
                One platform.
                <br />
                Every workflow.
              </p>
              <div className="marquee-mask min-w-0 flex-1 overflow-hidden">
                <div className="marquee-track flex w-max items-center gap-12 pr-12 sm:gap-16 sm:pr-16">
                  {[...capabilities, ...capabilities].map((item, index) => (
                    <div key={`${item}-${index}`} className="flex items-center gap-3 text-sm font-medium text-white/72">
                      <span className="liquid-glass grid size-7 place-items-center rounded-lg text-xs text-white">
                        {item[0]}
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="relative overflow-hidden border-t border-white/[0.06] bg-[#05030d] px-5 py-28 sm:px-8 sm:py-36">
          <div className="pointer-events-none absolute right-[-12%] top-[10%] size-[580px] rounded-full bg-violet-700/14 blur-[130px]" />
          <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7 }}
            >
              <p className="eyebrow">About KAIVO</p>
              <h2 className="mt-5 font-heading text-4xl leading-[1.05] tracking-[-0.04em] text-white sm:text-6xl">
                Your brand, in motion.
              </h2>
              <p className="mt-7 max-w-xl text-base leading-8 text-white/58 sm:text-lg">
                KAIVO is a premium operating system for hospitality and modern service businesses that need content, social, staff and brand workflows in one place.
              </p>
              <div className="mt-9 grid max-w-lg grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.08] min-[380px]:grid-cols-2">
                {[
                  ['01', 'Create with clarity'],
                  ['02', 'Manage in one place'],
                  ['03', 'Publish everywhere'],
                  ['04', 'Grow with insight'],
                ].map(([number, label]) => (
                  <div key={number} className="bg-[#080611] p-4 sm:p-5">
                    <span className="text-xs text-violet-300/72">{number}</span>
                    <p className="mt-2 text-sm text-white/72">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <HologramCard />
          </div>
        </section>

        <section id="workflow" className="border-t border-white/[0.06] bg-[#07050f] px-5 py-28 sm:px-8 sm:py-36">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow">One connected workflow</p>
                <h2 className="mt-5 max-w-2xl font-heading text-4xl leading-[1.05] tracking-[-0.04em] text-white sm:text-6xl">
                  Less noise. More momentum.
                </h2>
              </div>
              <p className="max-w-md text-base leading-7 text-white/50">
                A calm workspace for the content your business creates every day.
              </p>
            </div>

            <div className="mt-14 grid gap-4 md:grid-cols-4">
              {[
                ['Create', 'Turn an idea into ready-to-use content.'],
                ['Manage', 'Keep assets, approvals and campaigns together.'],
                ['Publish', 'Send content to every important channel.'],
                ['Grow', 'See what works and build on it.'],
              ].map(([title, description], index) => (
                <motion.article
                  key={title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.55, delay: index * 0.07 }}
                  className="workflow-card rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6"
                >
                  <span className="text-xs text-violet-300/70">0{index + 1}</span>
                  <h3 className="mt-14 text-xl font-medium text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/48">{description}</p>
                </motion.article>
              ))}
            </div>

            <div className="mt-20 flex flex-col items-start justify-between gap-7 rounded-[2rem] border border-white/[0.08] bg-white/[0.025] p-8 sm:flex-row sm:items-center sm:p-10">
              <div>
                <p className="eyebrow">Secure by design</p>
                <h2 className="mt-3 font-heading text-3xl tracking-[-0.03em] text-white sm:text-4xl">
                  Admin-controlled onboarding for serious businesses.
                </h2>
              </div>
              <button
                onClick={onOpenLogin}
                className="group inline-flex shrink-0 items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-medium text-[#080510]"
              >
                Open secure workspace
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/[0.06] bg-[#05030d] px-5 py-7 sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 text-sm text-white/36 sm:flex-row sm:items-center sm:justify-between">
            <BrandMark className="h-5 w-auto opacity-70" />
            <p>Run your business. Elevate experiences.</p>
            <p>© 2026 KAIVO</p>
          </div>
        </footer>
      </main>
    </motion.div>
  )
}

function HologramCard() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8 }}
      className="hologram-stage relative mx-auto w-full max-w-[560px] py-12"
      onMouseMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect()
        const x = (event.clientX - bounds.left) / bounds.width - 0.5
        const y = (event.clientY - bounds.top) / bounds.height - 0.5
        setTilt({ x: y * -8, y: x * 10 })
      }}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}>
        <div className="hologram-card liquid-glass relative overflow-hidden rounded-[2rem] p-5 sm:p-7" style={{ transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
          <div className="hologram-scan pointer-events-none absolute inset-0" />
          <div className="relative flex items-center justify-between border-b border-white/[0.09] pb-5">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl border border-violet-300/20 bg-violet-500/10 shadow-[0_0_35px_rgba(139,92,246,0.25)]">
                <img src={kaivoIconWhite} alt="" className="size-6" />
              </span>
              <div>
                <p className="text-sm font-medium text-white">KAIVO Workspace</p>
                <p className="mt-1 text-xs text-violet-200/55">Multi-tenant operating system</p>
              </div>
            </div>
            <span className="flex items-center gap-2 text-xs text-white/48">
              <span className="size-1.5 rounded-full bg-violet-300 shadow-[0_0_12px_rgba(196,181,253,0.9)]" />
              Live
            </span>
          </div>

          <div className="relative mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              ['24', 'Assets'],
              ['08', 'Scheduled'],
              ['71%', 'Growth'],
            ].map(([value, label]) => (
              <div key={label} className="min-w-0 rounded-2xl border border-white/[0.08] bg-black/20 p-3 sm:p-4">
                <p className="font-heading text-2xl text-white sm:text-3xl">{value}</p>
                <p className="mt-1 text-[0.68rem] uppercase tracking-[0.16em] text-white/35">{label}</p>
              </div>
            ))}
          </div>

          <div className="relative mt-4 space-y-2.5 rounded-2xl border border-white/[0.08] bg-black/20 p-4">
            {[
              ['Campaign story', 'Ready to publish', '82%'],
              ['Product launch', 'Team review', '64%'],
              ['Brand journal', 'Drafting', '38%'],
            ].map(([title, status, progress]) => (
              <div key={title} className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.025] p-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-400/10 text-violet-200">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white/82">{title}</p>
                  <p className="mt-0.5 text-xs text-white/33">{status}</p>
                </div>
                <span className="text-xs text-violet-200/65">{progress}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="pointer-events-none absolute bottom-2 left-1/2 h-8 w-3/4 -translate-x-1/2 rounded-[50%] bg-violet-500/18 blur-2xl" />
    </motion.div>
  )
}

function LoginPage({ onLogin, onBack }: { onLogin: (session: UserSession) => void; onBack: () => void }) {
  const [email, setEmail] = useState('owner@lumenhouse.co.za')
  const [password, setPassword] = useState('')

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalized = email.trim().toLowerCase()
    const isAdmin = normalized.includes('admin') || normalized.includes('kaivo')
    const session: UserSession = isAdmin
      ? {
          email,
          role: 'super_admin',
          fullName: 'KAIVO Admin',
          businessName: 'KAIVO Platform',
          permissions: getPermissionsForRole('super_admin'),
        }
      : {
          email,
          role: 'owner',
          fullName: 'Lumen House Owner',
          businessName: 'Lumen House',
          permissions: getPermissionsForRole('owner'),
        }
    onLogin(session)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05030d] text-white">
      <VideoBackground subdued />
      <div className="absolute inset-0 bg-[#05030d]/62" aria-hidden="true" />

      <header className="relative z-10 flex items-center justify-between px-5 py-6 sm:px-8 lg:px-12">
        <button onClick={onBack} aria-label="Back to KAIVO homepage">
          <BrandMark className="h-6 w-auto" />
        </button>
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-white/58 transition hover:text-white">
          <ArrowRight className="size-4" />
          Back to homepage
        </button>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-96px)] max-w-6xl items-center gap-12 px-5 pb-14 sm:px-8 lg:grid-cols-[1fr_0.78fr] lg:px-10">
        <motion.div initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
          <p className="eyebrow">Secure access</p>
          <h1 className="mt-5 max-w-2xl font-heading text-5xl leading-[0.98] tracking-[-0.05em] sm:text-7xl">
            Welcome back.
            <br />
            <span className="hero-gradient">Private workspace.</span>
          </h1>
          <p className="mt-7 max-w-lg text-base leading-8 text-white/55">
            Businesses are provisioned by KAIVO Admin. No public business signup flow is exposed on the website.
          </p>
          <div className="mt-9 hidden gap-5 text-sm text-white/45 sm:flex">
            {['Admin-controlled onboarding', 'Protected dashboards', 'Supabase-ready architecture'].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-violet-300" />
                {item}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.08 }} className="liquid-glass rounded-[1.8rem] p-6 sm:p-8">
          <div className="rounded-xl bg-black/25 p-1 text-sm text-white/70">
            <div className="rounded-lg bg-white px-4 py-2.5 text-center font-medium text-[#080510]">Sign in</div>
          </div>
          <p className="mt-5 text-sm leading-6 text-white/42">
            Use your KAIVO-issued account. Admin and business workspaces are separated by role and access.
          </p>
          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block">
              <span className="form-label">Email address</span>
              <input className="form-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="block">
              <span className="form-label">Password</span>
              <input className="form-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Development scaffold" required />
            </label>
            <button type="submit" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-medium text-[#080510] transition hover:bg-white/88">
              Continue to workspace
              <ArrowRight className="size-4" />
            </button>
          </form>

          <p className="mt-5 text-center text-xs leading-5 text-white/30">
            {getSupabaseStatusMessage()}
          </p>
        </motion.div>
      </main>
    </div>
  )
}

function AdminDashboard({ onBack, onNavigate }: { onBack: () => void; onNavigate: (route: AppRoute) => void }) {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview')
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses)
  const [showCreateFlow, setShowCreateFlow] = useState(false)
  const [step, setStep] = useState(1)
  const [newBusiness, setNewBusiness] = useState({
    name: '',
    tradingName: '',
    industry: 'Hospitality',
    businessType: 'Restaurant',
    website: '',
    email: '',
    city: '',
    province: 'Western Cape',
    country: 'South Africa',
    currency: 'ZAR',
    plan: 'Starter',
    ownerEmail: '',
  })

  const sections = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'businesses', label: 'Businesses', icon: Building2 },
    { key: 'customers', label: 'Customers', icon: Users },
    { key: 'subscriptions', label: 'Subscriptions', icon: ShieldCheck },
    { key: 'ai', label: 'AI Usage', icon: Bot },
    { key: 'social', label: 'Social Connections', icon: Sparkles },
    { key: 'activity', label: 'Platform Activity', icon: FileText },
    { key: 'support', label: 'Support', icon: Compass },
    { key: 'settings', label: 'Settings', icon: Layers3 },
  ] as const

  const handleCreateBusiness = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const business: Business = {
      id: `biz-${Date.now()}`,
      name: newBusiness.name,
      tradingName: newBusiness.tradingName || newBusiness.name,
      industry: newBusiness.industry,
      businessType: newBusiness.businessType,
      plan: newBusiness.plan,
      status: 'pending',
      ownerEmail: newBusiness.ownerEmail || newBusiness.email,
      city: newBusiness.city,
      country: newBusiness.country,
      timezone: 'Africa/Johannesburg',
      currency: newBusiness.currency,
      accentColor: '#C7A566',
      createdAt: 'Today',
      lastLogin: 'Pending',
      staffCount: 1,
      socialConnections: 0,
      aiUsage: 0,
    }
    setBusinesses([business, ...businesses])
    setShowCreateFlow(false)
    setStep(1)
    setActiveSection('businesses')
  }

  return (
    <div className="min-h-screen bg-[#07050f] text-white">
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#07050f]/90 px-4 py-3 backdrop-blur-xl sm:px-8 sm:py-4">
        <div className="mx-auto flex max-w-[1550px] items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} aria-label="Back to public website">
              <BrandMark className="h-5 w-auto" />
            </button>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-white">KAIVO Admin</p>
              <p className="text-xs text-white/40">Platform operations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="liquid-glass hidden size-10 place-items-center rounded-full min-[380px]:grid" aria-label="Search">
              <Search className="size-4 text-white/65" />
            </button>
            <button onClick={() => onNavigate('dashboard')} className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/70 sm:px-4 sm:text-sm">
              <span className="sm:hidden">Preview</span><span className="hidden sm:inline">Business preview</span>
            </button>
          </div>
        </div>
      </header>

      <nav className="mobile-section-nav lg:hidden" aria-label="Admin sections">
        {sections.map(({ key, label }) => (
          <button key={key} onClick={() => setActiveSection(key as AdminSection)} className={activeSection === key ? 'mobile-section-nav__active' : ''}>
            {label}
          </button>
        ))}
      </nav>

      <div className="mx-auto flex max-w-[1550px]">
        <aside className="hidden min-h-[calc(100vh-73px)] w-72 shrink-0 border-r border-white/[0.07] p-5 lg:flex lg:flex-col">
          <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-violet-300/70">SaaS control centre</p>
            <p className="mt-2 font-medium text-white">Manage onboarding, subscriptions and client workspaces.</p>
          </div>
          <nav className="mt-6 space-y-1">
            {sections.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveSection(key as AdminSection)} className={`sidebar-link ${activeSection === key ? 'sidebar-link-active' : ''}`}>
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </nav>
          <div className="mt-auto space-y-1">
            <button onClick={onBack} className="sidebar-link"><ArrowRight className="size-4" /> Public website</button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow">KAIVO administration</p>
                <h1 className="mt-3 font-heading text-3xl text-white sm:text-4xl">Admin operations centre</h1>
                <p className="mt-2 text-sm text-white/40">Create businesses, manage subscriptions and keep every workspace aligned.</p>
              </div>
              <button onClick={() => setShowCreateFlow(true)} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-[#080510]">
                <Plus className="size-4" /> Add Business
              </button>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {[
                { label: 'Active businesses', value: '12', hint: 'Healthy workspaces' },
                { label: 'Trial accounts', value: '04', hint: 'Needs activation' },
                { label: 'AI generations', value: '2.4k', hint: 'This month' },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-sm text-white/45">{item.label}</p>
                  <p className="mt-4 font-heading text-3xl text-white">{item.value}</p>
                  <p className="mt-1 text-sm text-white/35">{item.hint}</p>
                </div>
              ))}
            </div>

            {activeSection === 'businesses' && (
              <section className="mt-8 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-medium text-white">Business portfolio</h2>
                    <p className="mt-1 text-sm text-white/40">Search, filter and manage every tenant workspace.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Active', 'Trial', 'Suspended', 'Cancelled'].map((filter) => (
                      <button key={filter} className="rounded-full border border-white/10 px-3 py-2 text-sm text-white/60">
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 divide-y divide-white/[0.06] rounded-[1.1rem] border border-white/10">
                  {businesses.map((business) => (
                    <div key={business.id} className="grid gap-4 p-4 sm:grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr_0.6fr] sm:items-center sm:p-5">
                      <div className="flex items-center gap-3">
                        <div className="grid size-11 place-items-center rounded-2xl border border-white/10" style={{ backgroundColor: `${business.accentColor}22` }}>
                          <Building2 className="size-5" style={{ color: business.accentColor }} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white">{business.name}</p>
                          <p className="text-sm text-white/40">{business.industry}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-white/35">Plan</p>
                        <p className="mt-1 text-sm text-white/70">{business.plan}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-white/35">Owner</p>
                          <p className="mt-1 break-all text-sm text-white/70">{business.ownerEmail}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-white/35">Status</p>
                        <p className="mt-1 text-sm text-white/70">{business.status}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <button onClick={() => onNavigate('dashboard')} className="rounded-full border border-white/10 px-3 py-2 text-sm text-white/70">
                          Open
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeSection === 'overview' && (
              <section className="mt-8 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-[1.3rem] border border-white/10 bg-[linear-gradient(135deg,rgba(199,165,102,0.16),rgba(10,11,13,0.92))] p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-kaivo-gold">Platform health</p>
                    <h2 className="mt-3 font-heading text-2xl text-white">Every client workspace is provisioned through admin-controlled onboarding.</h2>
                    <p className="mt-3 text-sm leading-7 text-white/60">This architecture is prepared for Supabase Auth, RLS and future billing integrations while keeping the public site separate from the authenticated app.</p>
                  </div>
                  <div className="rounded-[1.3rem] border border-white/10 bg-black/20 p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/35">Environment</p>
                    <p className="mt-3 text-sm leading-7 text-white/60">{getSupabaseStatusMessage()}</p>
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>

      <AnimatePresence>
        {showCreateFlow && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-4">
            <motion.div initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 18, opacity: 0 }} className="my-2 max-h-[calc(100dvh-1rem)] w-full max-w-3xl overflow-y-auto rounded-[1.5rem] border border-white/10 bg-[#09060e] p-5 sm:my-0 sm:rounded-[2rem] sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">Create workspace</p>
                  <h2 className="mt-2 font-heading text-2xl text-white sm:text-3xl">Add a new business</h2>
                </div>
                <button onClick={() => setShowCreateFlow(false)} className="grid size-10 place-items-center rounded-full border border-white/10">
                  <X className="size-4" />
                </button>
              </div>
              <div className="mt-6 flex gap-2 text-sm text-white/55">
                {[1, 2, 3, 4, 5].map((value) => (
                  <div key={value} className={`h-2 flex-1 rounded-full ${value <= step ? 'bg-kaivo-gold' : 'bg-white/10'}`} />
                ))}
              </div>
              <form onSubmit={handleCreateBusiness} className="mt-8 space-y-4">
                {step === 1 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="form-label">Business name</span>
                      <input className="form-input" value={newBusiness.name} onChange={(event) => setNewBusiness((current) => ({ ...current, name: event.target.value }))} required />
                    </label>
                    <label className="block">
                      <span className="form-label">Trading name</span>
                      <input className="form-input" value={newBusiness.tradingName} onChange={(event) => setNewBusiness((current) => ({ ...current, tradingName: event.target.value }))} />
                    </label>
                    <label className="block">
                      <span className="form-label">Industry</span>
                      <input className="form-input" value={newBusiness.industry} onChange={(event) => setNewBusiness((current) => ({ ...current, industry: event.target.value }))} required />
                    </label>
                    <label className="block">
                      <span className="form-label">Business type</span>
                      <input className="form-input" value={newBusiness.businessType} onChange={(event) => setNewBusiness((current) => ({ ...current, businessType: event.target.value }))} required />
                    </label>
                  </div>
                )}

                {step === 2 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="form-label">Website</span>
                      <input className="form-input" value={newBusiness.website} onChange={(event) => setNewBusiness((current) => ({ ...current, website: event.target.value }))} />
                    </label>
                    <label className="block">
                      <span className="form-label">Email</span>
                      <input className="form-input" type="email" value={newBusiness.email} onChange={(event) => setNewBusiness((current) => ({ ...current, email: event.target.value }))} />
                    </label>
                    <label className="block">
                      <span className="form-label">City</span>
                      <input className="form-input" value={newBusiness.city} onChange={(event) => setNewBusiness((current) => ({ ...current, city: event.target.value }))} />
                    </label>
                    <label className="block">
                      <span className="form-label">Country</span>
                      <input className="form-input" value={newBusiness.country} onChange={(event) => setNewBusiness((current) => ({ ...current, country: event.target.value }))} />
                    </label>
                  </div>
                )}

                {step === 3 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="form-label">Owner email</span>
                      <input className="form-input" type="email" value={newBusiness.ownerEmail} onChange={(event) => setNewBusiness((current) => ({ ...current, ownerEmail: event.target.value }))} required />
                    </label>
                    <label className="block">
                      <span className="form-label">Plan</span>
                      <select className="form-input" value={newBusiness.plan} onChange={(event) => setNewBusiness((current) => ({ ...current, plan: event.target.value }))}>
                        {['Starter', 'Growth', 'Pro', 'Enterprise'].map((option) => (<option key={option} value={option} className="bg-[#0b0815]">{option}</option>))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="form-label">Currency</span>
                      <input className="form-input" value={newBusiness.currency} onChange={(event) => setNewBusiness((current) => ({ ...current, currency: event.target.value }))} />
                    </label>
                  </div>
                )}

                {step === 4 && (
                  <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-white/70">
                    <p className="font-medium text-white">Provisioning summary</p>
                    <p className="mt-2">Business workspace, owner login, subscription, feature gates and brand workspace will be created via protected server-side orchestration in the full production build.</p>
                  </div>
                )}

                {step === 5 && (
                  <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-white/70">
                    <p className="font-medium text-white">Success</p>
                    <p className="mt-2">Business workspace created. Open business, send login link or copy the portal URL from the admin flow.</p>
                  </div>
                )}

                <div className="flex flex-wrap justify-between gap-3">
                  <button type="button" onClick={() => setStep((current) => Math.max(1, current - 1))} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70">
                    Back
                  </button>
                  {step < 5 ? (
                    <button type="button" onClick={() => setStep((current) => current + 1)} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#080510]">
                      Continue
                    </button>
                  ) : (
                    <button type="submit" className="rounded-full bg-kaivo-gold px-4 py-2 text-sm font-medium text-[#080510]">
                      Create workspace
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function BusinessDashboard({ user, onLogout, onNavigate }: { user: UserSession; onLogout: () => void; onNavigate: (route: AppRoute) => void }) {
  const [activeModule, setActiveModule] = useState<DashboardModule>('overview')
  const [activeAiView, setActiveAiView] = useState<'workspace' | 'writer' | 'images'>('workspace')
  const [contentItems, setContentItems] = useState<ContentItem[]>(initialContent)
  const [products] = useState<ProductItem[]>(initialProducts)
  const [activity, setActivity] = useState<ActivityLog[]>(initialActivity)
  const [captionPrompt, setCaptionPrompt] = useState('What would you like to post about?')
  const [captionTone, setCaptionTone] = useState('Professional')
  const [generatedCaption, setGeneratedCaption] = useState('')
  const [generatedImage, setGeneratedImage] = useState('')
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerTitle, setComposerTitle] = useState('')
  const [composerChannel, setComposerChannel] = useState('Instagram')

  const moduleDefinitions = useMemo(() => {
    const base = [
      { key: 'overview', label: 'Overview', icon: LayoutDashboard, permission: 'business.view' as const },
      { key: 'ai', label: 'KAIVO AI', icon: Bot, permission: 'content.create' as const },
      { key: 'content', label: 'Content', icon: FileText, permission: 'content.view' as const },
      { key: 'social', label: 'Social', icon: Sparkles, permission: 'social.manage' as const },
      { key: 'calendar', label: 'Calendar', icon: CalendarDays, permission: 'content.view' as const },
      { key: 'brand', label: 'Brand', icon: Palette, permission: 'brand.manage' as const },
      { key: 'products', label: 'Products', icon: Store, permission: 'products.manage' as const },
      { key: 'staff', label: 'Staff', icon: Users, permission: 'staff.view' as const },
      { key: 'analytics', label: 'Analytics', icon: BarChart3, permission: 'analytics.view' as const },
      { key: 'files', label: 'Files', icon: Camera, permission: 'business.view' as const },
      { key: 'settings', label: 'Settings', icon: Layers3, permission: 'settings.manage' as const },
    ]
    return base.filter((module) => hasPermission(user.permissions, module.permission))
  }, [user.permissions])

  const submitCaption = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = await AIService.generateCaption(captionPrompt, captionTone)
    setGeneratedCaption(`${result.title}\n\n${result.body}`)
    setActivity((current) => [{ id: Date.now(), actor: user.fullName, action: 'generated', detail: result.title }, ...current])
  }

  const generateArtwork = async () => {
    const result = await AIService.generateImage(captionPrompt)
    setGeneratedImage(`${result.title}\n\n${result.body}`)
    setActivity((current) => [{ id: Date.now(), actor: user.fullName, action: 'generated', detail: result.title }, ...current])
  }

  const addDraft = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanTitle = composerTitle.trim()
    if (!cleanTitle) return
    setContentItems((current) => [{ id: Date.now(), title: cleanTitle, channel: composerChannel, status: 'Draft', updated: 'Created just now' }, ...current])
    setComposerOpen(false)
    setComposerTitle('')
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'overview':
        return (
          <div className="space-y-6">
            <section className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(135deg,rgba(199,165,102,0.14),rgba(10,11,13,0.95))] p-6 sm:p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-kaivo-gold">First-run experience</p>
              <h2 className="mt-3 font-heading text-3xl text-white">Welcome to KAIVO. Let’s set up your workspace.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">Complete your brand, connect social accounts, add team members and create your first post. This is the premium onboarding foundation for your company.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => setActiveModule('brand')} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#080510]">Complete brand</button>
                <button onClick={() => setActiveModule('products')} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70">Add products</button>
                <button onClick={() => setActiveModule('social')} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70">Connect socials</button>
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Social reach', value: '18.2k', hint: 'Growing steadily' },
                { label: 'Posts published', value: '84', hint: 'Across connected channels' },
                { label: 'Content scheduled', value: '09', hint: 'In the next 7 days' },
                { label: 'AI generations', value: '142', hint: 'This month' },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-sm text-white/45">{item.label}</p>
                  <p className="mt-4 font-heading text-3xl text-white">{item.value}</p>
                  <p className="mt-1 text-sm text-white/35">{item.hint}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <div className="flex flex-col items-start justify-between gap-4 min-[420px]:flex-row min-[420px]:items-center">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-white/35">Today</p>
                    <h3 className="mt-2 text-xl font-medium text-white">Scheduled posts</h3>
                  </div>
                  <button onClick={() => setActiveModule('content')} className="text-sm text-white/60">View all</button>
                </div>
                <div className="mt-5 space-y-3">
                  {contentItems.slice(0, 2).map((item) => (
                    <div key={item.id} className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">{item.title}</p>
                          <p className="mt-1 text-xs text-white/35">{item.channel}</p>
                        </div>
                        <span className={`status-pill ${item.status === 'Published' ? 'status-published' : item.status === 'Scheduled' ? 'status-scheduled' : 'status-draft'}`}>{item.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-white/35">Recent activity</p>
                <div className="mt-4 space-y-3">
                  {activity.slice(0, 4).map((entry) => (
                    <div key={entry.id} className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
                      <p className="text-sm text-white">{entry.actor} {entry.action}</p>
                      <p className="mt-1 text-sm text-white/45">{entry.detail}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )
      case 'ai':
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'workspace', label: 'Workspace' },
                { key: 'writer', label: 'KAIVO Writer' },
                { key: 'images', label: 'Image Studio' },
              ].map((item) => (
                <button key={item.key} onClick={() => setActiveAiView(item.key as 'workspace' | 'writer' | 'images')} className={`rounded-full px-4 py-2 text-sm ${activeAiView === item.key ? 'bg-white text-[#080510]' : 'border border-white/10 text-white/70'}`}>
                  {item.label}
                </button>
              ))}
            </div>

            {activeAiView === 'writer' ? (
              <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <p className="eyebrow">KAIVO Writer</p>
                <h2 className="mt-2 font-heading text-2xl text-white">Premium AI copy for your business</h2>
                <form onSubmit={submitCaption} className="mt-6 space-y-4">
                  <label className="block">
                    <span className="form-label">What would you like to post about?</span>
                    <textarea value={captionPrompt} onChange={(event) => setCaptionPrompt(event.target.value)} className="form-input min-h-[120px]" />
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="form-label">Tone</span>
                      <select value={captionTone} onChange={(event) => setCaptionTone(event.target.value)} className="form-input">
                        {['Professional', 'Luxury', 'Friendly', 'Urgent', 'Minimal'].map((option) => (<option key={option} value={option} className="bg-[#0b0815]">{option}</option>))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="form-label">Platform</span>
                      <select className="form-input">
                        <option value="Instagram">Instagram</option>
                        <option value="Facebook">Facebook</option>
                        <option value="TikTok">TikTok</option>
                      </select>
                    </label>
                  </div>
                  <button type="submit" className="rounded-full bg-kaivo-gold px-4 py-2 text-sm font-medium text-[#080510]">Generate with KAIVO AI</button>
                </form>
                {generatedCaption && <div className="mt-6 rounded-[1.2rem] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/70">{generatedCaption}</div>}
              </section>
            ) : activeAiView === 'images' ? (
              <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <p className="eyebrow">Image Studio</p>
                <h2 className="mt-2 font-heading text-2xl text-white">Create promotional artwork for everyday publishing</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-[1fr_0.7fr]">
                  <label className="block">
                    <span className="form-label">What would you like to create?</span>
                    <textarea value={captionPrompt} onChange={(event) => setCaptionPrompt(event.target.value)} className="form-input min-h-[120px]" />
                  </label>
                  <div className="rounded-[1.2rem] border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/35">Brand controls</p>
                    <div className="mt-4 space-y-2 text-sm text-white/65">
                      <p>Use business logo</p>
                      <p>Use brand colours</p>
                      <p>Use uploaded photo</p>
                    </div>
                    <button onClick={generateArtwork} className="mt-5 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#080510]">Generate artwork</button>
                  </div>
                </div>
                {generatedImage && <div className="mt-6 rounded-[1.2rem] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/70">{generatedImage}</div>}
              </section>
            ) : (
              <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <p className="eyebrow">AI workspace</p>
                <h2 className="mt-2 font-heading text-2xl text-white">A business-aware AI layer for your company</h2>
                <p className="mt-4 text-sm leading-7 text-white/60">This foundation stores company context and will later power campaign planning, image generation and brand-aware writing through Supabase-backed server functions.</p>
              </section>
            )}
          </div>
        )
      case 'content':
        return (
          <div className="space-y-6">
            <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="flex flex-col items-start justify-between gap-4 min-[420px]:flex-row min-[420px]:items-center">
                <div>
                  <p className="eyebrow">Content studio</p>
                  <h2 className="mt-2 font-heading text-2xl text-white">Owned media library and publishing workflow</h2>
                </div>
                <button onClick={() => setComposerOpen(true)} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#080510]">Create post</button>
              </div>
              <div className="mt-6 space-y-3">
                {contentItems.map((item) => (
                  <div key={item.id} className="rounded-[1rem] border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-sm text-white/40">{item.channel}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`status-pill ${item.status === 'Published' ? 'status-published' : item.status === 'Scheduled' ? 'status-scheduled' : 'status-draft'}`}>{item.status}</span>
                        <span className="text-sm text-white/40">{item.updated}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <AnimatePresence>
              {composerOpen && (
                <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onSubmit={addDraft} className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">Create a content draft</p>
                      <p className="mt-1 text-sm text-white/40">This is the premium composer foundation for the social publishing flow.</p>
                    </div>
                    <button type="button" onClick={() => setComposerOpen(false)} className="rounded-full border border-white/10 p-2">
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
                    <label>
                      <span className="form-label">Content title</span>
                      <input value={composerTitle} onChange={(event) => setComposerTitle(event.target.value)} className="form-input" placeholder="What are you creating?" autoFocus required />
                    </label>
                    <label>
                      <span className="form-label">Channel</span>
                      <select value={composerChannel} onChange={(event) => setComposerChannel(event.target.value)} className="form-input">
                        {['Instagram', 'Website', 'LinkedIn', 'Facebook', 'TikTok'].map((item) => (<option key={item} value={item} className="bg-[#0b0815]">{item}</option>))}
                      </select>
                    </label>
                    <button type="submit" className="flex h-[46px] items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-medium text-[#080510]">
                      <Sparkles className="size-4" /> Add draft
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        )
      case 'social':
        return (
          <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <p className="eyebrow">Social connections</p>
            <h2 className="mt-2 font-heading text-2xl text-white">Integration cards and secure provider architecture</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {['Instagram', 'Facebook', 'TikTok'].map((provider) => (
                <div key={provider} className="rounded-[1.2rem] border border-white/10 bg-black/20 p-5">
                  <p className="text-lg font-medium text-white">{provider}</p>
                  <p className="mt-3 text-sm leading-7 text-white/55">Integration setup required. Connect your official developer app to enable secure publishing.</p>
                  <button className="mt-5 rounded-full border border-white/10 px-4 py-2 text-sm text-white/70">Connect</button>
                </div>
              ))}
            </div>
          </section>
        )
      case 'calendar':
        return (
          <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <p className="eyebrow">Content calendar</p>
            <h2 className="mt-2 font-heading text-2xl text-white">Month, week and agenda views ready for scheduled content</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-7">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="rounded-[1rem] border border-white/10 bg-black/20 p-3 text-center text-sm text-white/60">{day}</div>
              ))}
            </div>
          </section>
        )
      case 'brand':
        return (
          <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <p className="eyebrow">Brand kit</p>
            <h2 className="mt-2 font-heading text-2xl text-white">Central identity system for your company</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {['Logo', 'Icon', 'Brand colours', 'Tone of voice', 'Hashtags', 'Preferred language'].map((item) => (
                <div key={item} className="rounded-[1rem] border border-white/10 bg-black/20 p-4 text-sm text-white/70">{item}</div>
              ))}
            </div>
          </section>
        )
      case 'products':
        return (
          <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <p className="eyebrow">Products and services</p>
            <h2 className="mt-2 font-heading text-2xl text-white">Reusable product catalog for AI prompts and publishing</h2>
            <div className="mt-6 divide-y divide-white/[0.06] rounded-[1.1rem] border border-white/10">
              {products.map((product) => (
                <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium text-white">{product.name}</p>
                    <p className="mt-1 text-sm text-white/40">{product.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-white/70">{product.price}</span>
                    <span className={`status-pill ${product.status === 'Live' ? 'status-published' : 'status-draft'}`}>{product.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      case 'staff':
        return (
          <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <p className="eyebrow">Staff management</p>
            <h2 className="mt-2 font-heading text-2xl text-white">Manage company staff with role-aware permissions</h2>
            <div className="mt-6 rounded-[1.1rem] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/70">
              Permissions and role assignments are centralized through the permission system and can be extended per company.
            </div>
          </section>
        )
      case 'analytics':
        return (
          <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <p className="eyebrow">Analytics</p>
            <h2 className="mt-2 font-heading text-2xl text-white">Social and content analytics that only unlock once accounts are connected</h2>
            <div className="mt-6 rounded-[1.1rem] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/70">
              Connect social accounts to unlock follower, reach and engagement dashboards. No metrics are fabricated.
            </div>
          </section>
        )
      case 'files':
        return (
          <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <p className="eyebrow">Files</p>
            <h2 className="mt-2 font-heading text-2xl text-white">Business media library organised by folder and purpose</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {['Logos', 'Products', 'Generated', 'Uploads', 'Social', 'Campaigns'].map((folder) => (
                <div key={folder} className="rounded-[1rem] border border-white/10 bg-black/20 p-4 text-sm text-white/70">{folder}</div>
              ))}
            </div>
          </section>
        )
      case 'settings':
        return (
          <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <p className="eyebrow">Settings</p>
            <h2 className="mt-2 font-heading text-2xl text-white">Business settings, notifications and preferences</h2>
            <div className="mt-6 rounded-[1.1rem] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/70">
              Settings are prepared for company profile, timezone, currency and notification preferences with tenant isolation in place.
            </div>
          </section>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[#07050f] text-white">
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#07050f]/90 px-4 py-3 backdrop-blur-xl sm:px-8 sm:py-4">
        <div className="mx-auto flex max-w-[1550px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <img src={kaivoIconWhite} alt="" className="h-8 w-8 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user.businessName}</p>
              <p className="text-xs text-white/40">{user.role === 'super_admin' ? 'KAIVO Platform' : 'Business workspace'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="liquid-glass hidden size-10 place-items-center rounded-full sm:grid" aria-label="Search">
              <Search className="size-4 text-white/65" />
            </button>
            <button onClick={() => onNavigate('admin')} className="hidden rounded-full border border-white/10 px-3 py-2 text-sm text-white/70 sm:inline-flex">
              Admin view
            </button>
            <button onClick={onLogout} className="liquid-glass grid size-10 shrink-0 place-items-center rounded-full text-sm text-white/70 sm:flex sm:w-auto sm:gap-2 sm:px-3 sm:py-2">
              <LogOut className="size-4" /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <nav className="mobile-section-nav lg:hidden" aria-label="Workspace sections">
        {moduleDefinitions.map((module) => (
          <button key={module.key} onClick={() => setActiveModule(module.key as DashboardModule)} className={activeModule === module.key ? 'mobile-section-nav__active' : ''}>
            {module.label}
          </button>
        ))}
      </nav>

      <div className="mx-auto flex max-w-[1550px]">
        <aside className="hidden min-h-[calc(100vh-73px)] w-72 shrink-0 border-r border-white/[0.07] p-5 lg:flex lg:flex-col">
          <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-violet-300/70">Good morning</p>
            <p className="mt-2 font-medium text-white">{user.fullName}</p>
            <p className="mt-1 text-sm text-white/40">{user.businessName}</p>
          </div>
          <nav className="mt-6 space-y-1">
            {moduleDefinitions.map((module) => {
              const Icon = module.icon
              return (
                <button key={module.key} onClick={() => setActiveModule(module.key as DashboardModule)} className={`sidebar-link ${activeModule === module.key ? 'sidebar-link-active' : ''}`}>
                  <Icon className="size-4" /> {module.label}
                </button>
              )
            })}
          </nav>
          <div className="mt-auto space-y-1">
            <button onClick={() => onNavigate('home')} className="sidebar-link"><ArrowRight className="size-4" /> Public site</button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">Business operating system</p>
                <h1 className="mt-3 font-heading text-3xl text-white sm:text-4xl">Good morning, {user.fullName.split(' ')[0]}</h1>
                <p className="mt-2 text-sm text-white/40">{user.businessName} · Premium workspace with secure onboarding and multi-tenant structure.</p>
              </div>
              <button onClick={() => setActiveModule('content')} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-[#080510]">
                <Plus className="size-4" /> Create
              </button>
            </div>
            <div className="mt-8">{renderModule()}</div>
          </div>
        </main>
      </div>
    </div>
  )
}

function KaivoApp() {
  const [route, setRoute] = useState<AppRoute>(() => {
    if (typeof window === 'undefined') return 'home'
    const path = window.location.pathname
    if (path.startsWith('/login')) return 'login'
    if (path.startsWith('/admin')) return 'admin'
    if (path.startsWith('/dashboard')) return 'dashboard'
    return 'home'
  })
  const [session, setSession] = useState<UserSession | null>(null)
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === 'undefined' || window.location.pathname !== '/') return false
    const forceIntro = new URLSearchParams(window.location.search).get('intro') === '1'
    return forceIntro || sessionStorage.getItem('kaivo:intro-seen') !== '1'
  })

  const completeIntro = () => {
    sessionStorage.setItem('kaivo:intro-seen', '1')
    setShowIntro(false)
  }

  useEffect(() => {
    if (!import.meta.env.DEV) return
    const devWindow = window as Window & { __replayKaivoIntro?: () => void }
    devWindow.__replayKaivoIntro = () => setShowIntro(true)
    return () => {
      delete devWindow.__replayKaivoIntro
    }
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      if (path.startsWith('/login')) setRoute('login')
      else if (path.startsWith('/admin')) setRoute('admin')
      else if (path.startsWith('/dashboard')) setRoute('dashboard')
      else setRoute('home')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (nextRoute: AppRoute) => {
    const path = nextRoute === 'home' ? '/' : nextRoute === 'login' ? '/login' : nextRoute === 'admin' ? '/admin' : nextRoute === 'admin/businesses' ? '/admin/businesses' : '/dashboard'
    window.history.pushState({}, '', path)
    setRoute(nextRoute)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  const handleLogin = (nextSession: UserSession) => {
    setSession(nextSession)
    if (nextSession.role === 'super_admin') {
      navigate('admin')
    } else {
      navigate('dashboard')
    }
  }

  if (route === 'login') {
    return <LoginPage onLogin={handleLogin} onBack={() => navigate('home')} />
  }

  if (route === 'admin') {
    return <AdminDashboard onBack={() => navigate('home')} onNavigate={navigate} />
  }

  if (route === 'dashboard') {
    if (!session) {
      return <LoginPage onLogin={handleLogin} onBack={() => navigate('home')} />
    }
    return <BusinessDashboard user={session} onLogout={() => {
      setSession(null)
      navigate('home')
    }} onNavigate={navigate} />
  }

  return (
    <>
      <HomePage onOpenLogin={() => navigate('login')} />
      {showIntro && <KaivoIntro onComplete={completeIntro} />}
    </>
  )
}

export default KaivoApp
