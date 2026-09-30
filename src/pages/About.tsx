import PageHero from '../components/PageHero'
import { ParallaxImage, Reveal } from '../lib/reveal'
import { FinalCTA, Principles, Roadmap, wrap } from '../sections/Sections'

export default function About() {
  return (
    <>
      <PageHero
        eyebrow="About VEYA" lines={['Technology for how', 'Africa does business.']}
        body="VEYA starts in Kenya and is built as a global technology company from day one."
        image="/img/matatu.jpg" alt="A colourful matatu at a busy Nairobi intersection" position="center 45%"
      />
      <main>
        <section className="border-b border-line py-24 sm:py-32" aria-labelledby="story">
          <div className={`${wrap} grid items-center gap-12 lg:grid-cols-2`}>
            <Reveal>
              <p className="eyebrow">Our story</p>
              <h2 id="story" className="h2 mt-4 text-4xl sm:text-5xl">Business here already runs on conversation.</h2>
              <div className="mt-6 space-y-4 leading-relaxed text-mist">
                <p>In Nairobi, Mombasa and beyond, deals start in a chat. Customers message on WhatsApp, ask a question, and expect a quick answer.</p>
                <p>VEYA builds the systems behind that moment: the agent that replies, the CRM that remembers and the workflow that follows up. The long-term goal is an operating layer for modern African businesses.</p>
              </div>
            </Reveal>
            <Reveal delay={120} className="grid grid-cols-2 gap-4">
              <ParallaxImage src="/img/retail.jpg" alt="Handwoven baskets on display at a Nairobi market" className="aspect-[3/4] rounded-2xl" strength={30} />
              <ParallaxImage src="/img/mombasa-port.jpg" alt="The Port of Mombasa" className="mt-10 aspect-[3/4] rounded-2xl" strength={30} />
            </Reveal>
          </div>
        </section>
        <Principles />
        <Roadmap />
        <FinalCTA />
      </main>
    </>
  )
}
