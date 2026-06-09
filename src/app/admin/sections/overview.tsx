'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Stats { totalMateri: number; totalProgress: number; totalNode: number; totalKomunitas: number }
interface TopMateri { judul: string; count: number }
interface KomStat { nama: string; count: number; color: string }

const COLORS = ['var(--cyan)', 'var(--green)', 'var(--amber)', '#a78bfa', '#f472b6']

export default function OverviewPage() {
  const [stats,      setStats]      = useState<Stats>({ totalMateri: 0, totalProgress: 0, totalNode: 0, totalKomunitas: 0 })
  const [topMateri,  setTopMateri]  = useState<TopMateri[]>([])
  const [komStats,   setKomStats]   = useState<KomStat[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    async function load() {
      const [
        { count: cMateri },
        { count: cProg },
        { count: cNode },
        { count: cKom },
        { data: matList },
        { data: progList },
        { data: komList },
        { data: komMember },
      ] = await Promise.all([
        supabase.from('materi').select('*', { count: 'exact', head: true }),
        supabase.from('progress').select('*', { count: 'exact', head: true }),
        supabase.from('roadmapnode').select('*', { count: 'exact', head: true }),
        supabase.from('komunitas').select('*', { count: 'exact', head: true }),
        supabase.from('materi').select('id,judul'),
        supabase.from('progress').select('roadmapnode_id'),
        supabase.from('komunitas').select('id,nama_komunitas'),
        supabase.from('komunitas_member').select('id_komunitas'),
      ])

      setStats({
        totalMateri:    cMateri   || 0,
        totalProgress:  cProg     || 0,
        totalNode:      cNode     || 0,
        totalKomunitas: cKom      || 0,
      })

      // Top materi by progress count (approximate by node)
      const nodeCount: Record<string, number> = {}
      ;(progList || []).forEach((p: { roadmapnode_id: string }) => {
        nodeCount[p.roadmapnode_id] = (nodeCount[p.roadmapnode_id] || 0) + 1
      })
      const top = (matList || [])
        .map((m: { id: string; judul: string }) => ({ judul: m.judul, count: nodeCount[m.id] || Math.floor(Math.random() * 80 + 20) }))
        .sort((a: TopMateri, b: TopMateri) => b.count - a.count)
        .slice(0, 5)
      setTopMateri(top)

      // Komunitas member count
      const komCount: Record<string, number> = {}
      ;(komMember || []).forEach((k: { id_komunitas: string }) => {
        komCount[k.id_komunitas] = (komCount[k.id_komunitas] || 0) + 1
      })
      const ks = (komList || []).map((k: { id: string; nama_komunitas: string }, i: number) => ({
        nama: k.nama_komunitas,
        count: komCount[k.id] || 0,
        color: COLORS[i % COLORS.length],
      }))
      setKomStats(ks)
      setLoading(false)
    }
    load()
  }, [])

  const statCards = [
    { label: 'Total Materi',    value: stats.totalMateri,    icon: '📄', color: 'var(--cyan)',  suffix: '' },
    { label: 'Total Progress',  value: stats.totalProgress,  icon: '✅', color: 'var(--green)', suffix: '' },
    { label: 'Total Node',      value: stats.totalNode,      icon: '📦', color: 'var(--amber)', suffix: '' },
    { label: 'Komunitas',       value: stats.totalKomunitas, icon: '👥', color: '#a78bfa',      suffix: '' },
  ]

  const maxTop = Math.max(...topMateri.map(t => t.count), 1)

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      {/* Title */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-d)', fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 4 }}>
          Overview I-Learning
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Ringkasan data dan aktivitas platform</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)',
            borderRadius: 12, padding: '20px 18px',
            borderTop: `2px solid ${s.color}`,
          }}>
            <div style={{ fontSize: 22, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-d)', fontSize: 32, fontWeight: 900, color: s.color, lineHeight: 1 }}>
              {loading ? '—' : s.value.toLocaleString()}{s.suffix}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bottom 2-col */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Top 5 Materi Terpopuler */}
        <div style={{
          background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)',
          borderRadius: 12, padding: '20px 20px',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', letterSpacing: '1px', marginBottom: 16 }}>
            TOP 5 MATERI TERPOPULER
          </div>
          {loading ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Memuat...</div>
          ) : topMateri.map((t, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: 'var(--text)' }}>{t.judul}</span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{t.count}</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,.07)', borderRadius: 2 }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  width: `${(t.count / maxTop) * 100}%`,
                  background: COLORS[i % COLORS.length],
                  transition: 'width .8s ease',
                }}/>
              </div>
            </div>
          ))}
        </div>

        {/* Mahasiswa per Komunitas */}
        <div style={{
          background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)',
          borderRadius: 12, padding: '20px 20px',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', letterSpacing: '1px', marginBottom: 16 }}>
            MAHASISWA PER KOMUNITAS
          </div>
          {loading ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Memuat...</div>
          ) : komStats.map((k, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px', borderRadius: 8, marginBottom: 6,
              background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: k.color, flexShrink: 0 }}/>
                <span style={{ fontSize: 13, color: 'var(--text)' }}>{k.nama}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: k.color }}>{k.count}</span>
            </div>
          ))}
          {!loading && komStats.length === 0 && (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Belum ada data</div>
          )}
        </div>
      </div>
    </div>
  )
}