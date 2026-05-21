'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

const COMMUNITIES = ['AgriUX', 'IWDC', 'CSI', 'CP', 'Gaming', 'Gary', 'MAD']

export default function LupaPasswordPage() {
  const router = useRouter()
  const [step, setStep]         = useState<1 | 2 | 3>(1)
  const [email, setEmail]       = useState('')
  const [otp,   setOtp]         = useState(['', '', '', '', '', ''])
  const [pass,  setPass]        = useState('')
  const [pass2, setPass2]       = useState('')
  const [showP, setShowP]       = useState(false)
  const [showP2,setShowP2]      = useState(false)
  const [loading, setLoading]   = useState(false)
  const [err, setErr]           = useState('')
  const [success, setSuccess]   = useState(false)
  const [resendCd, setResendCd] = useState(0)
  const [activeCom, setActiveCom] = useState('AgriUX')
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (resendCd <= 0) return
    const t = setTimeout(() => setResendCd(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCd])

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    if (!email.includes('@apps.ipb.ac.id') && !email.includes('@ipb.ac.id')) {
      setErr('Gunakan email IPB (@apps.ipb.ac.id)'); return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false }
    })
    setLoading(false)
    if (error) { setErr(error.message); return }
    setStep(2)
    setResendCd(60)
  }

  function handleOtpChange(val: string, idx: number) {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[idx] = val; setOtp(next)
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus()
    if (!val && idx > 0) otpRefs.current[idx - 1]?.focus()
  }

  function handleOtpKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus()
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault(); setErr('')
    const code = otp.join('')
    if (code.length < 6) { setErr('Masukkan 6 digit kode OTP'); return }
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
    setLoading(false)
    if (error) { setErr('Kode OTP salah atau sudah kadaluarsa.'); return }
    setStep(3)
  }

  async function handleResend() {
    if (resendCd > 0) return
    await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
    setResendCd(60); setOtp(['', '', '', '', '', ''])
    otpRefs.current[0]?.focus()
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault(); setErr('')
    if (pass.length < 8) { setErr('Password minimal 8 karakter'); return }
    if (pass !== pass2)  { setErr('Konfirmasi password tidak cocok'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pass })
    setLoading(false)
    if (error) { setErr(error.message); return }
    setSuccess(true)
    setTimeout(() => router.push('/login'), 2500)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
    borderRadius: 8, color: 'var(--text)', fontSize: 13,
    fontFamily: 'var(--font-b)', outline: 'none', transition: 'border-color .18s',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 10, letterSpacing: '.8px', textTransform: 'uppercase',
    color: 'var(--muted)', marginBottom: 5, fontWeight: 600,
  }
  const errBox: React.CSSProperties = {
    padding: '9px 13px', borderRadius: 8, fontSize: 12,
    background: 'rgba(255,77,77,.1)', border: '1px solid rgba(255,77,77,.25)', color: '#ff8080',
  }

  const stepDone   = (s: number) => s < step
  const stepActive = (s: number) => s === step

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse 55% 45% at 15% 55%, rgba(0,200,255,.07) 0%, transparent 65%)',
      padding: '16px',
    }}>
      <div style={{
        width: '100%', maxWidth: 920, display: 'flex', minHeight: 580,
        background: 'var(--bg2)', borderRadius: 18, overflow: 'hidden',
        border: '1px solid rgba(0,200,255,.08)',
        boxShadow: '0 32px 80px rgba(0,0,0,.55)',
      }}>

        {/* ===== LEFT PANEL — identik dengan login ===== */}
        <div style={{
          flex: 1, padding: '44px 40px', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(155deg, #080c16 0%, #0a1220 60%, #08101e 100%)',
          borderRight: '1px solid rgba(255,255,255,.05)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Glow orb */}
          <div style={{
            position: 'absolute', top: -120, left: -100, width: 340, height: 340,
            background: 'radial-gradient(circle, rgba(0,200,255,.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
              <div style={{
                width: 38, height: 38, background: 'var(--cyan)', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-d)', fontWeight: 900, fontSize: 15, color: '#080c16',
              }}>IL</div>
              <span style={{ fontFamily: 'var(--font-d)', fontSize: 19, fontWeight: 700, color: 'var(--cyan)', letterSpacing: .5 }}>
                I-Learning
              </span>
            </div>

            {/* Hero text */}
            <h1 style={{
              fontFamily: 'var(--font-d)', fontWeight: 900, lineHeight: 1.0,
              fontSize: 'clamp(30px,4vw,44px)', color: '#fff', marginBottom: 14,
            }}>
              SELAMAT<br />DATANG<br />
              <span style={{ color: 'var(--cyan)' }}>ILKOMERZ!</span>
            </h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 270, marginBottom: 32 }}>
              Jelajahi roadmap dari 7 komunitas di Himalkom. Lacak progressmu dan raih spesialisasi IT yang kamu minati.
            </p>

            {/* Feature list */}
            {['Kurikulum dari komunitas Himalkom', 'Pelacakan progress belajar real-time', 'Roadmap interaktif per spesialisasi'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--cyan-10)', border: '1px solid rgba(0,200,255,.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--cyan)', fontSize: 11,
                }}>◎</div>
                <span style={{ fontSize: 12, color: 'rgba(232,237,248,.55)' }}>{f}</span>
              </div>
            ))}
          </div>

          {/* Community tags */}
          <div>
            <div style={{ fontSize: 9, letterSpacing: '2px', color: 'rgba(255,255,255,.22)', marginBottom: 9, fontWeight: 600 }}>
              ILKOMUNITY
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {COMMUNITIES.map(c => (
                <button key={c} onClick={() => setActiveCom(c)} style={{
                  padding: '3px 11px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                  border: `1px solid ${c === activeCom ? 'var(--cyan)' : 'rgba(0,200,255,.22)'}`,
                  color: c === activeCom ? '#080c16' : 'var(--cyan)',
                  background: c === activeCom ? 'var(--cyan)' : 'rgba(0,200,255,.08)',
                  cursor: 'pointer', transition: 'all .18s',
                }}>{c}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ===== RIGHT PANEL ===== */}
        <div style={{ width: 380, padding: '36px 34px', display: 'flex', flexDirection: 'column', background: 'var(--bg2)' }}>

          {/* Step indicator — posisi sama dengan tab Masuk/Daftar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 0,
            marginBottom: 30,
          }}>
            {[{ n: 1, label: 'Email' }, { n: 2, label: 'Verifikasi' }, { n: 3, label: 'Reset' }].map((s, i) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700,
                    background: stepDone(s.n) ? 'var(--green)' : stepActive(s.n) ? 'var(--cyan)' : 'rgba(255,255,255,.1)',
                    color: stepDone(s.n) || stepActive(s.n) ? '#080c16' : 'rgba(255,255,255,.35)',
                    transition: 'all .3s', flexShrink: 0,
                  }}>
                    {stepDone(s.n) ? '✓' : s.n}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: stepActive(s.n) ? 600 : 400,
                    color: stepDone(s.n) ? 'var(--green)' : stepActive(s.n) ? 'var(--text)' : 'rgba(255,255,255,.3)',
                    transition: 'all .3s',
                  }}>{s.label}</span>
                </div>
                {i < 2 && (
                  <div style={{
                    width: 28, height: 1, margin: '0 6px',
                    background: stepDone(s.n) ? 'var(--green)' : 'rgba(255,255,255,.1)',
                    transition: 'background .3s',
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* Title */}
          <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 26, fontWeight: 900, color: 'var(--cyan)', marginBottom: 4 }}>
            Lupa Password
          </h2>

          {/* ---- STEP 1: Email ---- */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingTop: 12 }}>
              <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.65, marginBottom: 20 }}>
                Masukkan email IPB-mu. Kami akan mengirimkan kode OTP untuk mereset password.
              </p>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Email IPB</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 13 }}>✉</span>
                  <input
                    type="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="nama@apps.ipb.ac.id"
                    style={{ ...inputStyle, paddingLeft: 34 }}
                    onFocus={e => e.target.style.borderColor = 'rgba(0,200,255,.35)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'}
                  />
                </div>
              </div>
              {err && <div style={{ ...errBox, marginBottom: 12 }}>{err}</div>}
              <button type="submit" disabled={loading} className="btn-primary"
                style={{ width: '100%', padding: 12, fontSize: 14, marginBottom: 12 }}>
                {loading ? 'Mengirim...' : 'Kirim OTP'}
              </button>
              <Link href="/login" style={{ textAlign: 'center', fontSize: 11, color: 'var(--cyan)', textDecoration: 'none' }}>
                ← Kembali ke Login
              </Link>
            </form>
          )}

          {/* ---- STEP 2: OTP ---- */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingTop: 12 }}>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
                Kode OTP 6 digit telah dikirim ke:
              </p>
              <div style={{
                padding: '9px 13px', borderRadius: 8, marginBottom: 18,
                border: '1px solid rgba(0,200,255,.25)', background: 'rgba(0,200,255,.05)',
                fontSize: 13, color: 'var(--cyan)', fontWeight: 500,
              }}>{email}</div>

              {/* OTP boxes */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el }}
                    type="text" inputMode="numeric" maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(e.target.value, i)}
                    onKeyDown={e => handleOtpKeyDown(e, i)}
                    style={{
                      width: 44, height: 50, textAlign: 'center',
                      fontSize: 20, fontWeight: 700,
                      color: digit ? 'var(--cyan)' : 'rgba(255,255,255,.25)',
                      background: digit ? 'rgba(0,200,255,.08)' : 'rgba(255,255,255,.04)',
                      border: `1px solid ${digit ? 'rgba(0,200,255,.45)' : 'rgba(255,255,255,.1)'}`,
                      borderRadius: 8, outline: 'none',
                      fontFamily: 'var(--font-d)', transition: 'all .18s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(0,200,255,.6)'}
                    onBlur={e => { e.target.style.borderColor = digit ? 'rgba(0,200,255,.45)' : 'rgba(255,255,255,.1)' }}
                  />
                ))}
              </div>

              {err && <div style={{ ...errBox, marginBottom: 12 }}>{err}</div>}

              <button type="submit" disabled={loading} className="btn-primary"
                style={{ width: '100%', padding: 12, fontSize: 14, marginBottom: 12 }}>
                {loading ? 'Memverifikasi...' : 'Verifikasi Kode'}
              </button>
              <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)' }}>
                Tidak menerima kode?{' '}
                <span onClick={handleResend} style={{
                  color: resendCd > 0 ? 'rgba(255,255,255,.25)' : 'var(--cyan)',
                  cursor: resendCd > 0 ? 'default' : 'pointer', fontWeight: 500,
                }}>
                  {resendCd > 0 ? `Kirim ulang (${resendCd}s)` : 'Kirim ulang'}
                </span>
              </p>
            </form>
          )}

          {/* ---- STEP 3: Reset Password ---- */}
          {step === 3 && !success && (
            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingTop: 12 }}>
              <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.65, marginBottom: 20 }}>
                Buat password baru yang mudah kamu ingat
              </p>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Buat Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showP ? 'text' : 'password'} required value={pass}
                    onChange={e => setPass(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    style={{ ...inputStyle, paddingRight: 42 }}
                    onFocus={e => e.target.style.borderColor = 'rgba(0,200,255,.35)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'}
                  />
                  <button type="button" onClick={() => setShowP(!showP)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 15,
                  }}>{showP ? '🙈' : '👁'}</button>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Konfirmasi Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showP2 ? 'text' : 'password'} required value={pass2}
                    onChange={e => setPass2(e.target.value)}
                    placeholder="Ulangi password"
                    style={{ ...inputStyle, paddingRight: 42 }}
                    onFocus={e => e.target.style.borderColor = 'rgba(0,200,255,.35)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'}
                  />
                  <button type="button" onClick={() => setShowP2(!showP2)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 15,
                  }}>{showP2 ? '🙈' : '👁'}</button>
                </div>
              </div>
              {err && <div style={{ ...errBox, marginBottom: 12 }}>{err}</div>}
              <button type="submit" disabled={loading} className="btn-primary"
                style={{ width: '100%', padding: 12, fontSize: 14 }}>
                {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </form>
          )}

          {/* Success */}
          {success && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 14 }}>
              <div style={{ fontSize: 48 }}>✅</div>
              <h3 style={{ fontFamily: 'var(--font-d)', fontSize: 20, color: 'var(--green)' }}>Password Berhasil Direset!</h3>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Mengarahkan ke halaman login...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}