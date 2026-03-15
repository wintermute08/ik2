'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { ChevronLeft } from 'lucide-react'

export default function PostDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [post, setPost] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 투표
  const [poll, setPoll] = useState<any>(null)
  const [pollOptions, setPollOptions] = useState<any[]>([])
  const [myVote, setMyVote] = useState<string | null>(null)
  const [totalVotes, setTotalVotes] = useState(0)

  const isViewIncremented = useRef(false)

  useEffect(() => {
    if (isViewIncremented.current) return
    isViewIncremented.current = true

    const init = async () => {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      if (!id || typeof id !== 'string') return

      await supabase.rpc('increment_view', { post_id: id })

      const [postRes, commentRes, pollRes] = await Promise.all([
        supabase.from('posts').select('*').eq('id', id).single(),
        supabase.from('comments').select('*').eq('post_id', id).order('created_at', { ascending: false }),
        supabase.from('polls').select('*').eq('post_id', id).single()
      ])

      setPost(postRes.data)
      setComments(commentRes.data || [])

      if (pollRes.data) {
        setPoll(pollRes.data)

        const { data: options } = await supabase
          .from('poll_options')
          .select('*')
          .eq('poll_id', pollRes.data.id)

        setPollOptions(options || [])
        setTotalVotes(options?.reduce((sum, o) => sum + (o.vote_count || 0), 0) || 0)

        if (user) {
          const { data: myVoteData } = await supabase
  .from('poll_votes')
  .select('*')
  .eq('poll_id', pollRes.data.id)
  .eq('user_id', user.id)
  .maybeSingle()

          if (myVoteData) setMyVote(myVoteData.option_id)
        }
      }

      setIsLoading(false)
    }
    init()
  }, [id])

  const vote = async (optionId: string) => {
    if (!currentUser) return toast.error('로그인 후 투표할 수 있어요.')
    if (myVote) return toast.error('이미 투표했어요.')

    // 투표 기록 저장
    const { error } = await supabase
      .from('poll_votes')
      .insert([{ poll_id: poll.id, option_id: optionId, user_id: currentUser.id }])

    if (error) return toast.error('투표 실패: ' + error.message)

    // vote_count 증가
    await supabase.rpc('increment_vote', { option_id: optionId })

    // 로컬 상태 업데이트
    setMyVote(optionId)
    setPollOptions(pollOptions.map(o =>
      o.id === optionId ? { ...o, vote_count: (o.vote_count || 0) + 1 } : o
    ))
    setTotalVotes(prev => prev + 1)
    toast.success('투표 완료!')
  }

  const deletePost = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (error) toast.error('삭제 실패: ' + error.message)
    else { toast.success('삭제되었습니다.'); router.push('/') }
  }

  const addComment = async () => {
    if (!currentUser) return toast.error('로그인 후 이용하세요.')
    if (!newComment.trim()) return toast.error('댓글을 입력해주세요.')

    const { data, error } = await supabase
      .from('comments')
      .insert([{ post_id: id, content: newComment, user_id: currentUser.id }])
      .select()

    if (error) toast.error('등록 실패: ' + error.message)
    else { setComments([data[0], ...comments]); setNewComment('') }
  }

  const deleteComment = async (commentId: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    if (error) toast.error('삭제 실패: ' + error.message)
    else setComments(comments.filter(c => c.id !== commentId))
  }

  if (isLoading) return <main className="min-h-screen bg-white" />

  return (
    <main className="min-h-screen bg-white pb-20">
      <header className="fixed top-0 w-full z-40 bg-white/80 backdrop-blur-md h-16 border-b border-[#E1E4E6] flex items-center px-2">
        <button onClick={() => router.back()} className="p-2 text-[#191F28]">
          <ChevronLeft size={28} />
        </button>
      </header>

      <div className="pt-20 px-4 max-w-[500px] mx-auto space-y-6">

        <article className="bg-[#F9FAFB] p-6 rounded-[24px]">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-[#191F28] leading-tight">{post?.title}</h1>
            {currentUser?.id === post?.user_id && (
              <button onClick={deletePost} className="text-sm text-[#8B95A1] hover:text-red-500 font-medium ml-4">
                삭제
              </button>
            )}
          </div>
          <div className="text-[#8B95A1] text-sm mb-6">조회수 {post?.views}회</div>
          <p className="text-[#191F28] text-[16px] leading-relaxed whitespace-pre-wrap">{post?.content}</p>
        </article>

        {/* 투표 섹션 */}
        {poll && (
          <section className="bg-[#F9FAFB] p-6 rounded-[24px] space-y-4">
            <h2 className="font-bold text-[17px] text-[#191F28]">📊 {poll.question}</h2>
            <div className="space-y-3">
              {pollOptions.map((option) => {
                const percent = totalVotes > 0
                  ? Math.round((option.vote_count / totalVotes) * 100)
                  : 0
                const isMyChoice = myVote === option.id

                return (
                  <button
                    key={option.id}
                    onClick={() => vote(option.id)}
                    disabled={!!myVote}
                    className={`w-full text-left rounded-2xl overflow-hidden relative h-[52px] border-2 transition-all
                      ${isMyChoice ? 'border-[#3182F6]' : 'border-transparent'}
                      ${myVote ? 'cursor-default' : 'hover:border-[#3182F6]'}
                      bg-white`}
                  >
                    {/* 퍼센트 바 */}
                    {myVote && (
                      <div
                        className="absolute inset-y-0 left-0 bg-[#EBF3FE] transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-between px-4">
                      <span className={`text-[15px] font-medium ${isMyChoice ? 'text-[#3182F6]' : 'text-[#191F28]'}`}>
                        {isMyChoice && '✓ '}{option.label}
                      </span>
                      {myVote && (
                        <span className="text-[14px] text-[#8B95A1] font-medium">{percent}%</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
            <p className="text-[13px] text-[#8B95A1]">총 {totalVotes}명 참여</p>
          </section>
        )}

        {/* 댓글 섹션 */}
        <section className="space-y-4">
          <h2 className="font-bold text-lg text-[#191F28]">댓글 ({comments.length})</h2>
          <div className="flex gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 p-4 rounded-2xl bg-[#F9FAFB] outline-none text-[16px] text-[#191F28]"
              placeholder="댓글을 남겨보세요"
            />
            <button onClick={addComment} className="bg-[#3182F6] text-white px-6 rounded-2xl font-bold">등록</button>
          </div>
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="p-4 bg-[#F9FAFB] rounded-2xl relative">
                <p className="text-[#191F28] text-[15px] pr-12">{c.content}</p>
                {currentUser?.id === c.user_id && (
                  <button onClick={() => deleteComment(c.id)} className="absolute top-4 right-4 text-xs text-[#8B95A1] hover:text-red-500">삭제</button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}