'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setErrorMsg('이메일 또는 비밀번호가 올바르지 않아요.')
      } else if (error.message.includes('Email not confirmed')) {
        setErrorMsg('이메일 인증이 필요해요. 메일함을 확인해주세요.')
      } else {
        setErrorMsg('로그인에 실패했어요. 다시 시도해주세요.')
      }
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[400px] space-y-8">

        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#191F28]">로그인</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="이메일"
            className="w-full p-4 bg-[#F9FAFB] rounded-2xl outline-none border border-transparent focus:border-[#3182F6] text-black font-medium text-[16px]"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrorMsg('') }}
          />
          <input
            type="password"
            placeholder="비밀번호"
            className="w-full p-4 bg-[#F9FAFB] rounded-2xl outline-none border border-transparent focus:border-[#3182F6] text-black font-medium text-[16px]"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrorMsg('') }}
          />

          {/* 에러 메시지 */}
          {errorMsg && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl">
              <span className="text-red-500 text-sm font-medium">{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#3182F6] text-white font-bold rounded-2xl active:bg-blue-700 transition-colors"
          >
            {loading ? '로그인 중...' : '시작하기'}
          </button>
        </form>

        <div className="text-center pt-4">
          <p className="text-sm text-gray-500">
            아직 계정이 없으신가요?{' '}
            <Link href="/signup" className="text-[#3182F6] font-bold hover:underline">
              회원가입하기
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}