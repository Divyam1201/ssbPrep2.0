import Link from "next/link";

import { getModules } from "@/modules/registry";

export default function Home() {
  const modules = getModules();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <header>
        <p className="text-xs font-semibold tracking-[0.3em] text-sky-400 uppercase">
          SSB Practice Platform
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
          Train the psychology tests, one module at a time.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Self-contained practice modules with distraction-free, hidden-timer
          sessions. Pick a test to begin.
        </p>
      </header>

      <section aria-labelledby="modules-heading" className="mt-10">
        <h2
          id="modules-heading"
          className="text-sm font-semibold text-zinc-200"
        >
          Available modules
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {modules.map((module) => (
            <li key={module.id}>
              <Link
                href={`/modules/${module.id}`}
                className="group flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-sky-500/60 hover:bg-zinc-900"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="text-lg font-semibold text-zinc-50">
                    {module.title}
                  </span>
                  <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] font-semibold tracking-[0.15em] text-zinc-400 uppercase">
                    {module.id}
                  </span>
                </span>
                <span className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
                  {module.description}
                </span>
                <span className="mt-4 text-sm font-medium text-sky-400 transition group-hover:text-sky-300">
                  Open module →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-12 border-t border-zinc-800 pt-6 text-xs text-zinc-500">
        WAT, SRT and other modules coming soon
        required.
      </footer>
    </main>
  );
}
