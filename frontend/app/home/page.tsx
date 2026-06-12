'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

const EtherealBeamsHero = dynamic(
  () => import('@/components/ui/ethereal-beams-hero'),
  { ssr: false }
)

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <div
      className={`bg-black min-h-screen transition-opacity duration-900 ease-out ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <EtherealBeamsHero />
    </div>
  )
}
