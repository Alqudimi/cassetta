// Signal Archive design: asymmetric evidence-first landing page with archival labels, protocol lanes, and vermilion action signals.
import { ArrowUpRight, Check, ChevronRight, Copy, FileJson, GitBranch, LockKeyhole, Play, Radio, ShieldCheck, Terminal } from "lucide-react";
import { useState } from "react";

const hero = "/manus-storage/cassetta-hero_77b1f397.png";
const mark = "/manus-storage/cassetta-mark_2b288abf.png";

const steps = [
  { number: "01", title: "Capture the session", detail: "Observe JSON-RPC traffic without rewriting your server or client." },
  { number: "02", title: "Normalize the noise", detail: "Collapse volatile IDs, timestamps, and ordering artifacts into stable evidence." },
  { number: "03", title: "Replay in CI", detail: "Run the same interaction offline, diff behavior, and fail with a useful exit code." },
];

const cassetteRows = [
  ["request", "tools/list", "00:00.124", "same"],
  ["response", "tools/list → 12 tools", "00:00.308", "same"],
  ["request", "tools/call: search", "00:00.612", "changed"],
  ["response", "result.content[0]", "00:00.921", "added"],
];

export default function Home() {
  const [copied, setCopied] = useState(false);
  const copyCommand = async () => {
    await navigator.clipboard?.writeText("npx cassetta record session.jsonl fixtures/baseline.cassette.jsonl");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#f3ebdd] text-[#111827]">
      <header className="relative z-10 border-b border-[#111827]/15 bg-[#f3ebdd]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5 lg:px-12">
          <a href="#top" className="flex items-center gap-3" aria-label="Cassetta home">
            <img src={mark} alt="" className="h-9 w-9 rounded-[10px] object-contain" />
            <span className="font-display text-xl font-bold tracking-[-0.06em]"><span className="relative inline-block">c<span className="text-[#e85d3f]">a</span></span>ssetta<span className="text-[#e85d3f]">.</span></span>
          </a>
          <nav className="hidden items-center gap-8 text-xs font-semibold uppercase tracking-[0.18em] md:flex">
            <a href="#workflow" className="transition-colors hover:text-[#e85d3f]">Workflow</a>
            <a href="#artifact" className="transition-colors hover:text-[#e85d3f]">Artifact</a>
            <a href="#roadmap" className="transition-colors hover:text-[#e85d3f]">Roadmap</a>
          </nav>
          <a href="https://github.com/Alqudimi/cassetta" className="group flex items-center gap-2 rounded-full border border-[#111827] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition hover:bg-[#111827] hover:text-[#f3ebdd]">
            GitHub <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>
      </header>

      <main id="top">
        <section className="relative min-h-[650px] overflow-hidden bg-[#111827] text-[#f3ebdd]">
          <div className="absolute inset-0 bg-cover bg-center opacity-45" style={{ backgroundImage: `url(${hero})` }} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/90 to-transparent" />
          <div className="relative mx-auto grid max-w-[1440px] grid-cols-1 gap-14 px-6 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:py-32">
            <div className="max-w-3xl">
              <div className="mb-8 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[#e85d3f]"><span className="h-px w-12 bg-[#e85d3f]" /> Local-first protocol evidence</div>
              <h1 className="font-display text-[clamp(3.8rem,8vw,7.8rem)] font-bold leading-[0.88] tracking-[-0.08em]">Record once.<br /><span className="text-[#e85d3f]">Reproduce</span><br />without the network.</h1>
              <p className="mt-10 max-w-xl text-lg leading-8 text-[#f3ebdd]/72">Cassetta turns MCP and AI tool sessions into redacted, reviewable artifacts you can replay offline, diff deterministically, and enforce in CI.</p>
              <div className="mt-10 flex flex-wrap gap-4">
                <button onClick={copyCommand} className="group flex items-center gap-3 rounded-full bg-[#e85d3f] px-6 py-3.5 font-mono text-sm font-bold text-[#111827] transition hover:bg-[#f2765c] active:scale-[0.97]"><Terminal className="h-4 w-4" /> {copied ? "Copied" : "Try the workflow"} <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button>
                <a href="#artifact" className="flex items-center gap-2 rounded-full border border-[#f3ebdd]/35 px-6 py-3.5 text-sm font-semibold transition hover:border-[#f3ebdd]">Inspect a cassette <ArrowUpRight className="h-4 w-4" /></a>
              </div>
            </div>
            <div className="flex items-end justify-start lg:justify-end">
              <div className="w-full max-w-md border-l border-[#e85d3f] pl-6 font-mono text-xs text-[#f3ebdd]/65">
                <div className="mb-8 flex items-center gap-3 text-[#e85d3f]"><Radio className="h-4 w-4" /> LIVE CAPTURE / 00:00:921</div>
                <div className="space-y-4">
                  <div><span className="text-[#f3ebdd]/35">→</span> tools/call <span className="float-right text-[#f3ebdd]/35">request</span></div>
                  <div className="ml-6 border-l border-[#f3ebdd]/15 pl-4 text-[#f3ebdd]/45">name: search<br />arguments: {`{ query: "cassetta" }`}</div>
                  <div><span className="text-[#e85d3f]">←</span> result.content <span className="float-right text-[#e85d3f]">captured</span></div>
                  <div className="ml-6 border-l border-[#e85d3f]/45 pl-4 text-[#f3ebdd]/45">normalized: true<br />redacted: 2 fields<br />replayable: yes</div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-[#e85d3f]" />
        </section>

        <section id="workflow" className="mx-auto grid max-w-[1440px] grid-cols-[42px_1fr] gap-6 px-6 py-24 lg:grid-cols-[86px_1fr] lg:gap-10 lg:px-12 lg:py-32"><aside className="border-r border-[#111827]/15 pr-4 font-mono text-[9px] uppercase tracking-[0.18em] text-[#111827]/45"><span className="sticky top-24 block [writing-mode:vertical-rl]">CAPTURED / 00:00:000</span></aside>
          <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr]">
            <div><p className="label">01 / The premise</p><h2 className="mt-5 max-w-md font-display text-5xl font-bold leading-[0.95] tracking-[-0.06em]">An incident is only useful when it can be replayed.</h2></div>
            <div className="grid gap-8 md:grid-cols-3">{steps.map((step) => <article key={step.number} className="border-t-2 border-[#111827] pt-5"><div className="font-mono text-sm text-[#e85d3f]">{step.number}</div><h3 className="mt-12 font-display text-2xl font-bold tracking-[-0.04em]">{step.title}</h3><p className="mt-4 text-sm leading-6 text-[#111827]/65">{step.detail}</p></article>)}</div>
          </div>
        </section>\n\n        <section id="artifact" className="bg-[#111827] px-6 py-24 text-[#f3ebdd] lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div><p className="label text-[#e85d3f]">02 / The artifact</p><h2 className="mt-5 max-w-lg font-display text-5xl font-bold leading-[0.95] tracking-[-0.06em]">Your failure, packaged for the next engineer.</h2><p className="mt-7 max-w-md text-base leading-7 text-[#f3ebdd]/65">A cassette is a plain JSONL file. Read it in a diff, commit it beside your tests, or attach it to a bug report. The format stays boring so the evidence stays portable.</p><div className="mt-9 grid gap-3 font-mono text-xs text-[#f3ebdd]/55"><div className="flex gap-3"><FileJson className="h-4 w-4 text-[#e85d3f]" /> schema-aware, human-readable</div><div className="flex gap-3"><LockKeyhole className="h-4 w-4 text-[#e85d3f]" /> secrets redacted before persistence</div><div className="flex gap-3"><GitBranch className="h-4 w-4 text-[#e85d3f]" /> designed for pull requests and CI</div></div></div>
            <div className="relative"><div className="absolute -left-16 -top-14 hidden h-28 w-28 rotate-[-9deg] border border-[#e85d3f]/60 bg-[#111827] p-3 lg:block"><img src={mark} alt="" className="h-full w-full object-contain opacity-70" /><span className="absolute -bottom-5 left-1 font-mono text-[8px] uppercase tracking-[0.18em] text-[#e85d3f]">CASSETTE / 01</span></div><div className="overflow-hidden border border-[#f3ebdd]/20 bg-[#172033] shadow-2xl"><div className="flex items-center justify-between border-b border-[#f3ebdd]/15 px-5 py-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[#f3ebdd]/45"><span>fixtures/baseline.cassette.jsonl</span><span className="text-[#e85d3f]">v1</span></div><div className="p-5 font-mono text-xs">{cassetteRows.map(([type, event, time, state], i) => <div key={`${event}-${i}`} className="grid grid-cols-[68px_1fr_78px_60px] gap-3 border-b border-[#f3ebdd]/8 py-4 last:border-0"><span className={type === "response" ? "text-[#e85d3f]" : "text-[#f3ebdd]/45"}>{type}</span><span>{event}</span><span className="text-[#f3ebdd]/35">{time}</span><span className={state === "same" ? "text-emerald-300" : "text-[#e85d3f]"}>{state}</span></div>)}</div></div><div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-[#f3ebdd]/35"><span>normalized / redacted</span><span>4 entries</span></div></div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1440px] grid-cols-[42px_1fr] gap-6 px-6 py-24 lg:grid-cols-[86px_1fr] lg:gap-10 lg:px-12 lg:py-32"><aside className="border-r border-[#111827]/15 pr-4 font-mono text-[9px] uppercase tracking-[0.18em] text-[#111827]/45"><span className="sticky top-24 block [writing-mode:vertical-rl]">NORMALIZED / 00:00:921</span></aside><div className="grid gap-14 lg:grid-cols-[1fr_0.95fr] lg:items-center"><div className="order-2 border border-[#111827]/15 bg-[#111827] p-8 lg:order-1"><div className="mb-8 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-[#f3ebdd]/45"><span>replay graph / v1</span><span className="text-[#e85d3f]">CI-SAFE</span></div><div className="space-y-5 font-mono text-xs text-[#f3ebdd]/70"><div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-[#e85d3f]" /> capture.stream <span className="ml-auto text-[#f3ebdd]/35">01</span></div><div className="ml-5 h-8 border-l border-[#e85d3f]/50" /><div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-[#e85d3f]" /> normalize.policy <span className="ml-auto text-[#f3ebdd]/35">02</span></div><div className="ml-5 h-8 border-l border-[#e85d3f]/50" /><div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-[#e85d3f]" /> replay.assert <span className="ml-auto text-[#e85d3f]">PASS</span></div></div></div><div className="order-1 lg:order-2"><p className="label">03 / The architecture</p><h2 className="mt-5 max-w-lg font-display text-5xl font-bold leading-[0.95] tracking-[-0.06em]">Small surface area. Serious boundaries.</h2><p className="mt-7 max-w-lg text-base leading-7 text-[#111827]/65">The core does not know about dashboards, providers, or deployment platforms. It knows messages, artifacts, policies, and evidence. That boundary is the feature.</p><div className="mt-8 space-y-3">{["Transport adapters stay replaceable", "Normalization is explicit and testable", "Reports work for humans and machines"].map((item) => <div key={item} className="flex items-center gap-3 border-b border-[#111827]/12 py-3 font-mono text-sm"><Check className="h-4 w-4 text-[#e85d3f]" /> {item}</div>)}</div></div></div></section>

        <section id="roadmap" className="border-t border-[#111827]/15 bg-[#f3ebdd] px-6 py-24 lg:px-12 lg:py-28"><div className="mx-auto grid max-w-[1440px] gap-14 lg:grid-cols-[0.8fr_1.2fr]"><div><p className="label text-[#e85d3f]">04 / The invitation</p><h2 className="mt-5 max-w-md font-display text-5xl font-bold leading-[0.95] tracking-[-0.06em]">Make AI workflows boring to reproduce.</h2></div><div className="flex flex-col justify-between"><p className="max-w-xl text-xl leading-8 text-[#111827]/70">Cassetta is being shaped as an open-source foundation for engineers who would rather commit evidence than screenshots.</p><div className="mt-12 flex flex-wrap gap-4"><a href="https://github.com/Alqudimi/cassetta" className="group flex items-center gap-3 rounded-full bg-[#111827] px-6 py-3.5 text-sm font-bold text-[#f3ebdd] transition hover:bg-[#263148]">Read the repository <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a><a href="#top" className="flex items-center gap-2 rounded-full border border-[#111827]/40 px-6 py-3.5 text-sm font-semibold transition hover:border-[#111827]">Back to the signal <Play className="h-4 w-4" /></a></div></div></div></section>
      </main>
      <footer className="flex flex-col justify-between gap-4 bg-[#111827] px-6 py-8 font-mono text-[11px] uppercase tracking-[0.16em] text-[#f3ebdd]/45 md:flex-row lg:px-12"><span>cassetta / signal archive</span><span>MIT licensed / built for reproducibility</span></footer>
    </div>
  );
}
