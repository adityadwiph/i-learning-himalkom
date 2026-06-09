'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Navbar from '@/components/ui/navbar'

interface Profile  { username: string }
interface Node     { id: string; judul: string; urutan: number; learningpath_id: string }
interface LP       { id: string; 'Nama Learning Path': string }
interface Materi   {
  id: string; judul: string; konten: string; tipe: string
  video_url: string; urutan: number; section_title: string; roadmapnode_id: string
  resources?: { title: string; url: string }[]
}

type Tab = 'content' | 'video' | 'resources'

function normalizeResources(value: unknown): { title: string; url: string }[] {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(r => r && typeof r === 'object').map(r => ({
    title: String((r as any).title || ''),
    url: String((r as any).url || ''),
  }))
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

export default function MateriPage() {
  const { id, nodeId } = useParams<{ id: string; nodeId: string }>()
  const router = useRouter()

  const [profile,      setProfile]      = useState<Profile | null>(null)
  const [nim,          setNim]          = useState('')
  const [lp,           setLp]           = useState<LP | null>(null)
  const [node,         setNode]         = useState<Node | null>(null)
  const [allNodes,     setAllNodes]     = useState<Node[]>([])
  const [materiList,   setMateriList]   = useState<Materi[]>([])
  const [activeMateri, setActiveMateri] = useState<Materi | null>(null)
  const [tab,          setTab]          = useState<Tab>('content')
  const [loading,      setLoading]      = useState(true)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const [{ data: prof }, { data: mhs }, { data: lpd }, { data: nd }, { data: allNd }, { data: mat }] = await Promise.all([
      supabase.from('profiles').select('username').eq('id', user.id).single(),
      supabase.from('Mahasiswa').select('NIM').eq('id', user.id).single(),
      supabase.from('learningpath').select('*').eq('id', id).single(),
      supabase.from('roadmapnode').select('*').eq('id', nodeId).single(),
      supabase.from('roadmapnode').select('*').eq('learningpath_id', id).order('urutan'),
      supabase.from('materi').select('*').eq('roadmapnode_id', nodeId).order('urutan'),
    ])

    setProfile(prof)
    setNim(mhs?.NIM || '')
    setLp(lpd)
    setNode(nd)
    setAllNodes(allNd || [])
    const normalizedMat = (mat || []).map((item: any) => ({ ...item, resources: normalizeResources(item.resources) }))
    setMateriList(normalizedMat)
    if (normalizedMat.length > 0) setActiveMateri(normalizedMat[0])
    setLoading(false)
  }, [id, nodeId, router])

  useEffect(() => { load() }, [load])

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
      <Navbar username={profile?.username} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--muted)' }}>
        Memuat materi...
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar username={profile?.username} nim={nim} />

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
              {/* Section header */}
              <div style={{
                padding: '10px 18px 6px',
                fontSize: 11, fontWeight: 600, color: 'var(--muted)',
                display: 'flex', alignItems: 'center', gap: 6,
                letterSpacing: '0.3px',
              }}>
                <span style={{ fontSize: 13 }}>⊞</span>
                {sec.title}
              </div>

              {/* Lesson items */}
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

          {/* Other nodes nav */}
          {allNodes.length > 1 && (
            <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ padding: '0 18px 8px', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.5px' }}>
                MODUL LAINNYA
              </div>
              {allNodes.filter(n => n.id !== nodeId).map(n => (
                <div
                  key={n.id}
                  onClick={() => router.push(`/learning-path/${id}/materi/${n.id}`)}
                  style={{
                    padding: '8px 18px', fontSize: 12, cursor: 'pointer',
                    color: 'var(--muted)', transition: 'color .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--cyan)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                >
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
                      textTransform: 'capitalize',
                    }}
                  >
                    {t === 'content' ? 'Content' : t === 'video' ? 'Video' : 'Resources'}
                  </button>
                ))}
              </div>

              {/* Tab: Content */}
              {tab === 'content' && (
                <div style={{
                  fontSize: 14, color: 'var(--text)', lineHeight: 1.85,
                  maxWidth: 720,
                }}>
                  {activeMateri.konten ? (
                    activeMateri.konten.split('\n').map((para, i) => (
                      para.trim() ? (
                        <p key={i} style={{ marginBottom: 16 }}>{para}</p>
                      ) : <br key={i} />
                    ))
                  ) : (
                    <div style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
                      Konten belum tersedia.
                    </div>
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
                        background: '#000', borderRadius: 12, overflow: 'hidden',
                        marginBottom: 20,
                      }}>
                        <iframe
                          src={activeMateri.video_url.includes('watch?v=')
                            ? activeMateri.video_url.replace('watch?v=', 'embed/')
                            : activeMateri.video_url}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                          allowFullScreen
                        />
                      </div>
                      <div style={{
                        background: 'var(--bg3)', border: '1px solid var(--border)',
                        borderRadius: 10, padding: '14px 18px',
                      }}>
                        <div style={{ fontSize: 10, letterSpacing: '1.5px', color: 'var(--muted)', marginBottom: 6 }}>
                          TENTANG VIDEO INI
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text)' }}>
                          Video ini menjelaskan tentang {activeMateri.judul}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{
                      background: 'var(--bg3)', border: '1px solid var(--border)',
                      borderRadius: 12, padding: '60px 40px', textAlign: 'center',
                      color: 'var(--muted)',
                    }}>
                      <div style={{ fontSize: 32, marginBottom: 12 }}>🎬</div>
                      <p>Video belum tersedia untuk materi ini.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Resources */}
              {tab === 'resources' && (
                <div style={{ maxWidth: 720 }}>
                  {Array.isArray(activeMateri.resources) && activeMateri.resources.length > 0 ? (
                    <div style={{ display: 'grid', gap: 14 }}>
                      {activeMateri.resources.map((res, i) => (
                        <a key={i} href={res.url} target="_blank" rel="noreferrer" style={{
                          display: 'block', padding: 18, borderRadius: 14,
                          background: 'var(--bg3)', border: '1px solid var(--border)',
                          color: 'var(--text)', textDecoration: 'none', transition: 'background .15s',
                        }}>
                          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{res.title || 'Resource'}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)', wordBreak: 'break-all' }}>{res.url}</div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      background: 'var(--bg3)', border: '1px solid var(--border)',
                      borderRadius: 12, padding: '60px 40px', textAlign: 'center',
                      color: 'var(--muted)',
                    }}>
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
                          <button
                            onClick={() => { setActiveMateri(prev); setTab('content') }}
                            className="btn-ghost"
                            style={{ fontSize: 12 }}
                          >
                            ← {prev.judul}
                          </button>
                        )}
                      </div>
                      <div>
                        {next && (
                          <button
                            onClick={() => { setActiveMateri(next); setTab('content') }}
                            className="btn-primary"
                            style={{ fontSize: 12 }}
                          >
                            {next.judul} →
                          </button>
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>
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