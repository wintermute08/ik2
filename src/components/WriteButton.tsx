'use client'

import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function WriteButton() {
  return (
    // 하단 탭 바 높이를 고려해 bottom-24 정도로 배치합니다.
    <div className="fixed bottom-24 right-6 z-50">
      <Link href="/write">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          // shadow에 토스 블루 색상을 섞어 훨씬 입체감 있게 표현합니다.
          className="flex items-center justify-center w-14 h-14 bg-[#3182F6] text-white rounded-full shadow-[0_8px_25px_rgba(49,130,246,0.4)] active:shadow-[0_4px_10px_rgba(49,130,246,0.4)] transition-shadow"
        >
          <Plus size={30} strokeWidth={2.5} />
        </motion.button>
      </Link>
    </div>
  )
}