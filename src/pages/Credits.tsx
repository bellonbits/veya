import credits from '../credits.json'
import { wrap } from '../sections/Sections'

export default function Credits() {
  return (
    <main className={`${wrap} py-32`}>
      <title>Photo credits — VEYA</title>
      <h1 className="display text-5xl">Photo credits</h1>
      <p className="mt-4 max-w-xl text-mist">Photographs are from Wikimedia Commons and used under the licences below. Images are resized and cropped.</p>
      <ul className="mt-12 divide-y divide-line border-y border-line">
        {Object.values(credits).map((c) => (
          <li key={c.url} className="flex flex-col justify-between gap-1 py-4 text-sm sm:flex-row">
            <a href={c.url} target="_blank" rel="noreferrer" className="text-white hover:text-lime">{c.title.replace(/\.jpe?g$/i, '')}</a>
            <span className="text-mist">{c.author} · {c.license}</span>
          </li>
        ))}
      </ul>
    </main>
  )
}
