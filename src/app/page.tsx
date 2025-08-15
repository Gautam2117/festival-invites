export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <section className="card p-8">
        <h1 className="font-display text-3xl mb-2">Festival Invites</h1>
        <p className="text-ink-700 mb-6">
          WhatsApp-first e-invites and wishes for Indian festivals, birthdays, anniversaries, and more.
        </p>
        <div className="flex items-center gap-3">
          <a className="btn" href="/builder">Start building</a>
          <a className="underline" href="/about">About</a>
        </div>
      </section>
    </main>
  );
}
