import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { animate, stagger, svg } from 'animejs'
import { ParallaxImage, Reveal } from '../lib/reveal'
import { useAnime } from '../lib/anime'
import { channels, faqs, industryCards, layers, offerings, principles, problems, productDetails, products, roadmap, steps, tech, trust } from '../content'
import { Arrow } from '../components/Icons'

export const wrap = 'mx-auto w-full max-w-[1240px] px-6 sm:px-10'
const section = 'border-b border-line py-24 sm:py-32'

const grid = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.2, 0.7, 0.2, 1] as const } } }
const Stagger = ({ children, className }: { children: React.ReactNode; className: string }) => (
  <motion.div className={className} variants={grid} initial="hidden" whileInView="show" viewport={{ once: true, margin: '0px 0px -8% 0px' }}>{children}</motion.div>
)

export function Positioning() {
  return (
    <section className={section} aria-labelledby="pos">
      <div className={`${wrap} grid items-center gap-12 lg:grid-cols-2`}>
        <div>
          <Reveal>
            <p className="eyebrow">Positioning</p>
            <h2 id="pos" className="h2 mt-4 text-4xl sm:text-6xl">Modern businesses run on conversations.</h2>
            <p className="mt-6 text-lg leading-relaxed text-mist">
              Enquiries arrive through WhatsApp, websites, social media, email and phone. Too often they stay disconnected from the
              actual business process. <span className="text-white">VEYA connects them.</span>
            </p>
          </Reveal>
          <Stagger className="mt-8 flex flex-wrap gap-2">
            {channels.map((c) => (
              <motion.span key={c} variants={item} className="rounded-full border border-line bg-ink-2 px-4 py-2 text-sm">{c}</motion.span>
            ))}
          </Stagger>
        </div>
        <Reveal delay={120}>
          <ParallaxImage src="/img/nairobi-savannah.jpg" alt="The Nairobi skyline seen across the savannah of Nairobi National Park" className="aspect-[4/3] rounded-2xl" position="center 40%" />
        </Reveal>
      </div>
    </section>
  )
}

export function Problem() {
  return (
    <section id="problem" className={section} aria-labelledby="prob">
      <div className={wrap}>
        <Reveal>
          <p className="eyebrow">The problem</p>
          <h2 id="prob" className="h2 mt-4 max-w-3xl text-4xl sm:text-6xl">
            Your customers are already talking to you. <span className="text-mist">Your systems should be listening.</span>
          </h2>
        </Reveal>
        <Stagger className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {problems.map(([t, d], i) => (
            <motion.div key={t} variants={item} whileHover={{ backgroundColor: '#171726' }} className="bg-ink p-6">
              <span className="font-mono text-xs text-violet-soft">0{i + 1}</span>
              <h3 className="mt-6 text-lg font-semibold tracking-tight">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist">{d}</p>
            </motion.div>
          ))}
          <motion.div variants={item} className="flex items-end bg-violet/15 p-6 max-lg:hidden">
            <p className="text-lg font-semibold leading-snug tracking-tight">VEYA connects them into one system.</p>
          </motion.div>
        </Stagger>
      </div>
    </section>
  )
}

export function System() {
  const ref = useRef<HTMLOListElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' })
  useAnime(ref, (reduced) => {
    if (!inView || reduced) return
    animate(svg.createDrawable('.sys-line'), { draw: ['0 0', '0 1'], duration: 2200, ease: 'inOutQuad' })
    animate('.sys-dot', { scale: [0.4, 1], delay: stagger(220), duration: 600, ease: 'outBack' })
  }, [inView])

  return (
    <section id="system" className={section} aria-labelledby="sys">
      <div className={`${wrap} grid gap-14 lg:grid-cols-[1fr_1.2fr]`}>
        <Reveal className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow">The VEYA system</p>
          <h2 id="sys" className="h2 mt-4 text-4xl sm:text-6xl">Infrastructure for how your business talks and sells.</h2>
          <p className="mt-6 max-w-md text-mist">Each layer does one job and hands off cleanly to the next. Start with one and add the rest as you need them.</p>
        </Reveal>
        <ol className="relative" ref={ref}>
          <svg className="absolute bottom-8 left-[1.05rem] top-8 w-1 overflow-visible" preserveAspectRatio="none" viewBox="0 0 2 100" aria-hidden>
            <line className="sys-line" x1="1" y1="0" x2="1" y2="100" stroke="#6d5cff" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </svg>
          {layers.map(([t, d], i) => (
            <Reveal key={t} delay={i * 40}>
              <li className="relative flex gap-5 pb-8">
                <span className="sys-dot z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-ink-3 font-mono text-xs text-violet-soft">{i + 1}</span>
                <motion.div whileHover={{ x: 6 }} className="flex-1 rounded-xl border border-line bg-ink-2 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.14em]">{t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-mist">{d}</p>
                </motion.div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}

/** Compact product cards for the home page. */
export function Products() {
  return (
    <section id="products" className={section} aria-labelledby="prod">
      <div className={wrap}>
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Products</p>
            <h2 id="prod" className="h2 mt-4 max-w-2xl text-4xl sm:text-6xl">One platform, built layer by layer.</h2>
          </div>
          <Link to="/platform" className="inline-flex items-center gap-2 text-sm font-semibold text-lime">See the platform <Arrow /></Link>
        </Reveal>
        <Stagger className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map(([name, tag, desc], i) => (
            <motion.article key={name} variants={item} whileHover={{ y: -6 }} className="group h-full rounded-2xl border border-line bg-ink-2 p-7 transition-colors hover:border-violet/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet/15 font-mono text-xs text-violet-soft">0{i + 1}</div>
              <h3 className="mt-10 text-xl font-semibold tracking-tight">{name}</h3>
              <p className="mt-2 text-white/90">{tag}</p>
              <p className="mt-4 text-sm leading-relaxed text-mist">{desc}</p>
            </motion.article>
          ))}
          <motion.article variants={item} whileHover={{ y: -6 }} className="flex h-full flex-col justify-between rounded-2xl bg-lime p-7 text-ink">
            <p className="eyebrow !text-ink/60">Long term</p>
            <div>
              <h3 className="text-xl font-semibold tracking-tight">VEYA OS</h3>
              <p className="mt-2 text-sm leading-relaxed">A unified operating layer for modern businesses. We are building toward it, one workflow at a time.</p>
            </div>
          </motion.article>
        </Stagger>
      </div>
    </section>
  )
}

/** Alternating detail rows for the platform page. */
export function ProductDetails() {
  return (
    <section className={section} aria-label="Products in detail">
      <div className={`${wrap} space-y-24`}>
        {productDetails.map((p, i) => (
          <div key={p.name} id={p.name.toLowerCase().replace(/\s/g, '-')} className="grid items-center gap-10 lg:grid-cols-2">
            <Reveal className={i % 2 ? 'lg:order-2' : ''}>
              <p className="eyebrow">0{i + 1}</p>
              <h2 className="h2 mt-3 text-4xl sm:text-5xl">{p.name}</h2>
              <p className="mt-3 text-xl text-white/90">{p.tag}</p>
              <p className="mt-5 max-w-md leading-relaxed text-mist">{p.body}</p>
              <ul className="mt-6 space-y-2 text-sm">
                {p.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-lime" />{b}</li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={100}>
              <motion.div whileHover={{ rotate: i % 2 ? 1 : -1, scale: 1.01 }} className="rounded-2xl border border-line bg-ink-2 p-5 shadow-2xl shadow-black/40">
                <div className="mb-4 flex gap-1.5" aria-hidden>{[0, 1, 2].map((d) => <span key={d} className="h-2.5 w-2.5 rounded-full bg-white/15" />)}</div>
                <ul className="space-y-2">
                  {p.ui.map(([a, b]) => (
                    <li key={a + b} className="flex items-center justify-between rounded-lg border border-line bg-ink px-4 py-3.5 text-sm">
                      <span className="text-mist">{a}</span><span className="font-medium">{b}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-mist">Illustrative interface</p>
              </motion.div>
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  )
}

/** Photo cards. `preview` shows four with a link; the full page shows all eight. */
export function Industries({ preview = false }: { preview?: boolean }) {
  const list = preview ? industryCards.filter((c) => c.img).slice(0, 4) : industryCards
  return (
    <section id="industries" className={section} aria-labelledby="ind">
      <div className={wrap}>
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Industries</p>
            <h2 id="ind" className="h2 mt-4 max-w-2xl text-4xl sm:text-5xl">Where conversations turn into revenue.</h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-mist">Starting points, not templates. Every build is scoped around your own process.</p>
          </div>
          {preview && <Link to="/solutions" className="inline-flex items-center gap-2 text-sm font-semibold text-lime">All industries <Arrow /></Link>}
        </Reveal>
        <Stagger className={`mt-12 grid gap-4 sm:grid-cols-2 ${preview ? 'lg:grid-cols-4' : 'lg:grid-cols-4'}`}>
          {list.map((c) => (
            <motion.article key={c.name} variants={item} whileHover="hover" initial="rest" className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-plum">
              {c.img ? (
                <motion.img variants={{ rest: { scale: 1 }, hover: { scale: 1.07 } }} transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }} src={c.img} alt="" loading="lazy" decoding="async" style={{ objectPosition: c.pos }} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_30%_20%,#6d5cff88,transparent),linear-gradient(160deg,#261c69,#0f0a33)]" aria-hidden />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-[#0a0a12]/30 to-transparent" aria-hidden />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="text-lg font-semibold tracking-tight">{c.name}</h3>
                {!preview && <p className="mt-1.5 text-sm leading-snug text-white/75">{c.line}</p>}
              </div>
            </motion.article>
          ))}
        </Stagger>
        {!preview && <p className="mt-6 text-xs text-mist">Illustrative examples. Nothing here is a pre-built industry template.</p>}
      </div>
    </section>
  )
}

export function Offerings() {
  return (
    <section className={section} aria-labelledby="off">
      <div className={wrap}>
        <Reveal>
          <p className="eyebrow">Ways to start</p>
          <h2 id="off" className="h2 mt-4 max-w-2xl text-4xl sm:text-5xl">Productized services that grow into products.</h2>
        </Reveal>
        <Stagger className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {offerings.map(([t, d]) => (
            <motion.div key={t} variants={item} whileHover={{ backgroundColor: '#171726' }} className="bg-ink p-7">
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-mist">{d}</p>
            </motion.div>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

export function Process() {
  const ref = useRef<HTMLOListElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -25% 0px' })
  useAnime(ref, (reduced) => {
    if (!inView || reduced) return
    animate(svg.createDrawable('.proc-line'), { draw: ['0 0', '0 1'], duration: 2000, ease: 'inOutQuad' })
    animate('.proc-num', { scale: [0, 1], delay: stagger(280), duration: 500, ease: 'outBack' })
  }, [inView])

  return (
    <section id="process" className={section} aria-labelledby="proc">
      <div className={wrap}>
        <Reveal>
          <p className="eyebrow">How it works</p>
          <h2 id="proc" className="h2 mt-4 max-w-3xl text-4xl sm:text-6xl">Start with one process. Make it measurable.</h2>
          <p className="mt-5 max-w-xl text-mist">We identify a single repetitive business process and turn it into an automated workflow you can measure.</p>
        </Reveal>
        <ol ref={ref} className="relative mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <svg className="pointer-events-none absolute left-0 right-0 top-[2.15rem] hidden h-1 w-full lg:block" preserveAspectRatio="none" viewBox="0 0 100 2" aria-hidden>
            <line className="proc-line" x1="4" y1="1" x2="96" y2="1" stroke="#e3f35b" strokeOpacity=".5" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </svg>
          {steps.map(([t, d], i) => (
            <Reveal key={t} delay={i * 60}>
              <li className="relative h-full rounded-2xl border border-line bg-ink-2 p-5">
                <span className="proc-num grid h-9 w-9 place-items-center rounded-full bg-lime font-mono text-xs font-bold text-ink">{i + 1}</span>
                <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.14em]">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mist">{d}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function Technology() {
  return (
    <section className={section} aria-labelledby="tech">
      <div className={wrap}>
        <Reveal>
          <p className="eyebrow">Technology</p>
          <h2 id="tech" className="h2 mt-4 max-w-2xl text-4xl sm:text-5xl">Built to connect with what you already use.</h2>
        </Reveal>
        <Stagger className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {tech.map(([t, d]) => (
            <motion.div key={t} variants={item} className="border-t border-line pt-4">
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-mist">{d}</p>
            </motion.div>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

export function Trust() {
  return (
    <section className={section} aria-labelledby="trust">
      <div className={`${wrap} grid gap-12 lg:grid-cols-[1fr_1.4fr]`}>
        <Reveal>
          <p className="eyebrow">Security</p>
          <h2 id="trust" className="h2 mt-4 text-4xl sm:text-5xl">Designed for trust from day one.</h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-mist">Customer conversations are sensitive. These are the principles the platform is built around.</p>
        </Reveal>
        <Stagger className="grid gap-4 sm:grid-cols-2">
          {trust.map(([t, d]) => (
            <motion.div key={t} variants={item} className="rounded-xl border border-line bg-ink-2 p-5">
              <h3 className="text-sm font-semibold">{t}</h3>
              <p className="mt-1.5 text-sm text-mist">{d}</p>
            </motion.div>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

export function Principles() {
  return (
    <section className={section} aria-labelledby="prin">
      <div className={wrap}>
        <Reveal><p className="eyebrow">Principles</p><h2 id="prin" className="h2 mt-4 max-w-2xl text-4xl sm:text-5xl">How we work.</h2></Reveal>
        <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {principles.map(([t, d], i) => (
            <motion.div key={t} variants={item} className="rounded-2xl border border-line bg-ink-2 p-6">
              <span className="font-mono text-xs text-lime">0{i + 1}</span>
              <h3 className="mt-8 text-lg font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-mist">{d}</p>
            </motion.div>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

export function Roadmap() {
  return (
    <section className={section} aria-labelledby="road">
      <div className={wrap}>
        <Reveal><p className="eyebrow">Direction</p><h2 id="road" className="h2 mt-4 max-w-2xl text-4xl sm:text-5xl">From services to an operating layer.</h2></Reveal>
        <Stagger className="mt-12 grid gap-4 lg:grid-cols-3">
          {roadmap.map(([when, t, d]) => (
            <motion.div key={t} variants={item} className="rounded-2xl border border-line bg-gradient-to-b from-ink-3 to-ink-2 p-7">
              <span className="rounded-full bg-lime px-3 py-1 text-xs font-bold text-ink">{when}</span>
              <h3 className="mt-6 text-xl font-semibold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist">{d}</p>
            </motion.div>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className={section} aria-labelledby="faq">
      <div className={`${wrap} grid gap-12 lg:grid-cols-[1fr_1.5fr]`}>
        <Reveal><p className="eyebrow">FAQ</p><h2 id="faq" className="h2 mt-4 text-4xl sm:text-5xl">Common questions.</h2></Reveal>
        <div className="divide-y divide-line border-y border-line">
          {faqs.map(([q, a], i) => {
            const isOpen = open === i
            return (
              <div key={q}>
                <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-6 py-5 text-left font-medium">
                  {q}
                  <motion.span animate={{ rotate: isOpen ? 45 : 0 }} className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-lg leading-none" aria-hidden>+</motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                      <p className="pb-5 pr-10 text-sm leading-relaxed text-mist">{a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function FinalCTA() {
  return (
    <section id="contact" className="p-3 sm:p-5 lg:p-6" aria-labelledby="cta">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-plum px-6 py-24 text-center sm:rounded-[2.25rem] sm:py-32">
        <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 6, repeat: Infinity }} className="absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_120%,#e0709a77,transparent)]" aria-hidden />
        <Reveal className="relative">
          <h2 id="cta" className="display mx-auto max-w-4xl text-5xl sm:text-7xl">Find one process worth automating.</h2>
          <p className="mt-6 text-lg text-white/80">Start with one workflow. Build from there.</p>
          <motion.div className="mt-10 inline-block" whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-xl bg-lime px-7 py-4 text-xs font-bold uppercase tracking-wide text-ink transition hover:bg-white">
              Book an Automation Audit <Arrow />
            </Link>
          </motion.div>
        </Reveal>
      </div>
    </section>
  )
}
