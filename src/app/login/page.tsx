'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoginMode, setIsLoginMode] = useState(true)
  const router = useRouter()

  const handleAction = async () => {
    // 1. 판교고 이메일 도메인 검증
    if (!email.endsWith('@pangyo.hs.kr')) {
      alert('판교고등학교 이메일(@pangyo.hs.kr)만 사용 가능합니다.')
      return
    }

    // 2. 로그인 또는 회원가입 처리
    if (isLoginMode) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert('로그인 실패: ' + error.message)
      else router.push('/')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) alert('가입 실패: ' + error.message)
      else alert('가입 성공! 이제 로그인해주세요.')
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F2F4F6] p-6">
      <div className="w-full max-w-[360px] space-y-10">
        
        {/* 헤더: 명확한 위계 */}
        <header className="space-y-2">
          <h1 className="text-[28px] font-extrabold leading-[1.3] text-gray-900">
            {isLoginMode ? '판교고 커뮤니티\n로그인' : '판교고 계정\n만들기'}
          </h1>
          <p className="text-sm text-gray-500">
            {isLoginMode ? '학교 이메일로 바로 시작하세요.' : '학생 인증이 필요합니다.'}
          </p>
        </header>

        {/* 입력 섹션: 높은 가독성 */}
        <section className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-500 ml-1">이메일</label>
            <input 
              type="email"
              placeholder="pangyo@pangyo.hs.kr"
              className="w-full h-[56px] rounded-2xl border-none bg-white px-5 text-[17px] text-gray-900 placeholder:text-gray-300 shadow-[0_4px_12px_rgba(0,0,0,0.05)] outline-none focus:ring-2 focus:ring-[#3182F6]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-500 ml-1">비밀번호</label>
            <input 
              type="password"
              placeholder="비밀번호를 입력해주세요"
              className="w-full h-[56px] rounded-2xl border-none bg-white px-5 text-[17px] text-gray-900 placeholder:text-gray-300 shadow-[0_4px_12px_rgba(0,0,0,0.05)] outline-none focus:ring-2 focus:ring-[#3182F6]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </section>

        {/* 액션 버튼 */}
        <button 
          onClick={handleAction}
          className="w-full h-[56px] rounded-2xl bg-[#3182F6] text-[17px] font-bold text-white hover:bg-blue-600 transition-colors"
        >
          {isLoginMode ? '로그인' : '가입하기'}
        </button>

        {/* 모드 토글 */}
        <button 
          onClick={() => setIsLoginMode(!isLoginMode)}
          className="w-full text-center text-sm font-medium text-gray-400 hover:text-gray-600"
        >
          {isLoginMode ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
        </button>

      </div>
    </main>
  )
}