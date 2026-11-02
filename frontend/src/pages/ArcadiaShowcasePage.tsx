import { useEffect, useMemo, useState } from "react";
import { ARCADIA_PLOTS, ARCADIA_CLUSTERS, CONSTRUCTION_PHASES } from "./MasterPlanPage";
import ShowcaseQrCard from "../components/ShowcaseQrCard";
import { villaConstructionService } from "../services/villaConstructionService";

/**
 * Arcadia presentation page shared with Deewali gift recipients.
 * Built only from the project's own data (master plan, villa sizes, construction progress).
 * Kept free of prices, customer names and booking status so it can later be made public.
 */
const PROJECT = "Praneeth Arcadia Premium";
const ADDRESS = "Sy No: 455P, 456, D.Pochampalli Village, Near ORR Service Road, Dhundigal, Medchal - Malkajgiri Dist, Telangana - 500043";
const MAPS = "https://maps.app.goo.gl/aMNNjbehhJdBk2Mh9";


// Palette: deep emerald from the logo, champagne gold accents, warm ivory page
const GREEN = "#163B2A";
const GOLD = "#A8843F";        // on light backgrounds
const CHAMPAGNE = "#D6B56E";   // on dark backgrounds

function Diya({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="flame" cx="50%" cy="70%" r="60%"><stop offset="0%" stopColor="#FFF7C2" /><stop offset="55%" stopColor="#FFC93C" /><stop offset="100%" stopColor="#FF7A00" /></radialGradient>
        <linearGradient id="bowl" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#E0A35A" /><stop offset="100%" stopColor="#8A4B16" /></linearGradient>
      </defs>
      <ellipse cx="32" cy="24" rx="12" ry="18" fill="#FFB300" opacity="0.18" className="animate-pulse" />
      <path d="M32 8 C38 18 38 26 32 30 C26 26 26 18 32 8 Z" fill="url(#flame)" />
      <path d="M8 36 Q32 30 56 36 Q50 54 32 54 Q14 54 8 36 Z" fill="url(#bowl)" />
      <path d="M8 36 Q32 42 56 36" stroke="#5C2E0A" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export default function ArcadiaShowcasePage() {
  const [progress, setProgress] = useState<{ pct: number; stages: { label: string; done: number }[] } | null>(null);

  // Villa facts straight from the master plan
  const facts = useMemo(() => {
    const sizes = new Map<number, number>();
    let east = 0, west = 0;
    ARCADIA_PLOTS.forEach((p) => {
      const band = p.sqYards < 190 ? (p.sqYards < 175 ? 167 : 180) : p.sqYards < 215 ? 200 : p.sqYards < 240 ? 225 : p.sqYards < 280 ? 250 : 300;
      sizes.set(band, (sizes.get(band) || 0) + 1);
      if (p.facing === "East") east++; else west++;
    });
    const all = ARCADIA_PLOTS.map((p) => p.sqYards);
    return {
      villas: ARCADIA_PLOTS.length, east, west, min: Math.min(...all), max: Math.max(...all),
      bands: Array.from(sizes.entries()).sort((a, b) => a[0] - b[0]),
    };
  }, []);

  useEffect(() => {
    villaConstructionService.getAllByProject(PROJECT).then((list) => {
      const villas = new Set(ARCADIA_PLOTS.map((p) => p.villa));
      const done = new Map<string, number>();
      list.forEach((s) => { if (s.activity1Done && villas.has(s.villaNumber)) done.set(s.phase, (done.get(s.phase) || 0) + 1); });
      const total = CONSTRUCTION_PHASES.length * villas.size;
      const sum = CONSTRUCTION_PHASES.reduce((n, p) => n + Math.min(done.get(p.key) || 0, villas.size), 0);
      setProgress({
        pct: total ? Math.round((sum / total) * 100) : 0,
        stages: CONSTRUCTION_PHASES.map((p) => ({ label: p.label, done: Math.round(((done.get(p.key) || 0) / villas.size) * 100) })),
      });
    }).catch(() => setProgress(null));
  }, []);

  const bandLabel = (b: number) => (b === 167 ? "167 sq yd" : b === 180 ? "180 sq yd" : b === 200 ? "~200 sq yd" : b === 225 ? "~225 sq yd" : b === 250 ? "~250 sq yd" : "300+ sq yd");
  const maxBand = Math.max(...facts.bands.map((b) => b[1]));

  return (
    <div className="-m-4 md:-m-8 bg-[#F7F5F0] text-[#1F2937]" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      {/* ── TEMPORARY: QR code for verification — remove after verification ── */}
      <ShowcaseQrCard id="arcadia" name="Praneeth Arcadia Premium" url="https://arcadiapremium.duckdns.org/arcadia/" color={GREEN} />

      {/* ── Deewali greeting ── */}
      <section className="relative overflow-hidden text-center px-5 pt-10 pb-14" style={{ background: `radial-gradient(ellipse 80% 70% at 50% 0%, #24563D 0%, ${GREEN} 55%, #0D261A 100%)` }}>
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${CHAMPAGNE}, transparent)` }} />
        <div className="relative max-w-3xl mx-auto">
          <div className="flex justify-center gap-6 sm:gap-10 mb-4">
            <Diya className="w-10 h-10 sm:w-14 sm:h-14" /><Diya className="w-14 h-14 sm:w-20 sm:h-20 -mt-2" /><Diya className="w-10 h-10 sm:w-14 sm:h-14" />
          </div>
          <p className="tracking-[0.35em] text-xs sm:text-sm uppercase font-sans" style={{ color: CHAMPAGNE }}>With warm wishes</p>
          <h1 className="mt-2 text-3xl sm:text-5xl font-normal tracking-wide text-[#FBF7EE]">Happy Deewali</h1>
          <div className="mx-auto mt-3 flex items-center justify-center gap-2"><span className="h-px w-16" style={{ background: CHAMPAGNE }} /><span className="text-xs" style={{ color: CHAMPAGNE }}>◆</span><span className="h-px w-16" style={{ background: CHAMPAGNE }} /></div>
          <p className="mt-3 text-sm sm:text-lg text-[#E9E4D6] leading-relaxed">
            May this festival of lights fill your home with joy, prosperity and good health.{" "}<br className="hidden sm:block" />
            Thank you for being part of our journey.
          </p>
          <p className="mt-4 text-xs sm:text-sm text-[#BFB8A6] font-sans tracking-wide">— Team Praneeth · Venkata Praneeth Developers Pvt. Ltd.</p>
        </div>
      </section>

      {/* ── Project intro ── */}
      <section className="px-5 -mt-8 relative">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25)] border border-[#E6E0D2] p-6 sm:p-10 text-center">
          <img src="/arcadia-logo.png" alt="Praneeth Arcadia Premium" className="mx-auto h-24 sm:h-32 w-auto" />
          <p className="mt-4 text-base sm:text-xl leading-relaxed max-w-2xl mx-auto">
            A community of <b>{facts.villas} premium villas</b> coming up near the Outer Ring Road at Dhundigal, Hyderabad —
            designed for families who want space, greenery and a home of their own.
          </p>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              [String(facts.villas), "Villas"],
              [`${facts.min}–${facts.max}`, "Plot size (sq yd)"],
              ["G + 2", "Floors per villa"],
              [String(ARCADIA_CLUSTERS.length), "Clusters"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-xl border border-[#E6E0D2] bg-[#FAF8F3] py-4 sm:py-6">
                <div className="text-xl sm:text-3xl whitespace-nowrap" style={{ color: GREEN }}>{v}</div>
                <div className="text-[11px] sm:text-sm text-gray-600 mt-1 font-sans">{l}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2 font-sans text-xs sm:text-sm">
            {["East & West facing villas", "Clubhouse", "Covered car parking", "Near ORR Service Road"].map((t) => (
              <span key={t} className="px-3 py-1.5 rounded-full border" style={{ borderColor: "#D9C9A3", color: "#5C4A22" }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Master plan ── */}
      <section className="px-5 py-12">
        <div className="max-w-5xl mx-auto">
          <SectionTitle kicker="The layout" title="Master Plan" />
          <div className="mt-6 rounded-2xl overflow-hidden border border-[#E6E0D2] bg-white shadow-sm">
            <img src="/masterplan_colored.png" alt="Praneeth Arcadia Premium master plan" className="w-full h-auto" loading="lazy" />
          </div>
          <p className="mt-3 text-center text-xs sm:text-sm text-gray-500 font-sans">{facts.villas} villas across {ARCADIA_CLUSTERS.length} clusters · {facts.east} East-facing · {facts.west} West-facing</p>
        </div>
      </section>

      {/* ── Villa sizes ── */}
      <section className="px-5 pb-12">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#E6E0D2] p-6 shadow-sm">
            <SectionTitle kicker="Choose your space" title="Villa plot sizes" left />
            <div className="mt-5 space-y-3 font-sans">
              {facts.bands.map(([band, n]) => (
                <div key={band} className="flex items-center gap-3 text-sm">
                  <span className="w-24 text-gray-700">{bandLabel(band)}</span>
                  <div className="flex-1 h-3 rounded-full bg-[#EFEBE2] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(n / maxBand) * 100}%`, background: `linear-gradient(90deg, ${GREEN}, #2F6B4C)` }} />
                  </div>
                  <span className="w-16 text-right text-gray-600">{n} villas</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#E6E0D2] p-6 shadow-sm">
            <SectionTitle kicker="Your home" title="Thoughtfully planned" left />
            <ul className="mt-5 space-y-3 font-sans text-sm text-gray-700">
              {[
                "Independent villas — ground plus two floors",
                `Plots from ${facts.min} to ${facts.max} square yards`,
                "East and West facing options",
                "Clubhouse for residents",
                "Covered car parking",
                "Villas planned in clusters across the layout",
              ].map((t) => <li key={t} className="flex gap-3"><span className="mt-2 w-1.5 h-1.5 rotate-45 shrink-0" style={{ background: GOLD }} /><span>{t}</span></li>)}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Construction progress (live) ── */}
      {progress && progress.pct > 0 && (
        <section className="px-5 pb-12">
          <div className="max-w-5xl mx-auto rounded-2xl p-6 sm:p-10 text-white shadow-lg" style={{ background: `linear-gradient(135deg, #0D261A, ${GREEN} 60%, #24563D)` }}>
            <div className="grid md:grid-cols-[220px_1fr] gap-6 items-center">
              <div className="text-center">
                <div className="relative mx-auto w-40 h-40">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="52" stroke="rgba(255,255,255,0.15)" strokeWidth="12" fill="none" />
                    <circle cx="60" cy="60" r="52" stroke={CHAMPAGNE} strokeWidth="12" fill="none" strokeLinecap="round"
                      strokeDasharray={`${(progress.pct / 100) * 326.7} 326.7`} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">{progress.pct}%</span>
                    <span className="text-[11px] font-sans opacity-80">structure work</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="tracking-[0.3em] text-xs uppercase" style={{ color: CHAMPAGNE }}>Work in progress</p>
                <h2 className="text-2xl sm:text-3xl font-normal tracking-wide mt-1">Construction is moving ahead</h2>
                <div className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-2 font-sans text-xs sm:text-sm">
                  {progress.stages.map((s) => (
                    <div key={s.label} className="flex items-center gap-2">
                      <span className="w-40 shrink-0 opacity-90">{s.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-white/15 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${s.done}%`, background: CHAMPAGNE }} /></div>
                      <span className="w-10 text-right opacity-90">{s.done}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Location ── */}
      <section className="px-5 pb-12">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-[#E6E0D2] p-6 sm:p-10 shadow-sm text-center">
          <SectionTitle kicker="Where we are" title="Location" />
          <p className="mt-4 text-sm sm:text-base text-gray-700 max-w-2xl mx-auto font-sans leading-relaxed">{ADDRESS}</p>
          <a href={MAPS} target="_blank" rel="noopener noreferrer"
            className="inline-block mt-6 px-6 py-3 rounded-full text-white font-sans text-sm tracking-wide shadow-sm border" style={{ background: GREEN, borderColor: CHAMPAGNE }}>
            📍 Open in Google Maps
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="text-center px-5 pb-10 pt-4">
        <Diya className="w-10 h-10 mx-auto" />
        <p className="mt-3 text-lg" style={{ color: GREEN }}>Shubh Deepavali from all of us at Praneeth</p>
        <p className="mt-1 text-xs text-gray-500 font-sans">Venkata Praneeth Developers Pvt. Ltd. · {PROJECT} · Hyderabad</p>
      </footer>
    </div>
  );
}

function SectionTitle({ kicker, title, left = false }: { kicker: string; title: string; left?: boolean }) {
  return (
    <div className={left ? "" : "text-center"}>
      <p className="tracking-[0.3em] text-[10px] sm:text-xs uppercase font-sans" style={{ color: GOLD }}>{kicker}</p>
      <h2 className="text-2xl sm:text-3xl font-normal tracking-wide mt-1" style={{ color: GREEN }}>{title}</h2>
    </div>
  );
}
