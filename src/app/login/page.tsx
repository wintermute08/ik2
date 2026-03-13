'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert('로그인 실패: ' + error.message)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    // min-h-screen으로 화면 높이를 꽉 채우고 flex로 정중앙 정렬
    <main className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4 pt-20">
      <div className="w-full max-w-[400px] bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-extrabold text-gray-800 mb-8 text-center">로그인</h1>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="이메일"
            className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-500 text-gray-900"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-500 text-gray-900"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button 
            type="submit" 
            className="w-full h-12 bg-[#3182F6] text-white rounded-xl font-bold hover:bg-blue-600 transition-colors mt-2"
          >
            로그인
          </button>
        </form>
      </div>
    </main>
  )
}