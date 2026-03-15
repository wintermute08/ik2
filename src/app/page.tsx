'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchPosts = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

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
    <>
      {/* ✅ fixed 헤더 분리 */}
      <header className="fixed top-0 w-full z-40 bg-white/80 backdrop-blur-md h-16 border-b border-[#E1E4E6] flex items-center px-6">
        <h1 className="text-[18px] font-extrabold text-[#191F28]">판교고 커뮤니티</h1>
        <button
          onClick={() => router.push('/profile')}
          className="ml-auto text-sm text-[#8B95A1]"
        >
          프로필
        </button>
      </header>

      {/* ✅ pt-16으로 헤더 높이만큼 정확히 띄움 */}
      <main className="min-h-screen bg-[#F2F4F6] pt-16 pb-24 px-4 md:px-16">
        <div className="max-w-[400px] mx-auto space-y-4 pt-4">

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
                        onClick={(e) => { e.preventDefault(); deletePost(post.id) }}
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
        </div>

        {/* 글쓰기 버튼 */}
        <Link
          href="/write"
          className="fixed bottom-8 right-8 w-[60px] h-[60px] flex items-center justify-center bg-[#3182F6] text-white rounded-full shadow-lg hover:bg-blue-600 transition-transform hover:scale-105"
        >
          <span className="text-3xl font-light">+</span>
        </Link>
      </main>
    </>
  )
}