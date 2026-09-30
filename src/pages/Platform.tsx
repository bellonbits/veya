import PageHero from '../components/PageHero'
import { FinalCTA, ProductDetails, System, Technology, Trust } from '../sections/Sections'

export default function Platform() {
  return (
    <>
      <PageHero
        eyebrow="Platform" lines={['One system for', 'every conversation.']}
        body="Inbox, Agent, CRM, Flow and Analytics. Each layer does one job and hands off cleanly to the next."
        image="/img/zarafa-towers.jpg" alt="A modern tower in Nairobi against a bright sky" position="center 35%"
      />
      <main>
        <System />
        <ProductDetails />
        <Technology />
        <Trust />
        <FinalCTA />
      </main>
    </>
  )
}
