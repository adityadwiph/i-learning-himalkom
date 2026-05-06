'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import Navbar from '@/components/ui/navbar'

interface LP       { id: string; 'Nama Learning Path': string; deskripsi: string }
interface Komunitas{ id: string; nama_komunitas: string }
interface Profile  { username: string }

const KOM_ICON: Record<string,string> = {
  CSI:'🛡', IWDC:'🌐', AgriUX:'🎨', Gaming:'🎮', Gary:'⚡', MAD:'🤖', CP:'{}',
}

export default function SpesialisasiPage() {
  const { id }    = useParams<{ id:string }>()
  const router    = useRouter()
  const [profile, setProfile]   = useState<Profile|null>(null)
  const [nim,     setNim]       = useState('')
  const [kom,     setKom]       = useState<Komunitas|null>(null)
  const [paths,   setPaths]     = useState<LP[]>([])
  const [selected,setSelected]  = useState<string|null>(null)
  const [joining, setJoining]   = useState(false)
  const [loading, setLoading]   = useState(true)

  useEffect(()=>{ init() },[id])

  async function init() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const [{ data:prof },{ data:k },{ data:klp }] = await Promise.all([
      supabase.from('profiles').select('username').eq('id',user.id).single(),
      supabase.from('komunitas').select('id,nama_komunitas').eq('id',id).single(),
      supabase.from('komunitas_learningpath')
        .select('Learning_Path_id, learningpath(id, deskripsi, "Nama Learning Path")')
        .eq('komunitas_id',id),
    ])
    setProfile(prof)
    setKom(k)

    const lps: LP[] = (klp||[]).map((row: { Learning_Path_id: string; learningpath: LP | LP[] | null })=>{
      const lp = row.learningpath
      return (Array.isArray(lp)?lp[0]:lp) as LP
    }).filter(Boolean)
    setPaths(lps)
    if (lps.length) setSelected(lps[0].id)
    setLoading(false)
  }

  async function pilih(lpId: string) {
    setJoining(true)
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return
    await Promise.all([
      supabase.from('komunitas_member').upsert({ id_user:user.id, id_komunitas:id }),
      supabase.from('user_learningpath').upsert({ user_id:user.id, LearningPath_id:lpId }),
    ])
    setJoining(false)
    router.push(`/learning-path/${lpId}`)
  }

  const name = kom?.nama_komunitas||''
  const icon = KOM_ICON[name]||'📚'

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar username={profile?.username}/>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:'var(--muted)' }}>
        Memuat...
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar username={profile?.username} nim={nim}/>

      <main style={{ maxWidth:960, margin:'0 auto', padding:'44px 24px 80px' }}>

        <Link href="/eksplorasi" className="btn-ghost" style={{ fontSize:12, padding:'6px 14px', marginBottom:28, display:'inline-flex' }}>
          ← Ganti Komunitas
        </Link>

        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:22 }}>
          <div style={{
            width:44, height:44, borderRadius:12, background:'var(--cyan-10)',
            border:'1px solid var(--border-c)', display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:22,
          }}>{icon}</div>
          <div>
            <div style={{ fontSize:10, color:'var(--muted)', letterSpacing:'1px', marginBottom:2 }}>KOMUNITAS TERPILIH</div>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{name}</div>
          </div>
        </div>

        <h1 className="fade-up" style={{
          fontFamily:'var(--font-d)', fontWeight:900, fontSize:'clamp(26px,4vw,44px)',
          lineHeight:1.08, color:'#fff', marginBottom:12,
        }}>
          Pilih <span style={{ color:'var(--cyan)' }}>Jalur Spesialisasi</span> mu
        </h1>
        <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.7, marginBottom:44 }}>
          Setiap pembelajaran memiliki fokus yang berbeda. Baca deskripsi dengan teliti sebelum memilih.
        </p>

        {paths.length===0 ? (
          <div className="card" style={{ padding:'60px', textAlign:'center', color:'var(--muted)' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>📭</div>
            <p>Belum ada learning path untuk komunitas ini.</p>
          </div>
        ) : (
          <>
            <div className="fade-up d1" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14, marginBottom:36 }}>
              {paths.map((lp,i)=>{
                const isSelected = selected===lp.id
                const lpName = lp['Nama Learning Path']
                return (
                  <div key={lp.id} onClick={()=>setSelected(lp.id)} style={{
                    padding:22, borderRadius:14, cursor:'pointer',
                    border:`1px solid ${isSelected?'rgba(0,200,255,.45)':'var(--border)'}`,
                    background: isSelected ? 'rgba(0,200,255,.06)' : 'var(--bg3)',
                    boxShadow: isSelected ? '0 0 0 1px rgba(0,200,255,.2),0 8px 32px rgba(0,200,255,.1)' : 'none',
                    transition:'all .2s', animationDelay:`${i*.07}s`,
                  }}>
                    <div style={{
                      width:20, height:20, borderRadius:6,
                      border:`2px solid ${isSelected?'var(--cyan)':'rgba(255,255,255,.2)'}`,
                      background: isSelected ? 'var(--cyan)' : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      marginBottom:14, transition:'all .18s',
                    }}>
                      {isSelected && <span style={{ color:'#080c16', fontSize:12, fontWeight:900 }}>✓</span>}
                    </div>

                    <div style={{
                      fontFamily:'var(--font-d)', fontSize:15, fontWeight:800,
                      color: isSelected?'var(--cyan)':'#fff', marginBottom:10,
                    }}>{lpName}</div>

                    <p style={{ fontSize:12, color:'var(--muted)', lineHeight:1.65, marginBottom:16 }}>
                      {lp.deskripsi||'Jalur pembelajaran terstruktur untuk mencapai kompetensi di bidang ini.'}
                    </p>

                    <div style={{ display:'flex', gap:16, marginBottom:16 }}>
                      {['4-6 bulan','8+ Modul'].map(info=>(
                        <div key={info} style={{ fontSize:11, color:isSelected?'rgba(0,200,255,.7)':'var(--muted)' }}>{info}</div>
                      ))}
                    </div>

                    <button onClick={e=>{e.stopPropagation();pilih(lp.id)}} disabled={joining}
                      style={{
                        width:'100%', padding:'9px', border:`1px solid ${isSelected?'var(--cyan)':'rgba(255,255,255,.15)'}`,
                        borderRadius:8, background: isSelected?'var(--cyan)':'transparent',
                        color: isSelected?'#080c16':'var(--muted)',
                        fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-b)',
                        transition:'all .18s',
                      }}>
                      {joining?'Mendaftarkan...':'Pilih ini'}
                    </button>
                  </div>
                )
              })}
            </div>

            {selected && (
              <div style={{ textAlign:'center' }}>
                <button onClick={()=>pilih(selected)} disabled={joining} className="btn-primary" style={{ padding:'13px 40px', fontSize:14 }}>
                  {joining?'Mendaftarkan...': `Mulai Learning Path ${paths.find(p=>p.id===selected)?.['Nama Learning Path']} →`}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}