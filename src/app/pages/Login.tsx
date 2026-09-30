import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Wordmark } from '../../components/Logo'
import { useSession } from '../store/session'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Form'

/** Auth-ready placeholder: swap `signIn` for the OAuth/JWT flow (httpOnly cookie issued by the API). */
export default function Login() {
  const { signedIn, signIn } = useSession(), nav = useNavigate()
  const [email, setEmail] = useState('grace@nairobiprime.example')
  if (signedIn) return <Navigate to="/app/overview" replace />
  return (
    <div className="app grid min-h-svh place-items-center px-4" data-theme="light">
      <title>Sign in · VEYA</title>
      <div className="w-full max-w-sm rounded-2xl border border-edge bg-panel p-7 shadow-sm">
        <Wordmark tone="dark" />
        <h1 className="mt-7 text-xl font-semibold tracking-tight text-fg">Sign in to VEYA</h1>
        <p className="mt-1 text-sm text-fg2">Business, automated.</p>
        <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); signIn(); nav('/app/overview') }}>
          <Field label="Work email">{(id) => <Input id={id} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />}</Field>
          <Field label="Password" hint="Demo workspace: any value works. Real sign-in arrives with the API.">{(id) => <Input id={id} type="password" autoComplete="current-password" defaultValue="demo-password" required />}</Field>
          <Button variant="accent" type="submit" className="w-full">Continue</Button>
          <Button className="w-full" disabled>Continue with Google — coming soon</Button>
        </form>
      </div>
    </div>
  )
}
