import { Page } from '../layouts/Page'
import { EmptyState } from '../components/ui/States'
import { LinkButton } from '../components/ui/Button'

export default function NotFound() {
  return <Page><title>Not found · VEYA</title><EmptyState title="This page doesn't exist" body="The link may be out of date. Head back to your overview." action={<LinkButton to="/app/overview" variant="accent">Go to overview</LinkButton>} /></Page>
}
