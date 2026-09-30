import PageHero from '../components/PageHero'
import { FinalCTA, Industries, Offerings } from '../sections/Sections'

export default function Solutions() {
  return (
    <>
      <PageHero
        eyebrow="Solutions" lines={['Built around', 'your process.']}
        body="Start with a productized service. It becomes a standard VEYA product as the patterns repeat."
        image="/img/mombasa-port.jpg" alt="Container cranes and a truck at the Port of Mombasa" position="center 60%"
      />
      <main>
        <Offerings />
        <Industries />
        <FinalCTA />
      </main>
    </>
  )
}
