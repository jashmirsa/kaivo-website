import { Component, lazy, Suspense, type ErrorInfo, type ReactNode, useCallback, useEffect, useState } from 'react'
import { AlertTriangle, LoaderCircle } from 'lucide-react'
import { AuthProvider } from '../auth/AuthProvider'
import { useAuth } from '../auth/useAuth'
import { KaivoIntro } from '../components/intro/KaivoIntro'
import { ForgotPasswordPage, LoginPage, ResetPasswordPage } from './AuthPages'
import './production.css'

const AdminConsole = lazy(() => import('./AdminConsole').then((module) => ({ default: module.AdminConsole })))
const BusinessWorkspace = lazy(() => import('./BusinessWorkspace').then((module) => ({ default: module.BusinessWorkspace })))
const MarketingHome = lazy(() => import('../KaivoApp').then((module) => ({ default: module.HomePage })))

const adminRoutes = [/^\/admin$/, /^\/admin\/businesses$/, /^\/admin\/businesses\/[0-9a-f-]{36}$/i, /^\/admin\/users$/, /^\/admin\/activity$/, /^\/admin\/settings$/]
const businessRoutes = [/^\/dashboard$/, /^\/dashboard\/(content|create|calendar|socials|brand|assets|team|tasks|activity|settings)$/]

function useLocationPath() {
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  const navigate = useCallback((next: string) => {
    if (window.location.pathname !== next) window.history.pushState({}, '', next)
    setPath(next)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])
  return { path, navigate }
}

function RoutedApplication() {
  const { path, navigate } = useLocationPath()
  const auth = useAuth()
  const [showIntro, setShowIntro] = useState(() => {
    if (window.location.pathname !== '/') return false
    return new URLSearchParams(window.location.search).get('intro') === '1' || sessionStorage.getItem('kaivo:intro-seen') !== '1'
  })

  useEffect(() => {
    if (!import.meta.env.DEV) return
    const devWindow = window as Window & { __replayKaivoIntro?: () => void }
    devWindow.__replayKaivoIntro = () => setShowIntro(true)
    return () => { delete devWindow.__replayKaivoIntro }
  }, [])

  if (path === '/') return <><Suspense fallback={<FullScreenLoading />}><MarketingHome onOpenLogin={() => navigate('/login')} /></Suspense>{showIntro && <KaivoIntro onComplete={() => { sessionStorage.setItem('kaivo:intro-seen', '1'); setShowIntro(false) }} />}</>
  if (path === '/login') return <LoginPage onNavigate={navigate} />
  if (path === '/admin/login') return <LoginPage admin onNavigate={navigate} />
  if (path === '/forgot-password') return <ForgotPasswordPage onNavigate={navigate} />
  if (path === '/reset-password') return <ResetPasswordPage onNavigate={navigate} />

  const adminRoute = adminRoutes.some((pattern) => pattern.test(path))
  const businessRoute = businessRoutes.some((pattern) => pattern.test(path))
  if (adminRoute || businessRoute) {
    if (auth.state === 'loading') return <FullScreenLoading />
    if (auth.state === 'configuration_error') return <ConfigurationRequired onHome={() => navigate('/')} />
    if (auth.state === 'error') return <AccessError message={auth.error ?? 'Your account could not be resolved.'} onSignIn={() => navigate(adminRoute ? '/admin/login' : '/login')} />
    if (auth.state !== 'authenticated') {
      return <LoginPage admin={adminRoute} onNavigate={navigate} />
    }
    if (adminRoute) {
      return auth.isPlatformAdmin ? <Suspense fallback={<FullScreenLoading />}><AdminConsole path={path} onNavigate={navigate} /></Suspense> : <NotAuthorized onBack={() => navigate(auth.activeOrganization ? '/dashboard' : '/')} />
    }
    return auth.activeOrganization && auth.activeMembership ? <Suspense fallback={<FullScreenLoading />}><BusinessWorkspace path={path} onNavigate={navigate} /></Suspense> : <NotAuthorized onBack={() => navigate(auth.isPlatformAdmin ? '/admin' : '/')} />
  }

  return <NotFound onHome={() => navigate('/')} />
}

export default function ProductionApp() {
  return <ErrorBoundary><AuthProvider><RoutedApplication /></AuthProvider></ErrorBoundary>
}

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('KAIVO application error', error, info) }
  render() { return this.state.failed ? <AccessError message="KAIVO encountered an unexpected application error. Refresh the page to try again." onSignIn={() => window.location.assign('/')} /> : this.props.children }
}

function FullScreenLoading() { return <div className="grid min-h-screen place-items-center bg-[#05030d] text-white"><div className="text-center"><LoaderCircle className="mx-auto size-7 animate-spin text-violet-200" /><p className="mt-4 text-sm text-white/42">Securing your KAIVO workspace…</p></div></div> }
function ConfigurationRequired({ onHome }: { onHome: () => void }) { return <StatePage icon={<AlertTriangle />} title="Supabase configuration required" description="This protected KAIVO route needs the dedicated KAIVO Supabase project URL and publishable key." action="Return to website" onAction={onHome} /> }
function AccessError({ message, onSignIn }: { message: string; onSignIn: () => void }) { return <StatePage icon={<AlertTriangle />} title="Secure access unavailable" description={message} action="Return to sign in" onAction={onSignIn} /> }
function NotAuthorized({ onBack }: { onBack: () => void }) { return <StatePage icon={<AlertTriangle />} title="Not authorized" description="Your verified KAIVO role does not permit access to this route." action="Go back" onAction={onBack} /> }
function NotFound({ onHome }: { onHome: () => void }) { return <StatePage icon={<span className="font-heading text-2xl">404</span>} title="Page not found" description="The KAIVO page you requested does not exist." action="KAIVO home" onAction={onHome} /> }
function StatePage({ icon, title, description, action, onAction }: { icon: ReactNode; title: string; description: string; action: string; onAction: () => void }) { return <div className="grid min-h-screen place-items-center bg-[#05030d] px-4 text-white"><div className="app-panel max-w-md p-7 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-200">{icon}</span><h1 className="mt-6 font-heading text-2xl">{title}</h1><p className="mt-3 text-sm leading-6 text-white/45">{description}</p><button onClick={onAction} className="mt-6 rounded-full bg-white px-5 py-2.5 text-sm text-[#080510]">{action}</button></div></div> }
