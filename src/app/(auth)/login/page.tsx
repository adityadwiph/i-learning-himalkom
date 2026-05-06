'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

const COMMUNITIES = ['AgriUX','IWDC','CSI','CP','Gaming','Gary','MAD']

export default function LoginPage() {
  const router  = useRouter()
  const [tab, setTab]           = useState<'masuk'|'daftar'>('masuk')
  const [step, setStep]         = useState(1)
  const [showPass, setShowPass] = useState(false)
  const [activeCom, setActiveCom] = useState('AgriUX')

  /* Login state */
  const [email, setEmail]   = useState('')
  const [pass,  setPass]    = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  /* Register state */
  const [rName,  setRName]  = useState('')
  const [rNim,   setRNim]   = useState('')
  const [rEmail, setREmail] = useState('')
  const [rPass,  setRPass]  = useState('')
  const [rPass2, setRPass2] = useState('')
  const [rAgree, setRAgree] = useState(false)
  const [regErr, setRegErr] = useState('')
  const [regLoading, setRegLoading] = useState(false)
  const [regDone, setRegDone] = useState(false)

  /* ---- Handlers ---- */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginErr(''); setLoginLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    setLoginLoading(false)
    if (error) { setLoginErr('Email atau password salah.'); return }
    router.push('/eksplorasi')
  }

  function goStep2(e: React.FormEvent) {
    e.preventDefault(); setRegErr('')
    if (!rName.trim())  { setRegErr('Nama lengkap wajib diisi.'); return }
    if (!rNim.match(/^[A-Za-z]\d{10,}/)) { setRegErr('Format NIM tidak valid. Contoh: M0403241113'); return }
    if (!rEmail.includes('@apps.ipb.ac.id') && !rEmail.includes('@ipb.ac.id'))
      { setRegErr('Gunakan email IPB (@apps.ipb.ac.id)'); return }
    setStep(2)
  }

async function handleRegister(e: React.FormEvent) {
  e.preventDefault(); setRegErr('')
  if (rPass.length < 8)  { setRegErr('Password minimal 8 karakter.'); return }
  if (rPass !== rPass2)  { setRegErr('Konfirmasi password tidak cocok.'); return }
  if (!rAgree)           { setRegErr('Setujui syarat & ketentuan terlebih dahulu.'); return }
  setRegLoading(true)

  const { error } = await supabase.auth.signUp({ 
    email: rEmail, 
    password: rPass,
    options: {
      data: {
        username: rName,
        nim: rNim,
      }
    }
  })

  setRegLoading(false)
  if (error) { setRegErr(error.message); return }
  setRegDone(true)
}

  /* ---- Styles ---- */
  const inputStyle: React.CSSProperties = {
    width:'100%', padding:'10px 14px',
    background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)',
    borderRadius:8, color:'var(--text)', fontSize:13, fontFamily:'var(--font-b)',
    outline:'none', transition:'border-color .18s',
  }
  const labelStyle: React.CSSProperties = {
    display:'block', fontSize:10, letterSpacing:'.8px', textTransform:'uppercase',
    color:'var(--muted)', marginBottom:5, fontWeight:600,
  }
  const errBox: React.CSSProperties = {
    padding:'9px 13px', borderRadius:8, fontSize:12,
    background:'rgba(255,77,77,.1)', border:'1px solid rgba(255,77,77,.25)', color:'#ff8080',
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--bg)',
      backgroundImage:'radial-gradient(ellipse 55% 45% at 15% 55%, rgba(0,200,255,.07) 0%, transparent 65%)',
      padding:'16px',
    }}>
      <div style={{
        width:'100%', maxWidth:920, display:'flex', minHeight:580,
        background:'var(--bg2)', borderRadius:18, overflow:'hidden',
        border:'1px solid rgba(0,200,255,.08)',
        boxShadow:'0 32px 80px rgba(0,0,0,.55)',
      }}>

        {/* ========== LEFT PANEL ========== */}
        <div style={{
          flex:1, padding:'44px 40px', display:'flex', flexDirection:'column',
          justifyContent:'space-between',
          background:'linear-gradient(155deg, #080c16 0%, #0a1220 60%, #08101e 100%)',
          borderRight:'1px solid rgba(255,255,255,.05)',
          position:'relative', overflow:'hidden',
        }}>
          {/* Glow orb */}
          <div style={{
            position:'absolute', top:-120, left:-100, width:340, height:340,
            background:'radial-gradient(circle, rgba(0,200,255,.08) 0%, transparent 70%)',
            pointerEvents:'none',
          }}/>

          <div>
            {/* Logo */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:40 }}>
              <div style={{
                width:38, height:38, background:'var(--cyan)', borderRadius:10,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'var(--font-d)', fontWeight:900, fontSize:15, color:'#080c16',
              }}>IL</div>
              <span style={{ fontFamily:'var(--font-d)', fontSize:19, fontWeight:700, color:'var(--cyan)', letterSpacing:.5 }}>
                I-Learning
              </span>
            </div>

            {/* Hero text */}
            <h1 style={{
              fontFamily:'var(--font-d)', fontWeight:900, lineHeight:1.0,
              fontSize:'clamp(30px,4vw,44px)', color:'#fff', marginBottom:14,
            }}>
              SELAMAT<br/>DATANG<br/>
              <span style={{ color:'var(--cyan)' }}>ILKOMERZ!</span>
            </h1>
            <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.7, maxWidth:270, marginBottom:32 }}>
              Jelajahi roadmap dari 7 komunitas di Himalkom. Lacak progressmu dan raih spesialisasi IT yang kamu minati.
            </p>

            {/* Feature list */}
            {['Kurikulum dari komunitas Himalkom','Pelacakan progress belajar real-time','Roadmap interaktif per spesialisasi'].map(f => (
              <div key={f} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:11 }}>
                <div style={{
                  width:26, height:26, borderRadius:'50%', flexShrink:0,
                  background:'var(--cyan-10)', border:'1px solid var(--cyan-20)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'var(--cyan)', fontSize:11,
                }}>◎</div>
                <span style={{ fontSize:12, color:'rgba(232,237,248,.55)' }}>{f}</span>
              </div>
            ))}
          </div>

          {/* Community tags */}
          <div>
            <div style={{ fontSize:9, letterSpacing:'2px', color:'rgba(255,255,255,.22)', marginBottom:9, fontWeight:600 }}>
              ILKOMUNITY
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {COMMUNITIES.map(c => (
                <button key={c} onClick={() => setActiveCom(c)} style={{
                  padding:'3px 11px', borderRadius:20, fontSize:11, fontWeight:500,
                  border:`1px solid ${c===activeCom ? 'var(--cyan)' : 'rgba(0,200,255,.22)'}`,
                  color: c===activeCom ? '#080c16' : 'var(--cyan)',
                  background: c===activeCom ? 'var(--cyan)' : 'var(--cyan-10)',
                  cursor:'pointer', transition:'all .18s',
                }}>{c}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ========== RIGHT PANEL ========== */}
        <div style={{ width:380, padding:'36px 34px', display:'flex', flexDirection:'column', background:'var(--bg2)' }}>

          {/* Tab switcher */}
          <div style={{
            display:'flex', background:'rgba(255,255,255,.04)',
            borderRadius:10, padding:3, marginBottom:30,
          }}>
            {(['masuk','daftar'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setStep(1); setRegErr(''); setLoginErr('') }} style={{
                flex:1, padding:'7px', border:'none', borderRadius:8, cursor:'pointer',
                background: tab===t ? 'var(--cyan)' : 'transparent',
                color: tab===t ? '#080c16' : 'var(--muted)',
                fontSize:13, fontWeight:600, fontFamily:'var(--font-b)', transition:'all .18s',
                textTransform:'capitalize',
              }}>{t==='masuk' ? 'Masuk' : 'Daftar'}</button>
            ))}
          </div>

          {/* ---- LOGIN ---- */}
          {tab==='masuk' && (
            <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', flex:1 }}>
              <h2 style={{ fontFamily:'var(--font-d)', fontSize:26, fontWeight:900, color:'#fff', marginBottom:4 }}>
                Welcome Back!
              </h2>
              <p style={{ fontSize:12, color:'var(--muted)', marginBottom:26, lineHeight:1.6 }}>
                Masuk untuk melanjutkan progress belajar mu king!
              </p>

              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>Email IPB</label>
                <input className="il-input" type="email" required
                  placeholder="nama@apps.ipb.ac.id"
                  value={email} onChange={e=>setEmail(e.target.value)} style={inputStyle}
                  onFocus={e=>e.target.style.borderColor='var(--cyan-30)'}
                  onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'}
                />
              </div>

              <div style={{ marginBottom:6 }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position:'relative' }}>
                  <input className="il-input" type={showPass?'text':'password'} required
                    placeholder="Masukkan Password"
                    value={pass} onChange={e=>setPass(e.target.value)}
                    style={{ ...inputStyle, paddingRight:42 }}
                    onFocus={e=>e.target.style.borderColor='var(--cyan-30)'}
                    onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'}
                  />
                  <button type="button" onClick={()=>setShowPass(!showPass)} style={{
                    position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:15,
                  }}>{showPass?'🙈':'👁'}</button>
                </div>
              </div>
              <div style={{ textAlign:'right', marginBottom:24 }}>
                <span style={{ fontSize:11, color:'var(--cyan)', cursor:'pointer' }}>Lupa password?</span>
              </div>

              {loginErr && <div style={{ ...errBox, marginBottom:12 }}>{loginErr}</div>}

              <button type="submit" className="btn-primary" disabled={loginLoading}
                style={{ width:'100%', padding:12, fontSize:14, marginBottom:14 }}>
                {loginLoading ? 'Memproses...' : 'Masuk ke Dashboard'}
              </button>
              <p style={{ textAlign:'center', fontSize:11, color:'var(--muted)' }}>
                Belum punya akun?{' '}
                <span onClick={()=>setTab('daftar')} style={{ color:'var(--cyan)', cursor:'pointer' }}>
                  Daftar sekarang
                </span>
              </p>
            </form>
          )}

          {/* ---- REGISTER ---- */}
          {tab==='daftar' && !regDone && (
            <div style={{ flex:1 }}>
              <h2 style={{ fontFamily:'var(--font-d)', fontSize:24, fontWeight:900, color:'#fff', marginBottom:4 }}>
                Create Your Account
              </h2>
              <p style={{ fontSize:12, color:'var(--muted)', marginBottom:18, lineHeight:1.6 }}>
                Bergabung dan mulai perjalanan karir IT-mu #fokuskarir
              </p>

              {/* Step indicator */}
              <div style={{ display:'flex', gap:8, marginBottom:22 }}>
                {[1,2].map(s => (
                  <div key={s} style={{
                    display:'flex', alignItems:'center', gap:6, padding:'4px 12px',
                    borderRadius:20, fontSize:11, fontWeight:500,
                    border:`1px solid ${step>=s?'var(--cyan-30)':'rgba(255,255,255,.1)'}`,
                    color: step===s ? 'var(--cyan)' : step>s ? 'rgba(0,200,255,.5)' : 'var(--muted)',
                    background: step>=s ? 'var(--cyan-10)' : 'transparent',
                  }}>
                    <div style={{
                      width:16, height:16, borderRadius:'50%', fontSize:9,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      background: step>=s ? 'var(--cyan)' : 'rgba(255,255,255,.1)',
                      color: step>=s ? '#080c16' : 'var(--muted)', fontWeight:700,
                    }}>{step>s?'✓':s}</div>
                    {s===1 ? 'Identitas' : 'Keamanan'}
                  </div>
                ))}
              </div>

              {/* Step 1 */}
              {step===1 && (
                <form onSubmit={goStep2} style={{ display:'flex', flexDirection:'column', gap:13 }}>
                  <div>
                    <label style={labelStyle}>Nama Lengkap</label>
                    <input style={inputStyle} type="text" required placeholder="Masukkan nama lengkap anda"
                      value={rName} onChange={e=>setRName(e.target.value)}
                      onFocus={e=>e.target.style.borderColor='var(--cyan-30)'}
                      onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>NIM</label>
                    <input style={inputStyle} type="text" required placeholder="Contoh: M0403241113"
                      value={rNim} onChange={e=>setRNim(e.target.value)}
                      onFocus={e=>e.target.style.borderColor='var(--cyan-30)'}
                      onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email IPB</label>
                    <input style={inputStyle} type="email" required placeholder="nama@apps.ipb.ac.id"
                      value={rEmail} onChange={e=>setREmail(e.target.value)}
                      onFocus={e=>e.target.style.borderColor='var(--cyan-30)'}
                      onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'}
                    />
                  </div>
                  {regErr && <div style={errBox}>{regErr}</div>}
                  <button type="submit" className="btn-primary" style={{ width:'100%', padding:11 }}>
                    Buat Password →
                  </button>
                  <p style={{ textAlign:'center', fontSize:11, color:'var(--muted)' }}>
                    Sudah punya akun?{' '}
                    <span onClick={()=>setTab('masuk')} style={{ color:'var(--cyan)', cursor:'pointer' }}>Login di sini</span>
                  </p>
                </form>
              )}

              {/* Step 2 */}
              {step===2 && (
                <form onSubmit={handleRegister} style={{ display:'flex', flexDirection:'column', gap:13 }}>
                  {/* Summary */}
                  <div style={{
                    display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                    background:'var(--cyan-10)', border:'1px solid var(--border-c)', borderRadius:10,
                  }}>
                    <div style={{
                      width:30, height:30, borderRadius:'50%', background:'var(--cyan-20)',
                      border:'1px solid var(--cyan-30)', display:'flex', alignItems:'center',
                      justifyContent:'center', fontWeight:700, fontSize:12, color:'var(--cyan)',
                    }}>{rName[0]?.toUpperCase()}</div>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{rName}</div>
                      <div style={{ fontSize:10, color:'var(--muted)' }}>{rNim} · {rEmail}</div>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Buat Password</label>
                    <input style={inputStyle} type="password" required placeholder="Minimal 8 karakter"
                      value={rPass} onChange={e=>setRPass(e.target.value)}
                      onFocus={e=>e.target.style.borderColor='var(--cyan-30)'}
                      onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Konfirmasi Password</label>
                    <input style={inputStyle} type="password" required placeholder="Ulangi password"
                      value={rPass2} onChange={e=>setRPass2(e.target.value)}
                      onFocus={e=>e.target.style.borderColor='var(--cyan-30)'}
                      onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'}
                    />
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                    <input type="checkbox" id="agree" checked={rAgree} onChange={e=>setRAgree(e.target.checked)}
                      style={{ marginTop:2, accentColor:'var(--cyan)', flexShrink:0 }}/>
                    <label htmlFor="agree" style={{ fontSize:11, color:'var(--muted)', lineHeight:1.6, cursor:'pointer' }}>
                      Saya menyetujui <span style={{ color:'var(--cyan)' }}>Ketentuan Penggunaan</span> dan{' '}
                      <span style={{ color:'var(--cyan)' }}>Kebijakan Privasi</span> Website I-Learning.
                    </label>
                  </div>
                  {regErr && <div style={errBox}>{regErr}</div>}
                  <button type="submit" className="btn-primary" disabled={regLoading}
                    style={{ width:'100%', padding:11 }}>
                    {regLoading ? 'Membuat akun...' : 'Buat Akun'}
                  </button>
                  <button type="button" onClick={()=>{setStep(1);setRegErr('')}} style={{
                    background:'none', border:'none', color:'var(--muted)', fontSize:12,
                    cursor:'pointer', fontFamily:'var(--font-b)', textAlign:'center',
                  }}>← Kembali</button>
                </form>
              )}
            </div>
          )}

          {/* Register success */}
          {tab==='daftar' && regDone && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', gap:14 }}>
              <div style={{ fontSize:48 }}>🎉</div>
              <h2 style={{ fontFamily:'var(--font-d)', fontSize:22, color:'#fff' }}>Akun Berhasil Dibuat!</h2>
              <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.7, maxWidth:260 }}>
                Cek email <strong style={{ color:'var(--cyan)' }}>{rEmail}</strong> untuk verifikasi, lalu login.
              </p>
              <button onClick={()=>{setTab('masuk');setRegDone(false)}} className="btn-primary">
                Masuk Sekarang
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
