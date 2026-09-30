import type { ReactNode } from 'react'
import { Component } from 'react'
import { ErrorState } from '../components/ui/States'

export const Page = ({ children, wide }: { children: ReactNode; wide?: boolean }) => (
  <div className={`mx-auto w-full px-4 py-5 sm:px-6 sm:py-7 ${wide ? 'max-w-[1440px]' : 'max-w-[1280px]'}`}>{children}</div>
)

export class Boundary extends Component<{ children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {}
  static getDerivedStateFromError(error: Error) { return { error } }
  render() { return this.state.error ? <ErrorState error={this.state.error} onRetry={() => this.setState({ error: undefined })} /> : this.props.children }
}
