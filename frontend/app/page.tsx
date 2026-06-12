'use client'

import { SpiralAnimation } from '@/components/ui/spiral-animation'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Cormorant_Garamond } from 'next/font/google'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400'],
  style: ['normal', 'italic'],
})

export default function SplashPage() {
  const router = useRouter()
  const [enterVisible, setEnterVisible] = useState(false)
  const [subtitleVisible, setSubtitleVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setEnterVisible(true), 2000)
    const t2 = setTimeout(() => setSubtitleVisible(true), 3400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const handleClick = () => {
    if (exiting) return
    setExiting(true)
    setTimeout(() => router.push('/home'), 700)
  }

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-black">
      <div className="absolute inset-0">
        <SpiralAnimation />
      </div>

      <div
        className={`
          absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10
          transition-all duration-[1500ms] ease-out
          ${enterVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
      >
        <button
          onClick={handleClick}
          className="flex flex-col items-center gap-2 group"
        >
          <span className={`${cormorant.className} text-4xl tracking-[0.2em] uppercase font-normal transition-all duration-700 group-hover:tracking-[0.3em] animate-pulse`}>
            <span
              style={{ textShadow: '0 0 20px rgba(255,255,255,0.9), 0 0 60px rgba(255,255,255,0.5)' }}
              className="text-white"
            >
              D
            </span>
            <span
              style={{
                background: 'linear-gradient(to right, #ffffff, #D4A853)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 12px rgba(212,168,83,0.8)) drop-shadow(0 0 30px rgba(212,168,83,0.4))'
              }}
            >
              iscover FHI
            </span>
          </span>

          <span
            className={`text-white/60 text-xs tracking-[0.15em] uppercase font-light transition-all duration-1000 ease-out ${subtitleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
            style={{ textShadow: '0 0 10px rgba(255,255,255,0.6)' }}
          >
            click to begin
          </span>
        </button>
      </div>

      {/* Black dissolve overlay — fades in on click before navigation */}
      <div
        className={`absolute inset-0 z-50 bg-black pointer-events-none transition-opacity duration-700 ease-in ${
          exiting ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}
