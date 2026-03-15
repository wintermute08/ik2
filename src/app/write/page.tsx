'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ChevronLeft } from 'lucide-react'

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 48,
        height: 28,
        borderRadius: 14,
        backgroundColor: value ? '#3182F6' : '#D1D5DB',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          backgroundColor: 'white',
          position: 'absolute',
          top: 3,
          left: value ? 23 : 3,
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </div>
  )
}

export default function WritePage() {
  const TITLE_MAX = 100
  const CONTENT_MAX = 2000
  const POLL_Q_MAX = 100
  const POLL_OPT_MAX = 50

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('질문')
  const [isUploading, setIsUploading] = useState(false)
  const [hasPoll, setHasPoll] = useState(false)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const router = useRouter()

  useEffect(() => {
    const guard = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) router.push('/login')
    }
    void guard()
  }, [router])

  const togglePoll = (v: boolean) => {
    if (!v) {
      setPollQuestion('')
      setPollOptions(['', ''])
    }
    setHasPoll(v)
  }

  const addOption = () => {
    if (pollOptions.length >= 5) return alert('최대 5개까지 가능해요.')
    setPollOptions([...pollOptions, ''])
  }

  const removeOption = (index: number) => {
    if (pollOptions.length <= 2) return alert('최소 2개는 있어야 해요.')
    setPollOptions(pollOptions.filter((_, i) => i !== index))
  }

  const updateOption = (index: number, value: string) => {
    const updated = [...pollOptions]
    updated[index] = value
    setPollOptions(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return alert('제목과 내용을 모두 입력해주세요.')
    if (title.trim().length > TITLE_MAX) return alert('제목이 너무 길어요.')
    if (content.trim().length > CONTENT_MAX) return alert('내용이 너무 길어요.')
    if (hasPoll) {
      if (!pollQuestion.trim()) return alert('투표 질문을 입력해주세요.')
      if (pollQuestion.trim().length > POLL_Q_MAX) return alert('투표 질문이 너무 길어요.')
      if (pollOptions.some((o) => !o.trim()))
        return alert('모든 투표 항목을 입력해주세요.')
      if (pollOptions.some((o) => o.trim().length > POLL_OPT_MAX))
        return alert('투표 항목이 너무 길어요.')
    }

    setIsUploading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('로그인이 필요합니다.')
      setIsUploading(false)
      return
    }

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert([{ title, content, category, user_id: user.id }])
      .select()
      .single()

    if (postError) {
      alert('저장 실패: ' + postError.message)
      setIsUploading(false)
      return
    }

    if (hasPoll && post) {
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert([{ post_id: post.id, question: pollQuestion }])
        .select()
        .single()

      if (pollError) {
        alert('투표 저장 실패: ' + pollError.message)
        setIsUploading(false)
        return
      }

      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(pollOptions.map(label => ({ poll_id: poll.id, label })))

      if (optionsError) {
        alert('투표 항목 저장 실패: ' + optionsError.message)
        setIsUploading(false)
        return
      }
    }

    router.push('/')
  }

  return (
    <main className="min-h-screen bg-[#F2F4F6] pb-20">
      <header className="fixed top-0 w-full z-40 bg-white/80 backdrop-blur-md h-16 border-b border-[#E1E4E6] flex items-center px-2">
        <button onClick={() => router.back()} className="p-2 text-[#191F28]">
          <ChevronLeft size={28} />
        </button>
      </header>

      <div className="pt-20 px-4 md:px-16 max-w-[400px] mx-auto space-y-8">
        <h1 className="text-[28px] font-extrabold text-gray-900 tracking-tight">글 쓰기</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-semibold text-gray-700">카테고리</span>
              <select
                className="h-[40px] px-3 rounded-xl bg-white text-[14px] text-gray-900 outline-none border border-gray-200"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="질문">질문</option>
                <option value="고민">고민</option>
                <option value="잡담">잡담</option>
                <option value="정보">정보</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="제목을 입력하세요"
              className="w-full h-[60px] px-5 rounded-2xl bg-white text-[17px] text-gray-900 placeholder:text-gray-500 font-medium outline-none shadow-sm focus:ring-2 focus:ring-[#3182F6]"
              value={title}
              maxLength={TITLE_MAX}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              placeholder="내용을 입력하세요"
              className="w-full h-[200px] p-5 rounded-2xl bg-white text-[17px] text-gray-900 placeholder:text-gray-500 font-medium outline-none shadow-sm focus:ring-2 focus:ring-[#3182F6] resize-none"
              value={content}
              maxLength={CONTENT_MAX}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* 투표 첨부 토글 */}
          <div className="flex items-center gap-3">
            <Toggle value={hasPoll} onChange={togglePoll} />
            <span className="text-[15px] font-medium text-gray-700">투표 첨부</span>
          </div>

          {/* 투표 설정 */}
          {hasPoll && (
            <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
              <h2 className="font-bold text-[16px] text-gray-900">투표 설정</h2>
              <input
                type="text"
                placeholder="투표 질문을 입력하세요"
                className="w-full h-[50px] px-4 rounded-xl bg-[#F2F4F6] text-[15px] text-gray-900 outline-none"
                value={pollQuestion}
                maxLength={POLL_Q_MAX}
                onChange={(e) => setPollQuestion(e.target.value)}
              />
              <div className="space-y-2">
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder={`항목 ${i + 1}`}
                      className="flex-1 h-[46px] px-4 rounded-xl bg-[#F2F4F6] text-[15px] text-gray-900 outline-none"
                      value={opt}
                      maxLength={POLL_OPT_MAX}
                      onChange={(e) => updateOption(i, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="text-gray-400 hover:text-red-500 text-xl font-bold w-8"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addOption}
                className="w-full h-[44px] rounded-xl border-2 border-dashed border-gray-300 text-gray-400 text-[14px] hover:border-[#3182F6] hover:text-[#3182F6] transition-colors"
              >
                + 항목 추가
              </button>
            </div>
          )}

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
