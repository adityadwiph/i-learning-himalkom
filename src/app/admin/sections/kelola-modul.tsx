'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

interface LP     { id: string; 'Nama Learning Path': string }
interface Node   { id: string; judul: string; urutan: number; learningpath_id: string }
interface Materi { id: string; judul: string; konten: string; tipe: string; video_url: string; urutan: number; section_title: string; roadmapnode_id: string }

const EMPTY_NODE   = { id: '', judul: '', urutan: 1, learningpath_id: '' }
const EMPTY_MATERI = { id: '', judul: '', konten: '', tipe: 'text', video_url: '', urutan: 1, section_title: '', roadmapnode_id: '' }

export default function KelolModulPage() {
  const [lps,        setLps]        = useState<LP[]>([])
  const [nodes,      setNodes]      = useState<Node[]>([])
  const [materiList, setMateriList] = useState<Materi[]>([])
  const [selLP,      setSelLP]      = useState('')
  const [selNode,    setSelNode]    = useState('')
  const [tab,        setTab]        = useState<'node'|'materi'>('node')
  const [modal,      setModal]      = useState<'node'|'materi'|null>(null)
  const [formNode,   setFormNode]   = useState(EMPTY_NODE)
  const [formMat,    setFormMat]    = useState(EMPTY_MATERI)
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState('')

  const load = useCallback(async () => {
    const [{ data: lpd }, { data: nd }, { data: mat }] = await Promise.all([
      supabase.from('learningpath').select('*').order('id'),
      supabase.from('roadmapnode').select('*').order('urutan'),
      supabase.from('materi').select('*').order('urutan'),
    ])
    setLps(lpd || [])
    setNodes(nd || [])
    setMateriList(mat || [])
  }, [])

  useEffect(() => { load() }, [load])

  async function saveNode() {
    setSaving(true)
    const p = { judul: formNode.judul, urutan: formNode.urutan, learningpath_id: formNode.learningpath_id }
    formNode.id
      ? await supabase.from('roadmapnode').update(p).eq('id', formNode.id)
      : await supabase.from('roadmapnode').insert(p)
    await load(); setModal(null); setFormNode(EMPTY_NODE); setSaving(false)
  }

  async function saveMateri() {
    setSaving(true)
    const p = { judul: formMat.judul, konten: formMat.konten, tipe: formMat.tipe, video_url: formMat.video_url, urutan: formMat.urutan, section_title: formMat.section_title, roadmapnode_id: formMat.roadmapnode_id }
    formMat.id
      ? await supabase.from('materi').update(p).eq('id', formMat.id)
      : await supabase.from('materi').insert(p)
    await load(); setModal(null); setFormMat(EMPTY_MATERI); setSaving(false)
  }

  async function del(table: string, id: string) {
    if (!confirm('Hapus data ini?')) return
    setDeleting(id)
    await supabase.from(table).delete().eq('id', id)
    await load(); setDeleting('')
  }

  const filteredNodes  = selLP   ? nodes.filter(n => n.learningpath_id === selLP) : nodes
  const filteredMateri = selNode ? materiList.filter(m => m.roadmapnode_id === selNode)
                                 : selLP ? materiList.filter(m => {
                                   const node = nodes.find(n => n.learningpath_id === selLP && n.id === m.roadmapnode_id)
                                   return !!node
                                 })
                                         : materiList

  const lpName   = (id: string) => lps.find(l => l.id === id)?.['Nama Learning Path'] || '—'
  const nodeName = (id: string) => nodes.find(n => n.id === id)?.judul || '—'

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
    background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)',
    color: 'var(--text)', fontFamily: 'var(--font-b)', outline: 'none', marginBottom: 10,
  } as React.CSSProperties

  const thStyle = {
    padding: '10px 14px', fontSize: 10, color: 'var(--muted)', textAlign: 'left' as const,
    letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,.06)', fontWeight: 600,
  }
  const tdStyle = {
    padding: '11px 14px', fontSize: 13, color: 'var(--text)',
    borderBottom: '1px solid rgba(255,255,255,.04)', verticalAlign: 'middle' as const,
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-d)', fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Kelola Modul</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Manajemen node dan materi pembelajaran</p>
        </div>
        <button
          onClick={() => { tab === 'node' ? (setFormNode(EMPTY_NODE), setModal('node')) : (setFormMat(EMPTY_MATERI), setModal('materi')) }}
          style={{
            padding: '9px 18px', background: 'var(--cyan)', color: '#060a12',
            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--font-b)',
          }}
        >+ Tambah {tab === 'node' ? 'Modul' : 'Materi'}</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,.06)', marginBottom: 20 }}>
        {(['node', 'materi'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); if(t === 'materi' && !selLP) setSelNode('') }} style={{
            padding: '8px 20px', fontSize: 13, fontWeight: tab === t ? 600 : 400,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: tab === t ? 'var(--cyan)' : 'var(--muted)',
            borderBottom: tab === t ? '2px solid var(--cyan)' : '2px solid transparent',
            marginBottom: -1, fontFamily: 'var(--font-b)',
          }}>{t === 'node' ? 'Modul / Node' : 'Materi'}</button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <select value={selLP} onChange={e => { 
          const val = e.target.value
          setSelLP(val)
          setSelNode('')
          setTab('materi')
        }}
          style={{ ...inputStyle, width: 'auto', marginBottom: 0, minWidth: 200 }}>
          <option value="">Semua Learning Path</option>
          {lps.map(l => <option key={l.id} value={l.id}>{l['Nama Learning Path']}</option>)}
        </select>
        <select value={selNode} onChange={e => setSelNode(e.target.value)}
          disabled={tab === 'node'}
          style={{ ...inputStyle, width: 'auto', marginBottom: 0, minWidth: 200, opacity: tab === 'node' ? 0.5 : 1, cursor: tab === 'node' ? 'not-allowed' : 'pointer' }}>
          <option value="">Semua Modul</option>
          {(selLP ? nodes.filter(n => n.learningpath_id === selLP) : nodes).map(n => (
            <option key={n.id} value={n.id}>Modul {n.urutan} — {n.judul}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'rgba(0,0,0,.2)' }}>
            {tab === 'node' ? (
              <tr>
                <th style={thStyle}>NO</th>
                <th style={thStyle}>JUDUL MODUL</th>
                <th style={thStyle}>LEARNING PATH</th>
                <th style={thStyle}>MATERI</th>
                <th style={thStyle}>AKSI</th>
              </tr>
            ) : (
              <tr>
                <th style={thStyle}>NO</th>
                <th style={thStyle}>JUDUL MATERI</th>
                <th style={thStyle}>SECTION</th>
                <th style={thStyle}>MODUL</th>
                <th style={thStyle}>TIPE</th>
                <th style={thStyle}>AKSI</th>
              </tr>
            )}
          </thead>
          <tbody key={`${tab}-${selLP}-${selNode}`}>
            {tab === 'node' ? filteredNodes.map(n => (
              <tr key={n.id} style={{ transition: 'background .1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ ...tdStyle, color: 'var(--muted)', width: 48 }}>{n.urutan}</td>
                <td style={tdStyle}><span style={{ fontWeight: 600 }}>{n.judul}</span></td>
                <td style={{ ...tdStyle, color: 'var(--muted)' }}>{lpName(n.learningpath_id)}</td>
                <td style={{ ...tdStyle, color: 'var(--muted)' }}>
                  {materiList.filter(m => m.roadmapnode_id === n.id).length} materi
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setFormNode(n); setModal('node') }}
                      style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', background: 'rgba(0,200,255,.08)', border: '1px solid rgba(0,200,255,.2)', color: 'var(--cyan)', fontFamily: 'var(--font-b)' }}>Edit</button>
                    <button onClick={() => del('roadmapnode', n.id)} disabled={deleting === n.id}
                      style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#f87171', fontFamily: 'var(--font-b)' }}>Hapus</button>
                  </div>
                </td>
              </tr>
            )) : filteredMateri.map(m => (
              <tr key={m.id} style={{ transition: 'background .1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ ...tdStyle, color: 'var(--muted)', width: 48 }}>{m.urutan}</td>
                <td style={tdStyle}><span style={{ fontWeight: 600 }}>{m.judul}</span></td>
                <td style={{ ...tdStyle, color: 'var(--muted)', fontSize: 12 }}>{m.section_title || '—'}</td>
                <td style={{ ...tdStyle, color: 'var(--muted)' }}>{nodeName(m.roadmapnode_id)}</td>
                <td style={tdStyle}>
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 20,
                    background: m.tipe === 'video' ? 'rgba(251,191,36,.1)' : 'rgba(0,200,255,.1)',
                    color: m.tipe === 'video' ? 'var(--amber)' : 'var(--cyan)',
                    border: `1px solid ${m.tipe === 'video' ? 'rgba(251,191,36,.25)' : 'rgba(0,200,255,.25)'}`,
                  }}>{m.tipe}</span>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setFormMat(m); setModal('materi') }}
                      style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', background: 'rgba(0,200,255,.08)', border: '1px solid rgba(0,200,255,.2)', color: 'var(--cyan)', fontFamily: 'var(--font-b)' }}>Edit</button>
                    <button onClick={() => del('materi', m.id)} disabled={deleting === m.id}
                      style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#f87171', fontFamily: 'var(--font-b)' }}>Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
            {(tab === 'node' ? filteredNodes : filteredMateri).length === 0 && (
              <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: 'var(--muted)', padding: 48 }}>Belum ada data</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div style={{ background: '#0d1420', border: '1px solid rgba(0,200,255,.2)', borderRadius: 16, padding: '28px', width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>

            {modal === 'node' && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>{formNode.id ? 'Edit' : 'Tambah'} Modul</h3>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>LEARNING PATH</label>
                <select style={inputStyle} value={formNode.learningpath_id} onChange={e => setFormNode(p => ({ ...p, learningpath_id: e.target.value }))}>
                  <option value="">Pilih Learning Path</option>
                  {lps.map(l => <option key={l.id} value={l.id}>{l['Nama Learning Path']}</option>)}
                </select>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>JUDUL MODUL</label>
                <input style={inputStyle} value={formNode.judul} onChange={e => setFormNode(p => ({ ...p, judul: e.target.value }))} placeholder="Contoh: Basic Networking" />
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>URUTAN</label>
                <input style={inputStyle} type="number" min={1} value={formNode.urutan} onChange={e => setFormNode(p => ({ ...p, urutan: parseInt(e.target.value) || 1 }))} />
              </>
            )}

            {modal === 'materi' && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>{formMat.id ? 'Edit' : 'Tambah'} Materi</h3>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>MODUL</label>
                <select style={inputStyle} value={formMat.roadmapnode_id} onChange={e => setFormMat(p => ({ ...p, roadmapnode_id: e.target.value }))}>
                  <option value="">Pilih Modul</option>
                  {nodes.map(n => <option key={n.id} value={n.id}>Modul {n.urutan} — {n.judul}</option>)}
                </select>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>SECTION TITLE</label>
                <input style={inputStyle} value={formMat.section_title} onChange={e => setFormMat(p => ({ ...p, section_title: e.target.value }))} placeholder="Contoh: Introduction to Networking - Part 1" />
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>JUDUL MATERI</label>
                <input style={inputStyle} value={formMat.judul} onChange={e => setFormMat(p => ({ ...p, judul: e.target.value }))} placeholder="Contoh: OSI Model" />
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>TIPE</label>
                <select style={inputStyle} value={formMat.tipe} onChange={e => setFormMat(p => ({ ...p, tipe: e.target.value }))}>
                  <option value="text">text</option>
                  <option value="video">video</option>
                </select>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>KONTEN</label>
                <textarea style={{ ...inputStyle, height: 120, resize: 'vertical' }} value={formMat.konten} onChange={e => setFormMat(p => ({ ...p, konten: e.target.value }))} placeholder="Isi materi..." />
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>VIDEO URL</label>
                <input style={inputStyle} value={formMat.video_url} onChange={e => setFormMat(p => ({ ...p, video_url: e.target.value }))} placeholder="https://www.youtube.com/watch?v=..." />
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>URUTAN</label>
                <input style={inputStyle} type="number" min={1} value={formMat.urutan} onChange={e => setFormMat(p => ({ ...p, urutan: parseInt(e.target.value) || 1 }))} />
              </>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,.1)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-b)', fontSize: 13 }}>Batal</button>
              <button onClick={modal === 'node' ? saveNode : saveMateri} disabled={saving}
                style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'var(--cyan)', border: 'none', color: '#060a12', cursor: 'pointer', fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 700 }}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}