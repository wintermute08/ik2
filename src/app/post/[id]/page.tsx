'use client'

import { useState, useEffect, useRef } from 'react' // useRef 추가
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function PostDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [post, setPost] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isViewIncremented = useRef(false) // 실행 여부 체크용 Ref 추가

  useEffect(() => {
    // 이미 실행되었다면 함수 종료
    if (isViewIncremented.current) return 
    isViewIncremented.current = true // 실행 후 true로 변경

    const init = async () => {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      if (!id || typeof id !== 'string') return

      // 1. 조회수 증가 (RPC 호출)
      await supabase.rpc('increment_view', { post_id: id })

      // 2. 게시글 및 댓글 병렬 로드
      const [postRes, commentRes] = await Promise.all([
        supabase.from('posts').select('*').eq('id', id).single(),
        supabase.from('comments').select('*').eq('post_id', id).order('created_at', { ascending: false })
      ])

      setPost(postRes.data)
      setComments(commentRes.data || [])
      setIsLoading(false)
    }
    init()
  }, [id])

  const deletePost = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (error) alert('삭제 실패: ' + error.message)
    else router.push('/')
  }

  const addComment = async () => {
    if (!currentUser) return alert('로그인 후 이용하세요.')
    if (!newComment.trim()) return alert('댓글을 입력해주세요.')
    
    const { data, error } = await supabase
      .from('comments')
      .insert([{ post_id: id, content: newComment, user_id: currentUser.id }])
      .select()
    
    if (error) alert('등록 실패: ' + error.message)
    else { setComments([data[0], ...comments]); setNewComment('') }
  }

  const deleteComment = async (commentId: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    if (error) alert('삭제 실패: ' + error.message)
    else setComments(comments.filter(c => c.id !== commentId))
  }

  // 화면 깜빡임 방지를 위한 화이트 배경
  if (isLoading) {
    return (
      <div className="max-w-[500px] mx-auto p-4 min-h-screen bg-white animate-pulse">
        <div className="h-6 w-20 bg-gray-100 rounded mb-4"></div>
        <div className="h-40 bg-gray-100 rounded-3xl mb-6"></div>
      </div>
    )
  }

  if (!post) return <div className="p-6 text-center text-gray-500 bg-white min-h-screen">게시글을 찾을 수 없습니다.</div>

  return (
    <main className="max-w-[500px] mx-auto p-4 bg-white min-h-screen pt-20">
      <button onClick={() => router.back()} className="mb-4 text-gray-400 hover:text-gray-900 transition-colors">‹ 돌아가기</button>
      
      <article className="bg-white p-6 rounded-3xl border border-gray-100 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-extrabold text-gray-900">{post.title}</h1>
          {currentUser?.id === post?.user_id && (
            <button onClick={deletePost} className="text-red-500 text-sm font-medium hover:text-red-700">삭제</button>
          )}
        </div>
        <div className="text-gray-400 text-sm mb-4">조회수 {post.views}회</div>
        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{post.content}</p>
      </article>

      <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h2 className="font-bold text-lg mb-4 text-gray-900">댓글 ({comments.length})</h2>
        <div className="flex gap-2 mb-6">
          <input 
            value={newComment} onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#3182F6]" 
            placeholder="댓글을 남겨보세요"
          />
          <button onClick={addComment} className="bg-[#3182F6] text-white px-5 rounded-xl font-bold hover:bg-blue-600">등록</button>
        </div>
        
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="p-4 bg-gray-50 rounded-2xl relative">
              <p className="text-gray-800 text-[15px]">{c.content}</p>
              {currentUser?.id === c.user_id && (
                <button onClick={() => deleteComment(c.id)} className="absolute top-4 right-4 text-xs text-red-500 hover:underline">삭제</button>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}