import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { ArrowLeft, ChevronRight, Printer, RotateCcw } from "lucide-react";

const SP = {
  bg: "#1A1A2E",
  bg2: "#16213E",
  accent: "#00FFAA",
  accent2: "#0F3460",
  text: "#FFFFFF",
  textMuted: "#A0A0B0",
  danger: "#FF4444",
};

const sections = [
  { id: "hero", label: "Top" },
  { id: "identity", label: "Identity" },
  { id: "batting-avg", label: "QABs" },
  { id: "four-intentions", label: "Protocol" },
  { id: "opening-day", label: "Mindset" },
  { id: "hunting", label: "Hunting" },
  { id: "physio", label: "BPM" },
  { id: "integration", label: "Map" },
  { id: "closing", label: "Run It" },
];

function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const top = visible.reduce((a, b) =>
            a.boundingClientRect.top < b.boundingClientRect.top ? a : b
          );
          setActive(top.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function FadeSection({ id, children, className = "" }: { id?: string; children: React.ReactNode; className?: string }) {
  const ref = useFadeIn();
  return (
    <div
      ref={ref}
      id={id}
      className={className}
      style={{
        opacity: 0,
        transform: "translateY(30px)",
        transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
      }}
    >
      {children}
    </div>
  );
}

function StickyNav({ active }: { active: string }) {
  return (
    <nav
      className="sticky top-0 z-50 flex items-center gap-1 overflow-x-auto px-4 py-2 backdrop-blur-md border-b scrollbar-hide"
      style={{ background: `${SP.bg}ee`, borderColor: SP.accent2 }}
    >
      <Link href="/modules">
        <button className="shrink-0 p-2 rounded-lg hover:bg-white/10 transition-colors" data-testid="link-back-modules">
          <ArrowLeft size={18} color={SP.accent} />
        </button>
      </Link>
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            data-testid={`nav-${s.id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
            }}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap"
            style={{
              background: active === s.id ? SP.accent : "transparent",
              color: active === s.id ? SP.bg : SP.textMuted,
            }}
          >
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

function ModuleBadge({ num }: { num: number }) {
  return (
    <span
      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold"
      style={{ background: SP.accent2, color: SP.accent, border: `1px solid ${SP.accent}44` }}
    >
      M{num}
    </span>
  );
}

function HeroSection() {
  return (
    <FadeSection id="hero" className="py-16 md:py-24 px-4 text-center">
      <div className="max-w-3xl mx-auto">
        <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-6"
          style={{ background: `${SP.accent}20`, color: SP.accent, border: `1px solid ${SP.accent}40` }}>
          Bonus Module
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight" style={{ fontFamily: "'Oswald', sans-serif", color: SP.text }}>
          The Springer Protocol
        </h1>
        <p className="text-lg md:text-xl mb-8" style={{ color: SP.textMuted }}>
          A 14-year pro accidentally built a cybernetic system. Here's how to run it.
        </p>
        <p className="text-sm md:text-base leading-relaxed mb-10 max-w-2xl mx-auto" style={{ color: SP.textMuted }}>
          Steve Springer played 14 years in professional baseball — 11 years in Triple-A — and eventually became the mental skills coach for the Toronto Blue Jays. He never used the word "cybernetics." But everything he teaches maps directly onto the bio-computer model at the core of The 6th Tool. This bonus lesson is the translation layer.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="text-xs font-medium mr-2" style={{ color: SP.textMuted }}>Connects to:</span>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <ModuleBadge key={n} num={n} />
          ))}
        </div>
      </div>
    </FadeSection>
  );
}

const confidentOS = {
  thoughts: ["I belong here", "I'm ready for this pitch", "My preparation is my proof", "I trust my hands"],
  bodyLang: ["Relaxed shoulders", "Eyes locked on pitcher", "Controlled breathing", "Steady stance"],
  decisions: ["Hunt my pitch", "Swing with conviction", "Trust the process", "Stay present"],
};
const nonConfidentOS = {
  thoughts: ["Don't strike out", "I'm in a slump", "Everyone's watching", "What if I fail?"],
  bodyLang: ["Tense grip", "Darting eyes", "Shallow breathing", "Fidgeting"],
  decisions: ["Protect the plate", "Hope for a walk", "Swing at everything", "Check batting avg"],
};

function IdentityToggle() {
  const [isConfident, setIsConfident] = useState(true);
  const data = isConfident ? confidentOS : nonConfidentOS;
  const label = isConfident ? "Confident OS" : "Non-Confident OS";

  return (
    <div className="rounded-2xl p-6 md:p-8" style={{ background: SP.bg2, border: `1px solid ${SP.accent2}` }}>
      <div className="flex items-center justify-center gap-4 mb-8">
        <span className="text-sm font-medium" style={{ color: isConfident ? SP.accent : SP.textMuted }}>Confident OS</span>
        <button
          data-testid="toggle-os"
          onClick={() => setIsConfident(!isConfident)}
          className="relative w-16 h-8 rounded-full transition-colors duration-300"
          style={{ background: isConfident ? SP.accent : SP.danger }}
        >
          <div
            className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-transform duration-300"
            style={{ left: isConfident ? "2px" : "calc(100% - 26px)" }}
          />
        </button>
        <span className="text-sm font-medium" style={{ color: !isConfident ? SP.danger : SP.textMuted }}>Non-Confident OS</span>
      </div>
      <div className="text-center mb-6">
        <span className="px-4 py-1.5 rounded-full text-sm font-bold"
          style={{ background: isConfident ? `${SP.accent}20` : `${SP.danger}20`, color: isConfident ? SP.accent : SP.danger }}>
          {label}
        </span>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {(["thoughts", "bodyLang", "decisions"] as const).map((cat) => (
          <div key={cat} className="rounded-xl p-4" style={{ background: `${SP.bg}80` }}>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: SP.accent }}>
              {cat === "bodyLang" ? "Body Language" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </h4>
            <ul className="space-y-2">
              {data[cat].map((item, i) => (
                <li key={i} className="text-sm flex items-start gap-2" style={{ color: SP.text }}>
                  <ChevronRight size={14} style={{ color: isConfident ? SP.accent : SP.danger, marginTop: 2, flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

const qabCriteria = [
  "Hard contact",
  "Good pitch to hit",
  "Productive out",
  "Walk",
  "Hit",
  "Moved runner",
  "Battle with 2 strikes",
];

function QABScorecard() {
  const [checked, setChecked] = useState<boolean[]>(new Array(7).fill(false));
  const score = checked.filter(Boolean).length;
  const label = score >= 5 ? "Elite At-Bat" : score >= 3 ? "Quality At-Bat" : "Learning At-Bat";
  const labelColor = score >= 5 ? SP.accent : score >= 3 ? "#FFD700" : SP.textMuted;

  return (
    <div className="rounded-2xl p-6 md:p-8" style={{ background: SP.bg2, border: `1px solid ${SP.accent2}` }}>
      <h4 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: SP.accent }}>
        QAB Scorecard
      </h4>
      <div className="space-y-3 mb-6">
        {qabCriteria.map((c, i) => (
          <label key={i} className="flex items-center gap-3 cursor-pointer group" data-testid={`qab-${i}`}>
            <div
              className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
              style={{
                borderColor: checked[i] ? SP.accent : SP.accent2,
                background: checked[i] ? SP.accent : "transparent",
              }}
            >
              {checked[i] && <span className="text-xs font-bold" style={{ color: SP.bg }}>✓</span>}
            </div>
            <span className="text-sm" style={{ color: SP.text }}>{c}</span>
            <input
              type="checkbox"
              className="sr-only"
              checked={checked[i]}
              onChange={() => {
                const next = [...checked];
                next[i] = !next[i];
                setChecked(next);
              }}
            />
          </label>
        ))}
      </div>
      <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: `${SP.bg}80` }}>
        <div>
          <div className="text-xs" style={{ color: SP.textMuted }}>Score</div>
          <div className="text-2xl font-bold" style={{ color: SP.text }}>{score}/7</div>
        </div>
        <div className="text-right">
          <div className="text-xs" style={{ color: SP.textMuted }}>Rating</div>
          <div className="text-lg font-bold" style={{ color: labelColor }}>{label}</div>
        </div>
      </div>
      <button
        data-testid="button-reset-qab"
        onClick={() => setChecked(new Array(7).fill(false))}
        className="mt-4 text-xs flex items-center gap-1 mx-auto"
        style={{ color: SP.textMuted }}
      >
        <RotateCcw size={12} /> Reset
      </button>
    </div>
  );
}

const intentions = [
  { num: 1, title: "Identity State Activation", desc: "Walk up with 100% confidence" },
  { num: 2, title: "Process Focus Override", desc: "Hit the ball hard" },
  { num: 3, title: "Perceptual Narrowing", desc: "Attack the inside part / hunt your speed" },
  { num: 4, title: "Ego Dissolution", desc: "Help the team win" },
];

function BootSequence() {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [complete, setComplete] = useState(false);

  const run = useCallback(() => {
    setRunning(true);
    setStep(-1);
    setComplete(false);
    let i = 0;
    const interval = setInterval(() => {
      setStep(i);
      i++;
      if (i >= intentions.length) {
        clearInterval(interval);
        setTimeout(() => {
          setComplete(true);
          setRunning(false);
        }, 800);
      }
    }, 900);
  }, []);

  return (
    <div className="rounded-2xl p-6 md:p-8" style={{ background: SP.bg2, border: `1px solid ${SP.accent2}` }}>
      <div className="space-y-3 mb-8">
        {intentions.map((intent, i) => {
          const active = step >= i;
          const current = step === i && !complete;
          return (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-xl transition-all duration-500"
              style={{
                background: active ? `${SP.accent}10` : `${SP.bg}50`,
                border: `1px solid ${current ? SP.accent : active ? `${SP.accent}30` : SP.accent2}`,
                opacity: step === -1 ? 0.4 : active ? 1 : 0.3,
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-all duration-500"
                style={{
                  background: active ? SP.accent : SP.accent2,
                  color: active ? SP.bg : SP.textMuted,
                }}
              >
                {active ? "✓" : intent.num}
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: active ? SP.accent : SP.textMuted }}>
                  {intent.title}
                </div>
                <div className="text-sm mt-0.5" style={{ color: active ? SP.text : SP.textMuted }}>
                  {intent.desc}
                </div>
              </div>
              {current && (
                <div className="ml-auto w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${SP.accent} transparent ${SP.accent} ${SP.accent}` }} />
              )}
            </div>
          );
        })}
      </div>
      {complete && (
        <div className="text-center p-4 rounded-xl mb-4" style={{ background: `${SP.accent}15`, border: `1px solid ${SP.accent}40` }}>
          <div className="text-lg font-bold" style={{ color: SP.accent }}>PROTOCOL LOADED</div>
          <div className="text-xs mt-1" style={{ color: SP.textMuted }}>All systems ready. Step into the box.</div>
        </div>
      )}
      <button
        data-testid="button-run-protocol"
        onClick={run}
        disabled={running}
        className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all"
        style={{
          background: running ? SP.accent2 : SP.accent,
          color: running ? SP.textMuted : SP.bg,
          opacity: running ? 0.7 : 1,
        }}
      >
        {running ? "LOADING..." : complete ? "RUN AGAIN" : "RUN PROTOCOL"}
      </button>
    </div>
  );
}

function TemporalRelease() {
  const [text, setText] = useState("");
  const [releasing, setReleasing] = useState(false);

  const handleRelease = () => {
    if (!text.trim()) return;
    setReleasing(true);
    setTimeout(() => {
      setText("");
      setReleasing(false);
    }, 1500);
  };

  return (
    <div className="rounded-2xl p-6 md:p-8" style={{ background: SP.bg2, border: `1px solid ${SP.accent2}` }}>
      <p className="text-sm mb-4" style={{ color: SP.textMuted }}>
        What "yesterday" are you carrying into today's at-bat? Type it here — then release it.
      </p>
      <div className="relative">
        <textarea
          data-testid="input-temporal-release"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="I'm still thinking about that strikeout in the 3rd inning..."
          rows={4}
          className="w-full rounded-xl p-4 text-sm resize-none transition-all duration-1000"
          style={{
            background: `${SP.bg}80`,
            color: SP.text,
            border: `1px solid ${SP.accent2}`,
            opacity: releasing ? 0 : 1,
            transform: releasing ? "scale(0.95)" : "scale(1)",
            filter: releasing ? "blur(8px)" : "none",
          }}
        />
        {releasing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold animate-pulse" style={{ color: SP.accent }}>Released.</span>
          </div>
        )}
      </div>
      <button
        data-testid="button-release"
        onClick={handleRelease}
        disabled={!text.trim() || releasing}
        className="mt-4 w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all"
        style={{
          background: text.trim() && !releasing ? SP.danger : SP.accent2,
          color: text.trim() && !releasing ? SP.text : SP.textMuted,
        }}
      >
        RELEASE
      </button>
    </div>
  );
}

const huntStrategies: Record<string, { strategy: string; explanation: string }> = {
  "0-0": { strategy: "Hunt your pitch — fastball middle-in", explanation: "You're ahead. This is YOUR count. Look for the pitch you can drive. Be aggressive and ready to attack." },
  "1-0": { strategy: "Stay aggressive — fastball", explanation: "Pitcher's behind. Expect a fastball to get ahead. Stay in hunt mode and look to do damage." },
  "2-0": { strategy: "Green light — sit on your speed", explanation: "Hitter's count. Be ultra-selective. Wait for the pitch in your wheelhouse and unload." },
  "3-0": { strategy: "Take or green light on a pipe", explanation: "Count leverage is maxed. If you have the green light, only swing at an absolute meatball." },
  "3-1": { strategy: "Sit dead red — best count in baseball", explanation: "This is the best count in baseball. The pitcher must throw a strike. Sit on your fastball and let it rip." },
  "0-1": { strategy: "Narrow the zone — hunt fastball", explanation: "Behind but still in it. Don't expand. Narrow your focus to one pitch, one zone." },
  "1-1": { strategy: "Maintain aggression — quality swing", explanation: "Neutral count. Stay disciplined but don't get passive. Hunt your speed and make quality contact." },
  "2-1": { strategy: "Slight advantage — attack zone", explanation: "Slight lean toward you. The pitcher needs to come in. Sit on a pitch you can drive." },
  "0-2": { strategy: "Survive mode — battle and protect", explanation: "Survival mode. Shorten up, protect the plate. Fight off tough pitches and wait for a mistake." },
  "1-2": { strategy: "Battle — don't chase", explanation: "Protect but don't expand. The pitcher will try to get you to chase. Stay disciplined, cover the zone." },
  "2-2": { strategy: "Defensive hunt — zone awareness", explanation: "Two-strike discipline. Know the zone, protect against the best pitch, but be ready to drive a mistake." },
  "3-2": { strategy: "Runner's count — protect & attack", explanation: "Full count. Runners moving. Protect the plate but if it's your pitch, attack it with conviction." },
};

function PitchHuntSelector() {
  const [balls, setBalls] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const count = `${balls}-${strikes}`;
  const info = huntStrategies[count];

  return (
    <div className="rounded-2xl p-6 md:p-8" style={{ background: SP.bg2, border: `1px solid ${SP.accent2}` }}>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: SP.textMuted }}>Balls</label>
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((b) => (
              <button
                key={b}
                data-testid={`button-balls-${b}`}
                onClick={() => setBalls(b)}
                className="w-10 h-10 rounded-lg font-bold text-sm transition-all"
                style={{
                  background: balls === b ? SP.accent : SP.accent2,
                  color: balls === b ? SP.bg : SP.textMuted,
                }}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: SP.textMuted }}>Strikes</label>
          <div className="flex gap-2">
            {[0, 1, 2].map((s) => (
              <button
                key={s}
                data-testid={`button-strikes-${s}`}
                onClick={() => setStrikes(s)}
                className="w-10 h-10 rounded-lg font-bold text-sm transition-all"
                style={{
                  background: strikes === s ? SP.danger : SP.accent2,
                  color: strikes === s ? SP.text : SP.textMuted,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="text-center mb-4">
        <span className="text-3xl font-bold" style={{ fontFamily: "'Oswald', sans-serif", color: SP.text }}>{count}</span>
      </div>
      {info && (
        <div className="p-4 rounded-xl" style={{ background: `${SP.accent}10`, border: `1px solid ${SP.accent}30` }}>
          <div className="text-sm font-bold mb-1" style={{ color: SP.accent }}>{info.strategy}</div>
          <div className="text-sm" style={{ color: SP.textMuted }}>{info.explanation}</div>
        </div>
      )}
    </div>
  );
}

function BPMGauge() {
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-full max-w-xs">
        <path d="M 20 100 A 80 80 0 0 1 60 30" fill="none" stroke="#3366FF" strokeWidth="12" strokeLinecap="round" opacity="0.6" />
        <path d="M 60 30 A 80 80 0 0 1 140 30" fill="none" stroke={SP.accent} strokeWidth="14" strokeLinecap="round" />
        <path d="M 140 30 A 80 80 0 0 1 180 100" fill="none" stroke={SP.danger} strokeWidth="12" strokeLinecap="round" opacity="0.6" />
        <text x="30" y="115" fill="#3366FF" fontSize="10" fontWeight="bold">&lt;60</text>
        <text x="85" y="20" fill={SP.accent} fontSize="11" fontWeight="bold" textAnchor="middle">60-80</text>
        <text x="165" y="115" fill={SP.danger} fontSize="10" fontWeight="bold">&gt;80</text>
        <text x="100" y="85" fill={SP.text} fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="Oswald">BPM ZONE</text>
        <text x="100" y="102" fill={SP.accent} fontSize="10" textAnchor="middle">Performance Window</text>
      </svg>
      <div className="flex gap-4 mt-4 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block" style={{ background: "#3366FF" }} /> Under</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block" style={{ background: SP.accent }} /> Optimal</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block" style={{ background: SP.danger }} /> Over</span>
      </div>
    </div>
  );
}

function BreathingTimer() {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [count, setCount] = useState(0);
  const [cycles, setCycles] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phases = { inhale: 4, hold: 7, exhale: 8 };

  useEffect(() => {
    if (!active) return;
    timerRef.current = setInterval(() => {
      setCount((prev) => {
        const max = phases[phase];
        if (prev + 1 >= max) {
          setPhase((p) => {
            if (p === "inhale") return "hold";
            if (p === "hold") return "exhale";
            setCycles((c) => c + 1);
            return "inhale";
          });
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [active, phase]);

  const toggle = () => {
    if (active) {
      setActive(false);
      setPhase("inhale");
      setCount(0);
    } else {
      setActive(true);
      setPhase("inhale");
      setCount(0);
      setCycles(0);
    }
  };

  const circleScale = phase === "inhale" ? 1 + (count / phases.inhale) * 0.5 : phase === "hold" ? 1.5 : 1.5 - (count / phases.exhale) * 0.5;
  const phaseLabel = phase === "inhale" ? "Breathe In" : phase === "hold" ? "Hold" : "Breathe Out";

  return (
    <div className="rounded-2xl p-6 md:p-8 text-center" style={{ background: SP.bg2, border: `1px solid ${SP.accent2}` }}>
      <div className="relative w-40 h-40 mx-auto mb-6 flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full transition-transform duration-1000 ease-in-out"
          style={{
            background: `radial-gradient(circle, ${SP.accent}30, transparent)`,
            transform: `scale(${active ? circleScale : 1})`,
            border: `2px solid ${SP.accent}40`,
          }}
        />
        <div className="relative z-10">
          {active ? (
            <>
              <div className="text-3xl font-bold" style={{ color: SP.accent }}>{phases[phase] - count}</div>
              <div className="text-xs mt-1" style={{ color: SP.textMuted }}>{phaseLabel}</div>
            </>
          ) : (
            <div className="text-sm" style={{ color: SP.textMuted }}>4-7-8</div>
          )}
        </div>
      </div>
      {active && cycles > 0 && (
        <div className="text-xs mb-4" style={{ color: SP.textMuted }}>Cycles: {cycles}</div>
      )}
      <button
        data-testid="button-breathing"
        onClick={toggle}
        className="px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all"
        style={{ background: active ? SP.danger : SP.accent, color: active ? SP.text : SP.bg }}
      >
        {active ? "STOP" : "START BREATHING"}
      </button>
    </div>
  );
}

const integrationData = [
  { springer: "Confident vs Non-Confident Player", module: "Module 1", moduleName: "Bio-Computer Foundation", concept: "Competing Operating Systems" },
  { springer: "Batting Average Trap / QABs", module: "Module 2", moduleName: "Unconscious Programming", concept: "Corrupted Feedback Loops" },
  { springer: "Four Intentions Protocol", module: "Module 3", moduleName: "Debugging Mental Systems", concept: "Conscious Override Sequences" },
  { springer: "Opening Day Mindset", module: "Module 4", moduleName: "Present-State Dominance", concept: "Temporal Decoupling" },
  { springer: "Hunting Speeds", module: "Module 5", moduleName: "Perceptual Training", concept: "Predictive Processing" },
  { springer: "60-80 BPM Window", module: "Module 6", moduleName: "Physiological Regulation", concept: "Autonomic Coherence" },
];

function IntegrationMap() {
  return (
    <div className="space-y-3">
      {integrationData.map((row, i) => (
        <div key={i} className="flex items-stretch gap-2 md:gap-4">
          <div className="flex-1 rounded-xl p-3 md:p-4 text-sm" style={{ background: SP.bg2, border: `1px solid ${SP.accent2}` }}>
            <div className="font-bold text-xs md:text-sm" style={{ color: SP.text }}>{row.springer}</div>
          </div>
          <div className="flex flex-col items-center justify-center shrink-0 w-8">
            <div className="w-2 h-2 rounded-full" style={{ background: SP.accent }} />
            <div className="flex-1 w-0.5" style={{ background: `${SP.accent}40` }} />
            <div className="w-2 h-2 rounded-full" style={{ background: SP.accent }} />
          </div>
          <div className="flex-1 rounded-xl p-3 md:p-4" style={{ background: `${SP.accent}10`, border: `1px solid ${SP.accent}30` }}>
            <div className="text-xs font-bold" style={{ color: SP.accent }}>{row.module}</div>
            <div className="text-xs mt-0.5" style={{ color: SP.textMuted }}>{row.moduleName}</div>
            <div className="text-xs mt-1 italic" style={{ color: SP.text }}>→ {row.concept}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ title, moduleRef }: { title: string; moduleRef?: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "'Oswald', sans-serif", color: SP.text }}>{title}</h2>
      {moduleRef && (
        <div className="mt-2 inline-block px-3 py-1 rounded-full text-xs" style={{ background: `${SP.accent}15`, color: SP.accent }}>
          {moduleRef}
        </div>
      )}
    </div>
  );
}

export default function SpringerProtocolPage() {
  const sectionIds = sections.map((s) => s.id);
  const active = useScrollSpy(sectionIds);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen" style={{ background: SP.bg, color: SP.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Oswald:wght@400;500;600;700&display=swap');
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @media print {
          nav, button, textarea, .no-print { display: none !important; }
          div { break-inside: avoid; }
          body, html { background: white !important; color: black !important; }
        }
      `}</style>

      <StickyNav active={active} />

      <div className="max-w-3xl mx-auto px-4 pb-20">
        <HeroSection />

        <FadeSection id="identity" className="py-12 md:py-16">
          <SectionTitle title="Two Players. One Body. One Choice." moduleRef="↔ Module 1: Bio-Computer Foundation" />
          <p className="text-sm leading-relaxed mb-6" style={{ color: SP.textMuted }}>
            Steve Springer identified a fundamental split in every player: the Confident Player and the Non-Confident Player. These aren't moods — they're complete operating systems. Each one produces different thoughts, different body language, and different decisions at the plate. In cybernetic terms, these are two competing programs running on the same hardware. Your job is to choose which one boots up.
          </p>
          <IdentityToggle />
        </FadeSection>

        <FadeSection id="batting-avg" className="py-12 md:py-16">
          <SectionTitle title="When Your Feedback Loop Is Broken" moduleRef="↔ Module 2: Unconscious Programming" />
          <p className="text-sm leading-relaxed mb-4" style={{ color: SP.textMuted }}>
            Batting average is a corrupted feedback mechanism. When your self-worth is wired to hits, every 0-for-4 becomes a system error that compounds. The unconscious mind has been programmed to equate results with identity — and that program is wrong.
          </p>
          <p className="text-sm leading-relaxed mb-6" style={{ color: SP.textMuted }}>
            Quality At-Bats (QABs) are the recalibrated metric. They measure process, not outcome. A player who goes 0-for-4 with four hard outs had four quality at-bats. That's a system running correctly — the results just haven't caught up yet.
          </p>
          <QABScorecard />
        </FadeSection>

        <FadeSection id="four-intentions" className="py-12 md:py-16">
          <SectionTitle title="The Pre-Plate Executable: Installing Confidence Before the Pitch" moduleRef="↔ Module 3: Debugging Mental Systems" />
          <p className="text-sm leading-relaxed mb-6" style={{ color: SP.textMuted }}>
            Springer's four intentions aren't positive thinking — they're a formal execution sequence. A conscious override that replaces fear-based subroutines with performance-optimized directives. Each intention targets a different subsystem: identity, focus, perception, and purpose. Run them in order, every at-bat.
          </p>
          <BootSequence />
        </FadeSection>

        <FadeSection id="opening-day" className="py-12 md:py-16">
          <SectionTitle title="Temporal Decoupling: The Art of Having No Yesterday" moduleRef="↔ Module 4: Present-State Dominance" />
          <p className="text-sm leading-relaxed mb-4" style={{ color: SP.textMuted }}>
            On Opening Day, nobody's in a slump. There's no "yesterday" to carry. Springer calls this the Opening Day Mindset — and it's available to you every single day.
          </p>
          <p className="text-sm leading-relaxed mb-6" style={{ color: SP.textMuted }}>
            In cybernetic terms, this is <strong style={{ color: SP.accent }}>Temporal Decoupling</strong> — the deliberate severing of associative links between past failure states and present performance bandwidth. Your bio-computer doesn't need yesterday's error logs to perform today. Delete them.
          </p>
          <TemporalRelease />
        </FadeSection>

        <FadeSection id="hunting" className="py-12 md:py-16">
          <SectionTitle title="Load the Model Before the Pitch Arrives" moduleRef="↔ Module 5: Perceptual Training" />
          <p className="text-sm leading-relaxed mb-6" style={{ color: SP.textMuted }}>
            "See the ball, hit the ball" is bad software. Your brain can't process a 95mph fastball in real-time — it takes 400ms to fully process visual input, but the pitch arrives in 400ms. The solution? Predictive processing. Load a model of the pitch before it arrives. Hunting a specific speed narrows your perceptual filter, reduces reaction time, and gives your motor system a head start. Select a count below to see the recommended hunt strategy.
          </p>
          <PitchHuntSelector />
        </FadeSection>

        <FadeSection id="physio" className="py-12 md:py-16">
          <SectionTitle title="60-80 BPM: Your Performance Operating Window" moduleRef="↔ Module 6: Physiological Regulation" />
          <p className="text-sm leading-relaxed mb-6" style={{ color: SP.textMuted }}>
            Springer teaches that your best performance happens between 60-80 BPM. Below 60, you're underactivated — flat, disengaged. Above 80, you're overactivated — anxious, tight, reactive. The 4-7-8 breathing protocol is your regulation tool: inhale 4 counts, hold 7, exhale 8. It activates the parasympathetic nervous system and drives you into your performance window.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl p-6" style={{ background: SP.bg2, border: `1px solid ${SP.accent2}` }}>
              <BPMGauge />
            </div>
            <BreathingTimer />
          </div>
        </FadeSection>

        <FadeSection id="integration" className="py-12 md:py-16">
          <SectionTitle title="How The Springer Protocol Lives Inside The 6th Tool" />
          <p className="text-sm leading-relaxed mb-6" style={{ color: SP.textMuted }}>
            Every concept in the Springer Protocol maps directly to a module in The 6th Tool. Springer discovered these principles through 14 years of lived experience. You now have the systematic framework to understand why they work — and how to install them permanently.
          </p>
          <IntegrationMap />
        </FadeSection>

        <FadeSection id="closing" className="py-16 md:py-24 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: "'Oswald', sans-serif", color: SP.text }}>
            Run The Protocol
          </h2>
          <p className="text-sm leading-relaxed mb-8 max-w-xl mx-auto" style={{ color: SP.textMuted }}>
            Steve Springer didn't need the word "cybernetics." He needed 14 years in the grind. You now have both — the lived wisdom AND the system map. Run the protocol.
          </p>
          <button
            data-testid="button-print-cheatsheet"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all hover:brightness-110"
            style={{ background: SP.accent, color: SP.bg }}
          >
            <Printer size={16} />
            Download Springer Protocol Cheat Sheet
          </button>
          <p className="text-xs mt-3" style={{ color: SP.textMuted }}>Opens print dialog for PDF save</p>
        </FadeSection>
      </div>
    </div>
  );
}
