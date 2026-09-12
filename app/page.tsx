const errors: Record<string, string> = {
  threads_not_configured: "Threads OAuth is not configured yet. Add your Meta app credentials first.",
  oauth_state_mismatch: "That sign-in session expired. Please try connecting Threads again.",
  token_exchange_failed: "Meta did not complete the token exchange. Check your redirect URI and app permissions.",
  oauth_failed: "Threads sign-in failed. Please try again.",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  return (
    <main className="landing-shell">
      <div className="grid-bg" />
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <nav className="topbar landing-nav">
        <a className="brand" href="/">THREAD<span>DNA</span></a>
        <span className="nav-tag">V0 · READ-ONLY ANALYSIS</span>
      </nav>

      <section className="landing-hero">
        <div className="hero-copy">
          <p className="eyebrow">YOUR POSTS LEAVE A FINGERPRINT</p>
          <h1>
            See what your <span>Threads</span> account is made of.
          </h1>
          <p className="hero-subtitle">
            Connect your account. We analyze your recent posts and turn the patterns into a shareable creator DNA report.
          </p>

          {error ? <div className="error-banner">{errors[error] ?? "Something went wrong. Please try again."}</div> : null}

          <div className="cta-row">
            <a className="primary-button" href="/api/oauth/threads/start">
              Connect Threads <span>↗</span>
            </a>
            {demoMode ? (
              <a className="secondary-button" href="/r/demo">Preview demo</a>
            ) : null}
          </div>

          <div className="trust-row">
            <span><i /> Read-only</span>
            <span><i /> No token stored</span>
            <span><i /> 24 recent posts</span>
          </div>
        </div>

        <div className="preview-wrap" aria-hidden="true">
          <div className="preview-card glass">
            <div className="preview-top">
              <span>THREADDNA / SAMPLE</span>
              <span>@you</span>
            </div>
            <div className="preview-center">
              <div className="preview-score-ring">
                <strong>84</strong>
                <small>/ 100</small>
              </div>
              <div>
                <p className="eyebrow">CREATOR ARCHETYPE</p>
                <h2>THE BUILDER</h2>
                <p className="preview-copy">Practical signal. Strong process. High conversation potential.</p>
              </div>
            </div>
            <div className="mini-bars">
              {[92, 86, 78, 72, 88].map((value, index) => (
                <div className="mini-row" key={value + index}>
                  <span>{["Conversation", "Originality", "Authority", "Consistency", "Virality"][index]}</span>
                  <div><i style={{ width: `${value}%` }} /></div>
                  <b>{value}</b>
                </div>
              ))}
            </div>
          </div>
          <div className="floating-pill pill-one">SHAREABLE RESULT ↗</div>
          <div className="floating-pill pill-two">5 SIGNALS</div>
        </div>
      </section>

      <section className="how-strip">
        <div><b>01</b><span>Connect</span><p>Authorize read-only Threads access.</p></div>
        <div><b>02</b><span>Analyze</span><p>We score recent content and engagement signals.</p></div>
        <div><b>03</b><span>Share</span><p>Get a public result page with its own social preview.</p></div>
      </section>

      <footer className="landing-footer">
        <p>Independent prototype. Not affiliated with Meta or Threads.</p>
        <p>ThreadDNA does not persist raw post history or access tokens. Narrative processing uses Google Gemini.</p>
      </footer>
    </main>
  );
}
