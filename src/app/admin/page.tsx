'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Navbar from '@/components/ui/navbar'

interface Profile   { username: string; role: string }
interface LP        { id: string; 'Nama Learning Path': string; deskripsi: string }
interface Node      { id: string; judul: string; urutan: number; learningpath_id: string }
interface Materi    { id: string; judul: string; konten: string; tipe: string; video_url: string; urutan: number; section_title: string; roadmapnode_id: string; resources?: { title: string; url: string }[] }
interface Komunitas { id: string; nama_komunitas: string; deskripsi_komunitas: string }
interface KomLP     { komunitas_id: string; Learning_Path_id: string }

type View  = 'dashboard' | 'learning-paths' | 'nodes' | 'materi' | 'komunitas'
type Modal = 'lp' | 'node' | 'materi' | 'komunitas' | 'relasi' | null

const EMPTY_LP: LP = { id: '', 'Nama Learning Path': '', deskripsi: '' }
const EMPTY_NODE: Node = { id: '', judul: '', urutan: 1, learningpath_id: '' }
const EMPTY_MATERI: Materi = { id: '', judul: '', konten: '', tipe: 'text', video_url: '', urutan: 1, section_title: '', roadmapnode_id: '', resources: [] }
const EMPTY_KOM: Komunitas = { id: '', nama_komunitas: '', deskripsi_komunitas: '' }

function normalizeResources(value: unknown): { title: string; url: string }[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .filter(item => item && typeof item === 'object')
      .map(item => ({
        title: String((item as any).title || ''),
        url: String((item as any).url || ''),
      }))
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return normalizeResources(parsed)
    } catch {
      return []
    }
  }
  if (typeof value === 'object' && value !== null) {
    const item = value as Record<string, any>
    if ('title' in item || 'url' in item) {
      return [{ title: String(item.title || ''), url: String(item.url || '') }]
    }
    const values = Object.values(item)
    if (values.length > 0) return normalizeResources(values)
  }
  return []
}

export default function AdminPage() {
  const router = useRouter()
  const [profile,    setProfile]    = useState<Profile | null>(null)
  const [view,       setView]       = useState<View>('dashboard')
  const [loading,    setLoading]    = useState(true)

  const [lps,        setLps]        = useState<LP[]>([])
  const [nodes,      setNodes]      = useState<Node[]>([])
  const [materiList, setMateriList] = useState<Materi[]>([])
  const [komunitas,  setKomunitas]  = useState<Komunitas[]>([])
  const [komLPs,     setKomLPs]     = useState<KomLP[]>([])

  const [selLP,      setSelLP]      = useState('')
  const [selNode,    setSelNode]    = useState('')

  const [modal,      setModal]      = useState<Modal>(null)
  const [formLP,     setFormLP]     = useState(EMPTY_LP)
  const [formNode,   setFormNode]   = useState(EMPTY_NODE)
  const [formMateri, setFormMateri] = useState(EMPTY_MATERI)
  const [formKom,    setFormKom]    = useState(EMPTY_KOM)
  const [selKom,     setSelKom]     = useState<Komunitas | null>(null)
  const [selLPId,    setSelLPId]    = useState('')
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState('')

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('username,role').eq('id', user.id).single()
    if (!prof || prof.role !== 'admin') { router.push('/dashboard'); return }
    setProfile(prof)

    const [{ data: lpd }, { data: nd }, { data: mat }, { data: kom }, { data: kl }] = await Promise.all([
      supabase.from('learningpath').select('*').order('id'),
      supabase.from('roadmapnode').select('*').order('urutan'),
      supabase.from('materi').select('*').order('urutan'),
      supabase.from('komunitas').select('*').order('nama_komunitas'),
      supabase.from('komunitas_learningpath').select('*'),
    ])
    setLps(lpd || [])
    setNodes(nd || [])
    setMateriList((mat || []).map((item: any) => ({ ...item, resources: normalizeResources(item.resources) })))
    setKomunitas(kom || [])
    setKomLPs(kl || [])
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  const stats = [
    { label: 'Learning Path', value: lps.length,        icon: '🗺️', color: 'var(--cyan)'  },
    { label: 'Modul',         value: nodes.length,       icon: '📦', color: 'var(--green)' },
    { label: 'Materi',        value: materiList.length,  icon: '📄', color: 'var(--amber)' },
    { label: 'Komunitas',     value: komunitas.length,   icon: '👥', color: '#a78bfa'      },
  ]

  async function saveLP() {
    setSaving(true)
    const p = { 'Nama Learning Path': formLP['Nama Learning Path'], deskripsi: formLP.deskripsi }
    formLP.id ? await supabase.from('learningpath').update(p).eq('id', formLP.id)
              : await supabase.from('learningpath').insert(p)
    await load(); setModal(null); setFormLP(EMPTY_LP); setSaving(false)
  }

  async function saveNode() {
    setSaving(true)
    const p = { judul: formNode.judul, urutan: formNode.urutan, learningpath_id: formNode.learningpath_id }
    formNode.id ? await supabase.from('roadmapnode').update(p).eq('id', formNode.id)
                : await supabase.from('roadmapnode').insert(p)
    await load(); setModal(null); setFormNode(EMPTY_NODE); setSaving(false)
  }

  async function saveMateri() {
    setSaving(true)
    const p = {
      judul: formMateri.judul,
      konten: formMateri.konten,
      tipe: formMateri.tipe,
      video_url: formMateri.video_url,
      urutan: formMateri.urutan,
      section_title: formMateri.section_title,
      roadmapnode_id: formMateri.roadmapnode_id,
      resources: normalizeResources(formMateri.resources),
    }
    formMateri.id ? await supabase.from('materi').update(p).eq('id', formMateri.id)
                  : await supabase.from('materi').insert(p)
    await load(); setModal(null); setFormMateri(EMPTY_MATERI); setSaving(false)
  }

  async function saveKomunitas() {
    setSaving(true)
    const p = { nama_komunitas: formKom.nama_komunitas, deskripsi_komunitas: formKom.deskripsi_komunitas }
    formKom.id ? await supabase.from('komunitas').update(p).eq('id', formKom.id)
               : await supabase.from('komunitas').insert(p)
    await load(); setModal(null); setFormKom(EMPTY_KOM); setSaving(false)
  }

  async function addRelasi() {
    if (!selKom || !selLPId) return
    setSaving(true)
    const exists = komLPs.find(k => k.komunitas_id === selKom.id && k.Learning_Path_id === selLPId)
    if (!exists) {
      await supabase.from('komunitas_learningpath').insert({ komunitas_id: selKom.id, Learning_Path_id: selLPId })
    }
    await load(); setSelLPId(''); setSaving(false)
  }

  async function removeRelasi(komunitas_id: string, lp_id: string) {
    const key = komunitas_id + lp_id
    setDeleting(key)
    await supabase.from('komunitas_learningpath').delete().eq('komunitas_id', komunitas_id).eq('Learning_Path_id', lp_id)
    await load(); setDeleting('')
  }

  async function deleteRow(table: string, id: string) {
    if (!confirm('Yakin hapus data ini?')) return
    setDeleting(id)

    if (table === 'learningpath') {
      // Hapus relasi komunitas dulu
      await supabase.from('komunitas_learningpath').delete().eq('Learning_Path_id', id)
      // Hapus materi dari semua node LP ini
      const nodeIds = nodes.filter(n => n.learningpath_id === id).map(n => n.id)
      if (nodeIds.length > 0) {
        await supabase.from('materi').delete().in('roadmapnode_id', nodeIds)
        await supabase.from('progress').delete().in('roadmapnode_id', nodeIds)
        await supabase.from('roadmapnode').delete().eq('learningpath_id', id)
      }
    }

    if (table === 'roadmapnode') {
      // Hapus materi & progress dari node ini dulu
      await supabase.from('materi').delete().eq('roadmapnode_id', id)
      await supabase.from('progress').delete().eq('roadmapnode_id', id)
    }

    if (table === 'komunitas') {
      await supabase.from('komunitas_learningpath').delete().eq('komunitas_id', id)
    }

    await supabase.from(table).delete().eq('id', id)
    await load(); setDeleting('')
  }

  const filteredNodes  = selLP   ? nodes.filter(n => n.learningpath_id === selLP) : nodes
  const filteredMateri = selNode ? materiList.filter(m => m.roadmapnode_id === selNode) : materiList
  const lpName         = (id: string) => lps.find(l => l.id === id)?.['Nama Learning Path'] || '-'
  const nodeName       = (id: string) => nodes.find(n => n.id === id)?.judul || '-'
  const getLPsForKom   = (komId: string) => komLPs.filter(kl => kl.komunitas_id === komId).map(kl => lps.find(l => l.id === kl.Learning_Path_id)).filter(Boolean) as LP[]
  const getUnlinkedLPs = (komId: string) => { const linked = new Set(komLPs.filter(kl => kl.komunitas_id === komId).map(kl => kl.Learning_Path_id)); return lps.filter(l => !linked.has(l.id)) }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
      Memuat admin panel...
    </div>
  )

  const sideItem = (v: View) => ({
    padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
    fontWeight: view === v ? 600 : 400,
    color: view === v ? 'var(--cyan)' : 'var(--muted)',
    background: view === v ? 'var(--cyan-10)' : 'transparent',
    border: view === v ? '1px solid var(--cyan-20)' : '1px solid transparent',
    display: 'flex', alignItems: 'center', gap: 8, transition: 'all .15s',
  } as React.CSSProperties)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
    background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--text)', fontFamily: 'var(--font-b)', outline: 'none', marginBottom: 10,
  }
  const formResources = normalizeResources(formMateri.resources)
  const labelStyle: React.CSSProperties = { fontSize: 11, color: 'var(--muted)', marginBottom: 4, display: 'block', letterSpacing: '0.5px' }
  const thStyle: React.CSSProperties    = { padding: '10px 14px', fontSize: 11, color: 'var(--muted)', textAlign: 'left', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)', fontWeight: 600 }
  const tdStyle: React.CSSProperties    = { padding: '11px 14px', fontSize: 13, color: 'var(--text)', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar username={profile?.username} />

      <div style={{ display: 'flex', maxWidth: 1200, margin: '0 auto', padding: '32px 24px', gap: 24 }}>

        {/* Sidebar */}
        <aside style={{ width: 200, flexShrink: 0, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, height: 'fit-content', position: 'sticky', top: 24 }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '1px', marginBottom: 12, padding: '0 4px' }}>ADMIN PANEL</div>
          {([
            ['dashboard',      '📊', 'Dashboard'],
            ['learning-paths', '🗺️', 'Learning Path'],
            ['nodes',          '📦', 'Modul'],
            ['materi',         '📄', 'Materi'],
            ['komunitas',      '👥', 'Komunitas'],
          ] as [View, string, string][]).map(([v, icon, label]) => (
            <div key={v} style={sideItem(v)} onClick={() => setView(v)}>
              <span>{icon}</span> {label}
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 12 }}>
            <div 
              onClick={() => router.push('/dashboard')} 
              style={{ 
                ...sideItem('kembali' as any), 
                color: 'var(--muted)',
                background: 'var(--bg3)', /* Memberikan warna background permanen, bisa diganti misal 'rgba(255,255,255,0.05)' */
                border: '1px solid var(--border)' /* Memberikan garis tepi permanen */
              }}
            >
              ← Kembali
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, minWidth: 0 }}>

          {/* Dashboard */}
          {view === 'dashboard' && (
            <div>
              <h1 style={{ fontFamily: 'var(--font-d)', fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 6 }}>Admin Dashboard</h1>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 28 }}>Selamat datang, {profile?.username}.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
                {stats.map(s => (
                  <div key={s.label} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 18px' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: s.color, fontFamily: 'var(--font-d)' }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {([
                  ['learning-paths', '🗺️', 'Kelola Learning Path', 'Tambah, edit, hapus jalur belajar'],
                  ['nodes',          '📦', 'Kelola Modul',         'Atur urutan dan konten modul'],
                  ['materi',         '📄', 'Kelola Materi',        'Upload konten teks dan video'],
                  ['komunitas',      '👥', 'Kelola Komunitas',     'Atur komunitas & learning path-nya'],
                ] as [View, string, string, string][]).map(([v, icon, title, desc]) => (
                  <div key={v} onClick={() => setView(v)}
                    style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 18px', cursor: 'pointer', transition: 'border-color .2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--cyan-30)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learning Paths */}
          {view === 'learning-paths' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 22, fontWeight: 900, color: '#fff' }}>Learning Path</h2>
                <button className="btn-primary" style={{ fontSize: 12, padding: '8px 16px' }} onClick={() => { setFormLP(EMPTY_LP); setModal('lp') }}>+ Tambah</button>
              </div>
              <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={thStyle}>Nama Learning Path</th><th style={thStyle}>Deskripsi</th><th style={thStyle}>Aksi</th></tr></thead>
                  <tbody>
                    {lps.map(lp => (
                      <tr key={lp.id}>
                        <td style={tdStyle}><span style={{ fontWeight: 600 }}>{lp['Nama Learning Path']}</span></td>
                        <td style={{ ...tdStyle, color: 'var(--muted)', maxWidth: 300 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lp.deskripsi || '-'}</div></td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => { setFormLP(lp); setModal('lp') }}>Edit</button>
                            <button style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#f87171', opacity: deleting === lp.id ? .5 : 1 }} onClick={() => deleteRow('learningpath', lp.id)}>Hapus</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {lps.length === 0 && <tr><td colSpan={3} style={{ ...tdStyle, textAlign: 'center', color: 'var(--muted)', padding: 40 }}>Belum ada data</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Nodes */}
          {view === 'nodes' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 22, fontWeight: 900, color: '#fff' }}>Modul</h2>
                <button className="btn-primary" style={{ fontSize: 12, padding: '8px 16px' }} onClick={() => { setFormNode(EMPTY_NODE); setModal('node') }}>+ Tambah</button>
              </div>
              <select value={selLP} onChange={e => setSelLP(e.target.value)} style={{ ...inputStyle, width: 'auto', marginBottom: 16, minWidth: 240 }}>
                <option value="">Semua Learning Path</option>
                {lps.map(l => <option key={l.id} value={l.id}>{l['Nama Learning Path']}</option>)}
              </select>
              <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={thStyle}>No</th><th style={thStyle}>Judul Modul</th><th style={thStyle}>Learning Path</th><th style={thStyle}>Aksi</th></tr></thead>
                  <tbody>
                    {filteredNodes.map(n => (
                      <tr key={n.id}>
                        <td style={{ ...tdStyle, color: 'var(--muted)', width: 40 }}>{n.urutan}</td>
                        <td style={tdStyle}><span style={{ fontWeight: 600 }}>{n.judul}</span></td>
                        <td style={{ ...tdStyle, color: 'var(--muted)' }}>{lpName(n.learningpath_id)}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => { setFormNode(n); setModal('node') }}>Edit</button>
                            <button style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#f87171', opacity: deleting === n.id ? .5 : 1 }} onClick={() => deleteRow('roadmapnode', n.id)}>Hapus</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredNodes.length === 0 && <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: 'var(--muted)', padding: 40 }}>Belum ada data</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Materi */}
          {view === 'materi' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 22, fontWeight: 900, color: '#fff' }}>Materi</h2>
                <button className="btn-primary" style={{ fontSize: 12, padding: '8px 16px' }} onClick={() => { setFormMateri(EMPTY_MATERI); setModal('materi') }}>+ Tambah</button>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <select value={selLP} onChange={e => { setSelLP(e.target.value); setSelNode('') }} style={{ ...inputStyle, width: 'auto', marginBottom: 0, minWidth: 200 }}>
                  <option value="">Semua Learning Path</option>
                  {lps.map(l => <option key={l.id} value={l.id}>{l['Nama Learning Path']}</option>)}
                </select>
                <select value={selNode} onChange={e => setSelNode(e.target.value)} style={{ ...inputStyle, width: 'auto', marginBottom: 0, minWidth: 200 }}>
                  <option value="">Semua Modul</option>
                  {(selLP ? nodes.filter(n => n.learningpath_id === selLP) : nodes).map(n => (
                    <option key={n.id} value={n.id}>Modul {n.urutan} — {n.judul}</option>
                  ))}
                </select>
              </div>
              <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={thStyle}>No</th><th style={thStyle}>Judul</th><th style={thStyle}>Section</th><th style={thStyle}>Modul</th><th style={thStyle}>Resources</th><th style={thStyle}>Tipe</th><th style={thStyle}>Aksi</th></tr></thead>
                  <tbody>
                    {filteredMateri.map(m => (
                      <tr key={m.id}>
                        <td style={{ ...tdStyle, color: 'var(--muted)', width: 40 }}>{m.urutan}</td>
                        <td style={tdStyle}><span style={{ fontWeight: 600 }}>{m.judul}</span></td>
                        <td style={{ ...tdStyle, color: 'var(--muted)' }}>{m.section_title || '-'}</td>
                        <td style={{ ...tdStyle, color: 'var(--muted)' }}>{nodeName(m.roadmapnode_id)}</td>
                        <td style={{ ...tdStyle, color: 'var(--muted)' }}>{m.resources?.length ?? 0} link</td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: m.tipe === 'video' ? 'rgba(251,191,36,.1)' : 'var(--cyan-10)', color: m.tipe === 'video' ? 'var(--amber)' : 'var(--cyan)', border: `1px solid ${m.tipe === 'video' ? 'rgba(251,191,36,.3)' : 'var(--cyan-20)'}` }}>{m.tipe}</span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => { setFormMateri({ ...m, resources: normalizeResources(m.resources) }); setModal('materi') }}>Edit</button>
                            <button style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#f87171', opacity: deleting === m.id ? .5 : 1 }} onClick={() => deleteRow('materi', m.id)}>Hapus</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredMateri.length === 0 && <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: 'var(--muted)', padding: 40 }}>Belum ada data</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Komunitas */}
          {view === 'komunitas' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 22, fontWeight: 900, color: '#fff' }}>Komunitas</h2>
                <button className="btn-primary" style={{ fontSize: 12, padding: '8px 16px' }} onClick={() => { setFormKom(EMPTY_KOM); setModal('komunitas') }}>+ Tambah</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {komunitas.map(k => {
                  const linkedLPs = getLPsForKom(k.id)
                  return (
                    <div key={k.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{k.nama_komunitas}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{k.deskripsi_komunitas || 'Tidak ada deskripsi'}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 16 }}>
                          <button
                            onClick={() => { setSelKom(k); setSelLPId(''); setModal('relasi') }}
                            style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', background: 'rgba(167,139,250,.1)', border: '1px solid rgba(167,139,250,.25)', color: '#a78bfa', fontFamily: 'var(--font-b)', fontWeight: 600 }}>
                            + LP
                          </button>
                          <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => { setFormKom(k); setModal('komunitas') }}>Edit</button>
                          <button style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#f87171', opacity: deleting === k.id ? .5 : 1 }} onClick={() => deleteRow('komunitas', k.id)}>Hapus</button>
                        </div>
                      </div>
                      {/* Linked LP tags */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {linkedLPs.length === 0
                          ? <span style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>Belum ada learning path — klik "+ LP"</span>
                          : linkedLPs.map(lp => (
                            <div key={lp.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: 'var(--cyan-10)', border: '1px solid var(--cyan-20)', fontSize: 11, color: 'var(--cyan)' }}>
                              {lp['Nama Learning Path']}
                              <button
                                onClick={() => removeRelasi(k.id, lp.id)}
                                disabled={deleting === k.id + lp.id}
                                style={{ background: 'none', border: 'none', color: 'rgba(0,200,255,.5)', cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1 }}>✕</button>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )
                })}
                {komunitas.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)', fontSize: 13 }}>Belum ada komunitas</div>}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border-c)', borderRadius: 16, padding: '28px 28px 24px', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>

            {modal === 'lp' && (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20 }}>{formLP.id ? 'Edit' : 'Tambah'} Learning Path</h3>
                <label style={labelStyle}>NAMA LEARNING PATH</label>
                <input style={inputStyle} value={formLP['Nama Learning Path']} onChange={e => setFormLP(p => ({ ...p, 'Nama Learning Path': e.target.value }))} placeholder="Contoh: Offensive Security" />
                <label style={labelStyle}>DESKRIPSI</label>
                <textarea style={{ ...inputStyle, height: 100, resize: 'vertical' }} value={formLP.deskripsi} onChange={e => setFormLP(p => ({ ...p, deskripsi: e.target.value }))} placeholder="Deskripsi singkat learning path..." />
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setModal(null)}>Batal</button>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={saveLP} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
              </>
            )}

            {modal === 'node' && (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20 }}>{formNode.id ? 'Edit' : 'Tambah'} Modul</h3>
                <label style={labelStyle}>LEARNING PATH</label>
                <select style={inputStyle} value={formNode.learningpath_id} onChange={e => setFormNode(p => ({ ...p, learningpath_id: e.target.value }))}>
                  <option value="">Pilih Learning Path</option>
                  {lps.map(l => <option key={l.id} value={l.id}>{l['Nama Learning Path']}</option>)}
                </select>
                <label style={labelStyle}>JUDUL MODUL</label>
                <input style={inputStyle} value={formNode.judul} onChange={e => setFormNode(p => ({ ...p, judul: e.target.value }))} placeholder="Contoh: Basic Networking" />
                <label style={labelStyle}>URUTAN</label>
                <input style={inputStyle} type="number" min={1} value={formNode.urutan} onChange={e => setFormNode(p => ({ ...p, urutan: parseInt(e.target.value) || 1 }))} />
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setModal(null)}>Batal</button>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={saveNode} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
              </>
            )}

            {modal === 'materi' && (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20 }}>{formMateri.id ? 'Edit' : 'Tambah'} Materi</h3>
                <label style={labelStyle}>MODUL</label>
                <select style={inputStyle} value={formMateri.roadmapnode_id} onChange={e => setFormMateri(p => ({ ...p, roadmapnode_id: e.target.value }))}>
                  <option value="">Pilih Modul</option>
                  {nodes.map(n => <option key={n.id} value={n.id}>Modul {n.urutan} — {n.judul}</option>)}
                </select>
                <label style={labelStyle}>SECTION TITLE</label>
                <input style={inputStyle} value={formMateri.section_title} onChange={e => setFormMateri(p => ({ ...p, section_title: e.target.value }))} placeholder="Contoh: Introduction to Networking - Part 1" />
                <label style={labelStyle}>JUDUL MATERI</label>
                <input style={inputStyle} value={formMateri.judul} onChange={e => setFormMateri(p => ({ ...p, judul: e.target.value }))} placeholder="Contoh: OSI Model" />
                <label style={labelStyle}>TIPE</label>
                <select style={inputStyle} value={formMateri.tipe} onChange={e => setFormMateri(p => ({ ...p, tipe: e.target.value }))}>
                  <option value="text">text</option>
                  <option value="video">video</option>
                </select>
                <label style={labelStyle}>KONTEN</label>
                <textarea style={{ ...inputStyle, height: 120, resize: 'vertical' }} value={formMateri.konten} onChange={e => setFormMateri(p => ({ ...p, konten: e.target.value }))} placeholder="Isi materi / penjelasan..." />
                <label style={labelStyle}>VIDEO URL (opsional)</label>
                <input style={inputStyle} value={formMateri.video_url} onChange={e => setFormMateri(p => ({ ...p, video_url: e.target.value }))} placeholder="https://www.youtube.com/watch?v=..." />
                <label style={labelStyle}>RESOURCES</label>
                {formResources.map((res, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 10 }}>
                    <div>
                      <input style={inputStyle} value={res.title} placeholder="Judul resource" onChange={e => setFormMateri(p => ({ ...p, resources: normalizeResources((p.resources || []).map((item, i) => i === idx ? { ...item, title: e.target.value } : item)) }))} />
                      <input style={inputStyle} value={res.url} placeholder="URL resource" onChange={e => setFormMateri(p => ({ ...p, resources: normalizeResources((p.resources || []).map((item, i) => i === idx ? { ...item, url: e.target.value } : item)) }))} />
                    </div>
                    <button onClick={() => setFormMateri(p => ({ ...p, resources: normalizeResources((p.resources || []).filter((_, i) => i !== idx)) }))}
                      style={{ padding: '9px 12px', borderRadius: 8, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', color: '#f87171', cursor: 'pointer', fontSize: 12, alignSelf: 'start' }}>
                      Hapus
                    </button>
                  </div>
                ))}
                <button onClick={() => setFormMateri(p => ({ ...p, resources: normalizeResources([ ...(p.resources || []), { title: '', url: '' } ]) }))}
                  style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(0,200,255,.08)', border: '1px solid rgba(0,200,255,.2)', color: 'var(--cyan)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                  + Tambah Resource
                </button>
                <label style={labelStyle}>URUTAN</label>
                <input style={inputStyle} type="number" min={1} value={formMateri.urutan} onChange={e => setFormMateri(p => ({ ...p, urutan: parseInt(e.target.value) || 1 }))} />
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setModal(null)}>Batal</button>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={saveMateri} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
              </>
            )}

            {modal === 'komunitas' && (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20 }}>{formKom.id ? 'Edit' : 'Tambah'} Komunitas</h3>
                <label style={labelStyle}>NAMA KOMUNITAS</label>
                <input style={inputStyle} value={formKom.nama_komunitas} onChange={e => setFormKom(p => ({ ...p, nama_komunitas: e.target.value }))} placeholder="Contoh: CSI" />
                <label style={labelStyle}>DESKRIPSI</label>
                <textarea style={{ ...inputStyle, height: 100, resize: 'vertical' }} value={formKom.deskripsi_komunitas} onChange={e => setFormKom(p => ({ ...p, deskripsi_komunitas: e.target.value }))} placeholder="Deskripsi komunitas..." />
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setModal(null)}>Batal</button>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={saveKomunitas} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
              </>
            )}

            {modal === 'relasi' && selKom && (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Kelola Learning Path</h3>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>Komunitas: <span style={{ color: '#a78bfa' }}>{selKom.nama_komunitas}</span></p>

                <label style={labelStyle}>TERHUBUNG</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16, minHeight: 32 }}>
                  {getLPsForKom(selKom.id).length === 0
                    ? <span style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>Belum ada</span>
                    : getLPsForKom(selKom.id).map(lp => (
                      <div key={lp.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'var(--cyan-10)', border: '1px solid var(--cyan-20)', fontSize: 11, color: 'var(--cyan)' }}>
                        {lp['Nama Learning Path']}
                        <button onClick={() => removeRelasi(selKom.id, lp.id)} disabled={deleting === selKom.id + lp.id}
                          style={{ background: 'none', border: 'none', color: 'rgba(0,200,255,.5)', cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1 }}>✕</button>
                      </div>
                    ))
                  }
                </div>

                <label style={labelStyle}>TAMBAH LEARNING PATH</label>
                {getUnlinkedLPs(selKom.id).length === 0
                  ? <p style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', marginBottom: 16 }}>Semua learning path sudah terhubung.</p>
                  : (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                      <select value={selLPId} onChange={e => setSelLPId(e.target.value)} style={{ ...inputStyle, flex: 1, marginBottom: 0 }}>
                        <option value="">Pilih Learning Path...</option>
                        {getUnlinkedLPs(selKom.id).map(lp => <option key={lp.id} value={lp.id}>{lp['Nama Learning Path']}</option>)}
                      </select>
                      <button onClick={addRelasi} disabled={!selLPId || saving}
                        style={{ padding: '9px 16px', borderRadius: 8, background: selLPId ? '#a78bfa' : 'rgba(255,255,255,.1)', border: 'none', color: selLPId ? '#060a12' : 'var(--muted)', cursor: selLPId ? 'pointer' : 'default', fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {saving ? '...' : '+ Tambah'}
                      </button>
                    </div>
                  )
                }
                <button onClick={() => setModal(null)} style={{ width: '100%', padding: '10px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-b)', fontSize: 13 }}>Tutup</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}