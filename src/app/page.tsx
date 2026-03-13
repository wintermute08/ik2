'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Home() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const fetchPosts = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      // posts 테이블에서 모든 데이터를 시간순으로 가져오기
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('글 목록 불러오기 실패:', error)
      } else {
        setPosts(data || [])
      }
      setLoading(false)
    }
    
    fetchPosts()
  }, [])

  const deletePost = async (postId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) {
      alert('삭제 실패: ' + error.message)
    } else {
      setPosts(posts.filter(p => p.id !== postId))
    }
  }

  return (
    <main className="min-h-screen bg-[#F2F4F6] p-4 md:p-6 pb-24">
      <div className="max-w-[400px] mx-auto space-y-6">
        
        <header className="py-4">
          <h1 className="text-[24px] font-extrabold text-gray-900">판교고 커뮤니티</h1>
        </header>

        {loading ? (
          <div className="text-center py-10 text-gray-500">불러오는 중...</div>
        ) : (
          <section className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-10 text-gray-400">아직 작성된 글이 없어요.</div>
            ) : (
              posts.map((post) => (
                <div 
                  key={post.id} 
                  className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative"
                >
                  <Link href={`/post/${post.id}`}>
                    <h2 className="font-bold text-[17px] text-gray-900 truncate">{post.title}</h2>
                    <p className="text-[14px] text-gray-400 mt-1">
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                    <div className="text-[14px] text-gray-400 mt-1">
                      조회수 {post.views || 0}회
                    </div>
                  </Link>
                  {currentUser?.id === post?.user_id && (
                    <button 
                      onClick={(e) => { e.preventDefault(); deletePost(post.id); }} 
                      className="absolute top-4 right-4 text-red-500 text-sm font-medium hover:text-red-700"
                    >
                      삭제
                    </button>
                  )}
                </div>
              ))
            )}
          </section>
        )}

        {/* 글쓰기 버튼 (우측 하단 고정) */}
        <Link 
          href="/write" 
          className="fixed bottom-8 right-8 w-[60px] h-[60px] flex items-center justify-center bg-[#3182F6] text-white rounded-full shadow-lg hover:bg-blue-600 transition-transform hover:scale-105"
        >
          <span className="text-3xl font-light">+</span>
        </Link>
      </div>
    </main>
  )
}