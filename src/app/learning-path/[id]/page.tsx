'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Navbar from '@/components/ui/navbar'

interface LP      { id:string; Nama_Learning_Path:string; deskripsi:string }
interface Node    { id:string; judul:string; urutan:number; learningpath_id:string }
interface Profile { username:string }

type NodeStatus = 'selesai'|'aktif'|'terkunci'
interface RNode extends Node { status: NodeStatus }

const STATUS_COLOR  = { selesai:'var(--green)', aktif:'var(--cyan)', terkunci:'rgba(255,255,255,.2)' }
const STATUS_BG     = { selesai:'rgba(0,230,118,.12)', aktif:'rgba(0,200,255,.12)', terkunci:'transparent' }
const STATUS_LABEL  = { selesai:'✓ Selesai', aktif:'▶ Aktif', terkunci:'🔒 Terkunci' }
const LEVEL_LABELS  = ['Pemula','Intermediate','Advance','Capstone']

export default function LearningPathPage() {
  const { id }   = useParams<{ id:string }>()
  const router   = useRouter()
  const [profile,  setProfile]  = useState<Profile|null>(null)
  const [nim,      setNim]      = useState('')
  const [lp,       setLp]       = useState<LP|null>(null)
  const [nodes,    setNodes]    = useState<RNode[]>([])
  const [userId,   setUserId]   = useState('')
  const [openNode, setOpenNode] = useState<string|null>(null)
  const [marking,  setMarking]  = useState<string|null>(null)
  const [loading,  setLoading]  = useState(true)

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

  // Group nodes by level (3 per row matching mockup)
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
        <button onClick={()=>router.back()} className="btn-ghost" style={{ fontSize:12, padding:'6px 14px', marginBottom:32 }}>
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
            <span style={{ color:'var(--cyan)' }}>{lp?.Nama_Learning_Path}</span>
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

        {/* Roadmap grid — matches mockup layout */}
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
                    {/* Connector dot */}
                    {rowIdx < rows.length-1 && (
                      <div style={{ width:1, height:24, background:'rgba(255,255,255,.08)', marginTop:4 }}/>
                    )}
                  </div>

                  {/* Nodes in this row */}
                  <div style={{ flex:1, display:'flex', gap:12, flexWrap:'wrap' }}>
                    {row.map((node)=>{
                      const color  = STATUS_COLOR[node.status]
                      const bg     = STATUS_BG[node.status]
                      const isOpen = openNode===node.id
                      const locked = node.status==='terkunci'
                      return (
                        <div key={node.id} style={{
                          flex:'1 1 160px', minWidth:0,
                          opacity: locked?.6:1,
                        }}>
                          {/* Node card */}
                          <div
                            onClick={()=>!locked && setOpenNode(isOpen?null:node.id)}
                            style={{
                              padding:'14px 16px', borderRadius:12, cursor:locked?'default':'pointer',
                              border:`1px solid ${isOpen?color+'80':'rgba(255,255,255,.07)'}`,
                              background: isOpen ? bg : 'var(--bg3)',
                              transition:'all .2s',
                              display:'flex', flexDirection:'column', gap:8,
                            }}
                          >
                            {/* Status dot + title */}
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <div style={{
                                width:22, height:22, borderRadius:'50%', flexShrink:0,
                                border:`2px solid ${color}`, background:bg,
                                display:'flex', alignItems:'center', justifyContent:'center',
                                boxShadow: node.status==='aktif'?`0 0 0 3px rgba(0,200,255,.12)`:'none',
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

                          {/* Expanded detail */}
                          {isOpen && (
                            <div style={{
                              marginTop:6, padding:'14px 16px', borderRadius:10,
                              background:'var(--bg4)', border:'1px solid var(--border-c)',
                            }}>
                              <p style={{ fontSize:12, color:'var(--muted)', lineHeight:1.7, marginBottom:12 }}>
                                Selesaikan modul ini untuk membuka materi berikutnya. Klik tombol di bawah setelah kamu mempelajari materinya.
                              </p>
                              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                                <button style={{
                                  padding:'7px 14px', background:'transparent',
                                  border:'1px solid var(--border)', borderRadius:7,
                                  fontSize:12, color:'var(--muted)', cursor:'pointer', fontFamily:'var(--font-b)',
                                  transition:'all .18s',
                                }}
                                  onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--cyan-30)';e.currentTarget.style.color='var(--cyan)'}}
                                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--muted)'}}
                                >▶ Lihat Materi</button>

                                {node.status==='aktif' && (
                                  <button onClick={()=>markDone(node.id)} disabled={marking===node.id}
                                    className="btn-primary" style={{ padding:'7px 16px', fontSize:12 }}>
                                    {marking===node.id?'Menyimpan...':'Tandai Selesai ✓'}
                                  </button>
                                )}
                                {node.status==='selesai' && (
                                  <div style={{
                                    padding:'7px 14px', borderRadius:7, fontSize:12,
                                    background:'var(--green-10)', border:'1px solid rgba(0,230,118,.3)', color:'var(--green)',
                                  }}>✓ Sudah Selesai</div>
                                )}
                              </div>
                            </div>
                          )}
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
    </div>
  )
}
