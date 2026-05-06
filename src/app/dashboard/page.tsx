'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import Navbar from '@/components/ui/navbar'

interface Profile { username:string }
interface EnrolledLP { id:string; name:string; done:number; total:number }
interface RecentAct  { judul:string; status:string; updated_at:string }

function timeAgo(ts:string) {
  const diff = Date.now()-new Date(ts).getTime()
  const m = Math.floor(diff/60000)
  if (m<1)  return 'baru saja'
  if (m<60) return `${m}m lalu`
  const h = Math.floor(m/60)
  if (h<24) return `${h}j lalu`
  return `${Math.floor(h/24)}h lalu`
}

export default function DashboardPage() {
  const router = useRouter()
  const [profile,  setProfile]  = useState<Profile|null>(null)
  const [nim,      setNim]      = useState('')
  const [stats,    setStats]    = useState({ done:0, total:0, komunitas:0 })
  const [enrolled, setEnrolled] = useState<EnrolledLP[]>([])
  const [recent,   setRecent]   = useState<RecentAct[]>([])
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const [{ data:prof },{ data:mhs },{ data:ulp },{ data:prog },{ data:km }] = await Promise.all([
      supabase.from('profiles').select('username').eq('id',user.id).single(),
      supabase.from('Mahasiswa').select('NIM').eq('id',user.id).single(),
      supabase.from('user_learningpath').select('LearningPath_id,learningpath(id,Nama_Learning_Path)').eq('user_id',user.id),
      supabase.from('progress').select('roadmapnode_id,status,updated_at,roadmapnode(judul)').eq('user_id',user.id).order('updated_at',{ascending:false}).limit(6),
      supabase.from('komunitas_member').select('id_komunitas').eq('id_user',user.id),
    ])
    setProfile(prof); setNim(mhs?.NIM||'')

  setRecent((prog || []).map((p: any) => ({
      judul: p.roadmapnode?.judul || 'Materi',
      status: p.status,
      updated_at: p.updated_at,
  })))

    // Build enrolled paths with done/total counts
    const paths: EnrolledLP[] = await Promise.all(
      (ulp||[]).map(async (u:{ LearningPath_id:string; learningpath:{ id:string; Nama_Learning_Path:string }[] | null }) => {
        const lpId   = u.LearningPath_id
        const lpName = (Array.isArray(u.learningpath)?u.learningpath[0]:u.learningpath)?.Nama_Learning_Path||'Learning Path'
        const { data:allN } = await supabase.from('roadmapnode').select('id').eq('learningpath_id',lpId)
        const ids = (allN||[]).map((n:{ id:string })=>n.id)
        const { data:doneN } = ids.length
          ? await supabase.from('progress').select('id').eq('user_id',user.id).eq('status','selesai').in('roadmapnode_id',ids)
          : { data:[] }
        return { id:lpId, name:lpName, done:doneN?.length||0, total:ids.length }
      })
    )
    setEnrolled(paths)

    const totalNodes = paths.reduce((a,b)=>a+b.total,0)
    const doneNodes  = paths.reduce((a,b)=>a+b.done,0)
    setStats({ done:doneNodes, total:totalNodes, komunitas:km?.length||0 })
    setLoading(false)
  }, [router])

  useEffect(()=>{ load() },[load])

  const pct = stats.total>0 ? Math.round((stats.done/stats.total)*100) : 0

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar username={profile?.username}/>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:'var(--muted)' }}>
        Memuat dashboard...
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar username={profile?.username} nim={nim}/>

      <main style={{ maxWidth:980, margin:'0 auto', padding:'44px 24px 80px' }}>

        {/* Welcome */}
        <div className="fade-up" style={{ marginBottom:36 }}>
          <h1 style={{ fontFamily:'var(--font-d)', fontWeight:900, fontSize:'clamp(22px,3.5vw,36px)', color:'#fff', marginBottom:6 }}>
            Halo, <span style={{ color:'var(--cyan)' }}>{profile?.username}!</span> 👋
          </h1>
          <p style={{ fontSize:13, color:'var(--muted)' }}>Lanjutkan perjalanan belajarmu hari ini.</p>
        </div>

        {/* Stats */}
        <div className="fade-up d1" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:36 }}>
          {[
            { label:'Total Progress', val:`${pct}%`,                bar:pct,                          color:'var(--cyan)'  },
            { label:'Node Selesai',   val:`${stats.done} node`,     bar:pct,                          color:'var(--green)' },
            { label:'Komunitas Aktif',val:`${stats.komunitas}`,     bar:(stats.komunitas/7)*100,      color:'var(--amber)' },
          ].map(s=>(
            <div key={s.label} className="card" style={{ padding:'20px 22px' }}>
              <div style={{ fontSize:10, color:'var(--muted)', letterSpacing:'.8px', textTransform:'uppercase', marginBottom:8 }}>{s.label}</div>
              <div style={{ fontFamily:'var(--font-d)', fontSize:30, fontWeight:900, color:'#fff', marginBottom:10 }}>{s.val}</div>
              <div style={{ height:3, background:'rgba(255,255,255,.06)', borderRadius:2 }}>
                <div style={{ height:'100%', width:`${Math.min(s.bar,100)}%`, background:s.color, borderRadius:2, transition:'width 1s' }}/>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

          {/* Learning paths */}
          <div className="fade-up d2">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ fontSize:11, color:'var(--muted)', letterSpacing:'1px', textTransform:'uppercase', fontWeight:600 }}>Learning Path Aktif</div>
              <Link href="/eksplorasi" style={{ fontSize:11, color:'var(--cyan)', textDecoration:'none' }}>+ Tambah</Link>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {enrolled.length===0 ? (
                <div className="card" style={{ padding:'28px', textAlign:'center' }}>
                  <p style={{ fontSize:13, color:'var(--muted)', marginBottom:14 }}>Belum ada learning path.</p>
                  <Link href="/eksplorasi" className="btn-primary" style={{ fontSize:12 }}>Jelajahi Komunitas</Link>
                </div>
              ) : enrolled.map(lp=>{
                const p = lp.total>0?Math.round((lp.done/lp.total)*100):0
                return (
                  <Link key={lp.id} href={`/learning-path/${lp.id}`} className="card" style={{ padding:'16px 20px', textDecoration:'none', display:'block' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{lp.name}</div>
                      <div style={{ fontSize:11, color:'var(--cyan)' }}>{p}%</div>
                    </div>
                    <div style={{ height:3, background:'rgba(255,255,255,.06)', borderRadius:2, marginBottom:6 }}>
                      <div style={{ height:'100%', width:`${p}%`, background:'var(--cyan)', borderRadius:2 }}/>
                    </div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>{lp.done}/{lp.total} node selesai</div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Recent activity */}
          <div className="fade-up d3">
            <div style={{ fontSize:11, color:'var(--muted)', letterSpacing:'1px', textTransform:'uppercase', fontWeight:600, marginBottom:14 }}>
              Aktivitas Terbaru
            </div>
            <div className="card" style={{ padding:'16px 20px' }}>
              {recent.length===0 ? (
                <p style={{ fontSize:13, color:'var(--muted)', textAlign:'center', padding:'20px 0' }}>Belum ada aktivitas.</p>
              ) : recent.map((r,i)=>(
                <div key={i} style={{
                  display:'flex', alignItems:'center', gap:10, padding:'10px 0',
                  borderBottom: i<recent.length-1 ? '1px solid rgba(255,255,255,.05)' : 'none',
                }}>
                  <div style={{
                    width:7, height:7, borderRadius:'50%', flexShrink:0,
                    background: r.status==='selesai'?'var(--green)':'var(--cyan)',
                  }}/>
                  <div style={{ flex:1, fontSize:12, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    <b>{r.judul}</b>
                    <span style={{ color:'var(--muted)', marginLeft:5, fontSize:11 }}>· {r.status}</span>
                  </div>
                  <div style={{ fontSize:10, color:'var(--muted)', flexShrink:0 }}>{timeAgo(r.updated_at)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
