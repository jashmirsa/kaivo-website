import { useEffect, useRef, useState } from 'react'
import kaivoWordmarkWhite from '../../assets/brand/KAIVO-Brand-Pack/01_Logos/Primary/KAIVO-Primary-white.svg'
import { KaivoPipeline } from './KaivoPipeline'
import './KaivoIntro.css'

type KaivoIntroProps = {
  onComplete: () => void
}

export function KaivoIntro({ onComplete }: KaivoIntroProps) {
  const [exiting, setExiting] = useState(false)
  const [canSkip, setCanSkip] = useState(false)
  const completeRef = useRef(false)
  const reducedMotion = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const skipTimer = window.setTimeout(() => setCanSkip(true), 500)
    const exitTimer = window.setTimeout(() => setExiting(true), reducedMotion.current ? 560 : 3860)
    const completeTimer = window.setTimeout(() => {
      completeRef.current = true
      onComplete()
    }, reducedMotion.current ? 860 : 4380)

    return () => {
      document.body.style.overflow = previousOverflow
      window.clearTimeout(skipTimer)
      window.clearTimeout(exitTimer)
      window.clearTimeout(completeTimer)
    }
  }, [onComplete])

  const skip = () => {
    if (!canSkip || exiting || completeRef.current) return
    setExiting(true)
    window.setTimeout(() => {
      if (completeRef.current) return
      completeRef.current = true
      onComplete()
    }, 480)
  }

  return (
    <div
      className={`kaivo-intro${exiting ? ' kaivo-intro--exiting' : ''}`}
      onPointerUp={skip}
      role="presentation"
      aria-label="KAIVO brand introduction"
    >
      <div className="kaivo-intro__ambient" aria-hidden="true" />
      <div className="kaivo-intro__grid" aria-hidden="true" />
      <KaivoPipeline />

      <div className="kaivo-intro__brand">
        <img className="kaivo-intro__wordmark" src={kaivoWordmarkWhite} alt="KAIVO" />
        <div className="kaivo-intro__tagline-mask">
          <p className="kaivo-intro__tagline">RUN BETTER.</p>
        </div>
      </div>

      <button
        type="button"
        className={`kaivo-intro__skip${canSkip ? ' kaivo-intro__skip--visible' : ''}`}
        onClick={(event) => {
          event.stopPropagation()
          skip()
        }}
        tabIndex={canSkip ? 0 : -1}
        aria-hidden={!canSkip}
      >
        Skip
      </button>
      <div className="kaivo-intro__grain" aria-hidden="true" />
    </div>
  )
}
