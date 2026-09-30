import { useMemo, type ReactNode } from 'react'

// Deterministic pseudo-random so stars don't shift between renders.
function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
}

/**
 * The scene is split into separate SVG layers. Heavy filters (noise clouds, displacement, big blurs) render once per
 * layer, and every animation afterwards is a CSS transform/opacity change on a promoted layer, so the GPU just
 * moves cached textures instead of re-running the filters each frame.
 */
const Layer = ({ children, className = '', wide }: { children: ReactNode; className?: string; wide?: boolean }) => (
  <div aria-hidden className={`pointer-events-none absolute inset-y-0 will-change-transform ${wide ? '-inset-x-[4%]' : 'inset-x-0'} ${className}`} style={{ transform: 'translateZ(0)' }}>{children}</div>
)
const svgProps = { preserveAspectRatio: 'xMidYMid slice', className: 'h-full w-full', focusable: 'false' as const }

export default function HeroScene() {
  const [starsA, starsB] = useMemo(() => {
    const r = rng(42)
    const all = Array.from({ length: 170 }, () => ({ x: r() * 1440, y: r() * 470, s: r() * 1.4 + 0.3, o: r() * 0.7 + 0.2 }))
    return [all.filter((_, i) => i % 2 === 0), all.filter((_, i) => i % 2 === 1)]
  }, [])

  return (
    <>
      {/* sky + milky way */}
      <Layer>
        <svg viewBox="0 0 1440 900" {...svgProps}>
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0f1655" /><stop offset=".24" stopColor="#3038a0" /><stop offset=".4" stopColor="#8153b6" />
              <stop offset=".52" stopColor="#e0709a" /><stop offset=".6" stopColor="#f5a078" /><stop offset=".72" stopColor="#b56aa8" />
            </linearGradient>
            <linearGradient id="milky" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8fc4ff" stopOpacity="0" /><stop offset=".5" stopColor="#c7ddff" stopOpacity=".55" /><stop offset="1" stopColor="#8fc4ff" stopOpacity="0" />
            </linearGradient>
            <filter id="soft" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="34" /></filter>
          </defs>
          <rect width="1440" height="900" fill="url(#sky)" />
          <g transform="rotate(-24 560 200)">
            <ellipse cx="560" cy="190" rx="640" ry="46" fill="url(#milky)" filter="url(#soft)" opacity=".55" />
            <ellipse cx="640" cy="200" rx="360" ry="26" fill="#eaf2ff" opacity=".22" filter="url(#soft)" />
          </g>
        </svg>
      </Layer>

      {/* stars: two layers twinkling out of phase with a CSS opacity animation */}
      {[starsA, starsB].map((stars, k) => (
        <Layer key={k} className={k ? 'twinkle-b' : 'twinkle-a'}>
          <svg viewBox="0 0 1440 900" {...svgProps}><g fill="#fff">{stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.s} opacity={s.o} />)}</g></svg>
        </Layer>
      ))}

      {/* mountain (entrance animates this layer) */}
      <Layer className="mtn">
        <svg viewBox="0 0 1440 900" {...svgProps}>
          <defs>
            <linearGradient id="lit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd9c8" /><stop offset=".45" stopColor="#d98aa0" /><stop offset="1" stopColor="#7a4a98" /></linearGradient>
            <linearGradient id="shade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6a5cc0" /><stop offset="1" stopColor="#2a2178" /></linearGradient>
            <filter id="rough" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="8" result="t" />
              <feDisplacementMap in="SourceGraphic" in2="t" scale="16" />
            </filter>
            <filter id="soft2"><feGaussianBlur stdDeviation="1.2" /></filter>
          </defs>
          <g transform="translate(-355 -230) scale(1.5)">
            <g filter="url(#rough)">
              <path d="M400 640 L470 560 L545 500 L600 452 L650 418 L690 380 L722 404 L752 440 L800 486 L860 512 L940 546 L1010 580 L1030 640 Z" fill="url(#shade)" />
              <path d="M400 640 L470 560 L545 500 L600 452 L650 418 L690 380 L668 452 L640 500 L600 560 L560 640 Z" fill="url(#lit)" />
              <path d="M690 380 L722 404 L752 440 L800 486 L770 470 L735 470 L705 440 Z" fill="#7f7ad6" opacity=".55" />
            </g>
            <g filter="url(#soft2)" fill="#fff" opacity=".55">
              <path d="M690 384 L714 402 L700 412 L708 428 L690 440 L680 420 L684 404Z" />
              <path d="M652 424 L676 446 L660 470 L648 460Z" opacity=".7" />
              <path d="M735 440 L770 476 L744 470Z" opacity=".6" />
            </g>
          </g>
        </svg>
      </Layer>

      {/* haze */}
      <Layer>
        <svg viewBox="0 0 1440 900" {...svgProps}>
          <defs><linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff9f86" stopOpacity="0" /><stop offset=".5" stopColor="#c46fa6" stopOpacity=".95" /><stop offset="1" stopColor="#3b2a86" /></linearGradient></defs>
          <rect x="0" y="600" width="1440" height="300" fill="url(#haze)" />
        </svg>
      </Layer>

      {/* cloud seas: rendered once, then only translated */}
      <Layer wide className="cloud-back">
        <svg viewBox="-80 0 1600 900" {...svgProps}>
          <defs>
            <linearGradient id="cloudBack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd0b0" /><stop offset=".45" stopColor="#c77aae" /><stop offset="1" stopColor="#5a3f99" /></linearGradient>
            <linearGradient id="fadeInB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" /><stop offset=".22" stopColor="#fff" /></linearGradient>
            <filter id="cloudNoiseA" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.005 0.016" numOctaves="4" seed="4" />
              <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  6 0 0 0 -2.5" />
              <feGaussianBlur stdDeviation="1.6" />
            </filter>
            <mask id="maskA" maskUnits="userSpaceOnUse" x="-80" y="0" width="1600" height="900"><rect x="-80" width="1600" height="900" filter="url(#cloudNoiseA)" /></mask>
            <mask id="fadeBack" maskUnits="userSpaceOnUse" x="-80" y="0" width="1600" height="900"><rect x="-80" y="470" width="1600" height="430" fill="url(#fadeInB)" /></mask>
          </defs>
          <g mask="url(#fadeBack)"><rect x="-80" width="1600" height="900" fill="url(#cloudBack)" mask="url(#maskA)" /></g>
        </svg>
      </Layer>
      <Layer wide className="cloud-front">
        <svg viewBox="-80 0 1600 900" {...svgProps}>
          <defs>
            <linearGradient id="cloudFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f0b4d8" /><stop offset=".35" stopColor="#7d5ac0" /><stop offset="1" stopColor="#1b1157" /></linearGradient>
            <linearGradient id="fadeInF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" /><stop offset=".22" stopColor="#fff" /></linearGradient>
            <filter id="cloudNoiseB" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.0038 0.013" numOctaves="4" seed="19" />
              <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  6.5 0 0 0 -2.75" />
              <feGaussianBlur stdDeviation="2.2" />
            </filter>
            <mask id="maskB" maskUnits="userSpaceOnUse" x="-80" y="0" width="1600" height="900"><rect x="-80" width="1600" height="900" filter="url(#cloudNoiseB)" /></mask>
            <mask id="fadeFront" maskUnits="userSpaceOnUse" x="-80" y="0" width="1600" height="900"><rect x="-80" y="590" width="1600" height="310" fill="url(#fadeInF)" /></mask>
          </defs>
          <g mask="url(#fadeFront)"><rect x="-80" width="1600" height="900" fill="url(#cloudFront)" mask="url(#maskB)" /></g>
        </svg>
      </Layer>
      <Layer>
        <svg viewBox="0 0 1440 900" {...svgProps}>
          <defs><linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1b1157" stopOpacity="0" /><stop offset="1" stopColor="#1b1157" stopOpacity=".75" /></linearGradient></defs>
          <rect y="700" width="1440" height="200" fill="url(#bottomFade)" />
        </svg>
      </Layer>
    </>
  )
}
