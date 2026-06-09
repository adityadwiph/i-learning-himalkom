'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface NodeStat { judul: string; done: number; lpName: string }
interface ProgRow  { roadmapnode_id: string; updated_at: string }

export default function TrafficPage() {
  const [nodeStats, setNodeStats] = useState<NodeStat[]>([])
  const [dailyData, setDailyData] = useState<{ day: string; count: number }[]>([])
  const [totals,    setTotals]    = useState({ users: 0, progress: 0, avgPerUser: 0 })
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: prog }, { data: nodes }, { data: lps }, { data: users }] = await Promise.all([
        supabase.from('progress').select('roadmapnode_id,updated_at,user_id'),
        supabase.from('roadmapnode').select('id,judul,learningpath_id'),
        supabase.from('learningpath').select('id,"Nama Learning Path"'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ])

      // Node stats
      const nodeMap: Record<string, number> = {}
      ;(prog || []).forEach((p: ProgRow) => {
        nodeMap[p.roadmapnode_id] = (nodeMap[p.roadmapnode_id] || 0) + 1
      })
      const lpMap: Record<string, string> = {}
      ;(lps || []).forEach((l: { id: string; 'Nama Learning Path': string }) => { lpMap[l.id] = l['Nama Learning Path'] })
      const ns: NodeStat[] = (nodes || [])
        .map((n: { id: string; judul: string; learningpath_id: string }) => ({
          judul: n.judul,
          done: nodeMap[n.id] || 0,
          lpName: lpMap[n.learningpath_id] || '—',
        }))
        .sort((a: NodeStat, b: NodeStat) => b.done - a.done)
        .slice(0, 8)
      setNodeStats(ns)

      // Daily activity (last 7 days)
      const days: { day: string; count: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dayStr = d.toISOString().split('T')[0]
        const label  = d.toLocaleDateString('id-ID', { weekday: 'short' })
        const count  = (prog || []).filter((p: ProgRow) => p.updated_at?.startsWith(dayStr)).length
        days.push({ day: label, count })
      }
      setDailyData(days)

      const uniqueUsers = new Set((prog || []).map((p: { user_id: string }) => p.user_id)).size
      setTotals({
        users: uniqueUsers,
        progress: (prog || []).length,
        avgPerUser: uniqueUsers > 0 ? Math.round((prog || []).length / uniqueUsers * 10) / 10 : 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  const maxDaily = Math.max(...dailyData.map(d => d.count), 1)
  const maxNode  = Math.max(...nodeStats.map(n => n.done), 1)

  const statCards = [
    { label: 'User Aktif',    value: totals.users,       color: 'var(--cyan)',  icon: '👤' },
    { label: 'Total Progress',value: totals.progress,    color: 'var(--green)', icon: '✅' },
    { label: 'Avg per User',  value: totals.avgPerUser,  color: 'var(--amber)', icon: '📊' },
  ]

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-d)', fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Traffic & Analitik</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Data penggunaan platform 7 hari terakhir</p>
      </div>

      {/* Stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)',
            borderRadius: 12, padding: '18px 20px', borderTop: `2px solid ${s.color}`,
          }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-d)', fontSize: 30, fontWeight: 900, color: s.color }}>{loading ? '—' : s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bar chart + table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* Daily bar chart */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '20px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', letterSpacing: '1px', marginBottom: 20 }}>
            PROGRESS PER HARI (7 HARI TERAKHIR)
          </div>
          {loading ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>Memuat...</div> : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 140 }}>
              {dailyData.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: 10, color: 'var(--cyan)' }}>{d.count || ''}</div>
                  <div style={{
                    width: '100%', borderRadius: '4px 4px 0 0',
                    height: `${(d.count / maxDaily) * 100}%`,
                    minHeight: d.count > 0 ? 4 : 0,
                    background: `linear-gradient(to top, var(--cyan), rgba(0,200,255,.3))`,
                    transition: 'height .6s ease',
                    boxShadow: d.count > 0 ? '0 0 8px rgba(0,200,255,.3)' : 'none',
                  }}/>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{d.day}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Node completion table */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '20px', overflowY: 'auto', maxHeight: 260 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', letterSpacing: '1px', marginBottom: 16 }}>
            STATISTIK PER MODUL
          </div>
          {loading ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>Memuat...</div> : nodeStats.map((n, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{n.judul}</span>
                  <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 6 }}>{n.lpName}</span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--cyan)', fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>{n.done}</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,.07)', borderRadius: 2 }}>
                <div style={{
                  height: '100%', borderRadius: 2, transition: 'width .8s ease',
                  width: `${(n.done / maxNode) * 100}%`,
                  background: i % 2 === 0 ? 'var(--cyan)' : 'var(--green)',
                }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}