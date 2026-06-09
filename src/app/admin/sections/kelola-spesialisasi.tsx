'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

interface LP       { id: string; 'Nama Learning Path': string; deskripsi: string }
interface Komunitas { id: string; nama_komunitas: string; deskripsi_komunitas: string }

const EMPTY_LP  = { id: '', 'Nama Learning Path': '', deskripsi: '' }
const EMPTY_KOM = { id: '', nama_komunitas: '', deskripsi_komunitas: '' }

const COLORS = ['var(--cyan)', 'var(--green)', 'var(--amber)', '#a78bfa', '#f472b6', '#fb7185']

export default function KelolSpesPage() {
  const [lps,      setLps]      = useState<LP[]>([])
  const [komunitas,setKomunitas]= useState<Komunitas[]>([])
  const [nodeCount,setNodeCount]= useState<Record<string,number>>({})
  const [modal,    setModal]    = useState<'lp'|'kom'|null>(null)
  const [formLP,   setFormLP]   = useState(EMPTY_LP)
  const [formKom,  setFormKom]  = useState(EMPTY_KOM)
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState('')

  const load = useCallback(async () => {
    const [{ data: lpd }, { data: nd }, { data: kom }] = await Promise.all([
      supabase.from('learningpath').select('*').order('id'),
      supabase.from('roadmapnode').select('id,learningpath_id'),
      supabase.from('komunitas').select('*').order('nama_komunitas'),
    ])
    setLps(lpd || [])
    setKomunitas(kom || [])
    const nc: Record<string,number> = {}
    ;(nd || []).forEach((n: { learningpath_id: string }) => {
      nc[n.learningpath_id] = (nc[n.learningpath_id] || 0) + 1
    })
    setNodeCount(nc)
  }, [])

  useEffect(() => { load() }, [load])

  async function saveLP() {
    setSaving(true)
    const p = { 'Nama Learning Path': formLP['Nama Learning Path'], deskripsi: formLP.deskripsi }
    formLP.id ? await supabase.from('learningpath').update(p).eq('id', formLP.id)
              : await supabase.from('learningpath').insert(p)
    await load(); setModal(null); setFormLP(EMPTY_LP); setSaving(false)
  }

  async function saveKom() {
    setSaving(true)
    const p = { nama_komunitas: formKom.nama_komunitas, deskripsi_komunitas: formKom.deskripsi_komunitas }
    formKom.id ? await supabase.from('komunitas').update(p).eq('id', formKom.id)
               : await supabase.from('komunitas').insert(p)
    await load(); setModal(null); setFormKom(EMPTY_KOM); setSaving(false)
  }

  async function del(table: string, id: string) {
    if (!confirm('Hapus data ini?')) return
    setDeleting(id)
    await supabase.from(table).delete().eq('id', id)
    await load(); setDeleting('')
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
    background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)',
    color: 'var(--text)', fontFamily: 'var(--font-b)', outline: 'none', marginBottom: 10,
  } as React.CSSProperties

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-d)', fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Kelola Spesialisasi</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Manajemen learning path dan komunitas</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Learning Paths */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', letterSpacing: '1px' }}>LEARNING PATH</div>
            <button onClick={() => { setFormLP(EMPTY_LP); setModal('lp') }}
              style={{ padding: '6px 14px', background: 'var(--cyan)', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, color: '#060a12', cursor: 'pointer', fontFamily: 'var(--font-b)' }}>+ Tambah</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lps.map((lp, i) => (
              <div key={lp.id} style={{
                background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)',
                borderRadius: 12, padding: '16px 18px',
                borderLeft: `3px solid ${COLORS[i % COLORS.length]}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{lp['Nama Learning Path']}</div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 10 }}>
                    <button onClick={() => { setFormLP(lp); setModal('lp') }}
                      style={{ padding: '3px 8px', borderRadius: 5, fontSize: 10, cursor: 'pointer', background: 'rgba(0,200,255,.08)', border: '1px solid rgba(0,200,255,.2)', color: 'var(--cyan)', fontFamily: 'var(--font-b)' }}>Edit</button>
                    <button onClick={() => del('learningpath', lp.id)} disabled={deleting === lp.id}
                      style={{ padding: '3px 8px', borderRadius: 5, fontSize: 10, cursor: 'pointer', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#f87171', fontFamily: 'var(--font-b)' }}>Hapus</button>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.5 }}>
                  {lp.deskripsi || 'Tidak ada deskripsi'}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${COLORS[i % COLORS.length]}18`, color: COLORS[i % COLORS.length], border: `1px solid ${COLORS[i % COLORS.length]}30` }}>
                    {nodeCount[lp.id] || 0} modul
                  </span>
                </div>
              </div>
            ))}
            {lps.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13, padding: 20, textAlign: 'center' }}>Belum ada data</div>}
          </div>
        </div>

        {/* Komunitas */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', letterSpacing: '1px' }}>KOMUNITAS</div>
            <button onClick={() => { setFormKom(EMPTY_KOM); setModal('kom') }}
              style={{ padding: '6px 14px', background: '#a78bfa', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, color: '#060a12', cursor: 'pointer', fontFamily: 'var(--font-b)' }}>+ Tambah</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {komunitas.map((k, i) => (
              <div key={k.id} style={{
                background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)',
                borderRadius: 12, padding: '16px 18px',
                borderLeft: `3px solid ${COLORS[(i + 3) % COLORS.length]}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{k.nama_komunitas}</div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 10 }}>
                    <button onClick={() => { setFormKom(k); setModal('kom') }}
                      style={{ padding: '3px 8px', borderRadius: 5, fontSize: 10, cursor: 'pointer', background: 'rgba(167,139,250,.08)', border: '1px solid rgba(167,139,250,.2)', color: '#a78bfa', fontFamily: 'var(--font-b)' }}>Edit</button>
                    <button onClick={() => del('komunitas', k.id)} disabled={deleting === k.id}
                      style={{ padding: '3px 8px', borderRadius: 5, fontSize: 10, cursor: 'pointer', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#f87171', fontFamily: 'var(--font-b)' }}>Hapus</button>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                  {k.deskripsi_komunitas || 'Tidak ada deskripsi'}
                </div>
              </div>
            ))}
            {komunitas.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13, padding: 20, textAlign: 'center' }}>Belum ada data</div>}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div style={{ background: '#0d1420', border: '1px solid rgba(0,200,255,.2)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 460 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>
              {modal === 'lp' ? (formLP.id ? 'Edit' : 'Tambah') : (formKom.id ? 'Edit' : 'Tambah')} {modal === 'lp' ? 'Learning Path' : 'Komunitas'}
            </h3>
            {modal === 'lp' ? (
              <>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>NAMA LEARNING PATH</label>
                <input style={inputStyle} value={formLP['Nama Learning Path']} onChange={e => setFormLP(p => ({ ...p, 'Nama Learning Path': e.target.value }))} placeholder="Contoh: Offensive Security" />
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>DESKRIPSI</label>
                <textarea style={{ ...inputStyle, height: 90, resize: 'vertical' }} value={formLP.deskripsi} onChange={e => setFormLP(p => ({ ...p, deskripsi: e.target.value }))} placeholder="Deskripsi..." />
              </>
            ) : (
              <>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>NAMA KOMUNITAS</label>
                <input style={inputStyle} value={formKom.nama_komunitas} onChange={e => setFormKom(p => ({ ...p, nama_komunitas: e.target.value }))} placeholder="Contoh: CSI" />
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>DESKRIPSI</label>
                <textarea style={{ ...inputStyle, height: 90, resize: 'vertical' }} value={formKom.deskripsi_komunitas} onChange={e => setFormKom(p => ({ ...p, deskripsi_komunitas: e.target.value }))} placeholder="Deskripsi komunitas..." />
              </>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,.1)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-b)', fontSize: 13 }}>Batal</button>
              <button onClick={modal === 'lp' ? saveLP : saveKom} disabled={saving}
                style={{ flex: 1, padding: '10px', borderRadius: 8, background: modal === 'lp' ? 'var(--cyan)' : '#a78bfa', border: 'none', color: '#060a12', cursor: 'pointer', fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 700 }}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}