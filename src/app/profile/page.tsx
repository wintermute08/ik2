'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import LogoutButton from '@/components/LogoutButton'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [nickname, setNickname] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('id', user.id)
        .single()
      setNickname(profile?.nickname || '')
      setLoading(false)
    }
    getUser()
  }, [router])

  const saveNickname = async () => {
    const trimmed = nickname.trim()
    if (trimmed.length < 2 || trimmed.length > 12) {
      alert('닉네임은 2~12자로 입력해주세요.')
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, nickname: trimmed }, { onConflict: 'id' })
    if (error) alert('저장 실패: ' + error.message)
    setSaving(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 pt-20">
        <div className="max-w-[400px] mx-auto">
          <div className="text-center py-10 text-gray-500">로딩 중...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 pt-20">
      <div className="max-w-[400px] mx-auto space-y-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-900 transition-colors">‹ 돌아가기</button>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-6">프로필</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-xl">{user?.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-3 rounded-xl bg-gray-50 outline-none border border-transparent focus:border-[#3182F6] text-gray-900"
                  value={nickname}
                  maxLength={12}
                  onChange={(e) => setNickname(e.target.value)}
                />
                <button
                  onClick={saveNickname}
                  disabled={saving}
                  className="px-4 rounded-xl bg-[#3182F6] text-white text-sm font-bold disabled:opacity-50"
                >
                  저장
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">가입일</label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-xl">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '정보 없음'}
              </p>
            </div>
            
            <div className="pt-4">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
