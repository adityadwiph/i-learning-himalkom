'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import Navbar from '@/components/ui/navbar'

interface Profile    { username: string; nim: string }
interface EnrolledLP { id: string; name: string; done: number; total: number; komunitas: string }
interface RecentAct  { judul: string; status: string; updated_at: string }
interface JoinedKom  { id: string; nama: string }

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'baru saja'
  if (m < 60) return `${m}m lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}j lalu`
  return `${Math.floor(h / 24)}h lalu`
}

const KOM_COLOR: Record<string, string> = {
  CSI: '#00c8ff', IWDC: '#818cf8', AgriUX: '#f59e0b',
  Gaming: '#34d399', Gary: '#f87171', MAD: '#a78bfa', CP: '#22d3ee',
}
const KOM_ICON: Record<string, string> = {
  CSI: '🛡', IWDC: '🌐', AgriUX: '🎨',
  Gaming: '🎮', Gary: '⚡', MAD: '🤖', CP: '{}',
}

export default function DashboardPage() {
  const router = useRouter()
  const [profile,   setProfile]   = useState<Profile | null>(null)
  const [stats,     setStats]     = useState({ done: 0, total: 0, komunitas: 0 })
  const [enrolled,  setEnrolled]  = useState<EnrolledLP[]>([])
  const [recent,    setRecent]    = useState<RecentAct[]>([])
  const [joinedKom, setJoinedKom] = useState<JoinedKom[]>([])
  const [loading,   setLoading]   = useState(true)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Load data paralel
    const [{ data: prof }, { data: ulp }, { data: prog }, { data: km }] = await Promise.all([
      supabase.from('profiles').select('username, nim').eq('id', user.id).single(),
      supabase.from('user_learningpath')
        .select('LearningPath_id, learningpath(id, "Nama Learning Path")')
        .eq('user_id', user.id),
      supabase.from('progress')
        .select('roadmapnode_id, status, updated_at, roadmapnode(judul)')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(6),
      supabase.from('komunitas_member')
        .select('id_komunitas')
        .eq('id_user', user.id),
    ])

    setProfile(prof)

    // Aktivitas terbaru
    setRecent((prog || []).map((p: any) => ({
      judul: p.roadmapnode?.judul || 'Materi',
      status: p.status,
      updated_at: p.updated_at,
    })))

    // Ambil nama komunitas secara terpisah
    const komIds = (km || []).map((k: any) => k.id_komunitas)
    const { data: komData } = komIds.length
      ? await supabase.from('komunitas').select('id, nama_komunitas').in('id', komIds)
      : { data: [] }

    const komList: JoinedKom[] = (komData || []).map((k: any) => ({
      id: k.id,
      nama: k.nama_komunitas || '',
    }))
    setJoinedKom(komList)

    // Learning path + progress per path
    const paths: EnrolledLP[] = await Promise.all(
      (ulp || []).map(async (u: any) => {
        const lpId   = u.LearningPath_id
        const lpData = Array.isArray(u.learningpath) ? u.learningpath[0] : u.learningpath
        const lpName = lpData?.['Nama Learning Path'] || 'Learning Path'

        const { data: allN } = await supabase
          .from('roadmapnode').select('id').eq('learningpath_id', lpId)
        const ids = (allN || []).map((n: any) => n.id)

        const { data: doneN } = ids.length
          ? await supabase.from('progress').select('id')
              .eq('user_id', user.id).eq('status', 'selesai').in('roadmapnode_id', ids)
          : { data: [] }

        // Cari nama komunitas untuk path ini
        const { data: klp } = await supabase
          .from('komunitas_learningpath')
          .select('komunitas_id')
          .eq('Learning_Path_id', lpId)
          .single()
        const komNamaObj = komList.find(k => k.id === (klp as any)?.komunitas_id)
        const komNama = komNamaObj?.nama || ''

        return { id: lpId, name: lpName, done: doneN?.length || 0, total: ids.length, komunitas: komNama }
      })
    )
    setEnrolled(paths)

    const totalNodes = paths.reduce((a, b) => a + b.total, 0)
    const doneNodes  = paths.reduce((a, b) => a + b.done, 0)
    setStats({ done: doneNodes, total: totalNodes, komunitas: komList.length })
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--muted)', fontSize: 14 }}>
        Memuat dashboard...
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar username={profile?.username} nim={profile?.nim || ''} />

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '44px 24px 80px' }}>

        {/* Welcome */}
        <div className="fade-up" style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <h1 style={{ fontFamily: 'var(--font-d)', fontWeight: 900, fontSize: 'clamp(22px,3.5vw,36px)', color: '#fff', marginBottom: 6 }}>
            Halo, <span style={{ color: 'var(--cyan)' }}>{profile?.username}!</span> 👋
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            {enrolled.length === 0
              ? 'Mulai perjalanan belajarmu dengan memilih komunitas.'
              : `Kamu sedang aktif di ${stats.komunitas} komunitas. Semangat belajar!`}
          </p>
        </div>

        {/* Stats */}
        <div className="fade-up d1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 36 }}>
          {[
            { label: 'Total Progress',  val: `${pct}%`,           sub: `${stats.done} dari ${stats.total} node`, bar: pct,                      color: 'var(--cyan)'  },
            { label: 'Node Selesai',    val: `${stats.done}`,      sub: 'node berhasil diselesaikan',             bar: pct,                      color: 'var(--green)' },
            { label: 'Komunitas Aktif', val: `${stats.komunitas}`, sub: 'komunitas diikuti',                      bar: (stats.komunitas / 7) * 100, color: 'var(--amber)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-d)', fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{s.val}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>{s.sub}</div>
              <div style={{ height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${Math.min(s.bar, 100)}%`, background: s.color, borderRadius: 2, transition: 'width 1s' }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

          {/* Learning paths */}
          <div className="fade-up d2">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>
                Learning Path Aktif
              </div>
              <Link href="/eksplorasi" style={{ fontSize: 11, color: 'var(--cyan)', textDecoration: 'none' }}>+ Tambah</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {enrolled.length === 0 ? (
                <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
                    Belum ada learning path aktif.<br />Pilih komunitas untuk mulai belajar.
                  </p>
                  <Link href="/eksplorasi" className="btn-primary" style={{ fontSize: 12 }}>
                    Jelajahi Komunitas
                  </Link>
                </div>
              ) : enrolled.map(lp => {
                const p = lp.total > 0 ? Math.round((lp.done / lp.total) * 100) : 0
                const color = KOM_COLOR[lp.komunitas] || 'var(--cyan)'
                return (
                  <Link key={lp.id} href={`/learning-path/${lp.id}`} className="card"
                    style={{ padding: '16px 20px', textDecoration: 'none', display: 'block' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 10, color, marginBottom: 3, fontWeight: 500 }}>{lp.komunitas}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{lp.name}</div>
                      </div>
                      <div style={{
                        fontSize: 12, fontWeight: 700, color,
                        background: `${color}15`, border: `1px solid ${color}30`,
                        padding: '2px 8px', borderRadius: 20,
                      }}>{p}%</div>
                    </div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 2, margin: '8px 0 6px' }}>
                      <div style={{ height: '100%', width: `${p}%`, background: color, borderRadius: 2, transition: 'width 1s' }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{lp.done}/{lp.total} node selesai</div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Aktivitas terbaru */}
          <div className="fade-up d3">
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, marginBottom: 14 }}>
              Aktivitas Terbaru
            </div>
            <div className="card" style={{ padding: '16px 20px' }}>
              {recent.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🕐</div>
                  <p style={{ fontSize: 13, color: 'var(--muted)' }}>Belum ada aktivitas.</p>
                </div>
              ) : recent.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                  borderBottom: i < recent.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none',
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: r.status === 'selesai' ? 'var(--green)' : r.status === 'dipelajari' ? 'var(--amber)' : 'var(--cyan)',
                  }} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.judul}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                      {r.status === 'selesai' ? '✓ Selesai' : r.status === 'dipelajari' ? '▶ Dipelajari' : r.status}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>{timeAgo(r.updated_at)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Komunitas yang diikuti */}
        {joinedKom.length > 0 && (
          <div className="fade-up d4">
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, marginBottom: 14 }}>
              Komunitas Saya
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {joinedKom.map(k => {
                const color = KOM_COLOR[k.nama] || 'var(--cyan)'
                const icon  = KOM_ICON[k.nama]  || '📚'
                return (
                  <Link key={k.id} href={`/eksplorasi/${k.id}`} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px', borderRadius: 10, textDecoration: 'none',
                    background: `${color}10`, border: `1px solid ${color}30`,
                    transition: 'all .18s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${color}20` }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${color}10` }}
                  >
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color }}>{k.nama}</span>
                  </Link>
                )
              })}
              <Link href="/eksplorasi" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', borderRadius: 10, textDecoration: 'none',
                background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
                fontSize: 13, color: 'var(--muted)', transition: 'all .18s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,200,255,.3)'; e.currentTarget.style.color = 'var(--cyan)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = 'var(--muted)' }}
              >
                + Gabung komunitas lain
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}