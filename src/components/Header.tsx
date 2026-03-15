'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export default function Header() {
  const [user, setUser] = useState(null)
  const pathname = usePathname()
  const router = useRouter()

  const isPostDetail = pathname.startsWith('/post/')

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()
  }, [])

  return (
    <header className="fixed top-0 w-full flex justify-between items-center px-2 h-16 border-b bg-white z-40">
      <div>
        {isPostDetail && (
          <button onClick={() => router.back()} className="p-2 text-[#191F28]">
            <ChevronLeft size={28} />
          </button>
        )}
      </div>
      <div>
        {user ? (
          <Link href="/profile" className="px-4 py-2 text-sm text-gray-500 hover:text-blue-500 transition-colors">프로필</Link>
        ) : (
          <Link href="/login" className="px-4 py-2 text-sm text-gray-500 hover:text-blue-500 transition-colors">로그인</Link>
        )}
      </div>
    </header>
  )
}