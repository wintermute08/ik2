'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import LogoutButton from './LogoutButton'
import Link from 'next/link'

export default function Header() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()
  }, [])

  return (
    <header className="fixed top-0 w-full flex justify-between items-center p-4 border-b bg-white z-10">
      <Link href="/" className="font-bold text-lg text-gray-900">잌명</Link>
      <div>
        {user ? <LogoutButton /> : <Link href="/login" className="px-4 py-2 text-sm text-gray-500 hover:text-blue-500 transition-colors">로그인</Link>}
      </div>
    </header>
  )
}