'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Activity {
  id: string
  username: string
  nim: string
  nodeJudul: string
  lpName: string
  updated_at: string
}

export default function AktivitasPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [stats, setStats] = useState({ today: 0, week: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  async function loadActivities() {
    const [{ data: prog }, { data: nodes }, { data: lps }, { data: profiles }] = await Promise.all([
      supabase.from('progress').select('id,user_id,roadmapnode_id,updated_at,status').eq('status', 'selesai').order('updated_at', { ascending: false }).limit(50),
      supabase.from('roadmapnode').select('id,judul,learningpath_id'),
      supabase.from('learningpath').select('id,Nama Learning Path'),
      supabase.from('profiles').select('id,username,nim'),
    ])

    const nodeMap: Record<string, { judul: string; lpId: string }> = {}
    ;(nodes || []).forEach((n: { id: string; judul: string; learningpath_id: string }) => {
      nodeMap[n.id] = { judul: n.judul, lpId: n.learningpath_id }
    })
    const lpMap: Record<string, string> = {}
;(lps as any || []).forEach((l: any) => { lpMap[l.id] = l['Nama Learning Path'] })
    const profMap: Record<string, { username: string; nim: string }> = {}
    ;(profiles || []).forEach((p: { id: string; username: string; nim: string }) => { profMap[p.id] = { username: p.username, nim: p.nim } })

    const acts: Activity[] = (prog || []).map((p: { id: string; user_id: string; roadmapnode_id: string; updated_at: string }) => ({
      id: p.id,
      username: profMap[p.user_id]?.username || 'Unknown',
      nim: profMap[p.user_id]?.nim || '',
      nodeJudul: nodeMap[p.roadmapnode_id]?.judul || '—',
      lpName: lpMap[nodeMap[p.roadmapnode_id]?.lpId] || '—',
      updated_at: p.updated_at,
    }))
    setActivities(acts)

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const weekAgo  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    setStats({
      today: acts.filter(a => a.updated_at?.startsWith(todayStr)).length,
      week:  acts.filter(a => a.updated_at > weekAgo).length,
      total: prog?.length || 0,
    })
    setLoading(false)
  }

  useEffect(() => {
    loadActivities()

    // Realtime subscription
    const channel = supabase
      .channel('progress-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'progress' }, () => {
        loadActivities()
      })
      .subscribe()
    channelRef.current = channel

    return () => { channel.unsubscribe() }
  }, [])

  function timeAgo(dateStr: string) {
    if (!dateStr) return '—'
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'Baru saja'
    if (m < 60) return `${m} menit lalu`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h} jam lalu`
    return `${Math.floor(h / 24)} hari lalu`
  }

  const statCards = [
    { label: 'Aktivitas Hari Ini', value: stats.today, color: 'var(--green)', icon: '📅' },
    { label: 'Aktivitas Minggu Ini', value: stats.week, color: 'var(--cyan)', icon: '📆' },
    { label: 'Total Selesai', value: stats.total, color: 'var(--amber)', icon: '🏁' },
  ]

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-d)', fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Aktivitas Live</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Progress mahasiswa secara real-time</p>
        </div>
        {/* Live pulse */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: 'rgba(0,230,118,.08)', border: '1px solid rgba(0,230,118,.2)' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)', animation: 'pulse 1.5s infinite' }}/>
          <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, letterSpacing: '1px' }}>LIVE</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)',
            borderRadius: 12, padding: '18px 20px', borderTop: `2px solid ${s.color}`,
          }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-d)', fontSize: 32, fontWeight: 900, color: s.color }}>{loading ? '—' : s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Activity feed */}
      <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', letterSpacing: '1px' }}>FEED AKTIVITAS TERBARU</span>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{activities.length} entri</span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Memuat aktivitas...</div>
        ) : activities.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Belum ada aktivitas</div>
        ) : (
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {activities.map((a, i) => (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,.04)',
                transition: 'background .1s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Avatar */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: `rgba(0,200,255,.1)`, border: '1px solid rgba(0,200,255,.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: 'var(--cyan)', fontFamily: 'var(--font-d)',
                }}>{a.username.slice(0, 2).toUpperCase()}</div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#fff', marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, color: 'var(--cyan)' }}>{a.username}</span>
                    <span style={{ color: 'var(--muted)' }}> menyelesaikan </span>
                    <span style={{ fontWeight: 600 }}>{a.nodeJudul}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{a.lpName} • {a.nim}</div>
                </div>

                {/* Badge + time */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 20, marginBottom: 4,
                    background: 'rgba(0,230,118,.08)', border: '1px solid rgba(0,230,118,.2)',
                    color: 'var(--green)', display: 'inline-block',
                  }}>✓ Selesai</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{timeAgo(a.updated_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .5; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}