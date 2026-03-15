'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { ChevronLeft } from 'lucide-react'

type Post = {
  id: string
  title: string
  content: string
  views: number
  user_id: string
  category?: string | null
}

type Comment = {
  id: string
  content: string
  user_id: string
}

type Poll = {
  id: string
  question: string
}

type PollOption = {
  id: string
  label: string
  vote_count: number | null
}

export default function PostDetailPage() {
  const COMMENT_MAX = 300

  const { id } = useParams()
  const router = useRouter()

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [poll, setPoll] = useState<Poll | null>(null)
  const [pollOptions, setPollOptions] = useState<PollOption[]>([])
  const [myVote, setMyVote] = useState<string | null>(null)
  const [totalVotes, setTotalVotes] = useState(0)

  const [anonMap, setAnonMap] = useState<Record<string, string>>({})
  const [nicknameMap, setNicknameMap] = useState<Record<string, string>>({})

  const isViewIncremented = useRef(false)

  useEffect(() => {
    if (isViewIncremented.current) return
    isViewIncremented.current = true

    const init = async () => {
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUser(user)

      if (!user) {
        router.push('/login')
        setIsLoading(false)
        return
      }

      if (!id || typeof id !== 'string') return

      await supabase.rpc('increment_view', { post_id: id })

      const [postRes, commentRes, pollRes] = await Promise.all([
        supabase.from('posts').select('*').eq('id', id).single(),
        supabase
          .from('comments')
          .select('*')
          .eq('post_id', id)
          .order('created_at', { ascending: false }),
        supabase.from('polls').select('*').eq('post_id', id).maybeSingle(),
      ])

      setPost(postRes.data)
      setComments(commentRes.data || [])

      if (postRes.data && commentRes.data) {
        const userIds = Array.from(
          new Set([
            postRes.data.user_id,
            ...commentRes.data.map((c: Comment) => c.user_id),
          ].filter(Boolean))
        )

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, anonymous_number, nickname')
          .in('id', userIds)

        const map: Record<string, string> = {}
        const nickMap: Record<string, string> = {}
        profiles?.forEach((p) => {
          map[p.id] = `익명${p.anonymous_number}`
          if (p.nickname) nickMap[p.id] = p.nickname
        })
        setAnonMap(map)
        setNicknameMap(nickMap)
      }

      if (pollRes.data) {
        setPoll(pollRes.data)

        const { data: options } = await supabase
          .from('poll_options')
          .select('*')
          .eq('poll_id', pollRes.data.id)

        setPollOptions(options || [])
        setTotalVotes(
          options?.reduce((sum, o) => sum + (o.vote_count || 0), 0) || 0
        )

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

    void init()
  }, [id])

  const vote = async (optionId: string) => {
    if (!currentUser) return toast.error('로그인 후 투표할 수 있어요.')
    if (myVote) return toast.error('이미 투표했어요.')

    const { error } = await supabase
      .from('poll_votes')
      .insert([{ poll_id: poll?.id, option_id: optionId, user_id: currentUser.id }])

    if (error) return toast.error('투표 실패: ' + error.message)

    await supabase.rpc('increment_vote', { option_id: optionId })

    setMyVote(optionId)
    setPollOptions((prev) =>
      prev.map((o) =>
        o.id === optionId
          ? { ...o, vote_count: (o.vote_count || 0) + 1 }
          : o
      )
    )
    setTotalVotes((prev) => prev + 1)
    toast.success('투표 완료!')
  }

  const cancelVote = async () => {
    if (!currentUser || !myVote || !poll) return

    const { error } = await supabase
      .from('poll_votes')
      .delete()
      .eq('poll_id', poll.id)
      .eq('user_id', currentUser.id)

    if (error) return toast.error('취소 실패: ' + error.message)

    await supabase.rpc('decrement_vote', { option_id: myVote })

    setPollOptions((prev) =>
      prev.map((o) =>
        o.id === myVote
          ? { ...o, vote_count: Math.max(0, (o.vote_count || 1) - 1) }
          : o
      )
    )
    setTotalVotes((prev) => Math.max(0, prev - 1))
    setMyVote(null)
    toast.success('투표가 취소되었어요.')
  }

  const deletePost = async () => {
    if (currentUser?.id !== post?.user_id)
      return toast.error('삭제 권한이 없어요.')
    if (!confirm('정말 삭제하시겠습니까?')) return
    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (error) toast.error('삭제 실패: ' + error.message)
    else {
      toast.success('삭제되었습니다.')
      router.push('/')
    }
  }

  const addComment = async () => {
    if (!currentUser) return toast.error('로그인 후 이용하세요.')
    if (!newComment.trim()) return toast.error('댓글을 입력해주세요.')
    if (newComment.trim().length > COMMENT_MAX)
      return toast.error('댓글이 너무 길어요.')

    const { data, error } = await supabase
      .from('comments')
      .insert([{ post_id: id, content: newComment, user_id: currentUser.id }])
      .select()

    if (error) {
      toast.error('등록 실패: ' + error.message)
      return
    }

    const newItem = data?.[0]
    if (newItem?.user_id && (!anonMap[newItem.user_id] || !nicknameMap[newItem.user_id])) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, anonymous_number, nickname')
        .eq('id', newItem.user_id)
        .single()

      if (profile) {
        setAnonMap((prev) => ({
          ...prev,
          [profile.id]: `익명${profile.anonymous_number}`,
        }))
        if (profile.nickname) {
          setNicknameMap((prev) => ({ ...prev, [profile.id]: profile.nickname }))
        }
      }
    }

    setComments((prev) => [newItem, ...prev])
    setNewComment('')
  }

  const deleteComment = async (commentId: string) => {
    const target = comments.find((c) => c.id === commentId)
    if (target && target.user_id !== currentUser?.id)
      return toast.error('삭제 권한이 없어요.')
    if (!confirm('삭제하시겠습니까?')) return
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    if (error) toast.error('삭제 실패: ' + error.message)
    else setComments((prev) => prev.filter((c) => c.id !== commentId))
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
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-2xl font-bold text-[#191F28] leading-tight">
              {post?.title}
            </h1>
            {currentUser?.id === post?.user_id && (
              <button
                onClick={deletePost}
                className="text-sm text-[#8B95A1] hover:text-red-500 font-medium ml-4"
              >
                삭제
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mb-4">
            {post?.category && (
              <span className="text-[13px] font-semibold text-[#3182F6] bg-blue-50 px-2 py-0.5 rounded-full">
                {post.category}
              </span>
            )}
            {post?.user_id && nicknameMap[post.user_id] && (
              <span className="text-[13px] font-semibold text-[#191F28] bg-white px-2 py-0.5 rounded-full border border-[#E1E4E6]">
                {nicknameMap[post.user_id]}
              </span>
            )}
            <span className="text-[13px] font-semibold text-[#3182F6] bg-blue-50 px-2 py-0.5 rounded-full">
              작성자
            </span>
            <span className="text-[#8B95A1] text-sm">조회수 {post?.views}회</span>
          </div>
          <p className="text-[#191F28] text-[16px] leading-relaxed whitespace-pre-wrap">
            {post?.content}
          </p>
        </article>

        {poll && (
          <section className="bg-[#F9FAFB] p-6 rounded-[24px] space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-[17px] text-[#191F28]">📊 {poll.question}</h2>
              {myVote && (
                <button
                  onClick={cancelVote}
                  className="text-sm text-[#8B95A1] hover:text-red-500 transition-colors"
                >
                  취소
                </button>
              )}
            </div>
            <div className="space-y-3">
              {pollOptions.map((option) => {
                const percent =
                  totalVotes > 0
                    ? Math.round((option.vote_count || 0) / totalVotes * 100)
                    : 0
                const isMyChoice = myVote === option.id

                return (
                  <button
                    key={option.id}
                    onClick={() => vote(option.id)}
                    disabled={!!myVote}
                    className={`w-full text-left rounded-2xl overflow-hidden relative h-[52px] border-2 transition-all
                      ${isMyChoice ? 'border-[#3182F6]' : 'border-transparent'}
                      ${myVote ? 'cursor-default' : 'hover:border-[#3182F6]'} bg-white`}
                  >
                    {myVote && (
                      <div
                        className="absolute inset-y-0 left-0 bg-[#EBF3FE] transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-between px-4">
                      <span
                        className={`text-[15px] font-medium ${
                          isMyChoice ? 'text-[#3182F6]' : 'text-[#191F28]'
                        }`}
                      >
                        {isMyChoice && '✓ '}
                        {option.label}
                      </span>
                      {myVote && (
                        <span className="text-[14px] text-[#8B95A1] font-medium">
                          {percent}%
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
            <p className="text-[13px] text-[#8B95A1]">총 {totalVotes}명 참여</p>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="font-bold text-lg text-[#191F28]">댓글 ({comments.length})</h2>
          <div className="flex gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 p-4 rounded-2xl bg-[#F9FAFB] outline-none text-[16px] text-[#191F28]"
              placeholder="댓글을 남겨보세요"
              maxLength={COMMENT_MAX}
            />
            <button
              onClick={addComment}
              className="bg-[#3182F6] text-white px-6 rounded-2xl font-bold"
            >
              등록
            </button>
          </div>
          <div className="space-y-3">
            {comments.map((c) => {
              const isPostAuthor = c.user_id === post?.user_id
              const isMe = c.user_id === currentUser?.id
              const displayName =
                nicknameMap[c.user_id] || (isPostAuthor ? '작성자' : anonMap[c.user_id] || '익명')

              return (
                <div key={c.id} className="p-4 bg-[#F9FAFB] rounded-2xl">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[13px] font-semibold px-2 py-0.5 rounded-full
                        ${
                          isPostAuthor
                            ? 'text-[#3182F6] bg-blue-50'
                            : 'text-[#8B95A1] bg-gray-100'
                        }`}
                      >
                        {displayName}
                      </span>
                      {isMe && <span className="text-[11px] text-gray-400">(나)</span>}
                    </div>
                    {isMe && (
                      <button
                        onClick={() => deleteComment(c.id)}
                        className="text-xs text-[#8B95A1] hover:text-red-500"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <p className="text-[#191F28] text-[15px]">{c.content}</p>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
