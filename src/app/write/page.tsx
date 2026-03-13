'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function WritePage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return alert('제목과 내용을 모두 입력해주세요.')

    setIsUploading(true)

    // Supabase 데이터 삽입
    const { error } = await supabase.from('posts').insert([
      { title, content }
    ])

    if (error) {
      console.error('에러 상세:', error) // 콘솔에서 에러 확인용
      alert('저장 실패: ' + error.message)
      setIsUploading(false)
    } else {
      // 등록 성공 시 홈으로 이동
      router.push('/')
    }
  }

  return (
    <main className="min-h-screen bg-[#F2F4F6] p-4 md:p-6">
      {/* 1. 돌아가기: router.push('/')를 사용해 홈으로 강제 이동 */}
      <nav className="mb-8">
        <button 
          onClick={() => router.push('/')} 
          className="text-sm font-medium text-gray-400 hover:text-gray-900 transition-colors"
        >
          ‹ 돌아가기
        </button>
      </nav>

      <div className="max-w-[400px] mx-auto space-y-8">
        <h1 className="text-[28px] font-extrabold text-gray-900 tracking-tight">
          글 쓰기
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <input 
              type="text"
              placeholder="제목을 입력하세요"
              className="w-full h-[60px] px-5 rounded-2xl bg-white text-[17px] text-gray-900 placeholder:text-gray-500 font-medium outline-none shadow-sm focus:ring-2 focus:ring-[#3182F6]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            
            <textarea 
              placeholder="내용을 입력하세요"
              className="w-full h-[300px] p-5 rounded-2xl bg-white text-[17px] text-gray-900 placeholder:text-gray-500 font-medium outline-none shadow-sm focus:ring-2 focus:ring-[#3182F6] resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            disabled={isUploading}
            className="w-full h-[56px] bg-[#3182F6] text-white text-[17px] font-bold rounded-2xl hover:bg-blue-600 transition-all shadow-lg disabled:opacity-50"
          >
            {isUploading ? '작성 중...' : '등록하기'}
          </button>
        </form>
      </div>
    </main>
  )
}