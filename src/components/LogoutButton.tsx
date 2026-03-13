'use client'

import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    // 1. Supabase 로그아웃 처리 기다림
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      alert('로그아웃 실패: ' + error.message);
    } else {
      // 2. 로그아웃 성공 후 이동
      // 'replace'를 쓰면 뒤로가기 버튼을 눌렀을 때 다시 로그아웃 전 페이지로 돌아가는 것을 방지합니다.
      router.replace('/login');
      router.refresh(); 
    }
  };

  return (
    <button 
      onClick={handleLogout}
      className="px-4 py-2 text-sm text-red-500 hover:text-red-700 transition-colors"
    >
      로그아웃
    </button>
  )
}