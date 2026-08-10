import { type FormEvent, useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, KeyRound, LoaderCircle } from 'lucide-react'
import kaivoWordmarkWhite from '../assets/brand/KAIVO-Brand-Pack/01_Logos/Primary/KAIVO-Primary-white.svg'
import { useAuth } from '../auth/useAuth'
import { supabase } from '../lib/supabase'

type AuthPageProps = {
  admin?: boolean
  onNavigate: (path: string) => void
}

export function LoginPage({ admin = false, onNavigate }: AuthPageProps) {
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage(null)
    const result = await auth.signIn(email, password)
    setSubmitting(false)
    const destination = result.destination
    if (!destination) {
      setMessage(result.error ?? 'Unable to sign in.')
      return
    }
    if (admin && destination !== '/admin') {
      await auth.signOut()
      setMessage('This sign-in is reserved for authorized KAIVO administrators.')
      return
    }
    onNavigate(destination)
  }

  return (
    <div className="auth-shell">
      <div className="auth-shell__glow" />
      <header className="relative z-10 flex items-center justify-between px-5 py-6 sm:px-8 lg:px-12">
        <button onClick={() => onNavigate('/')} aria-label="KAIVO home"><img src={kaivoWordmarkWhite} alt="KAIVO" className="h-6 w-auto" /></button>
        <button onClick={() => onNavigate('/')} className="flex items-center gap-2 text-sm text-white/48"><ArrowLeft className="size-4" /> Website</button>
      </header>
      <main className="relative z-10 mx-auto grid min-h-[calc(100dvh-96px)] max-w-6xl items-center gap-12 px-5 pb-14 sm:px-8 lg:grid-cols-[1fr_0.78fr] lg:px-10">
        <section className="hidden lg:block">
          <p className="eyebrow">{admin ? 'KAIVO platform access' : 'Your brand operating system'}</p>
          <h1 className="mt-5 max-w-2xl font-heading text-7xl leading-[0.98] tracking-[-0.05em]">{admin ? 'Control with clarity.' : 'Run your brand. Better.'}</h1>
          <p className="mt-7 max-w-lg text-base leading-8 text-white/55">Secure access is provisioned by KAIVO. Public account creation is intentionally disabled.</p>
        </section>
        <section className="auth-card">
          <div className="grid size-12 place-items-center rounded-2xl border border-violet-300/20 bg-violet-500/10"><KeyRound className="size-5 text-violet-200" /></div>
          <p className="eyebrow mt-7">{admin ? 'Administrator' : 'Business workspace'}</p>
          <h1 className="mt-3 font-heading text-3xl text-white">Sign in to KAIVO</h1>
          <p className="mt-2 text-sm leading-6 text-white/42">Use the secure account issued by KAIVO.</p>
          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block"><span className="form-label">Email</span><input className="form-input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label className="block"><span className="form-label">Password</span><input className="form-input" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></label>
            {message && <p className="rounded-xl border border-red-300/15 bg-red-400/[0.06] p-3 text-sm text-red-100/80" role="alert">{message}</p>}
            {auth.state === 'configuration_error' && <p className="rounded-xl border border-amber-300/15 bg-amber-400/[0.06] p-3 text-sm text-amber-100/80">Supabase is not configured in this environment.</p>}
            <button disabled={submitting || auth.state === 'configuration_error'} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-medium text-[#080510] disabled:cursor-not-allowed disabled:opacity-45">
              {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <>Sign in <ArrowRight className="size-4" /></>}
            </button>
          </form>
          <button onClick={() => onNavigate('/forgot-password')} className="mt-5 text-sm text-white/42 hover:text-white/75">Forgot password?</button>
          {!admin && <button onClick={() => onNavigate('/admin/login')} className="mt-5 block text-xs text-white/25 hover:text-white/55">KAIVO administrator</button>}
        </section>
      </main>
    </div>
  )
}

export function ForgotPasswordPage({ onNavigate }: Pick<AuthPageProps, 'onNavigate'>) {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    if (supabase) await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${window.location.origin}/reset-password` })
    setSubmitting(false)
    setSent(true)
  }

  return (
    <SimpleAuthShell title="Reset your password" description="Enter your KAIVO account email. If it is eligible, a secure reset link will be sent." onBack={() => onNavigate('/login')}>
      {sent ? (
        <div className="rounded-xl border border-emerald-300/15 bg-emerald-400/[0.06] p-4 text-sm leading-6 text-emerald-100/75">If an eligible KAIVO account matches that address, reset instructions are on the way.</div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <label className="block"><span className="form-label">Email</span><input className="form-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <button disabled={submitting || !supabase} className="w-full rounded-xl bg-white px-5 py-3.5 text-sm font-medium text-[#080510] disabled:opacity-45">{submitting ? 'Sending…' : 'Send secure reset link'}</button>
        </form>
      )}
    </SimpleAuthShell>
  )
}

export function ResetPasswordPage({ onNavigate }: Pick<AuthPageProps, 'onNavigate'>) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)))
    const { data } = supabase.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true) })
    return () => data.subscription.unsubscribe()
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (password.length < 10) return setMessage('Use at least 10 characters.')
    if (password !== confirm) return setMessage('Passwords do not match.')
    const { error } = await supabase!.auth.updateUser({ password })
    if (error) return setMessage('The password could not be updated. Request a new reset link.')
    setMessage('Password updated. You can now continue to KAIVO.')
  }

  return (
    <SimpleAuthShell title="Choose a new password" description="Complete the secure recovery flow for your KAIVO account." onBack={() => onNavigate('/login')}>
      {!ready ? <p className="rounded-xl border border-amber-300/15 bg-amber-400/[0.06] p-4 text-sm text-amber-100/75">This recovery link is invalid or has expired. Request a new one.</p> : (
        <form onSubmit={submit} className="space-y-4">
          <label className="block"><span className="form-label">New password</span><input className="form-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          <label className="block"><span className="form-label">Confirm password</span><input className="form-input" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required /></label>
          {message && <p className="text-sm text-white/65" role="status">{message}</p>}
          <button className="w-full rounded-xl bg-white px-5 py-3.5 text-sm font-medium text-[#080510]">Update password</button>
        </form>
      )}
    </SimpleAuthShell>
  )
}

function SimpleAuthShell({ title, description, onBack, children }: { title: string; description: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="auth-shell grid min-h-screen place-items-center px-4 py-10">
      <div className="auth-shell__glow" />
      <section className="auth-card relative z-10 w-full max-w-md">
        <img src={kaivoWordmarkWhite} alt="KAIVO" className="h-6 w-auto" />
        <h1 className="mt-8 font-heading text-3xl text-white">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-white/45">{description}</p>
        <div className="mt-7">{children}</div>
        <button onClick={onBack} className="mt-6 flex items-center gap-2 text-sm text-white/42"><ArrowLeft className="size-4" /> Back to sign in</button>
      </section>
    </div>
  )
}
