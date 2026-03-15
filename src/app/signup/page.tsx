'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      return toast.error('비밀번호가 일치하지 않습니다.')
    }
    
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast.error('회원가입 실패: ' + error.message)
    } else {
      toast.success('가입을 축하합니다! 이메일을 확인해주세요.')
      router.push('/login')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-white">
      {/* 상단바: 돌아가기 버튼 */}
      <header className="fixed top-0 w-full z-40 bg-white/80 backdrop-blur-md h-16 border-b border-[#E1E4E6] flex items-center px-2">
        <button onClick={() => router.back()} className="p-2 text-[#191F28]">
          <ChevronLeft size={28} />
        </button>
      </header>

      {/* 가입 폼 */}
      <div className="pt-24 px-6 max-w-[400px] mx-auto">
        <h1 className="text-2xl font-bold text-[#191F28] mb-8">회원가입</h1>
        
        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="email"
            placeholder="이메일"
            className="w-full p-4 bg-[#F9FAFB] rounded-2xl outline-none border border-transparent focus:border-[#3182F6] text-black font-medium text-[16px]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="비밀번호"
            className="w-full p-4 bg-[#F9FAFB] rounded-2xl outline-none border border-transparent focus:border-[#3182F6] text-black font-medium text-[16px]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="비밀번호 확인"className="w-full p-4 bg-[#F9FAFB] rounded-2xl outline-none border 
            border-transparent focus:border-[#3182F6] text-black font-medium text-[16px]"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#3182F6] text-white font-bold rounded-2xl active:bg-blue-700 transition-colors mt-4"
          >
            {loading ? '가입 처리 중...' : '회원가입 완료'}
          </button>
        </form>
      </div>
    </main>
  )
}