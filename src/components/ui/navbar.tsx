'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useState, useRef, useEffect } from 'react'

interface NavbarProps {
  username?: string
  nim?: string
}

export default function Navbar({ username = '', nim = '' }: NavbarProps) {
  const path     = usePathname()
  const router   = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const links = [
    { href: '/eksplorasi',   label: 'Eksplorasi', icon: '⊹ ' },
    { href: '/dashboard',    label: 'Dashboard' },
    { href: '/ruang-belajar',label: 'Ruang Belajar' },
  ]

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const initials = username.slice(0, 2).toUpperCase() || 'IL'

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      height: 56, display: 'flex', alignItems: 'center',
      padding: '0 28px', gap: 8,
      background: 'rgba(8,12,22,.85)',
      backdropFilter: 'blur(18px)',
      borderBottom: '1px solid rgba(255,255,255,.06)',
    }}>
      {/* Logo */}
      <Link href="/eksplorasi" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 12 }}>
        <div style={{
          width: 30, height: 30, background: 'var(--cyan)', borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-d)', fontWeight: 900, fontSize: 12, color: '#080c16',
        }}>IL</div>
        <span style={{ fontFamily: 'var(--font-d)', fontSize: 16, fontWeight: 700, color: 'var(--cyan)', letterSpacing: .4 }}>
          I-Learning
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 2, flex: 1 }}>
        {links.map(l => {
          const active = path.startsWith(l.href)
          return (
            <Link key={l.href} href={l.href} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px',
              borderRadius: 7, fontSize: 13, fontWeight: active ? 600 : 400,
              color: active ? 'var(--cyan)' : 'var(--muted)',
              background: active ? 'var(--cyan-10)' : 'transparent',
              border: active ? '1px solid var(--border-c)' : '1px solid transparent',
              textDecoration: 'none', transition: 'all .18s',
            }}>
              {l.icon}{l.label}
            </Link>
          )
        })}
      </div>

      {/* Avatar + Dropdown */}
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '4px 8px', borderRadius: 10,
            transition: 'background .18s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {username && (
            <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{username}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>{nim}</div>
            </div>
          )}
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(0,200,255,.15)', border: '1px solid rgba(0,200,255,.35)',
            fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 12, color: 'var(--cyan)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>{initials}</div>
        </button>

        {/* Dropdown menu */}
        {open && (
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
            background: 'var(--bg2)', border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 12, overflow: 'hidden', minWidth: 160,
            boxShadow: '0 16px 40px rgba(0,0,0,.5)',
            zIndex: 200,
          }}>
            {/* User info */}
            <div style={{
              padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.07)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(0,200,255,.15)', border: '1px solid rgba(0,200,255,.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 11, color: 'var(--cyan)',
                flexShrink: 0,
              }}>{initials}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{username}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{nim}</div>
              </div>
            </div>

            {/* Menu items */}
            <div style={{ padding: '6px' }}>
              <Link
                href="/profil"
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8, textDecoration: 'none',
                  fontSize: 13, color: 'var(--text)', transition: 'background .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 15 }}>✏️</span>
                Edit Profile
              </Link>

              <button
                onClick={logout}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '9px 12px', borderRadius: 8,
                  fontSize: 13, color: '#ff6b6b', background: 'transparent',
                  border: 'none', cursor: 'pointer', fontFamily: 'var(--font-b)',
                  textAlign: 'left', transition: 'background .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,107,.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 15 }}>🚪</span>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}