import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import kaivoWordmarkWhite from './assets/brand/KAIVO-Brand-Pack/01_Logos/Primary/KAIVO-Primary-white.svg'
import kaivoIconWhite from './assets/brand/KAIVO-Brand-Pack/02_Icons/Selected/KAIVO-Icon-Primary-white.svg'

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4'

const capabilities = ['Create', 'Manage', 'Publish', 'Grow']

type Route = 'home' | 'portal'
type AuthMode = 'login' | 'signup'
type ContentStatus = 'Published' | 'Scheduled' | 'Draft'

type ContentItem = {
  id: number
  title: string
  channel: string
  status: ContentStatus
  updated: string
}

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
      frame = requestAnimationFrame(updateOpacity)
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
    frame = requestAnimationFrame(updateOpacity)

    return () => {
      cancelAnimationFrame(frame)
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

function HomePage({ onOpenPortal }: { onOpenPortal: () => void }) {
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
                <button onClick={() => scrollTo('workflow')} className="nav-link flex items-center gap-1.5">
                  Learning <ChevronDown className="size-3.5" />
                </button>
              </nav>

              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenPortal}
                  className="liquid-glass hidden rounded-full px-5 py-2.5 text-sm text-white transition hover:bg-white/10 sm:inline-flex"
                >
                  Brand Portal
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
                    onClick={onOpenPortal}
                    className="mt-2 w-full rounded-xl bg-white px-4 py-3 text-left font-medium text-[#080510]"
                  >
                    Open Brand Portal
                  </button>
                </motion.nav>
              )}
            </AnimatePresence>
          </header>

          <div id="top" className="relative z-10 flex flex-1 items-center justify-center overflow-visible px-5 py-12 text-center">
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
                Create, manage and publish from one intelligent platform.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => scrollTo('about')}
                  className="liquid-glass group inline-flex items-center gap-3 rounded-full px-7 py-3.5 text-sm text-white transition hover:bg-white/10"
                >
                  Explore KAIVO
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={onOpenPortal}
                  className="rounded-full bg-white px-7 py-3.5 text-sm font-medium text-[#080510] transition hover:bg-white/88"
                >
                  Start managing content
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
                KAIVO is the intelligent content layer for modern businesses. Plan the story, organise every asset, publish across channels and understand what moves your audience.
              </p>
              <div className="mt-9 grid max-w-lg grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.08]">
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
                <p className="eyebrow">Ready when you are</p>
                <h2 className="mt-3 font-heading text-3xl tracking-[-0.03em] text-white sm:text-4xl">
                  Bring your content into focus.
                </h2>
              </div>
              <button
                onClick={onOpenPortal}
                className="group inline-flex shrink-0 items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-medium text-[#080510]"
              >
                Open Brand Portal
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
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      >
        <div
          className="hologram-card liquid-glass relative overflow-hidden rounded-[2rem] p-5 sm:p-7"
          style={{ transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
        >
          <div className="hologram-scan pointer-events-none absolute inset-0" />
          <div className="relative flex items-center justify-between border-b border-white/[0.09] pb-5">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl border border-violet-300/20 bg-violet-500/10 shadow-[0_0_35px_rgba(139,92,246,0.25)]">
                <img src={kaivoIconWhite} alt="" className="size-6" />
              </span>
              <div>
                <p className="text-sm font-medium text-white">KAIVO Workspace</p>
                <p className="mt-1 text-xs text-violet-200/55">Content intelligence online</p>
              </div>
            </div>
            <span className="flex items-center gap-2 text-xs text-white/48">
              <span className="size-1.5 rounded-full bg-violet-300 shadow-[0_0_12px_rgba(196,181,253,0.9)]" />
              Live
            </span>
          </div>

          <div className="relative mt-6 grid grid-cols-3 gap-3">
            {[
              ['24', 'Assets'],
              ['08', 'Scheduled'],
              ['71%', 'Growth'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
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

function AuthPortal({ onBack, onAuthenticated }: { onBack: () => void; onAuthenticated: () => void }) {
  const [mode, setMode] = useState<AuthMode>('signup')

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onAuthenticated()
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
          <ArrowLeft className="size-4" />
          Back to homepage
        </button>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-96px)] max-w-6xl items-center gap-12 px-5 pb-14 sm:px-8 lg:grid-cols-[1fr_0.78fr] lg:px-10">
        <motion.div initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
          <p className="eyebrow">KAIVO Brand Portal</p>
          <h1 className="mt-5 max-w-2xl font-heading text-5xl leading-[0.98] tracking-[-0.05em] sm:text-7xl">
            Your content.
            <br />
            <span className="hero-gradient">One calm workspace.</span>
          </h1>
          <p className="mt-7 max-w-lg text-base leading-8 text-white/55">
            Create, organise and publish your brand content without losing the thread.
          </p>
          <div className="mt-9 hidden gap-5 text-sm text-white/45 sm:flex">
            {['Plan campaigns', 'Manage assets', 'Publish with confidence'].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-violet-300" />
                {item}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.08 }}
          className="liquid-glass rounded-[1.8rem] p-6 sm:p-8"
        >
          <div className="grid grid-cols-2 rounded-xl bg-black/25 p-1">
            {(['signup', 'login'] as AuthMode[]).map((item) => (
              <button
                key={item}
                onClick={() => setMode(item)}
                className={`rounded-lg px-4 py-2.5 text-sm capitalize transition ${
                  mode === item ? 'bg-white text-[#080510]' : 'text-white/48 hover:text-white'
                }`}
              >
                {item === 'signup' ? 'Create account' : 'Log in'}
              </button>
            ))}
          </div>

          <div className="mt-7">
            <h2 className="font-heading text-2xl text-white">
              {mode === 'signup' ? 'Build your brand workspace' : 'Welcome back'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/42">
              {mode === 'signup'
                ? 'Start with a simple local preview of the KAIVO workspace.'
                : 'Continue managing your campaigns and content.'}
            </p>
          </div>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {mode === 'signup' && (
              <label className="block">
                <span className="form-label">Brand name</span>
                <input className="form-input" name="brand" placeholder="Your brand" required />
              </label>
            )}
            <label className="block">
              <span className="form-label">Email address</span>
              <input className="form-input" name="email" type="email" placeholder="you@brand.co.za" required />
            </label>
            <label className="block">
              <span className="form-label">Password</span>
              <input className="form-input" name="password" type="password" placeholder="At least 8 characters" minLength={8} required />
            </label>
            <button type="submit" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-medium text-[#080510] transition hover:bg-white/88">
              {mode === 'signup' ? 'Create brand workspace' : 'Enter workspace'}
              <ArrowRight className="size-4" />
            </button>
          </form>

          <p className="mt-5 text-center text-xs leading-5 text-white/30">
            Local product preview only. Secure account services will be connected in a later phase.
          </p>
        </motion.div>
      </main>
    </div>
  )
}

function ContentWorkspace({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) {
  const [items, setItems] = useState<ContentItem[]>(initialContent)
  const [composerOpen, setComposerOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [channel, setChannel] = useState('Instagram')

  const stats = useMemo(
    () => [
      { label: 'Total content', value: String(items.length).padStart(2, '0'), icon: FileText },
      { label: 'Published', value: String(items.filter((item) => item.status === 'Published').length).padStart(2, '0'), icon: Eye },
      { label: 'Scheduled', value: String(items.filter((item) => item.status === 'Scheduled').length).padStart(2, '0'), icon: CalendarDays },
      { label: 'Drafts', value: String(items.filter((item) => item.status === 'Draft').length).padStart(2, '0'), icon: Clock3 },
    ],
    [items],
  )

  const addDraft = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) return

    setItems((current) => [
      {
        id: Date.now(),
        title: cleanTitle,
        channel,
        status: 'Draft',
        updated: 'Created just now',
      },
      ...current,
    ])
    setTitle('')
    setComposerOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#07050f] text-white">
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#07050f]/85 px-5 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between">
          <button onClick={onBack} aria-label="Go to KAIVO homepage">
            <BrandMark className="h-6 w-auto" />
          </button>
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="liquid-glass grid size-10 place-items-center rounded-full" aria-label="Search">
              <Search className="size-4 text-white/65" />
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-sm text-white/82">Lumen House</p>
              <p className="text-xs text-white/32">Brand workspace</p>
            </div>
            <span className="grid size-10 place-items-center rounded-full bg-violet-500/20 text-sm text-violet-100">LH</span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px]">
        <aside className="hidden min-h-[calc(100vh-73px)] w-64 shrink-0 border-r border-white/[0.07] p-5 lg:flex lg:flex-col">
          <nav className="space-y-1">
            <button className="sidebar-link sidebar-link-active"><LayoutDashboard className="size-4" /> Overview</button>
            <button className="sidebar-link"><FileText className="size-4" /> Content</button>
            <button className="sidebar-link"><CalendarDays className="size-4" /> Schedule</button>
            <button className="sidebar-link"><BarChart3 className="size-4" /> Insights</button>
          </nav>
          <div className="mt-auto space-y-1">
            <button onClick={onBack} className="sidebar-link"><ArrowLeft className="size-4" /> Homepage</button>
            <button onClick={onLogout} className="sidebar-link"><LogOut className="size-4" /> Log out</button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">Content command centre</p>
                <h1 className="mt-3 font-heading text-3xl tracking-[-0.03em] text-white sm:text-4xl">Good evening, Lumen House.</h1>
                <p className="mt-2 text-sm text-white/38">Here is what is moving across your brand today.</p>
              </div>
              <button onClick={() => setComposerOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-[#080510]">
                <Plus className="size-4" /> Create content
              </button>
            </div>

            <div className="mt-9 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-white/42">{label}</p>
                    <Icon className="size-4 text-violet-300/70" />
                  </div>
                  <p className="mt-5 font-heading text-3xl text-white">{value}</p>
                </div>
              ))}
            </div>

            <AnimatePresence>
              {composerOpen && (
                <motion.form
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  onSubmit={addDraft}
                  className="overflow-hidden rounded-2xl border border-violet-300/15 bg-violet-500/[0.055]"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Create a content draft</p>
                        <p className="mt-1 text-xs text-white/34">Add the first details. You can refine it later.</p>
                      </div>
                      <button type="button" onClick={() => setComposerOpen(false)} className="grid size-9 place-items-center rounded-full hover:bg-white/5" aria-label="Close composer">
                        <X className="size-4 text-white/55" />
                      </button>
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_220px_auto] sm:items-end">
                      <label>
                        <span className="form-label">Content title</span>
                        <input value={title} onChange={(event) => setTitle(event.target.value)} className="form-input" placeholder="What are you creating?" autoFocus required />
                      </label>
                      <label>
                        <span className="form-label">Channel</span>
                        <select value={channel} onChange={(event) => setChannel(event.target.value)} className="form-input">
                          {['Instagram', 'Website', 'LinkedIn', 'Facebook', 'Email'].map((item) => (
                            <option key={item} value={item} className="bg-[#0b0815]">{item}</option>
                          ))}
                        </select>
                      </label>
                      <button type="submit" className="flex h-[46px] items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-medium text-[#080510]">
                        <Sparkles className="size-4" /> Add draft
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <section className="mt-9 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
              <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-base font-medium text-white">Content library</h2>
                  <p className="mt-1 text-xs text-white/34">Your latest drafts, scheduled work and live content.</p>
                </div>
                <button className="liquid-glass inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs text-white/65">
                  <Upload className="size-3.5" /> Upload asset
                </button>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {items.map((item) => (
                  <div key={item.id} className="grid gap-4 p-5 transition hover:bg-white/[0.02] sm:grid-cols-[1fr_130px_130px_140px] sm:items-center sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-400/10 text-violet-200/80"><FileText className="size-4" /></span>
                      <div className="min-w-0">
                        <p className="truncate text-sm text-white/78">{item.title}</p>
                        <p className="mt-1 text-xs text-white/30 sm:hidden">{item.channel} · {item.updated}</p>
                      </div>
                    </div>
                    <span className="hidden text-sm text-white/42 sm:block">{item.channel}</span>
                    <span className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</span>
                    <span className="hidden text-right text-xs text-white/30 sm:block">{item.updated}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="mt-6 flex gap-3 lg:hidden">
              <button onClick={onBack} className="liquid-glass flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm text-white/60"><ArrowLeft className="size-4" /> Homepage</button>
              <button onClick={onLogout} className="liquid-glass flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm text-white/60"><LogOut className="size-4" /> Log out</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function BrandPortal({ onBack }: { onBack: () => void }) {
  const [authenticated, setAuthenticated] = useState(false)

  return authenticated ? (
    <ContentWorkspace onBack={onBack} onLogout={() => setAuthenticated(false)} />
  ) : (
    <AuthPortal onBack={onBack} onAuthenticated={() => setAuthenticated(true)} />
  )
}

function App() {
  const [route, setRoute] = useState<Route>(() =>
    window.location.pathname.startsWith('/portal') ? 'portal' : 'home',
  )

  useEffect(() => {
    const handlePopState = () => {
      setRoute(window.location.pathname.startsWith('/portal') ? 'portal' : 'home')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (nextRoute: Route) => {
    const pathname = nextRoute === 'portal' ? '/portal' : '/'
    window.history.pushState({}, '', pathname)
    setRoute(nextRoute)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  return (
    <AnimatePresence mode="wait">
      {route === 'portal' ? (
        <motion.div key="portal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <BrandPortal onBack={() => navigate('home')} />
        </motion.div>
      ) : (
        <HomePage onOpenPortal={() => navigate('portal')} />
      )}
    </AnimatePresence>
  )
}

export default App
