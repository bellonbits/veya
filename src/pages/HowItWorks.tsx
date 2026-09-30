import PageHero from '../components/PageHero'
import Demo from '../sections/Demo'
import { Faq, FinalCTA, Process } from '../sections/Sections'

export default function HowItWorks() {
  return (
    <>
      <PageHero
        eyebrow="How it works" lines={['One process.', 'Made measurable.']}
        body="We begin by identifying one repetitive business process, then turn it into an automated workflow."
        image="/img/nairobi-savannah.jpg" alt="The Nairobi skyline in the distance" position="center 45%"
      />
      <main>
        <Process />
        <Demo />
        <Faq />
        <FinalCTA />
      </main>
    </>
  )
}
