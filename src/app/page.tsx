'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showRules, setShowRules] = useState(false)
  const [hideFor7Days, setHideFor7Days] = useState(false)
  const [nicknameMap, setNicknameMap] = useState<Record<string, string>>({})
  const router = useRouter()

  useEffect(() => {
    const dismissedAt = localStorage.getItem('rulesDismissedAt')
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt)
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      if (elapsed < sevenDays) {
        setShowRules(false)
      } else {
        setShowRules(true)
      }
    } else {
      setShowRules(true)
    }

    const fetchPosts = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUser(user)

      if (!user) {
        router.push('/login')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('글 목록 불러오기 실패:', error)
      } else {
        setPosts(data || [])
        const userIds = Array.from(new Set((data || []).map((p) => p.user_id).filter(Boolean)))
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, nickname')
            .in('id', userIds)
          const map: Record<string, string> = {}
          profiles?.forEach((p) => {
            if (p.nickname) map[p.id] = p.nickname
          })
          setNicknameMap(map)
        }
      }
      setLoading(false)
    }
    
    fetchPosts()
  }, [])

  const closeRules = () => {
    if (hideFor7Days) {
      localStorage.setItem('rulesDismissedAt', String(Date.now()))
    }
    setShowRules(false)
  }

  const deletePost = async (postId: string) => {
    const target = posts.find((p) => p.id === postId)
    if (target && target.user_id !== currentUser?.id) {
      alert('삭제 권한이 없어요.')
      return
    }
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
        <h1 className="text-[18px] font-extrabold text-[#191F28]">판교고익명</h1>
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
                      <div className="flex items-center gap-2">
                        {post.category && (
                          <span className="text-[12px] font-semibold text-[#3182F6] bg-blue-50 px-2 py-0.5 rounded-full">
                            {post.category}
                          </span>
                        )}
                        <h2 className="font-bold text-[17px] text-gray-900 truncate">{post.title}</h2>
                      </div>
                      {nicknameMap[post.user_id] && (
                        <div className="text-[13px] text-gray-500 mt-1">
                          {nicknameMap[post.user_id]}
                        </div>
                      )}
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

      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[420px] bg-white rounded-3xl p-6 shadow-xl">
            <h2 className="text-[18px] font-extrabold text-[#191F28]">
              익명 커뮤니티 규칙
            </h2>
            <p className="text-[14px] text-[#8B95A1] mt-2">
              모두가 편하게 이용할 수 있도록 아래 규칙을 지켜주세요.
            </p>

            <div className="mt-4 space-y-2 text-[14px] text-[#191F28]">
              <div>1. 비방, 혐오, 차별 발언 금지</div>
              <div>2. 개인정보 공유 및 유출 금지</div>
              <div>3. 과도한 비속어, 선정적 표현 자제</div>
              <div>4. 불법/유해 정보 게시 금지</div>
              <div>5. 타인 권리 침해 금지</div>
            </div>

            <label className="flex items-center gap-2 mt-5 text-[13px] text-[#8B95A1]">
              <input
                type="checkbox"
                checked={hideFor7Days}
                onChange={(e) => setHideFor7Days(e.target.checked)}
              />
              7일 동안 보지 않기
            </label>

            <button
              onClick={closeRules}
              className="mt-5 w-full h-[48px] bg-[#3182F6] text-white font-bold rounded-2xl"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  )
}
