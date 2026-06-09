'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Navbar from '@/components/ui/navbar'

interface LP      { id:string; 'Nama Learning Path':string; deskripsi:string }
interface Node    { id:string; judul:string; urutan:number; learningpath_id:string }
interface Profile { username:string }

type NodeStatus = 'selesai'|'aktif'|'terkunci'
interface RNode extends Node { status: NodeStatus }

const STATUS_COLOR  = { selesai:'var(--green)', aktif:'var(--cyan)', terkunci:'rgba(255,255,255,.2)' }
const STATUS_BG     = { selesai:'rgba(0,230,118,.12)', aktif:'rgba(0,200,255,.12)', terkunci:'transparent' }
const STATUS_LABEL  = { selesai:'✓ Selesai', aktif:'▶ Aktif', terkunci:'🔒 Terkunci' }
const LEVEL_LABELS  = ['Pemula','Intermediate','Advance','Capstone']

// ── FAB bottom-sheet ────────────────────────────────────────────────────────
function NodeFAB({
  node,
  onClose,
  onMarkDone,
  onLihatMateri,
  marking,
}: {
  node: RNode | null
  onClose: () => void
  onMarkDone: (id: string) => void
  onLihatMateri: (nodeId: string) => void
  marking: string | null
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (node) {
      // tiny delay so the CSS transition fires after mount
      const t = setTimeout(() => setVisible(true), 10)
      return () => clearTimeout(t)
    } else {
      setVisible(false)
    }
  }, [node])

  if (!node) return null

  const color = STATUS_COLOR[node.status]
  const isDone = node.status === 'selesai'
  const isActive = node.status === 'aktif'

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,.55)',
          opacity: visible ? 1 : 0,
          transition: 'opacity .25s ease',
        }}
      />

      {/* Centered modal */}
      <div
        style={{
          position: 'fixed', top: '50%', left: '50%', zIndex: 201,
          width: '90%', maxWidth: 480,
          background: 'var(--bg3)',
          border: `1px solid ${color}40`,
          borderTop: `2px solid ${color}`,
          borderRadius: 16,
          padding: '20px 24px 28px',
          transform: visible
            ? 'translate(-50%, -50%) scale(1)'
            : 'translate(-50%, -50%) scale(0.92)',
          opacity: visible ? 1 : 0,
          transition: 'transform .28s cubic-bezier(.16,1,.3,1), opacity .22s ease',
        }}
      >
        {/* Top row: status badge + close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: '8px 0', borderRadius: 10,
            background: isDone ? 'rgba(0,230,118,.12)' : 'rgba(0,200,255,.12)',
            border: `1px solid ${color}`,
            fontSize: 14, fontWeight: 700, color,
          }}>
            {isDone ? '✓ Selesai' : '▶ Aktif'}
          </div>
          <button
            onClick={handleClose}
            style={{
              width: 34, height: 34, flexShrink: 0,
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--muted)', fontSize: 16,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        {/* Title */}
        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
          {node.judul}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
          Modul {node.urutan}
        </div>

        {/* Study materials box */}
        <div style={{
          background: 'var(--bg4)', border: '1px solid var(--border-c)',
          borderRadius: 10, padding: '12px 14px', marginBottom: 14,
        }}>
          <div style={{ fontSize: 10, letterSpacing: '1.5px', color: 'var(--muted)', marginBottom: 10 }}>
            STUDY MATERIALS
          </div>
          {['Modul', 'Video'].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{
                width: 14, height: 14, border: '1.5px solid var(--border)',
                borderRadius: 3, flexShrink: 0,
              }}/>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>{item}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 18 }}>
          Selesaikan modul ini untuk membuka materi berikutnya. Klik tombol di bawah setelah kamu mempelajari materinya.
        </p>

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            onClick={() => onLihatMateri(node.id)}
            style={{
              padding: '11px', borderRadius: 8,
              background: 'transparent', border: `1px solid ${color}`,
              fontSize: 13, fontWeight: 600, color, cursor: 'pointer',
              fontFamily: 'var(--font-b)',
            }}
          >▶ Lihat Materi</button>

          {isActive && (
            <button
              onClick={() => onMarkDone(node.id)}
              disabled={marking === node.id}
              className="btn-primary"
              style={{ padding: '11px', fontSize: 13 }}
            >
              {marking === node.id ? 'Menyimpan...' : '✓ Tandai Selesai'}
            </button>
          )}

          {isDone && (
            <div style={{
              padding: '11px', borderRadius: 8, textAlign: 'center',
              fontSize: 13, fontWeight: 600,
              background: 'rgba(0,230,118,.1)', border: '1px solid rgba(0,230,118,.3)',
              color: 'var(--green)',
            }}>✓ Sudah Selesai</div>
          )}
        </div>
      </div>
    </>
  )
}
// ────────────────────────────────────────────────────────────────────────────

export default function LearningPathPage() {
  const { id }   = useParams<{ id:string }>()
  const router   = useRouter()
  const [profile,    setProfile]    = useState<Profile|null>(null)
  const [nim,        setNim]        = useState('')
  const [lp,         setLp]         = useState<LP|null>(null)
  const [nodes,      setNodes]      = useState<RNode[]>([])
  const [userId,     setUserId]     = useState('')
  const [openNode,   setOpenNode]   = useState<RNode|null>(null)  // now stores the full node
  const [marking,    setMarking]    = useState<string|null>(null)
  const [loading,    setLoading]    = useState(true)
  const [komunitasId,setKomunitasId] = useState<string|null>(null)

  const load = useCallback(async () => {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)

    const [{ data:prof },{ data:mhs },{ data:lpd },{ data:rawNodes },{ data:prog }] = await Promise.all([
      supabase.from('profiles').select('username').eq('id',user.id).single(),
      supabase.from('Mahasiswa').select('NIM').eq('id',user.id).single(),
      supabase.from('learningpath').select('*').eq('id',id).single(),
      supabase.from('roadmapnode').select('*').eq('learningpath_id',id).order('urutan'),
      supabase.from('progress').select('roadmapnode_id,status').eq('user_id',user.id),
    ])
    setProfile(prof); setNim(mhs?.NIM||''); setLp(lpd)

    const { data: komlp } = await supabase.from('komunitas_learningpath').select('komunitas_id').eq('Learning_Path_id', id).limit(1)
    setKomunitasId((komlp && komlp[0]?.komunitas_id) || null)

    const doneSet = new Set((prog||[]).filter((p:{ status:string })=>p.status==='selesai').map((p:{ roadmapnode_id:string })=>p.roadmapnode_id))
    let foundActive = false
    const enriched: RNode[] = (rawNodes||[]).map((n: Node) => {
      if (doneSet.has(n.id)) return { ...n, status:'selesai' as NodeStatus }
      if (!foundActive) { foundActive=true; return { ...n, status:'aktif' as NodeStatus } }
      return { ...n, status:'terkunci' as NodeStatus }
    })
    setNodes(enriched)
    setLoading(false)
  }, [id, router])

  useEffect(()=>{ load() },[load])

  async function markDone(nodeId: string) {
    setMarking(nodeId)
    await supabase.from('progress').upsert({
      user_id:userId, roadmapnode_id:nodeId,
      status:'selesai', updated_at:new Date().toISOString(),
    })
    await load()
    setMarking(null)
    setOpenNode(null)
  }

  const done  = nodes.filter(n=>n.status==='selesai').length
  const total = nodes.length
  const pct   = total>0 ? Math.round((done/total)*100) : 0

  const chunkSize = 3
  const rows: RNode[][] = []
  for (let i=0; i<nodes.length; i+=chunkSize) rows.push(nodes.slice(i,i+chunkSize))

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar username={profile?.username}/>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:'var(--muted)' }}>Memuat roadmap...</div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar username={profile?.username} nim={nim}/>

      <main style={{ maxWidth:960, margin:'0 auto', padding:'44px 24px 80px' }}>

        {/* Back */}
        <button
          onClick={() => router.push(komunitasId ? `/eksplorasi/${komunitasId}` : '/eksplorasi')}
          className="btn-ghost"
          style={{ fontSize:12, padding:'6px 14px', marginBottom:32 }}
        >
          ← Ganti Path
        </button>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom:10 }}>
          <div style={{ fontSize:11, color:'var(--muted)', letterSpacing:'0.5px', marginBottom:6 }}>Learning Path</div>
          <h1 style={{
            fontFamily:'var(--font-d)', fontWeight:900, fontSize:'clamp(24px,4vw,40px)',
            lineHeight:1.08, marginBottom:8,
          }}>
            <span style={{ color:'var(--text)' }}>Learning Path — </span>
            <span style={{ color:'var(--cyan)' }}>{lp?.['Nama Learning Path']}</span>
          </h1>
          <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.65, maxWidth:520, marginBottom:28 }}>
            {lp?.deskripsi||'Ikuti setiap modul secara berurutan untuk menyelesaikan jalur pembelajaran ini.'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="fade-up d1 card" style={{ padding:'18px 22px', marginBottom:44, display:'flex', alignItems:'center', gap:22 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:12, color:'var(--muted)' }}>Progress Keseluruhan</span>
              <span style={{ fontSize:12, fontWeight:600, color:'var(--cyan)' }}>{pct}%</span>
            </div>
            <div style={{ height:6, background:'rgba(255,255,255,.07)', borderRadius:3, overflow:'hidden' }}>
              <div style={{
                height:'100%', width:`${pct}%`,
                background:'linear-gradient(90deg, var(--cyan), rgba(0,200,255,.6))',
                borderRadius:3, transition:'width 1s cubic-bezier(.22,1,.36,1)',
              }}/>
            </div>
          </div>
          <div style={{ textAlign:'center', flexShrink:0 }}>
            <div style={{ fontFamily:'var(--font-d)', fontSize:26, fontWeight:900, color:'var(--cyan)' }}>{done}/{total}</div>
            <div style={{ fontSize:10, color:'var(--muted)' }}>modul selesai</div>
          </div>
        </div>

        {/* Roadmap grid */}
        {nodes.length===0 ? (
          <div className="card" style={{ padding:60, textAlign:'center', color:'var(--muted)' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>📭</div>
            <p>Belum ada materi untuk jalur ini.</p>
          </div>
        ) : (
          <div className="fade-up d2">
            {rows.map((row, rowIdx)=>{
              const levelLabel = LEVEL_LABELS[rowIdx] || `Level ${rowIdx+1}`
              return (
                <div key={rowIdx} style={{ display:'flex', alignItems:'flex-start', gap:16, marginBottom:28 }}>
                  {/* Level badge */}
                  <div style={{
                    width:96, flexShrink:0, paddingTop:18,
                    display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                  }}>
                    <div style={{
                      padding:'4px 10px', borderRadius:20, fontSize:10, fontWeight:600,
                      border:'1px solid rgba(255,255,255,.15)', color:'var(--muted)',
                      background:'var(--bg3)', whiteSpace:'nowrap',
                    }}>{levelLabel}</div>
                    {rowIdx < rows.length-1 && (
                      <div style={{ width:1, height:24, background:'rgba(255,255,255,.08)', marginTop:4 }}/>
                    )}
                  </div>

                  {/* Node cards */}
                  <div style={{ flex:1, display:'flex', gap:12, flexWrap:'wrap' }}>
                    {row.map((node)=>{
                      const color  = STATUS_COLOR[node.status]
                      const bg     = STATUS_BG[node.status]
                      const locked = node.status === 'terkunci'
                      const isOpen = openNode?.id === node.id

                      return (
                        <div
                          key={node.id}
                          onClick={()=> !locked && setOpenNode(isOpen ? null : node)}
                          style={{
                            flex:'1 1 160px', minWidth:0,
                            padding:'14px 16px', borderRadius:12,
                            cursor: locked ? 'default' : 'pointer',
                            border:`1px solid ${isOpen ? color+'80' : 'rgba(255,255,255,.07)'}`,
                            background: isOpen ? bg : 'var(--bg3)',
                            opacity: locked ? .6 : 1,
                            transition:'all .2s',
                            display:'flex', flexDirection:'column', gap:8,
                          }}
                        >
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{
                              width:22, height:22, borderRadius:'50%', flexShrink:0,
                              border:`2px solid ${color}`, background:bg,
                              display:'flex', alignItems:'center', justifyContent:'center',
                              boxShadow: node.status==='aktif' ? `0 0 0 3px rgba(0,200,255,.12)` : 'none',
                              transition:'all .2s',
                            }}>
                              {node.status==='selesai' && <span style={{ fontSize:10, color:'var(--green)', fontWeight:700 }}>✓</span>}
                              {node.status==='aktif'   && <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--cyan)' }}/>}
                            </div>
                            <span style={{ fontSize:12, fontWeight:600, color: locked?'var(--muted)':'#fff', lineHeight:1.3 }}>
                              {node.judul}
                            </span>
                          </div>

                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ fontSize:10, color:'var(--muted)' }}>Modul {node.urutan}</span>
                            <span style={{
                              fontSize:10, padding:'2px 8px', borderRadius:20,
                              background:`${color}18`, color, border:`1px solid ${color}30`,
                            }}>{STATUS_LABEL[node.status]}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Completion banner */}
        {pct===100 && (
          <div className="fade-up" style={{
            marginTop:32, padding:28, borderRadius:14, textAlign:'center',
            background:'rgba(0,230,118,.08)', border:'1px solid rgba(0,230,118,.25)',
          }}>
            <div style={{ fontSize:40, marginBottom:10 }}>🏆</div>
            <div style={{ fontFamily:'var(--font-d)', fontSize:22, fontWeight:900, color:'var(--green)', marginBottom:6 }}>
              Learning Path Selesai!
            </div>
            <p style={{ fontSize:13, color:'var(--muted)' }}>
              Selamat! Kamu telah menyelesaikan semua modul di jalur ini.
            </p>
          </div>
        )}
      </main>

      {/* FAB bottom sheet */}
      <NodeFAB
        node={openNode}
        onClose={()=>setOpenNode(null)}
        onMarkDone={markDone}
        onLihatMateri={(nodeId) => router.push(`/learning-path/${id}/materi/${nodeId}`)}
        marking={marking}
      />
    </div>
  )
}