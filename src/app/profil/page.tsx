'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import Navbar from '@/components/ui/navbar'

const AVATAR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#00c8ff', '#3b82f6', '#a855f7', '#ec4899'
]

interface Profile {
  username: string; nim: string; email?: string
  avatar_color?: string; avatar_url?: string
  angkatan?: string; prodi?: string; bio?: string
}

export default function ProfilPage() {
  const router = useRouter()
  const [tab,       setTab]       = useState<'data' | 'password'>('data')
  const [profile,   setProfile]   = useState<Profile | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg,       setMsg]       = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Data diri
  const [username,  setUsername]  = useState('')
  const [nim,       setNim]       = useState('')
  const [email,     setEmail]     = useState('')
  const [angkatan,  setAngkatan]  = useState('')
  const [prodi,     setProdi]     = useState('')
  const [bio,       setBio]       = useState('')
  const [avatarCol, setAvatarCol] = useState('#00c8ff')
  const [avatarUrl, setAvatarUrl] = useState('')

  // Password
  const [oldPass,  setOldPass]  = useState('')
  const [newPass,  setNewPass]  = useState('')
  const [confPass, setConfPass] = useState('')
  const [showOld,  setShowOld]  = useState(false)
  const [showNew,  setShowNew]  = useState(false)
  const [showConf, setShowConf] = useState(false)

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: prof } = await supabase
      .from('profiles')
      .select('username, nim, avatar_color, avatar_url, angkatan, prodi, bio')
      .eq('id', user.id).single()
    if (prof) {
      setProfile({ ...prof, email: user.email })
      setUsername(prof.username || '')
      setNim(prof.nim || '')
      setEmail(user.email || '')
      setAngkatan(prof.angkatan || '')
      setProdi(prof.prodi || '')
      setBio(prof.bio || '')
      setAvatarCol(prof.avatar_color || '#00c8ff')
      setAvatarUrl(prof.avatar_url || '')
    }
    setLoading(false)
  }

  async function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setMsg({ type: 'err', text: 'Ukuran foto maksimal 2MB.' }); return }
    const ext = file.name.split('.').pop()
    if (!['jpg','jpeg','png','webp'].includes(ext?.toLowerCase() || '')) {
      setMsg({ type: 'err', text: 'Format foto harus JPG, PNG, atau WebP.' }); return
    }
    setUploading(true); setMsg(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const path = `${user.id}/avatar.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (upErr) { setMsg({ type: 'err', text: 'Gagal upload foto. Coba lagi.' }); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = `${urlData.publicUrl}?t=${Date.now()}` // cache bust
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
    setAvatarUrl(url)
    setUploading(false)
    setMsg({ type: 'ok', text: 'Foto profil berhasil diupload!' })
  }

  async function saveDataDiri(e: React.FormEvent) {
    e.preventDefault(); setMsg(null); setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({
      username, nim, avatar_color: avatarCol, angkatan, prodi, bio,
    }).eq('id', user.id)
    setSaving(false)
    if (error) { setMsg({ type: 'err', text: error.message }); return }
    setMsg({ type: 'ok', text: 'Profil berhasil diperbarui!' })
    setProfile(prev => prev ? { ...prev, username, nim, avatar_color: avatarCol, angkatan, prodi, bio } : null)
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault(); setMsg(null)
    if (newPass.length < 8) { setMsg({ type: 'err', text: 'Password baru minimal 8 karakter.' }); return }
    if (newPass !== confPass) { setMsg({ type: 'err', text: 'Konfirmasi password tidak cocok.' }); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: user.email, password: oldPass })
    if (authErr) { setSaving(false); setMsg({ type: 'err', text: 'Password saat ini salah.' }); return }
    const { error } = await supabase.auth.updateUser({ password: newPass })
    setSaving(false)
    if (error) { setMsg({ type: 'err', text: error.message }); return }
    setMsg({ type: 'ok', text: 'Password berhasil diubah!' })
    setOldPass(''); setNewPass(''); setConfPass('')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
    borderRadius: 8, color: 'var(--text)', fontSize: 13,
    fontFamily: 'var(--font-b)', outline: 'none', transition: 'border-color .18s',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6,
  }
  const initials = (username || profile?.username || '').slice(0, 2).toUpperCase() || 'IL'

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar username={profile?.username} nim={profile?.nim} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--muted)' }}>
        Memuat profil...
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar username={profile?.username} nim={profile?.nim} />
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '36px 24px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <Link href="/dashboard" style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
            color: 'var(--muted)', textDecoration: 'none', padding: '6px 14px',
            border: '1px solid var(--border)', borderRadius: 8, transition: 'all .18s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--cyan)'; e.currentTarget.style.borderColor = 'var(--border-c)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >← Back</Link>
          <h1 style={{ fontFamily: 'var(--font-d)', fontSize: 26, fontWeight: 900, color: '#fff' }}>Edit Profile</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>

          {/* SIDEBAR KIRI */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '28px 20px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>

              {/* Avatar — foto atau inisial */}
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" style={{
                  width: 72, height: 72, borderRadius: '50%', objectFit: 'cover',
                  margin: '0 auto 12px', display: 'block',
                  boxShadow: `0 0 0 4px ${avatarCol}40`,
                }} />
              ) : (
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: avatarCol, margin: '0 auto 12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-d)', fontWeight: 900, fontSize: 24, color: '#080c16',
                  boxShadow: `0 0 0 4px ${avatarCol}30`, transition: 'all .3s',
                }}>{initials}</div>
              )}

              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                {username || profile?.username}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{nim || profile?.nim}</div>

              {/* Color picker */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '1px', marginBottom: 10, textTransform: 'uppercase' }}>
                  Warna Avatar
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {AVATAR_COLORS.map(c => (
                    <button key={c} onClick={() => setAvatarCol(c)} style={{
                      width: 24, height: 24, borderRadius: '50%', background: c,
                      border: avatarCol === c ? '2px solid #fff' : '2px solid transparent',
                      cursor: 'pointer', transition: 'all .18s',
                      boxShadow: avatarCol === c ? `0 0 0 2px ${c}` : 'none', outline: 'none',
                    }} />
                  ))}
                </div>
                <div style={{ marginTop: 12, fontSize: 11, color: 'var(--muted)' }}>atau</div>

                {/* Upload foto — input file tersembunyi */}
                <label style={{
                  marginTop: 8, width: '100%', padding: '7px',
                  background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 8, fontSize: 11,
                  color: uploading ? 'var(--cyan)' : 'var(--muted)',
                  cursor: uploading ? 'default' : 'pointer',
                  fontFamily: 'var(--font-b)', textAlign: 'center', display: 'block',
                  transition: 'all .18s',
                }}
                  onMouseEnter={e => { if (!uploading) e.currentTarget.style.borderColor = 'rgba(0,200,255,.3)' }}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)'}
                >
                  {uploading ? '⏳ Mengupload...' : '📷 Upload Fotomu'}
                  <input
                    type="file" accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }} disabled={uploading}
                    onChange={handleUploadFoto}
                  />
                </label>

                {/* Tombol hapus foto */}
                {avatarUrl && (
                  <button onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser()
                    if (!user) return
                    await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id)
                    setAvatarUrl('')
                    setMsg({ type: 'ok', text: 'Foto profil dihapus.' })
                  }} style={{
                    marginTop: 6, width: '100%', padding: '6px',
                    background: 'transparent', border: '1px solid rgba(255,107,107,.2)',
                    borderRadius: 8, fontSize: 11, color: '#ff8080',
                    cursor: 'pointer', fontFamily: 'var(--font-b)', transition: 'all .18s',
                  }}>🗑 Hapus Foto</button>
                )}
              </div>
            </div>

            {/* Tab nav */}
            <div style={{ padding: '8px' }}>
              {[{ key: 'data', label: 'Data Diri' }, { key: 'password', label: 'Password' }].map(t => (
                <button key={t.key} onClick={() => { setTab(t.key as any); setMsg(null) }} style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8, textAlign: 'left',
                  fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
                  color: tab === t.key ? 'var(--cyan)' : 'var(--muted)',
                  background: tab === t.key ? 'rgba(0,200,255,.08)' : 'transparent',
                  border: tab === t.key ? '1px solid rgba(0,200,255,.2)' : '1px solid transparent',
                  cursor: 'pointer', fontFamily: 'var(--font-b)', marginBottom: 4, transition: 'all .18s',
                }}>{t.label}</button>
              ))}
            </div>
          </div>

          {/* KONTEN KANAN */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px' }}>
            {msg && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 20, fontSize: 13,
                background: msg.type === 'ok' ? 'rgba(0,230,118,.1)' : 'rgba(255,77,77,.1)',
                border: `1px solid ${msg.type === 'ok' ? 'rgba(0,230,118,.3)' : 'rgba(255,77,77,.25)'}`,
                color: msg.type === 'ok' ? 'var(--green)' : '#ff8080',
              }}>{msg.type === 'ok' ? '✓ ' : '⚠ '}{msg.text}</div>
            )}

            {/* DATA DIRI */}
            {tab === 'data' && (
              <form onSubmit={saveDataDiri}>
                <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 24 }}>Data Diri</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Nama Lengkap</label>
                    <input style={inputStyle} type="text" value={username} onChange={e => setUsername(e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      onFocus={e => e.target.style.borderColor = 'rgba(0,200,255,.4)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'} />
                  </div>
                  <div>
                    <label style={labelStyle}>NIM</label>
                    <input style={inputStyle} type="text" value={nim} onChange={e => setNim(e.target.value)}
                      placeholder="Contoh: M0403241113"
                      onFocus={e => e.target.style.borderColor = 'rgba(0,200,255,.4)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email IPB</label>
                    <input style={{ ...inputStyle, opacity: .6, cursor: 'not-allowed' }} type="email" value={email} disabled />
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Email tidak dapat diubah</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Angkatan</label>
                      <input style={inputStyle} type="text" value={angkatan} onChange={e => setAngkatan(e.target.value)}
                        placeholder="2024"
                        onFocus={e => e.target.style.borderColor = 'rgba(0,200,255,.4)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'} />
                    </div>
                    <div>
                      <label style={labelStyle}>Program Studi</label>
                      <input style={inputStyle} type="text" value={prodi} onChange={e => setProdi(e.target.value)}
                        placeholder="Ilmu Komputer"
                        onFocus={e => e.target.style.borderColor = 'rgba(0,200,255,.4)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Bio Singkat <span style={{ color: 'var(--muted)', fontWeight: 400 }}>— opsional</span></label>
                    <textarea value={bio} onChange={e => setBio(e.target.value)}
                      placeholder="Ceritakan sedikit tentang dirimu..." rows={3}
                      style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                      onFocus={e => e.target.style.borderColor = 'rgba(0,200,255,.4)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '10px 28px', fontSize: 13 }}>
                      {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* PASSWORD */}
            {tab === 'password' && (
              <form onSubmit={savePassword}>
                <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Ubah Password</h2>
                <div style={{
                  padding: '12px 14px', borderRadius: 8, marginBottom: 24,
                  background: 'rgba(0,200,255,.06)', border: '1px solid rgba(0,200,255,.2)',
                  fontSize: 12, color: 'var(--cyan)', lineHeight: 1.65,
                }}>
                  Pastikan password baru kamu minimal 8 karakter, mengandung huruf besar, angka, dan simbol untuk keamanan optimal.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { label: 'Password Saat Ini',        val: oldPass,  set: setOldPass,  show: showOld,  setShow: setShowOld,  ph: 'Masukkan password lama' },
                    { label: 'Password Baru',            val: newPass,  set: setNewPass,  show: showNew,  setShow: setShowNew,  ph: 'Masukkan password baru' },
                    { label: 'Konfirmasi Password Baru', val: confPass, set: setConfPass, show: showConf, setShow: setShowConf, ph: 'Ulangi password baru' },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={labelStyle}>{f.label}</label>
                      <div style={{ position: 'relative' }}>
                        <input type={f.show ? 'text' : 'password'} required
                          value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                          style={{ ...inputStyle, paddingRight: 42 }}
                          onFocus={e => e.target.style.borderColor = 'rgba(0,200,255,.4)'}
                          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'} />
                        <button type="button" onClick={() => f.setShow(!f.show)} style={{
                          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 15,
                        }}>{f.show ? '🙈' : '👁'}</button>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '10px 28px', fontSize: 13 }}>
                      {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}