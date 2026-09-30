import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import Hero from '../components/Hero'
import Workflow from '../sections/Workflow'
import Demo from '../sections/Demo'
import { Reveal } from '../lib/reveal'
import { Arrow } from '../components/Icons'
import { FinalCTA, Industries, Positioning, Problem, Products, wrap } from '../sections/Sections'

const Dashboard = lazy(() => import('../sections/Dashboard'))

export default function Home() {
  return (
    <>
      <Hero />
      <main>
        <Workflow />
        <Positioning />
        <Problem />
        <Products />
        <Demo />
        <section className="border-b border-line py-24 sm:py-32" aria-labelledby="dash">
          <div className={wrap}>
            <Reveal className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow">Dashboard</p>
                <h2 id="dash" className="h2 mt-4 max-w-2xl text-4xl sm:text-6xl">See what is happening, all in one place.</h2>
              </div>
              <a href="/app" className="inline-flex items-center gap-2 text-sm font-semibold text-lime">Open full view <Arrow /></a>
            </Reveal>
            <Reveal delay={100}>
              <div className="mt-12 max-h-[46rem] overflow-hidden rounded-2xl border border-line shadow-2xl shadow-black/50">
                <Suspense fallback={<div className="h-[40rem]" />}><Dashboard /></Suspense>
              </div>
            </Reveal>
          </div>
        </section>
        <Industries preview />
        <div className={`${wrap} pb-24 pt-10`}>
          <Link to="/how-it-works" className="inline-flex items-center gap-2 text-sm font-semibold text-lime">See how an engagement works <Arrow /></Link>
        </div>
        <FinalCTA />
      </main>
    </>
  )
}
