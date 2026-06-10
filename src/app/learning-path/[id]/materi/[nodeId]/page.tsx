'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Navbar from '@/components/ui/navbar'

interface Profile  { username: string; role: string }
interface Node     { id: string; judul: string; urutan: number; learningpath_id: string }
interface LP       { id: string; 'Nama Learning Path': string }
interface Materi   {
  id: string; judul: string; konten: string; tipe: string
  video_url: string; urutan: number; section_title: string; roadmapnode_id: string
  resources?: { title: string; url: string }[]
}

type Tab        = 'content' | 'video' | 'resources'
type NodeStatus = 'selesai' | 'aktif' | 'terkunci'
interface RNode extends Node { status: NodeStatus }

export default function MateriPage() {
  const { id, nodeId } = useParams<{ id: string; nodeId: string }>()
  const router = useRouter()

  const [userId,       setUserId]       = useState('')
  const [profile,      setProfile]      = useState<Profile | null>(null)
  const [nim,          setNim]          = useState('')
  const [lp,           setLp]           = useState<LP | null>(null)
  const [node,         setNode]         = useState<Node | null>(null)
  const [allNodes,     setAllNodes]     = useState<RNode[]>([])
  const [materiList,   setMateriList]   = useState<Materi[]>([])
  const [activeMateri, setActiveMateri] = useState<Materi | null>(null)
  const [tab,          setTab]          = useState<Tab>('content')
  const [loading,      setLoading]      = useState(true)
  const [marking,      setMarking]      = useState(false)
  const [marked,       setMarked]       = useState(false)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)

    const [{ data: prof }, { data: mhs }, { data: lpd }, { data: nd }, { data: allNd }, { data: mat }, { data: prog }] = await Promise.all([
      supabase.from('profiles').select('username,role').eq('id', user.id).single(),
      supabase.from('Mahasiswa').select('NIM').eq('id', user.id).single(),
      supabase.from('learningpath').select('id,"Nama Learning Path"').eq('id', id).single(),
      supabase.from('roadmapnode').select('*').eq('id', nodeId).single(),
      supabase.from('roadmapnode').select('*').eq('learningpath_id', id).order('urutan'),
      supabase.from('materi').select('*').eq('roadmapnode_id', nodeId).order('urutan'),
      supabase.from('progress').select('roadmapnode_id,status').eq('user_id', user.id),
    ])

    setProfile(prof)
    setNim(mhs?.NIM || '')
    setLp(lpd)
    setNode(nd)
    setMateriList(mat || [])
    if (mat && mat.length > 0) setActiveMateri(mat[0])

    // Compute node statuses
    const doneSet = new Set((prog || []).filter((p: any) => p.status === 'selesai').map((p: any) => p.roadmapnode_id))
    let foundActive = false
    const enriched: RNode[] = (allNd || []).map((n: Node) => {
      if (doneSet.has(n.id)) return { ...n, status: 'selesai' as NodeStatus }
      if (!foundActive) { foundActive = true; return { ...n, status: 'aktif' as NodeStatus } }
      return { ...n, status: 'terkunci' as NodeStatus }
    })
    setAllNodes(enriched)

    // Check if current node is already done
    setMarked(doneSet.has(nodeId))
    setLoading(false)
  }, [id, nodeId, router])

  useEffect(() => { load() }, [load])

  // Check if current node is accessible
  const currentNodeStatus = allNodes.find(n => n.id === nodeId)?.status

  async function markDone() {
    if (!userId) return
    setMarking(true)
    await supabase.from('progress').upsert({
      user_id: userId,
      roadmapnode_id: nodeId,
      status: 'selesai',
      updated_at: new Date().toISOString(),
    })
    setMarked(true)
    setMarking(false)
    await load()
    // Navigate back to learning path
    router.push(`/learning-path/${id}`)
  }

  // Group materi by section_title
  const sections: { title: string; items: Materi[] }[] = []
  materiList.forEach(m => {
    const last = sections[sections.length - 1]
    if (!last || last.title !== m.section_title) {
      sections.push({ title: m.section_title, items: [m] })
    } else {
      last.items.push(m)
    }
  })

  const totalLesson = materiList.length
  const totalJam    = Math.ceil(totalLesson * 0.3 * 10) / 10

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar username={profile?.username} role={profile?.role || ''} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--muted)' }}>
        Memuat materi...
      </div>
    </div>
  )

  // Block access if node is locked
  if (currentNodeStatus === 'terkunci') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar username={profile?.username} nim={nim} role={profile?.role || ''} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', gap: 16 }}>
          <div style={{ fontSize: 48 }}>🔒</div>
          <div style={{ fontFamily: 'var(--font-d)', fontSize: 22, fontWeight: 900, color: '#fff' }}>Modul Terkunci</div>
          <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', maxWidth: 360, lineHeight: 1.7 }}>
            Selesaikan modul sebelumnya terlebih dahulu untuk membuka modul ini.
          </p>
          <button onClick={() => router.push(`/learning-path/${id}`)} className="btn-primary" style={{ marginTop: 8 }}>
            ← Kembali ke Roadmap
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar username={profile?.username} nim={nim} role={profile?.role || ''} />

      {/* Breadcrumb bar */}
      <div style={{
        background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        padding: '0 24px', display: 'flex', alignItems: 'center', gap: 16, height: 48,
      }}>
        <button
          onClick={() => router.push(`/learning-path/${id}`)}
          className="btn-ghost"
          style={{ fontSize: 12, padding: '5px 12px', height: 32 }}
        >
          ← Kembali ke Roadmap
        </button>
        <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--cyan)' }}>{lp?.['Nama Learning Path']}</span>
          <span>-</span>
          <span style={{ color: 'var(--cyan)' }}>{node?.judul}</span>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar */}
        <aside style={{
          width: 260, flexShrink: 0,
          background: 'var(--bg2)', borderRight: '1px solid var(--border)',
          overflowY: 'auto', padding: '20px 0',
        }}>
          {/* Module title */}
          <div style={{ padding: '0 18px 16px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              {node?.judul}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              {totalLesson} lesson | {totalJam} jam
            </div>
          </div>

          {/* Sections + lessons */}
          {sections.map((sec, si) => (
            <div key={si}>
              <div style={{
                padding: '10px 18px 6px',
                fontSize: 11, fontWeight: 600, color: 'var(--muted)',
                display: 'flex', alignItems: 'center', gap: 6,
                letterSpacing: '0.3px',
              }}>
                <span style={{ fontSize: 13 }}>⊞</span>
                {sec.title}
              </div>
              {sec.items.map(m => {
                const isActive = activeMateri?.id === m.id
                return (
                  <div
                    key={m.id}
                    onClick={() => { setActiveMateri(m); setTab('content') }}
                    style={{
                      padding: '9px 18px 9px 28px',
                      fontSize: 13, cursor: 'pointer',
                      color: isActive ? '#fff' : 'var(--muted)',
                      background: isActive ? 'var(--cyan-10)' : 'transparent',
                      borderLeft: isActive ? '2px solid var(--cyan)' : '2px solid transparent',
                      transition: 'all .15s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#fff' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--muted)' }}
                  >
                    {m.judul}
                  </div>
                )
              })}
            </div>
          ))}

          {/* Other nodes nav — only show accessible ones */}
          {allNodes.filter(n => n.id !== nodeId && n.status !== 'terkunci').length > 0 && (
            <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ padding: '0 18px 8px', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.5px' }}>
                MODUL LAINNYA
              </div>
              {allNodes.filter(n => n.id !== nodeId && n.status !== 'terkunci').map(n => (
                <div
                  key={n.id}
                  onClick={() => router.push(`/learning-path/${id}/materi/${n.id}`)}
                  style={{
                    padding: '8px 18px', fontSize: 12, cursor: 'pointer',
                    color: 'var(--muted)', transition: 'color .15s',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--cyan)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                >
                  {n.status === 'selesai' && <span style={{ fontSize: 10, color: 'var(--green)' }}>✓</span>}
                  {n.status === 'aktif'   && <span style={{ fontSize: 10, color: 'var(--cyan)' }}>▶</span>}
                  Modul {n.urutan} — {n.judul}
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Content area */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>

          {activeMateri ? (
            <>
              {/* Lesson title */}
              <h1 style={{
                fontFamily: 'var(--font-d)', fontSize: 26, fontWeight: 900,
                color: '#fff', marginBottom: 20,
              }}>
                {activeMateri.judul}
              </h1>

              {/* Tabs */}
              <div style={{
                display: 'flex', gap: 0, borderBottom: '1px solid var(--border)',
                marginBottom: 28,
              }}>
                {(['content', 'video', 'resources'] as Tab[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    style={{
                      padding: '10px 20px', fontSize: 13, fontWeight: 500,
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: tab === t ? 'var(--cyan)' : 'var(--muted)',
                      borderBottom: tab === t ? '2px solid var(--cyan)' : '2px solid transparent',
                      marginBottom: -1, transition: 'color .15s',
                      fontFamily: 'var(--font-b)',
                    }}
                  >
                    {t === 'content' ? 'Content' : t === 'video' ? 'Video' : 'Resources'}
                  </button>
                ))}
              </div>

              {/* Tab: Content */}
              {tab === 'content' && (
                <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.85, maxWidth: 720 }}>
                  {activeMateri.konten ? (
                    activeMateri.konten.split('\n').map((para, i) => (
                      para.trim() ? <p key={i} style={{ marginBottom: 16 }}>{para}</p> : <br key={i} />
                    ))
                  ) : (
                    <div style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Konten belum tersedia.</div>
                  )}
                </div>
              )}

              {/* Tab: Video */}
              {tab === 'video' && (
                <div style={{ maxWidth: 720 }}>
                  {activeMateri.video_url ? (
                    <>
                      <div style={{
                        position: 'relative', width: '100%', paddingTop: '56.25%',
                        background: '#000', borderRadius: 12, overflow: 'hidden', marginBottom: 20,
                      }}>
                        <iframe
                          src={activeMateri.video_url.includes('watch?v=')
                            ? activeMateri.video_url.replace('watch?v=', 'embed/')
                            : activeMateri.video_url}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                          allowFullScreen
                        />
                      </div>
                      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }}>
                        <div style={{ fontSize: 10, letterSpacing: '1.5px', color: 'var(--muted)', marginBottom: 6 }}>TENTANG VIDEO INI</div>
                        <div style={{ fontSize: 13, color: 'var(--text)' }}>Video ini menjelaskan tentang {activeMateri.judul}</div>
                      </div>
                    </>
                  ) : (
                    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '60px 40px', textAlign: 'center', color: 'var(--muted)' }}>
                      <div style={{ fontSize: 32, marginBottom: 12 }}>🎬</div>
                      <p>Video belum tersedia untuk materi ini.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Resources */}
              {tab === 'resources' && (
                <div style={{ maxWidth: 720 }}>
                  {activeMateri.resources && activeMateri.resources.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {activeMateri.resources.map((r, i) => (
                        <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '14px 18px', borderRadius: 10, textDecoration: 'none',
                          background: 'var(--bg3)', border: '1px solid var(--border)',
                          transition: 'border-color .15s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--cyan-30)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                        >
                          <span style={{ fontSize: 18 }}>📎</span>
                          <span style={{ fontSize: 13, color: 'var(--cyan)', fontWeight: 500 }}>{r.title || r.url}</span>
                          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>↗</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '60px 40px', textAlign: 'center', color: 'var(--muted)' }}>
                      <div style={{ fontSize: 32, marginBottom: 12 }}>📎</div>
                      <p>Belum ada resource untuk materi ini.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Prev / Next lesson navigation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 48, maxWidth: 720 }}>
                {(() => {
                  const idx = materiList.findIndex(m => m.id === activeMateri.id)
                  const prev = materiList[idx - 1]
                  const next = materiList[idx + 1]
                  return (
                    <>
                      <div>
                        {prev && (
                          <button onClick={() => { setActiveMateri(prev); setTab('content') }} className="btn-ghost" style={{ fontSize: 12 }}>
                            ← {prev.judul}
                          </button>
                        )}
                      </div>
                      <div>
                        {next && (
                          <button onClick={() => { setActiveMateri(next); setTab('content') }} className="btn-primary" style={{ fontSize: 12 }}>
                            {next.judul} →
                          </button>
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Tandai Selesai — only show for aktif node */}
              {currentNodeStatus === 'aktif' && (
                <div style={{
                  maxWidth: 720, marginTop: 40,
                  padding: '24px 28px', borderRadius: 14,
                  background: 'rgba(0,200,255,.05)', border: '1px solid rgba(0,200,255,.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
                      Sudah selesai mempelajari modul ini?
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {activeMateri?.id !== materiList[materiList.length - 1]?.id
                        ? 'Selesaikan semua materi terlebih dahulu sebelum menandai modul ini selesai.'
                        : 'Tandai selesai untuk membuka modul berikutnya.'}
                    </div>
                  </div>
                  <button
                    onClick={markDone}
                    disabled={marking || activeMateri?.id !== materiList[materiList.length - 1]?.id}
                    className="btn-primary"
                    style={{
                      padding: '11px 24px', fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0,
                      opacity: activeMateri?.id !== materiList[materiList.length - 1]?.id ? 0.4 : 1,
                      cursor: activeMateri?.id !== materiList[materiList.length - 1]?.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {marking ? 'Menyimpan...' : '✓ Tandai Selesai'}
                  </button>
                </div>
              )}

              {/* Already done banner */}
              {currentNodeStatus === 'selesai' && (
                <div style={{
                  maxWidth: 720, marginTop: 40,
                  padding: '20px 24px', borderRadius: 14,
                  background: 'rgba(0,230,118,.06)', border: '1px solid rgba(0,230,118,.2)',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: 20 }}>✅</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>Modul sudah diselesaikan</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Kamu telah menyelesaikan modul ini sebelumnya.</div>
                  </div>
                  <button onClick={() => router.push(`/learning-path/${id}`)} className="btn-ghost" style={{ fontSize: 12, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                    ← Kembali ke Roadmap
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <p>Belum ada materi untuk modul ini.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}