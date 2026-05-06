'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

interface NavbarProps {
  username?: string
  nim?: string
}

export default function Navbar({ username = '', nim = '' }: NavbarProps) {
  const path = usePathname()
  const router = useRouter()

  const links = [
    { href: '/eksplorasi', label: 'Eksplorasi', icon: '⊹ ' },
    { href: '/dashboard',  label: 'Dashboard' },
    { href: '/ruang-belajar', label: 'Ruang Belajar' },
  ]

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = username.slice(0, 2).toUpperCase() || 'IL'

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      height: 56, display: 'flex', alignItems: 'center',
      padding: '0 28px', gap: 8,
      background: 'rgba(8,12,22,.82)',
      backdropFilter: 'blur(18px)',
      borderBottom: '1px solid rgba(255,255,255,.06)',
    }}>
      {/* Logo */}
      <Link href="/eksplorasi" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', marginRight:12 }}>
        <div style={{
          width:30, height:30, background:'var(--cyan)', borderRadius:7,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:'var(--font-d)', fontWeight:900, fontSize:12, color:'#080c16',
        }}>IL</div>
        <span style={{ fontFamily:'var(--font-d)', fontSize:16, fontWeight:700, color:'var(--cyan)', letterSpacing:.4 }}>
          I-Learning
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display:'flex', gap:2, flex:1 }}>
        {links.map(l => {
          const active = path.startsWith(l.href)
          return (
            <Link key={l.href} href={l.href} style={{
              display:'flex', alignItems:'center', gap:4, padding:'5px 12px',
              borderRadius:7, fontSize:13, fontWeight: active ? 600 : 400,
              color: active ? 'var(--cyan)' : 'var(--muted)',
              background: active ? 'var(--cyan-10)' : 'transparent',
              border: active ? '1px solid var(--border-c)' : '1px solid transparent',
              textDecoration:'none', transition:'all .18s',
            }}>
              {l.icon}{l.label}
            </Link>
          )
        })}
      </div>

      {/* User avatar */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        {username && (
          <div style={{ textAlign:'right', lineHeight:1.3 }}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{username}</div>
            <div style={{ fontSize:10, color:'var(--muted)' }}>{nim}</div>
          </div>
        )}
        <button onClick={logout} title="Logout" style={{
          width:34, height:34, borderRadius:'50%',
          background:'var(--cyan-10)', border:'1px solid var(--cyan-30)',
          fontFamily:'var(--font-d)', fontWeight:800, fontSize:12, color:'var(--cyan)',
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          transition:'background .18s',
        }}>{initials}</button>
      </div>
    </nav>
  )
}
