'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import Navbar from '@/components/ui/navbar'

interface Komunitas { id: string; nama_komunitas: string; deskripsi_komunitas: string }
interface Profile { username: string; role: string; nim: string }

const KOM_ICON: Record<string,string> = {
  CSI:'🛡', IWDC:'🌐', AgriUX:'🎨', 'AGRI-UX':'🎨',
  Gaming:'🎮', DAMING:'🎮', Gary:'⚡', GARY:'⚡', MAD:'🤖', CP:'{}',
}
const KOM_COLOR: Record<string,string> = {
  CSI:'#00c8ff', IWDC:'#818cf8', AgriUX:'#f59e0b', 'AGRI-UX':'#f59e0b',
  Gaming:'#34d399', DAMING:'#34d399', Gary:'#f87171', GARY:'#f87171',
  MAD:'#a78bfa', CP:'#22d3ee',
}

export default function EksplorasiPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile|null>(null)
  const [nim,     setNim]     = useState('')
  const [list,    setList]    = useState<Komunitas[]>([])
  const [joined,  setJoined]  = useState<string[]>([])
  const [search,  setSearch]  = useState('')
  const [loading, setLoading] = useState(true)
  const [stats,   setStats]   = useState({ komunitas: 0, member: 0, peminatan: 0, materi: 0 })

  useEffect(()=>{ init() }, [])

  async function init() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const [{ data:prof }, { data:kom }, { data:mem }] = await Promise.all([
      supabase.from('profiles').select('username,role,nim').eq('id', user.id).single(),
      supabase.from('komunitas').select('*').order('nama_komunitas'),
      supabase.from('komunitas_member').select('id_komunitas').eq('id_user', user.id),
    ])
    setProfile(prof)
    setList(kom || [])
    setJoined((mem||[]).map((m:{ id_komunitas:string })=>m.id_komunitas))

    // Stats real dari database
    const [{ count: cMember }, { count: cPeminatan }, { count: cMateri }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('learningpath').select('*', { count: 'exact', head: true }),
      supabase.from('roadmapnode').select('*', { count: 'exact', head: true }),
    ])
    setStats({
      komunitas: kom?.length || 0,
      member:    cMember    || 0,
      peminatan: cPeminatan || 0,
      materi:    cMateri    || 0,
    })

    setLoading(false)
  }

  const filtered = list.filter(k =>
    k.nama_komunitas?.toLowerCase().includes(search.toLowerCase()) ||
    k.deskripsi_komunitas?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar username={profile?.username || ''} nim={profile?.nim || ''} />

      <main style={{ maxWidth:1080, margin:'0 auto', padding:'52px 24px 80px' }}>

        {/* Hero */}
        <div className="fade-up" style={{ textAlign:'center', marginBottom:52 }}>
          <h1 style={{
            fontFamily:'var(--font-d)', fontWeight:900,
            fontSize:'clamp(30px,5vw,54px)', lineHeight:1.08, color:'#fff', marginBottom:18,
          }}>
            Pilih <span style={{ color:'var(--cyan)' }}>Jalur Peminatan</span><br/>
            IT-mu di Compsci IPB
          </h1>
          <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.75, maxWidth:460, margin:'0 auto 32px' }}>
            Setiap komunitas menyediakan roadmap belajar terstruktur.<br/>Pilih satu, mulai perjalananmu hari ini.
          </p>

          {/* Search */}
          <div style={{ position:'relative', maxWidth:420, margin:'0 auto' }}>
            <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--muted)', fontSize:14 }}>🔍</span>
            <input
              type="text" placeholder="Cari komunitas atau topik..."
              value={search} onChange={e=>setSearch(e.target.value)}
              style={{
                width:'100%', padding:'12px 14px 12px 42px',
                background:'var(--bg3)', border:'1px solid var(--border)',
                borderRadius:10, color:'var(--text)', fontSize:13, fontFamily:'var(--font-b)',
                outline:'none', transition:'border-color .18s',
              }}
              onFocus={e=>e.target.style.borderColor='var(--cyan-30)'}
              onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.07)'}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="fade-up d1" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:52 }}>
          {[
            { n: stats.komunitas, label:'Komunitas Aktif' },
            { n: stats.member,    label:'Total Member' },
            { n: stats.peminatan, label:'Pilihan Peminatan' },
            { n: stats.materi,    label:'Pilihan Materi' },
          ].map(s=>(
            <div key={s.label} className="card" style={{ padding:'18px 20px', textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-d)', fontSize:34, fontWeight:900, color:'var(--cyan)' }}>
                {loading ? '...' : s.n}
              </div>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Grid komunitas */}
        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14 }}>
            {[1,2,3,4].map(i=>(
              <div key={i} className="skeleton" style={{ height:180, borderRadius:14 }}/>
            ))}
          </div>
        ) : (
          <div className="fade-up d2" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14 }}>
            {filtered.map((k,i)=>{
              const name     = k.nama_komunitas||''
              const icon     = KOM_ICON[name]||KOM_ICON[name.toUpperCase()]||'📚'
              const color    = KOM_COLOR[name]||KOM_COLOR[name.toUpperCase()]||'var(--cyan)'
              const isJoined = joined.includes(k.id)
              return (
                <div key={k.id} className="card fade-up" style={{ padding:24, animationDelay:`${i*.07}s` }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:14 }}>
                    <div style={{
                      width:50, height:50, borderRadius:14, flexShrink:0,
                      background:`${color}18`, border:`1px solid ${color}35`,
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:24,
                    }}>{icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                        <span style={{ fontFamily:'var(--font-d)', fontSize:17, fontWeight:800, color:'#fff' }}>{name}</span>
                        {isJoined && <span className="tag joined">Bergabung</span>}
                      </div>
                      <div style={{ fontSize:11, color:'var(--muted)' }}>6 Jalur Pembelajaran</div>
                    </div>
                  </div>
                  <p style={{ fontSize:12, color:'var(--muted)', lineHeight:1.7, marginBottom:18, minHeight:36 }}>
                    {k.deskripsi_komunitas||'Komunitas IT Himalkom IPB University dengan kurikulum terstruktur.'}
                  </p>
                  <Link href={`/eksplorasi/${k.id}`} style={{
                    display:'block', textAlign:'center', padding:'10px',
                    background:color, color:'#080c16', borderRadius:8,
                    fontSize:13, fontWeight:600, textDecoration:'none',
                    transition:'opacity .18s, transform .15s',
                  }}
                    onMouseEnter={e=>{e.currentTarget.style.opacity='.88';e.currentTarget.style.transform='translateY(-1px)'}}
                    onMouseLeave={e=>{e.currentTarget.style.opacity='1';e.currentTarget.style.transform='translateY(0)'}}
                  >
                    Pilih Jalur Peminatan →
                  </Link>
                </div>
              )
            })}
            {filtered.length===0 && !loading && (
              <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'60px', color:'var(--muted)', fontSize:14 }}>
                Tidak ada komunitas yang cocok dengan "<b>{search}</b>"
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}