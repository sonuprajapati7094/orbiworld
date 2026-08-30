"use client";

import { useState } from "react";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-hidden bg-[#05070b] text-white">
      {/* =====================================================
          BACKGROUND EFFECTS
      ===================================================== */}

      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute left-[-15%] top-[-10%] h-[520px] w-[520px] rounded-full bg-[#1683ff]/10 blur-[150px]" />

        <div className="absolute right-[-15%] top-[8%] h-[520px] w-[520px] rounded-full bg-[#6d4aff]/10 blur-[150px]" />

        <div className="absolute bottom-[-20%] left-[35%] h-[500px] w-[500px] rounded-full bg-[#ff9d3d]/5 blur-[150px]" />
      </div>

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="relative z-30 border-b border-white/[0.06] bg-[#05070b]/80 backdrop-blur-xl">
        <div className="orbi-container flex h-[92px] items-center justify-between">
          {/* LOGO */}

          <a
            href="/"
            className="group flex items-center"
            aria-label="ORBI WORLD Home"
          >
            <img
              src="/orbi-logo.png"
              alt="ORBI WORLD"
              className="h-12 w-auto object-contain transition duration-300 group-hover:scale-[1.02]"
            />
          </a>

          {/* DESKTOP NAV */}

          <nav className="hidden items-center gap-9 md:flex">
            <a
              href="#ecosystem"
              className="text-sm font-medium text-slate-400 transition hover:text-white"
            >
              Ecosystem
            </a>

            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-400 transition hover:text-white"
            >
              How It Works
            </a>

            <a
              href="#community"
              className="text-sm font-medium text-slate-400 transition hover:text-white"
            >
              Community
            </a>

            <a
              href="#faq"
              className="text-sm font-medium text-slate-400 transition hover:text-white"
            >
              FAQ
            </a>
          </nav>

          {/* CONNECT WALLET */}

          <div className="hidden md:block">
            <a href="/dashboard" className="orbi-button">
              Connect Wallet
            </a>
          </div>

          {/* MOBILE MENU */}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] md:hidden"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            <span className="text-xl text-white">
              {menuOpen ? "×" : "☰"}
            </span>
          </button>
        </div>

        {/* MOBILE NAV */}

        {menuOpen && (
          <div className="border-t border-white/[0.06] bg-[#080c13] px-5 py-6 md:hidden">
            <div className="flex flex-col gap-5">
              <a
                href="#ecosystem"
                onClick={() => setMenuOpen(false)}
                className="text-sm text-slate-300 transition hover:text-white"
              >
                Ecosystem
              </a>

              <a
                href="#how-it-works"
                onClick={() => setMenuOpen(false)}
                className="text-sm text-slate-300 transition hover:text-white"
              >
                How It Works
              </a>

              <a
                href="#community"
                onClick={() => setMenuOpen(false)}
                className="text-sm text-slate-300 transition hover:text-white"
              >
                Community
              </a>

              <a
                href="#faq"
                onClick={() => setMenuOpen(false)}
                className="text-sm text-slate-300 transition hover:text-white"
              >
                FAQ
              </a>

              <a
                href="/dashboard"
                className="orbi-button mt-2 w-full text-center"
              >
                Connect Wallet
              </a>
            </div>
          </div>
        )}
      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative z-10">
        <div className="orbi-container">
          <div className="relative flex min-h-[calc(100vh-92px)] flex-col items-center justify-center px-0 py-16 text-center sm:py-20 lg:py-24">
            {/* HERO GLOW */}

            <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1683ff]/[0.07] blur-[120px]" />

            <div className="pointer-events-none absolute left-1/2 top-[30%] -z-10 h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-[#6d4aff]/[0.06] blur-[100px]" />

            {/* BADGE */}

            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#1683ff]/25 bg-[#1683ff]/[0.05] px-4 py-2.5 shadow-[0_0_30px_rgba(22,131,255,0.06)]">
              <span className="h-2 w-2 rounded-full bg-[#35c9ff] shadow-[0_0_14px_rgba(53,201,255,0.9)]" />

              <span className="text-xs font-semibold tracking-[0.08em] text-[#8fcfff] sm:text-sm">
                Built on BNB Smart Chain
              </span>
            </div>

            {/* HERO HEADING */}

            <h1 className="max-w-5xl text-5xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl md:text-7xl lg:text-[82px]">
              <span className="block text-white">Build Your</span>

              <span className="orbi-gradient-text mt-2 block pb-2">
                Decentralized Future
              </span>
            </h1>

            {/* HERO DESCRIPTION */}

            <p className="mt-8 max-w-3xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
              ORBI World is a decentralized staking and referral ecosystem
              designed to connect users, staking packages and rewards through
              smart contracts.
            </p>

            {/* HERO CTA */}

            <div className="mt-9 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
              <a
                href="/dashboard"
                className="orbi-button min-w-[190px] justify-center text-center"
              >
                Connect Wallet
              </a>

              <a
                href="#ecosystem"
                className="orbi-button-secondary min-w-[190px] justify-center text-center"
              >
                Explore Ecosystem
              </a>
            </div>

            {/* =================================================
                VERIFICATION CARDS
            ================================================= */}

            <div className="mt-16 grid w-full max-w-6xl gap-4 md:grid-cols-3">
              <VerificationCard
                type="blue"
                icon={<AuditIcon />}
                title="AUDIT REPORT"
                subtitle="VERIFIED"
                description="Our smart contract is audited by a trusted security firm."
              />

              <VerificationCard
                type="orange"
                icon={<ContractIcon />}
                title="CONTRACT ADDRESS"
                subtitle="VERIFIED"
                description="Our contract address is fully verified and transparent."
              />

              <VerificationCard
                type="blue"
                icon={<BnbIcon />}
                title="POWERED BY"
                subtitle="BNB CHAIN"
                description="ORBI WORLD is proudly powered by BNB Smart Chain."
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          ECOSYSTEM
      ===================================================== */}

      <section
        id="ecosystem"
        className="relative z-10 border-t border-white/[0.06] py-20 sm:py-24"
      >
        <div className="orbi-container">
          {/* SECTION HEADER */}

          <div className="max-w-3xl">
            <span className="text-xs font-bold tracking-[0.2em] text-[#35a7ff]">
              THE ECOSYSTEM
            </span>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
              One ecosystem.
              <br />

              <span className="orbi-gradient-text">
                Multiple possibilities.
              </span>
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">
              A blockchain-powered environment built around staking, network
              growth, rewards and long-term participation.
            </p>
          </div>

          {/* =================================================
              BUSINESS CARDS
          ================================================= */}

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <BusinessCard
              number="01"
              type="blue"
              icon={<UsdtIcon />}
              title="USDT OTC"
              eyebrow="PRIMARY BUSINESS"
              description="We are dealing in USDT OTC/F2F deals across India and generate revenue through OTC transactions."
              points={["OTC Buy / Sell", "Merchant USDT Settlements"]}
            />

            <BusinessCard
              number="02"
              type="orange"
              icon={<TradingIcon />}
              title="CRYPTO TRADING"
              description="Trade in top crypto pairs globally through established digital asset markets."
              footerTitle="TOP CRYPTO PAIRS"
              footerText="BTC, ETH, BNB & more"
            />

            <BusinessCard
              number="03"
              type="blue"
              icon={<ForexIcon />}
              title="FOREX TRADING"
              description="Trade major forex pairs with precision across global currency markets."
              footerTitle="MAJOR FOREX PAIRS"
              footerText="EUR/USD, GBP/USD, USD/JPY & more"
            />

          </div>

          {/* =================================================
              CORE ECOSYSTEM
          ================================================= */}

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <EcosystemCard
              number="01"
              title="Staking"
              description="Participate through staking packages powered by smart-contract based infrastructure."
              icon={<StackIcon />}
            />

            <EcosystemCard
              number="02"
              title="Network"
              description="Build your network by connecting users and growing together inside the ORBI WORLD ecosystem."
              icon={<NetworkIcon />}
            />

            <EcosystemCard
              number="03"
              title="Rewards"
              description="Access ecosystem rewards through on-chain participation and the ORBI WORLD reward structure."
              icon={<RewardIcon />}
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}

      <section
        id="how-it-works"
        className="relative z-10 py-20 sm:py-24"
      >
        <div className="orbi-container">
          <div className="text-center">
            <span className="text-xs font-bold tracking-[0.2em] text-[#ff9d3d]">
              HOW IT WORKS
            </span>

            <h2 className="mt-4 text-3xl font-black sm:text-4xl md:text-5xl">
              Enter the world of ORBI
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
              A simple journey from connecting your wallet to participating
              in the ORBI WORLD ecosystem.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-4">
            <Step
              number="01"
              title="Connect"
              description="Connect your compatible Web3 wallet."
            />

            <Step
              number="02"
              title="Register"
              description="Create your on-chain ORBI profile."
            />

            <Step
              number="03"
              title="Participate"
              description="Participate through the ecosystem."
            />

            <Step
              number="04"
              title="Grow"
              description="Build your network and grow."
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          COMMUNITY
      ===================================================== */}

      <section
        id="community"
        className="relative z-10 border-y border-white/[0.06] py-20 sm:py-24"
      >
        <div className="orbi-container">
          <div className="orbi-card relative overflow-hidden p-8 sm:p-12 lg:p-16">
            {/* DECORATIVE GLOWS */}

            <div className="absolute right-[-10%] top-[-35%] h-80 w-80 rounded-full bg-[#1683ff]/10 blur-[110px]" />

            <div className="absolute bottom-[-40%] right-[20%] h-64 w-64 rounded-full bg-[#7357ff]/10 blur-[100px]" />

            <div className="relative max-w-4xl">
              <span className="text-xs font-bold tracking-[0.2em] text-[#35a7ff]">
                JOIN THE NETWORK
              </span>

              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                The next world is{" "}
                <span className="orbi-gradient-text">connected.</span>
              </h2>

              <p className="mt-5 max-w-2xl leading-7 text-slate-400">
                Connect your wallet and become part of the ORBI WORLD
                ecosystem.
              </p>

              <a
                href="/dashboard"
                className="orbi-button mt-8 inline-flex"
              >
                Connect Wallet
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FAQ
      ===================================================== */}

      <section
        id="faq"
        className="relative z-10 py-20 sm:py-24"
      >
        <div className="orbi-container">
          <div className="max-w-2xl">
            <span className="text-xs font-bold tracking-[0.2em] text-[#35a7ff]">
              FAQ
            </span>

            <h2 className="mt-4 text-3xl font-black sm:text-4xl md:text-5xl">
              Frequently asked questions
            </h2>

            <p className="mt-5 leading-7 text-slate-400">
              Everything you need to know about entering the ORBI WORLD
              ecosystem.
            </p>
          </div>

          <div className="mt-10 grid gap-4">
            <Faq
              question="What is ORBI WORLD?"
              answer="ORBI WORLD is a decentralized staking and referral ecosystem designed to connect users, staking packages and rewards through smart contracts."
            />

            <Faq
              question="How do I access the ecosystem?"
              answer="Users connect a compatible Web3 wallet and interact with the ecosystem through the decentralized dashboard."
            />

            <Faq
              question="Which network does ORBI WORLD use?"
              answer="ORBI WORLD is designed to operate on BNB Smart Chain."
            />

            <Faq
              question="How does participation work?"
              answer="Users connect their wallet, complete registration where required, and participate in the available ORBI WORLD ecosystem features."
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t border-white/[0.06] py-10">
        <div className="orbi-container flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <a href="/" aria-label="ORBI WORLD Home">
              <img
                src="/orbi-logo.png"
                alt="ORBI WORLD"
                className="h-10 w-auto object-contain"
              />
            </a>

            <p className="mt-3 text-xs text-slate-500">
              Connecting Worlds through Web3.
            </p>
          </div>

          <div className="flex flex-wrap gap-5 text-xs text-slate-500">
            <a
              href="#ecosystem"
              className="transition hover:text-white"
            >
              Ecosystem
            </a>

            <a
              href="#how-it-works"
              className="transition hover:text-white"
            >
              How It Works
            </a>

            <a
              href="#community"
              className="transition hover:text-white"
            >
              Community
            </a>

            <a
              href="#faq"
              className="transition hover:text-white"
            >
              FAQ
            </a>
          </div>

          <div className="text-xs text-slate-600">
            © {new Date().getFullYear()} ORBI WORLD. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ============================================================
   VERIFICATION CARD
============================================================ */

function VerificationCard({
  type,
  icon,
  title,
  subtitle,
  description,
}: {
  type: "blue" | "orange";
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
}) {
  const blue = type === "blue";

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-2xl border p-6 text-center transition duration-300 hover:-translate-y-1",
        blue
          ? "border-[#1683ff]/30 bg-[#07101d]/80 hover:border-[#1683ff]/60"
          : "border-[#ff9d32]/30 bg-[#100d07]/80 hover:border-[#ff9d32]/60",
      ].join(" ")}
    >
      <div
        className={[
          "absolute left-1/2 top-[-70px] h-40 w-40 -translate-x-1/2 rounded-full blur-[70px] transition",
          blue ? "bg-[#1683ff]/10" : "bg-[#ff9d32]/10",
        ].join(" ")}
      />

      <div className="relative">
        <div
          className={[
            "mx-auto flex h-20 w-20 items-center justify-center rounded-full border",
            blue
              ? "border-[#1683ff]/50 bg-[#1683ff]/[0.06] text-[#1683ff] shadow-[0_0_35px_rgba(22,131,255,0.12)]"
              : "border-[#ff9d32]/50 bg-[#ff9d32]/[0.06] text-[#ff9d32] shadow-[0_0_35px_rgba(255,157,50,0.12)]",
          ].join(" ")}
        >
          {icon}
        </div>

        <h3
          className={[
            "mt-5 text-sm font-black tracking-[0.16em]",
            blue ? "text-[#168cff]" : "text-[#ff9d32]",
          ].join(" ")}
        >
          {title}
        </h3>

        <div className="mt-1 text-lg font-bold tracking-[0.18em] text-white">
          {subtitle}
        </div>

        <div
          className={[
            "mx-auto mt-3 h-px w-20",
            blue ? "bg-[#1683ff]/50" : "bg-[#ff9d32]/50",
          ].join(" ")}
        />

        <p className="mx-auto mt-4 max-w-xs text-xs leading-5 text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   BUSINESS CARD
============================================================ */

function BusinessCard({
  number,
  type,
  icon,
  title,
  eyebrow,
  description,
  points,
  footerTitle,
  footerText,
}: {
  number: string;
  type: "blue" | "orange";
  icon: React.ReactNode;
  title: string;
  eyebrow?: string;
  description: string;
  points?: string[];
  footerTitle?: string;
  footerText?: string;
}) {
  const blue = type === "blue";

  return (
    <div
      className={[
        "group relative flex min-h-[330px] flex-col overflow-hidden rounded-2xl border p-5 transition duration-300 hover:-translate-y-1",
        blue
          ? "border-[#1683ff]/40 bg-[#07111f]/80 hover:border-[#1683ff]/70 hover:shadow-[0_18px_60px_rgba(22,131,255,0.10)]"
          : "border-[#ff9d32]/40 bg-[#100d08]/80 hover:border-[#ff9d32]/70 hover:shadow-[0_18px_60px_rgba(255,157,50,0.10)]",
      ].join(" ")}
    >
      <div
        className={[
          "absolute right-[-45px] top-[-45px] h-36 w-36 rounded-full blur-[60px] opacity-50 transition group-hover:opacity-100",
          blue ? "bg-[#1683ff]/15" : "bg-[#ff9d32]/15",
        ].join(" ")}
      />

      <div className="relative">
        <div className="flex items-start gap-4">
          {/* ICON */}

          <div
            className={[
              "flex h-20 w-20 shrink-0 items-center justify-center rounded-full border",
              blue
                ? "border-[#1683ff]/60 bg-[#1683ff]/[0.05] text-[#168cff] shadow-[0_0_30px_rgba(22,131,255,0.12)]"
                : "border-[#ff9d32]/60 bg-[#ff9d32]/[0.05] text-[#ff9d32] shadow-[0_0_30px_rgba(255,157,50,0.12)]",
            ].join(" ")}
          >
            {icon}
          </div>

          {/* TITLE */}

          <div className="min-w-0 pt-1">
            <div
              className={[
                "text-2xl font-black leading-none",
                blue ? "text-[#168cff]" : "text-[#ff9d32]",
              ].join(" ")}
            >
              {number}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-base font-bold leading-tight text-white">
                {title}
              </h3>

              {eyebrow && (
                <span className="text-[8px] font-bold tracking-[0.12em] text-slate-500">
                  ({eyebrow})
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="mt-5 min-h-[76px] text-sm leading-6 text-slate-400">
          {description}
        </p>

        {/* OTC POINTS */}

        {points && points.length > 0 && (
          <div className="mt-2 space-y-2">
            {points.map((point) => (
              <div
                key={point}
                className="flex items-center gap-2 text-xs font-medium text-slate-300"
              >
                <span
                  className={[
                    "flex h-4 w-4 items-center justify-center rounded-full border text-[9px]",
                    blue
                      ? "border-[#1683ff] text-[#1683ff]"
                      : "border-[#ff9d32] text-[#ff9d32]",
                  ].join(" ")}
                >
                  ✓
                </span>

                <span>{point}</span>
              </div>
            ))}
          </div>
        )}

        {/* FOOTER */}

        {footerTitle && footerText && (
          <div
            className={[
              "mt-auto border-t pt-4",
              blue ? "border-[#1683ff]/20" : "border-[#ff9d32]/20",
            ].join(" ")}
          >
            <div
              className={[
                "text-[10px] font-bold tracking-[0.14em]",
                blue ? "text-[#168cff]" : "text-[#ff9d32]",
              ].join(" ")}
            >
              {footerTitle}
            </div>

            <p className="mt-1 text-xs text-slate-400">
              {footerText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   ECOSYSTEM CARD
============================================================ */

function EcosystemCard({
  number,
  title,
  description,
  icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="orbi-card group relative overflow-hidden p-7 transition duration-300 hover:-translate-y-1 hover:border-[#1683ff]/30 hover:shadow-[0_15px_50px_rgba(22,131,255,0.08)]">
      <div className="absolute right-[-30px] top-[-30px] h-24 w-24 rounded-full bg-[#1683ff]/5 blur-2xl transition group-hover:bg-[#1683ff]/10" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="text-xs font-bold tracking-[0.15em] text-[#35a7ff]">
            {number}
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#1683ff]/25 bg-[#1683ff]/[0.04] text-[#35a7ff]">
            {icon}
          </div>
        </div>

        <h3 className="mt-7 text-xl font-bold">
          {title}
        </h3>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   STEP
============================================================ */

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="orbi-card group p-6 text-center transition duration-300 hover:-translate-y-1 hover:border-[#1683ff]/30">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#1683ff]/30 bg-[#1683ff]/5 text-sm font-bold text-[#35a7ff] shadow-[0_0_25px_rgba(22,131,255,0.08)] transition group-hover:shadow-[0_0_35px_rgba(22,131,255,0.15)]">
        {number}
      </div>

      <h3 className="mt-5 font-bold">
        {title}
      </h3>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

/* ============================================================
   FAQ
============================================================ */

function Faq({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <details className="orbi-card group overflow-hidden">
      <summary className="cursor-pointer list-none px-6 py-6 font-semibold">
        <div className="flex items-center justify-between gap-5">
          <span>{question}</span>

          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#1683ff]/20 text-lg font-normal text-[#35a7ff] transition group-open:rotate-45">
            +
          </span>
        </div>
      </summary>

      <div className="border-t border-white/[0.05] px-6 py-5">
        <p className="max-w-3xl text-sm leading-6 text-slate-400">
          {answer}
        </p>
      </div>
    </details>
  );
}

/* ============================================================
   ICONS
============================================================ */

function AuditIcon() {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 4H29L38 13V43H10V4Z"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="M29 4V13H38"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="M16 20H31M16 26H27M16 32H23"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle
        cx="34"
        cy="34"
        r="7"
        fill="#05070b"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M31 34L33 36L37 32"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ContractIcon() {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 4H29L38 13V43H10V4Z"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="M29 4V13H38"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="M16 20H31M16 26H28"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle
        cx="31"
        cy="34"
        r="7"
        fill="#05070b"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M28 34L30 36L34 32"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BnbIcon() {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M24 5L30 11L24 17L18 11L24 5Z"
        fill="currentColor"
      />
      <path
        d="M15 14L21 20L15 26L9 20L15 14Z"
        fill="currentColor"
      />
      <path
        d="M33 14L39 20L33 26L27 20L33 14Z"
        fill="currentColor"
      />
      <path
        d="M24 22L30 28L24 34L18 28L24 22Z"
        fill="currentColor"
      />
      <path
        d="M24 31L30 37L24 43L18 37L24 31Z"
        fill="currentColor"
      />
    </svg>
  );
}

function UsdtIcon() {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="24"
        cy="24"
        r="19"
        fill="#18A889"
      />
      <path
        d="M12 12H36V17H28V19C32 19.4 35 20.3 35 22C35 24.2 30.2 25.2 24 25.2C17.8 25.2 13 24.2 13 22C13 20.3 16 19.4 20 19V17H12V12Z"
        fill="white"
      />
      <path
        d="M24 25.5V36"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TradingIcon() {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 38H40"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M12 34V27M20 34V21M28 34V25M36 34V14"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M10 20L19 13L26 17L38 8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 8H38V14"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ForexIcon() {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="24"
        cy="24"
        r="19"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M16 15L21 24L16 33M32 15L27 24L32 33M20 28H28"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 24H36"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.5"
      />
    </svg>
  );
}

function StackIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 4L20 8L12 12L4 8L12 4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M4 12L12 16L20 12M4 16L12 20L20 16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NetworkIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="5"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="5"
        cy="18"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="19"
        cy="18"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M10.7 7.2L6.5 15.7M13.3 7.2L17.5 15.7M7.5 18H16.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RewardIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 8H18V20H6V8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M4 8H20V12H4V8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 8V20"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 8H8.5C7.1 8 6 6.9 6 5.5C6 4.1 7.1 3 8.5 3C11 3 12 8 12 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 8H15.5C16.9 8 18 6.9 18 5.5C18 4.1 16.9 3 15.5 3C13 3 12 8 12 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}