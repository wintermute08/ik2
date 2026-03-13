'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [posts, setPosts] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    // 세션 체크
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) router.push('/login')
    }
    checkUser()
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false })
    if (data) setPosts(data)
  }

  return (
    <main className="min-h-screen bg-[#F2F4F6] pb-20">
      {/* 헤더 */}
      <header className="sticky top-0 bg-[#F2F4F6]/90 backdrop-blur-sm p-6 border-b border-gray-200">
        <h1 className="text-[20px] font-bold text-gray-900">익명 게시판</h1>
      </header>

      {/* 리스트 영역 */}
      <section className="p-4 space-y-3">
        {posts.map((post) => (
          <div key={post.id} className="bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <h2 className="text-[17px] font-semibold text-gray-900 mb-1">{post.title}</h2>
            <p className="text-[15px] text-gray-600 line-clamp-2 mb-3">{post.content}</p>
            <div className="flex gap-3 text-[13px] text-gray-400">
              <span>익명</span>
              <span>{new Date(post.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </section>

      {/* 글쓰기 버튼 (플로팅) */}
      <button 
        onClick={() => router.push('/write')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#3182F6] rounded-full shadow-lg text-white font-bold text-2xl hover:bg-blue-600 transition-transform hover:scale-105"
      >
        +
      </button>
    </main>
  )
}