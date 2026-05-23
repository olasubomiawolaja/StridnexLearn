const NAV_LINKS = ["How It Works", "About", "Testimonials"];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Choose Your Course",
    desc: "Pick any subject \u2014 physics, math, literature, coding. No fixed curriculum. You define what you learn.",
  },
  {
    step: "02",
    title: "AI Teaches, Not Answers",
    desc: "Your tutor explains concepts deeply, asks follow-up questions, and guides you to real understanding.",
  },
  {
    step: "03",
    title: "It Adapts to You",
    desc: "Based on your responses and scores, the system detects weak areas and adjusts difficulty in real time.",
  },
  {
    step: "04",
    title: "Master Through Practice",
    desc: "Quizzes, assignments, and guided problem-solving reinforce learning until you truly get it.",
  },
];

const ABOUT_FEATURES = [
  { label: "Any Subject", desc: "No fixed curriculum \u2014 you choose" },
  { label: "Truly Adaptive", desc: "Responds to your progress" },
  { label: "Teaches First", desc: "Never spoon-feeds answers" },
  { label: "Always Available", desc: "24/7 personal AI tutor" },
];

const TESTIMONIALS = [
  {
    name: "Amara Osei",
    role: "WAEC Student, Lagos",
    initials: "AO",
    text: "I was failing physics before StridenexLearn. The AI doesn't just give me answers \u2014 it actually makes me think. My grades went from D to B+ in two months.",
  },
  {
    name: "David Nwosu",
    role: "University Freshman, Abuja",
    initials: "DN",
    text: "What I love is that it stays on topic. When I'm in my Chemistry course, everything is chemistry. It feels like having a private tutor available 24/7.",
  },
  {
    name: "Fatima Al-Hassan",
    role: "High School Teacher, Kano",
    initials: "FA",
    text: "I recommend StridenexLearn to all my students. It teaches the way I wish I had time to \u2014 patiently, adaptively, and with real depth.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-xs font-bold text-white">
              SL
            </div>
            <span className="font-semibold text-lg tracking-tight">
              StridenexLearn
            </span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                {link}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2"
            >
              Sign In
            </a>
            <a
              href="/signup"
              className="text-sm bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-800"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-600 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            AI-Powered Adaptive Tutoring
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Learn deeper.
            <br />
            <span className="text-gray-400">Think smarter.</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            StridenexLearn is an AI tutor that adapts to how you learn &mdash;
            adjusting explanations, generating quizzes, and guiding you through
            any subject at your own pace.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/signup"
              className="bg-gray-900 text-white px-7 py-3.5 rounded-lg text-base font-medium hover:bg-gray-800 transition-colors"
            >
              Start Learning Free &rarr;
            </a>
            <a
              href="#how-it-works"
              className="border border-gray-200 text-gray-600 px-7 py-3.5 rounded-lg text-base hover:bg-gray-50 transition-colors"
            >
              See How It Works
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            <span>No credit card required</span>
            <span className="hidden sm:inline text-gray-200">&middot;</span>
            <span>Any subject, any level</span>
            <span className="hidden sm:inline text-gray-200">&middot;</span>
            <span>Adapts to you</span>
          </div>
        </div>

        {/* Chat preview */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-6">
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100">
              <div className="w-7 h-7 rounded-md bg-gray-900 flex items-center justify-center text-[10px] font-bold text-white">
                SL
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  StridenexLearn Tutor
                </p>
                <p className="text-xs text-gray-400">Physics &middot; Active</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-md bg-gray-900 flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5">
                  AI
                </div>
                <div className="bg-white rounded-lg rounded-tl-none border border-gray-100 px-4 py-2.5 text-gray-600 max-w-sm">
                  Let&apos;s start from the beginning. What do you know about
                  wave-particle duality?
                </div>
              </div>
              <div className="flex gap-2.5 justify-end">
                <div className="bg-gray-900 text-white rounded-lg rounded-tr-none px-4 py-2.5 max-w-sm">
                  I&apos;ve heard of it but I&apos;m not sure what it means
                  exactly...
                </div>
              </div>
              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-md bg-gray-900 flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5">
                  AI
                </div>
                <div className="bg-white rounded-lg rounded-tl-none border border-gray-100 px-4 py-2.5 text-gray-600 max-w-sm">
                  Perfect starting point! Let me explain with an experiment you
                  can picture...
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 md:py-28 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Process
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              How It Works
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Four steps from confused to confident &mdash; guided by AI that
              genuinely teaches.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="bg-white rounded-xl border border-gray-100 p-7 hover:border-gray-200 hover:shadow-sm transition-[border-color,box-shadow] duration-150"
              >
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Step {item.step}
                </span>
                <h3 className="text-lg font-semibold text-gray-900 mt-2 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                About
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 leading-tight">
                The AI tutor that thinks like a teacher
              </h2>
              <p className="text-gray-500 leading-relaxed mb-5">
                Most AI tools just answer questions. StridenexLearn is built
                differently &mdash; it starts by assuming you&apos;re a beginner and
                builds up your understanding layer by layer through guided
                questions and explanations.
              </p>
              <p className="text-gray-500 leading-relaxed mb-8">
                It&apos;s not here to replace your teachers. It&apos;s the
                patient, always-adapting assistant that every student deserves &mdash;
                across any course, any domain.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {ABOUT_FEATURES.map((f) => (
                  <div
                    key={f.label}
                    className="bg-gray-50 rounded-lg border border-gray-100 p-4"
                  >
                    <p className="text-sm font-semibold text-gray-900 mb-0.5">
                      {f.label}
                    </p>
                    <p className="text-xs text-gray-400">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — session preview */}
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                Live Session Preview
              </p>

              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100">
                <div className="w-7 h-7 rounded-md bg-gray-900 flex items-center justify-center text-[10px] font-bold text-white">
                  SL
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Quantum Physics 101</p>
                  <p className="text-xs text-gray-400">Course</p>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-gray-900 flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5">
                    AI
                  </div>
                  <div className="bg-white rounded-lg rounded-tl-none border border-gray-100 px-3 py-2 text-gray-600">
                    What do you know about wave-particle duality?
                  </div>
                </div>
                <div className="flex gap-2.5 justify-end">
                  <div className="bg-gray-900 text-white rounded-lg rounded-tr-none px-3 py-2">
                    Not sure what it means exactly...
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-gray-900 flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5">
                    AI
                  </div>
                  <div className="bg-white rounded-lg rounded-tl-none border border-gray-100 px-3 py-2 text-gray-600">
                    Perfect! Let me explain with a simple experiment...
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>Understanding</span>
                  <span className="text-emerald-500">Building...</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-gray-900 h-1.5 rounded-full transition-all"
                    style={{ width: "35%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-20 md:py-28 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Testimonials
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              What Students Are Saying
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Real learners, real results. No spoon-feeding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-white rounded-xl border border-gray-100 p-6 hover:border-gray-200 hover:shadow-sm transition-[border-color,box-shadow] duration-150"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-xs font-semibold text-white">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, s) => (
                    <span key={s} className="text-amber-400 text-sm">
                      &#9733;
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  &ldquo;{t.text}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 md:py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to learn the right way?
          </h2>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto">
            Join students who are mastering their subjects with an AI that
            teaches, adapts, and grows with them.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/signup"
              className="bg-gray-900 text-white px-7 py-3.5 rounded-lg text-base font-medium hover:bg-gray-800 transition-colors"
            >
              Get Started &mdash; It&apos;s Free
            </a>
            <a
              href="/login"
              className="border border-gray-200 text-gray-600 px-7 py-3.5 rounded-lg text-base hover:bg-gray-50 transition-colors"
            >
              Sign In
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gray-900 flex items-center justify-center text-[9px] font-bold text-white">
              SL
            </div>
            <span className="font-semibold text-sm">StridenexLearn</span>
          </div>
          <p className="text-gray-400 text-xs">
            &copy; 2026 StridenexLearn. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-gray-400">
            <a href="#" className="hover:text-gray-600 transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-gray-600 transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-gray-600 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
