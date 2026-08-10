import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, Building2, LayoutDashboard, LoaderCircle, LogOut, Plus, Search, Settings, ShieldCheck, Users, X } from 'lucide-react'
import kaivoWordmarkWhite from '../assets/brand/KAIVO-Brand-Pack/01_Logos/Primary/KAIVO-Primary-white.svg'
import { useAuth } from '../auth/useAuth'
import { requireSupabase, supabaseConfig } from '../lib/supabase'
import type { ActivityRecord, Organization, Profile } from '../types/database'

type AdminConsoleProps = { path: string; onNavigate: (path: string) => void }
type AdminMembership = { id: string; user_id: string; organization_id: string; role: string; status: string; created_at: string; profile?: Profile }

const navigation = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/businesses', label: 'Businesses', icon: Building2 },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/activity', label: 'Activity', icon: Activity },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
]

const initialBusiness = {
  name: '', businessType: '', industry: '', website: '', phone: '', email: '', city: '', province: '', country: 'South Africa',
  primaryColor: '#5B5CE2', secondaryColor: '#0A0B0D', brandDescription: '',
}
const initialOwner = { fullName: '', email: '', phone: '' }

export function AdminConsole({ path, onNavigate }: AdminConsoleProps) {
  const auth = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [memberships, setMemberships] = useState<AdminMembership[]>([])
  const [activity, setActivity] = useState<ActivityRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [step, setStep] = useState(1)
  const [business, setBusiness] = useState(initialBusiness)
  const [owner, setOwner] = useState(initialOwner)
  const [provisioning, setProvisioning] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    const client = requireSupabase()
    const [orgResult, membershipResult, activityResult] = await Promise.all([
      client.from('organizations').select('*').order('created_at', { ascending: false }),
      client.from('organization_members').select('id,user_id,organization_id,role,status,created_at').order('created_at', { ascending: false }),
      client.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100),
    ])
    const firstError = orgResult.error || membershipResult.error || activityResult.error
    if (firstError) {
      setLoadError(firstError.message)
    } else {
      const rows = membershipResult.data as AdminMembership[]
      const userIds = [...new Set(rows.map((item) => item.user_id))]
      let profiles: Profile[] = []
      if (userIds.length) {
        const profileResult = await client.from('profiles').select('id,full_name,email,avatar_url,phone,platform_role,status,last_active_at').in('id', userIds)
        profiles = (profileResult.data ?? []) as Profile[]
      }
      setOrganizations((orgResult.data ?? []) as Organization[])
      setMemberships(rows.map((item) => ({ ...item, profile: profiles.find((profile) => profile.id === item.user_id) })))
      setActivity((activityResult.data ?? []) as ActivityRecord[])
    }
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const createBusiness = async (event: FormEvent) => {
    event.preventDefault()
    setProvisioning(true)
    setActionMessage(null)
    const { data, error } = await requireSupabase().functions.invoke('provision-kaivo-business', {
      body: { business, owner, redirectTo: `${window.location.origin}/reset-password` },
    })
    setProvisioning(false)
    if (error || data?.error) {
      setActionMessage(data?.error || error?.message || 'The business could not be provisioned.')
      return
    }
    setShowCreate(false)
    setStep(1)
    setBusiness(initialBusiness)
    setOwner(initialOwner)
    await load()
    onNavigate(`/admin/businesses/${data.organization.id}`)
  }

  const detailMatch = path.match(/^\/admin\/businesses\/([0-9a-f-]{36})$/i)
  const detailOrganization = detailMatch ? organizations.find((item) => item.id === detailMatch[1]) ?? null : null
  const activeNav = path === '/admin' ? '/admin' : navigation.find((item) => item.path !== '/admin' && path.startsWith(item.path))?.path ?? '/admin'

  return (
    <div className="min-h-screen bg-[#07050f] text-white">
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#07050f]/92 px-4 py-3 backdrop-blur-xl sm:px-8 sm:py-4">
        <div className="mx-auto flex max-w-[1550px] items-center justify-between gap-3">
          <button onClick={() => onNavigate('/')}><img src={kaivoWordmarkWhite} alt="KAIVO" className="h-5 w-auto" /></button>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 text-xs text-emerald-100/60 sm:flex"><span className="size-1.5 rounded-full bg-emerald-300" /> Secure admin</span>
            <button onClick={async () => { await auth.signOut(); onNavigate('/admin/login') }} className="liquid-glass flex items-center gap-2 rounded-full px-3 py-2 text-sm text-white/60"><LogOut className="size-4" /><span className="hidden sm:inline">Sign out</span></button>
          </div>
        </div>
      </header>
      <nav className="mobile-section-nav lg:hidden" aria-label="Admin navigation">
        {navigation.map((item) => <button key={item.path} onClick={() => onNavigate(item.path)} className={activeNav === item.path ? 'mobile-section-nav__active' : ''}>{item.label}</button>)}
      </nav>
      <div className="mx-auto flex max-w-[1550px]">
        <aside className="hidden min-h-[calc(100vh-73px)] w-64 shrink-0 border-r border-white/[0.07] p-5 lg:flex lg:flex-col">
          <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.035] p-4"><p className="eyebrow">Platform control</p><p className="mt-2 text-sm text-white/55">{auth.profile?.full_name}</p></div>
          <nav className="mt-6 space-y-1">{navigation.map((item) => { const Icon = item.icon; return <button key={item.path} onClick={() => onNavigate(item.path)} className={`sidebar-link ${activeNav === item.path ? 'sidebar-link-active' : ''}`}><Icon className="size-4" />{item.label}</button> })}</nav>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-7 sm:px-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-6xl">
            {loading ? <LoadingState /> : loadError ? <ErrorState message={loadError} onRetry={load} /> : detailMatch ? (
              detailOrganization ? <BusinessDetail organization={detailOrganization} memberships={memberships.filter((item) => item.organization_id === detailOrganization.id)} activity={activity.filter((item) => item.organization_id === detailOrganization.id)} onRefresh={load} /> : <ErrorState message="This business does not exist or you are not authorized to view it." onRetry={() => onNavigate('/admin/businesses')} />
            ) : path === '/admin/businesses' ? (
              <BusinessesScreen organizations={organizations} memberships={memberships} search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} onOpen={(id) => onNavigate(`/admin/businesses/${id}`)} onCreate={() => setShowCreate(true)} />
            ) : path === '/admin/users' ? (
              <UsersScreen memberships={memberships} />
            ) : path === '/admin/activity' ? (
              <ActivityScreen activity={activity} organizations={organizations} />
            ) : path === '/admin/settings' ? (
              <AdminSettings />
            ) : (
              <AdminOverview organizations={organizations} memberships={memberships} activity={activity} onCreate={() => setShowCreate(true)} onBusinesses={() => onNavigate('/admin/businesses')} />
            )}
          </div>
        </main>
      </div>
      {showCreate && <CreateBusinessModal step={step} setStep={setStep} business={business} setBusiness={setBusiness} owner={owner} setOwner={setOwner} submitting={provisioning} message={actionMessage} onClose={() => { setShowCreate(false); setActionMessage(null) }} onSubmit={createBusiness} />}
    </div>
  )
}

function AdminOverview({ organizations, memberships, activity, onCreate, onBusinesses }: { organizations: Organization[]; memberships: AdminMembership[]; activity: ActivityRecord[]; onCreate: () => void; onBusinesses: () => void }) {
  const stats = [
    ['Total businesses', organizations.length],
    ['Active businesses', organizations.filter((item) => item.status === 'active').length],
    ['Onboarding', organizations.filter((item) => item.status === 'onboarding').length],
    ['Total users', new Set(memberships.map((item) => item.user_id)).size],
    ['Pending invitations', memberships.filter((item) => item.status === 'invited').length],
  ]
  return <>
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">KAIVO administration</p><h1 className="mt-3 font-heading text-3xl sm:text-4xl">Control centre</h1><p className="mt-2 text-sm text-white/42">Live platform data. No demo statistics.</p></div><div className="flex flex-wrap gap-2"><button onClick={onBusinesses} className="rounded-full border border-white/10 px-4 py-2.5 text-sm text-white/65">Businesses</button><button onClick={onCreate} className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-[#080510]"><Plus className="size-4" />Add Business</button></div></div>
    <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{stats.map(([label, value]) => <div key={label} className="app-panel p-5"><p className="text-sm text-white/42">{label}</p><p className="mt-4 font-heading text-3xl">{value}</p></div>)}</div>
    <div className="mt-7 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]"><section className="app-panel p-5 sm:p-6"><h2 className="text-lg font-medium">Recent businesses</h2>{organizations.length ? <div className="mt-4 space-y-2">{organizations.slice(0, 5).map((org) => <div key={org.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] p-3"><div className="min-w-0"><p className="truncate text-sm">{org.name}</p><p className="mt-1 text-xs text-white/35">{org.industry || org.business_type || 'Business'}</p></div><span className="app-chip capitalize">{org.status}</span></div>)}</div> : <CompactEmpty text="No businesses yet." />}</section><section className="app-panel p-5 sm:p-6"><h2 className="text-lg font-medium">Recent activity</h2>{activity.length ? <div className="mt-4 space-y-3">{activity.slice(0, 6).map((item) => <div key={item.id}><p className="text-sm text-white/70">{humanize(item.event_type)}</p><p className="mt-1 text-xs text-white/30">{formatDate(item.created_at)}</p></div>)}</div> : <CompactEmpty text="No account activity yet." />}</section></div>
  </>
}

function BusinessesScreen({ organizations, memberships, search, setSearch, filter, setFilter, onOpen, onCreate }: { organizations: Organization[]; memberships: AdminMembership[]; search: string; setSearch: (value: string) => void; filter: string; setFilter: (value: string) => void; onOpen: (id: string) => void; onCreate: () => void }) {
  const filtered = useMemo(() => organizations.filter((org) => (filter === 'all' || org.status === filter) && `${org.name} ${org.email ?? ''} ${org.industry}`.toLowerCase().includes(search.toLowerCase())), [organizations, search, filter])
  return <><ScreenTitle eyebrow="Platform businesses" title="Businesses" action={<button onClick={onCreate} className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-[#080510]"><Plus className="size-4" /> Add Business</button>} /><div className="mt-7 flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30" /><input className="form-input pl-10" placeholder="Search businesses" value={search} onChange={(event) => setSearch(event.target.value)} /></label><div className="flex gap-2 overflow-x-auto">{['all', 'active', 'onboarding', 'suspended'].map((item) => <button key={item} onClick={() => setFilter(item)} className={`app-chip capitalize ${filter === item ? 'app-chip-active' : ''}`}>{item}</button>)}</div></div>{filtered.length ? <div className="mt-5 space-y-2">{filtered.map((org) => { const owner = memberships.find((item) => item.organization_id === org.id && item.role === 'owner'); const count = memberships.filter((item) => item.organization_id === org.id).length; return <button key={org.id} onClick={() => onOpen(org.id)} className="app-panel grid w-full gap-4 p-4 text-left sm:grid-cols-[1.4fr_1fr_0.7fr_auto] sm:items-center sm:p-5"><div className="flex min-w-0 items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl" style={{ background: `${org.brand_primary_color}22`, color: org.brand_primary_color }}><Building2 className="size-5" /></span><div className="min-w-0"><p className="truncate font-medium">{org.name}</p><p className="mt-1 truncate text-xs text-white/35">{org.industry || org.business_type}</p></div></div><div className="min-w-0"><p className="truncate text-sm text-white/62">{owner?.profile?.full_name || 'Owner pending'}</p><p className="mt-1 truncate text-xs text-white/32">{owner?.profile?.email || org.email || 'No email'}</p></div><p className="text-sm text-white/48">{count} user{count === 1 ? '' : 's'}</p><span className="app-chip w-fit capitalize">{org.status}</span></button> })}</div> : <div className="app-empty-state mt-5"><div><Building2 className="mx-auto size-7 text-violet-200/55" /><h2 className="mt-4 font-medium">No businesses found</h2><p className="mt-2 text-sm text-white/40">Create the first real KAIVO client workspace.</p></div></div>}</>
}

function BusinessDetail({ organization, memberships, activity, onRefresh }: { organization: Organization; memberships: AdminMembership[]; activity: ActivityRecord[]; onRefresh: () => Promise<void> }) {
  const [message, setMessage] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const accessAction = async (action: string, targetUserId?: string) => {
    if (!window.confirm(`Confirm ${humanize(action)}?`)) return
    setWorking(true); setMessage(null)
    const { data, error } = await requireSupabase().functions.invoke('manage-kaivo-access', { body: { action, organizationId: organization.id, targetUserId, redirectTo: `${window.location.origin}/reset-password` } })
    setWorking(false); setMessage(data?.error || error?.message || 'Access updated securely.')
    if (!error && !data?.error) await onRefresh()
  }
  return <><ScreenTitle eyebrow="Business detail" title={organization.name} action={<span className="app-chip capitalize">{organization.status}</span>} />{message && <p className="mt-5 rounded-xl border border-white/10 p-3 text-sm text-white/65">{message}</p>}<div className="mt-7 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]"><section className="app-panel p-5 sm:p-6"><h2 className="text-lg font-medium">Overview</h2><dl className="mt-5 space-y-4 text-sm">{[['Industry', organization.industry || '—'], ['Business type', organization.business_type || '—'], ['Email', organization.email || '—'], ['Location', [organization.city, organization.country].filter(Boolean).join(', ')], ['Created', formatDate(organization.created_at)]].map(([label, value]) => <div key={label} className="flex justify-between gap-5"><dt className="text-white/35">{label}</dt><dd className="text-right text-white/70">{value}</dd></div>)}</dl><div className="mt-7 border-t border-white/[0.07] pt-5"><p className="text-xs uppercase tracking-[0.2em] text-red-200/45">Access control</p><button disabled={working} onClick={() => accessAction(organization.status === 'suspended' ? 'reactivate_organization' : 'suspend_organization')} className="mt-3 rounded-full border border-red-200/15 px-4 py-2 text-sm text-red-100/65 disabled:opacity-40">{organization.status === 'suspended' ? 'Reactivate business' : 'Suspend business'}</button></div></section><section className="app-panel p-5 sm:p-6"><h2 className="text-lg font-medium">Users</h2>{memberships.length ? <div className="mt-4 space-y-2">{memberships.map((member) => <div key={member.id} className="rounded-xl border border-white/[0.07] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm">{member.profile?.full_name || 'Invitation pending'}</p><p className="mt-1 text-xs text-white/35">{member.profile?.email}</p></div><div className="flex flex-wrap gap-2"><span className="app-chip">{humanize(member.role)}</span><span className="app-chip capitalize">{member.status}</span></div></div><div className="mt-3 flex flex-wrap gap-3 text-xs text-violet-200/60"><button onClick={() => accessAction('resend_invitation', member.user_id)}>Resend invitation</button><button onClick={() => accessAction('send_password_reset', member.user_id)}>Password reset</button><button onClick={() => accessAction(member.status === 'disabled' ? 'enable_user' : 'disable_user', member.user_id)}>{member.status === 'disabled' ? 'Enable' : 'Disable'} access</button></div></div>)}</div> : <CompactEmpty text="No users assigned." />}</section></div><section className="app-panel mt-5 p-5 sm:p-6"><h2 className="text-lg font-medium">Activity</h2>{activity.length ? <div className="mt-4 divide-y divide-white/[0.06]">{activity.slice(0, 20).map((item) => <div key={item.id} className="flex justify-between gap-4 py-3 text-sm"><span className="text-white/62">{humanize(item.event_type)}</span><span className="text-xs text-white/28">{formatDate(item.created_at)}</span></div>)}</div> : <CompactEmpty text="No activity yet." />}</section></>
}

function UsersScreen({ memberships }: { memberships: AdminMembership[] }) { return <><ScreenTitle eyebrow="Platform access" title="Users" /><div className="mt-7 space-y-2">{memberships.map((item) => <div key={item.id} className="app-panel flex flex-wrap items-center justify-between gap-4 p-4"><div><p className="text-sm">{item.profile?.full_name || 'Invitation pending'}</p><p className="mt-1 text-xs text-white/35">{item.profile?.email}</p></div><div className="flex gap-2"><span className="app-chip">{humanize(item.role)}</span><span className="app-chip capitalize">{item.status}</span></div></div>)}</div></> }
function ActivityScreen({ activity, organizations }: { activity: ActivityRecord[]; organizations: Organization[] }) { return <><ScreenTitle eyebrow="Audit trail" title="Activity" /><div className="app-panel mt-7 divide-y divide-white/[0.06] p-4 sm:p-6">{activity.length ? activity.map((item) => <div key={item.id} className="flex flex-col justify-between gap-2 py-4 sm:flex-row"><div><p className="text-sm text-white/72">{humanize(item.event_type)}</p><p className="mt-1 text-xs text-white/32">{organizations.find((org) => org.id === item.organization_id)?.name || 'Platform event'}</p></div><span className="text-xs text-white/28">{formatDate(item.created_at)}</span></div>) : <CompactEmpty text="No activity recorded." />}</div></> }
function AdminSettings() { return <><ScreenTitle eyebrow="Platform configuration" title="Settings" /><div className="app-panel mt-7 p-5 sm:p-6"><div className="flex items-center gap-3"><ShieldCheck className="size-5 text-violet-200" /><div><p className="text-sm">Supabase connection</p><p className="mt-1 text-xs text-white/35">{supabaseConfig.enabled ? 'Public client configuration detected' : 'Not configured'}</p></div></div><p className="mt-5 text-sm leading-7 text-white/48">Secrets, SMTP, Auth redirects and Edge Function deployment are configured in Supabase—not stored in this browser application.</p></div></> }

function CreateBusinessModal({ step, setStep, business, setBusiness, owner, setOwner, submitting, message, onClose, onSubmit }: { step: number; setStep: (step: number) => void; business: typeof initialBusiness; setBusiness: (value: typeof initialBusiness) => void; owner: typeof initialOwner; setOwner: (value: typeof initialOwner) => void; submitting: boolean; message: string | null; onClose: () => void; onSubmit: (event: FormEvent) => void }) {
  const updateBusiness = (key: keyof typeof initialBusiness, value: string) => setBusiness({ ...business, [key]: value })
  const updateOwner = (key: keyof typeof initialOwner, value: string) => setOwner({ ...owner, [key]: value })
  return <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-sm sm:items-center"><form onSubmit={onSubmit} className="app-panel my-2 max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto bg-[#090711] p-5 sm:my-0 sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Secure provisioning</p><h2 className="mt-2 font-heading text-2xl sm:text-3xl">Add Business</h2></div><button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full border border-white/10"><X className="size-4" /></button></div><div className="mt-6 flex gap-2">{[1, 2, 3, 4].map((value) => <span key={value} className={`h-1.5 flex-1 rounded-full ${value <= step ? 'bg-violet-400' : 'bg-white/10'}`} />)}</div><div className="mt-7">
    {step === 1 && <div className="grid gap-4 sm:grid-cols-2"><Field label="Business name" value={business.name} onChange={(v) => updateBusiness('name', v)} required /><Field label="Business type" value={business.businessType} onChange={(v) => updateBusiness('businessType', v)} required /><Field label="Industry" value={business.industry} onChange={(v) => updateBusiness('industry', v)} /><Field label="Website" value={business.website} onChange={(v) => updateBusiness('website', v)} /><Field label="Business email" type="email" value={business.email} onChange={(v) => updateBusiness('email', v)} /><Field label="Phone" value={business.phone} onChange={(v) => updateBusiness('phone', v)} /><Field label="City" value={business.city} onChange={(v) => updateBusiness('city', v)} /><Field label="Country" value={business.country} onChange={(v) => updateBusiness('country', v)} /></div>}
    {step === 2 && <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Primary colour" type="color" value={business.primaryColor} onChange={(v) => updateBusiness('primaryColor', v)} /><Field label="Secondary colour" type="color" value={business.secondaryColor} onChange={(v) => updateBusiness('secondaryColor', v)} /></div><label className="block"><span className="form-label">Brand description</span><textarea className="form-input min-h-28" value={business.brandDescription} onChange={(event) => updateBusiness('brandDescription', event.target.value)} /></label><p className="text-xs text-white/35">Logo upload becomes available inside the secured business asset workspace after provisioning.</p></div>}
    {step === 3 && <div className="grid gap-4 sm:grid-cols-2"><Field label="Owner full name" value={owner.fullName} onChange={(v) => updateOwner('fullName', v)} required /><Field label="Owner email" type="email" value={owner.email} onChange={(v) => updateOwner('email', v)} required /><Field label="Owner phone" value={owner.phone} onChange={(v) => updateOwner('phone', v)} /><label className="block"><span className="form-label">Role</span><input className="form-input" value="Owner" disabled /></label></div>}
    {step === 4 && <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><p className="text-sm font-medium">Confirm secure provisioning</p><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-white/35">Business</dt><dd>{business.name}</dd></div><div className="flex justify-between gap-4"><dt className="text-white/35">Owner</dt><dd>{owner.fullName}</dd></div><div className="flex justify-between gap-4"><dt className="text-white/35">Invitation</dt><dd className="text-right">{owner.email}</dd></div></dl><p className="mt-5 text-xs leading-6 text-white/38">KAIVO will create the isolated workspace, assign the owner, and ask Supabase Auth to send a secure password setup invitation.</p></div>}
  </div>{message && <p className="mt-5 rounded-xl border border-red-300/15 bg-red-400/[0.06] p-3 text-sm text-red-100/75">{message}</p>}<div className="mt-7 flex justify-between gap-3"><button type="button" onClick={() => step === 1 ? onClose() : setStep(step - 1)} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/60">{step === 1 ? 'Cancel' : 'Back'}</button>{step < 4 ? <button type="button" onClick={() => setStep(step + 1)} disabled={(step === 1 && (!business.name || !business.businessType)) || (step === 3 && (!owner.fullName || !owner.email))} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#080510] disabled:opacity-40">Continue</button> : <button disabled={submitting} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#080510] disabled:opacity-45">{submitting && <LoaderCircle className="size-4 animate-spin" />}Create Business & Send Invite</button>}</div></form></div>
}

function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <label className="block"><span className="form-label">{label}</span><input className={`form-input ${type === 'color' ? 'h-12 p-1' : ''}`} type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></label> }
function ScreenTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) { return <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">{eyebrow}</p><h1 className="mt-3 font-heading text-3xl sm:text-4xl">{title}</h1></div>{action}</div> }
function LoadingState() { return <div className="grid min-h-[55vh] place-items-center"><div className="text-center"><LoaderCircle className="mx-auto size-6 animate-spin text-violet-200" /><p className="mt-3 text-sm text-white/40">Loading secure KAIVO data…</p></div></div> }
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void | Promise<void> }) { return <div className="app-empty-state"><div><h2 className="font-medium">KAIVO could not load this view</h2><p className="mt-2 max-w-lg text-sm text-white/42">{message}</p><button onClick={() => void onRetry()} className="mt-5 rounded-full border border-white/10 px-4 py-2 text-sm">Try again</button></div></div> }
function CompactEmpty({ text }: { text: string }) { return <p className="mt-5 rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-white/35">{text}</p> }
function humanize(value: string) { return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }
function formatDate(value: string) { return new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) }
