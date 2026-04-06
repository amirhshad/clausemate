import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useInView, AnimatePresence } from 'framer-motion'
import {
  FileText, Sparkles, Calendar, Search, TrendingDown, ArrowRight,
  CheckCircle, ChevronDown, Upload, Shield, MessageSquare, Layers,
  PieChart, Zap, Globe, BarChart3, Menu, X
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------

function useFadeUp(delay = 0) {
  const reduced = useReducedMotion()
  return {
    initial: reduced ? undefined : { opacity: 0, y: 20 },
    animate: reduced ? undefined : { opacity: 1, y: 0 },
    transition: { duration: reduced ? 0 : 0.5, delay: reduced ? 0 : delay, ease: [0.25, 0.1, 0.25, 1.0] as const },
  }
}

function useStaggerChildren(stagger = 0.06) {
  const reduced = useReducedMotion()
  const ease = [0.25, 0.1, 0.25, 1.0] as const
  return {
    parent: {
      initial: 'hidden' as const,
      whileInView: 'visible' as const,
      viewport: { once: true, margin: '-60px' },
      variants: {
        hidden: {},
        visible: { transition: { staggerChildren: reduced ? 0 : stagger } },
      },
    },
    child: {
      variants: {
        hidden: reduced ? { opacity: 1 } : { opacity: 0, y: 20 },
        visible: reduced ? { opacity: 1 } : { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
      },
    },
  }
}

// ---------------------------------------------------------------------------
// 3D tilt hook (desktop only)
// ---------------------------------------------------------------------------

function useTilt(maxDeg = 5) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState({ rotateX: 0, rotateY: 0 })

  const onMove = (e: React.MouseEvent) => {
    if (reduced) return
    if (!ref.current) return
    if (!window.matchMedia('(hover: hover)').matches) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setStyle({ rotateX: -y * maxDeg, rotateY: x * maxDeg })
  }
  const onLeave = () => setStyle({ rotateX: 0, rotateY: 0 })

  return { ref, style, onMove, onLeave }
}

// ---------------------------------------------------------------------------
// Section wrapper with scroll fade-up
// ---------------------------------------------------------------------------

function Section({ children, id, className = '' }: { children: React.ReactNode; id?: string; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const reduced = useReducedMotion()
  return (
    <motion.section
      ref={ref}
      id={id}
      className={className}
      initial={reduced ? undefined : { opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: reduced ? 0 : 0.6, ease: [0.25, 0.1, 0.25, 1.0] as const }}
    >
      {children}
    </motion.section>
  )
}

// ---------------------------------------------------------------------------
// Feature card with 3D tilt
// ---------------------------------------------------------------------------

function FeatureCard({ icon: Icon, title, desc, accent }: {
  icon: React.ElementType; title: string; desc: string; accent: string
}) {
  const { ref, style, onMove, onLeave } = useTilt(5)
  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ perspective: 1000 }}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1.0] as const } },
      }}
    >
      <motion.div
        className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 hover:bg-white/[0.06] hover:border-white/[0.1] transition-colors duration-300 h-full"
        style={{ rotateX: style.rotateX, rotateY: style.rotateY }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className={`w-10 h-10 rounded-lg ${accent} flex items-center justify-center mb-4`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
      </motion.div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Landing() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const stagger = useStaggerChildren()

  // -------------------------------------------------------------------------
  // Feature data
  // -------------------------------------------------------------------------

  const features = [
    { icon: Upload, title: 'AI-Powered Extraction', desc: 'Upload any PDF and AI extracts provider, costs, dates, parties, key terms, and risks with confidence scoring.', accent: 'bg-indigo-500/80' },
    { icon: Zap, title: 'Smart AI Routing', desc: 'Claude Sonnet 4.6 handles primary analysis. Complex contracts automatically escalate to Gemini 2.5 Pro for deeper review.', accent: 'bg-violet-500/80' },
    { icon: Layers, title: 'Multi-Document Contracts', desc: 'Add SOWs, amendments, T&Cs, and addendums to existing contracts. AI merges new data with fuzzy deduplication.', accent: 'bg-blue-500/80' },
    { icon: MessageSquare, title: 'RAG-Powered Q&A', desc: 'Ask questions about your contracts in plain language. Get answers with document citations and page references.', accent: 'bg-cyan-500/80' },
    { icon: TrendingDown, title: 'AI Recommendations', desc: 'Get actionable insights: cost reductions, vendor consolidation, risk alerts, and renewal reminders with estimated savings.', accent: 'bg-emerald-500/80' },
    { icon: Calendar, title: 'Timeline Visualization', desc: 'Gantt-style view of every contract lifecycle. Spot urgent renewals and auto-renewal traps at a glance.', accent: 'bg-amber-500/80' },
    { icon: Shield, title: 'Risk Detection', desc: 'AI identifies risks by severity — auto-renewal traps, price escalations, liability limitations, and missing cancellation windows.', accent: 'bg-rose-500/80' },
    { icon: PieChart, title: 'Spending Analytics', desc: 'Category breakdown and 12-month spending projections. See exactly where your money goes across all contracts.', accent: 'bg-purple-500/80' },
    { icon: Search, title: 'Search & Export', desc: 'Full-text search across all contracts, providers, and key terms. Export your entire contract library to CSV anytime.', accent: 'bg-teal-500/80' },
  ]

  // -------------------------------------------------------------------------
  // Pricing data
  // -------------------------------------------------------------------------

  const pricing = [
    {
      name: 'Free', price: '$0', period: '/forever', highlighted: false,
      features: ['Up to 3 contracts', 'AI extraction with confidence scoring', 'Dashboard & spending charts', 'Full-text search', 'CSV export', 'Multi-currency support'],
      cta: 'Get Started', ctaStyle: 'border border-white/10 text-white hover:bg-white/5',
    },
    {
      name: 'Pro', price: '$29', period: '/month', highlighted: true,
      features: ['Unlimited contracts', 'Up to 5 PDFs per contract', 'Smart AI routing (Claude + Gemini)', 'RAG-powered Q&A with citations', 'AI recommendations (4 types)', 'Timeline visualization', 'Risk detection & severity alerts', 'Priority support'],
      cta: 'Start Free Trial', ctaStyle: 'bg-accent-500 hover:bg-accent-600 text-white',
    },
    {
      name: 'Team', price: '$79', period: '/month', highlighted: false,
      features: ['Everything in Pro', 'Up to 5 team members', 'Shared contract library', 'Team spending analytics', 'Role-based permissions', 'Dedicated support'],
      cta: 'Contact Sales', ctaStyle: 'border border-white/10 text-white hover:bg-white/5',
    },
  ]

  // Chart mock data
  const chartData = [
    { spend: 62, save: 8 }, { spend: 69, save: 10 }, { spend: 65, save: 14 },
    { spend: 76, save: 11 }, { spend: 72, save: 17 }, { spend: 67, save: 21 },
    { spend: 59, save: 19 }, { spend: 55, save: 24 }, { spend: 52, save: 27 },
    { spend: 49, save: 29 }, { spend: 46, save: 31 }, { spend: 43, save: 34 },
  ]
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  // Product showcase tabs
  const showcaseTabs = ['Dashboard', 'Contract Analysis', 'Timeline']

  return (
    <div className="min-h-screen bg-navy-950 text-white scroll-smooth">
      {/* Background treatment */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(99,102,241,1) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
        {/* Top glow */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.12), transparent)' }}
        />
      </div>

      {/* ================================================================ */}
      {/* NAVIGATION                                                       */}
      {/* ================================================================ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-navy-950/90 backdrop-blur-xl shadow-lg shadow-black/20 border-b border-white/5' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-indigo-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-lg font-semibold text-white">Clausemate</span>
            </div>

            {/* Center nav (desktop) */}
            <nav className="hidden md:flex items-center gap-8">
              {[
                { href: '#features', label: 'Features' },
                { href: '#how-it-works', label: 'How It Works' },
                { href: '#pricing', label: 'Pricing' },
              ].map(link => (
                <a key={link.href} href={link.href} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Right */}
            <div className="flex items-center gap-3">
              <Link to="/login" className="hidden sm:inline text-sm font-medium text-slate-400 hover:text-white transition-colors">
                Sign in
              </Link>
              <Link to="/login" className="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Get Started
              </Link>
              <button
                className="md:hidden text-slate-400 hover:text-white p-1"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-navy-950/95 backdrop-blur-xl border-b border-white/5 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-3">
                {[
                  { href: '#features', label: 'Features' },
                  { href: '#how-it-works', label: 'How It Works' },
                  { href: '#pricing', label: 'Pricing' },
                ].map(link => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <Link to="/login" className="block text-sm font-medium text-slate-400 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  Sign in
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ================================================================ */}
      {/* HERO SECTION                                                     */}
      {/* ================================================================ */}
      <section className="relative z-10 pt-28 pb-16 md:pt-36 md:pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div {...useFadeUp(0)} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 mb-8">
            <Sparkles className="w-3.5 h-3.5 text-accent-400" />
            <span className="text-xs font-medium text-accent-400">Powered by Claude Sonnet 4.6 + Gemini 2.5 Pro</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 {...useFadeUp(0.1)} className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
            <span className="text-white">Your contracts,</span>
            <br />
            <span className="bg-gradient-to-r from-accent-400 to-indigo-300 bg-clip-text text-transparent">decoded by AI.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p {...useFadeUp(0.2)} className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Upload any contract PDF and get instant extraction of costs, dates, risks, and key terms.
            Smart AI routing analyzes complex agreements with multi-model intelligence.
          </motion.p>

          {/* CTAs */}
          <motion.div {...useFadeUp(0.3)} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="group bg-accent-500 hover:bg-accent-600 text-white px-7 py-3.5 rounded-xl font-semibold text-base shadow-lg shadow-accent-500/25 transition-all flex items-center justify-center gap-2"
            >
              Start Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#how-it-works"
              className="border border-white/10 text-slate-300 hover:text-white hover:border-white/20 px-7 py-3.5 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2"
            >
              See How It Works
              <ChevronDown className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Trust line */}
          <motion.p {...useFadeUp(0.35)} className="mt-5 text-sm text-slate-500">
            Free forever plan available &middot; No credit card required
          </motion.p>
        </div>

        {/* Dashboard mockup */}
        <motion.div
          className="max-w-5xl mx-auto mt-16 md:mt-20"
          initial={reduced ? {} : { opacity: 0, y: 40 }}
          animate={reduced ? {} : { opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0 } : { duration: 0.8, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-1.5 shadow-2xl shadow-black/50">
            <div className="rounded-xl bg-navy-900/80 p-5 sm:p-6">
              {/* Window chrome */}
              <div className="flex items-center gap-1.5 mb-5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                <span className="ml-3 text-[10px] text-slate-600 font-medium">clausemate.vercel.app</span>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Total Contracts', value: '24', color: 'text-white' },
                  { label: 'Monthly Spend', value: '$2,847', color: 'text-accent-400' },
                  { label: 'Expiring Soon', value: '3', color: 'text-amber-400' },
                  { label: 'Savings Found', value: '$420', color: 'text-emerald-400' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.04]">
                    <p className="text-[10px] text-slate-500 mb-0.5">{stat.label}</p>
                    <p className={`text-lg sm:text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="bg-white/[0.04] rounded-lg border border-white/[0.04] p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] text-slate-500 font-medium">Monthly Spending</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-600">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-accent-500" />Spend</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Savings</span>
                  </div>
                </div>
                <div className="flex items-end gap-1.5" style={{ height: '80px' }}>
                  {chartData.map((d, i) => (
                    <div key={i} className="flex-1 flex items-end gap-px">
                      <div className="flex-1 bg-accent-500/60 rounded-t-sm" style={{ height: `${d.spend}px` }} />
                      <div className="flex-1 bg-emerald-400/60 rounded-t-sm" style={{ height: `${d.save}px` }} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-[9px] text-slate-600">
                  {months.map(m => <span key={m}>{m}</span>)}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ================================================================ */}
      {/* STATS BAR                                                        */}
      {/* ================================================================ */}
      <Section className="relative z-10 py-12 border-y border-white/5">
        <motion.div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8" {...stagger.parent}>
          {[
            { icon: FileText, num: '5', label: 'PDFs per contract' },
            { icon: Sparkles, num: '3', label: 'AI models integrated' },
            { icon: Globe, num: '6', label: 'Currencies supported' },
            { icon: BarChart3, num: '4', label: 'Recommendation types' },
          ].map((stat, i) => (
            <motion.div key={i} className="text-center" {...stagger.child}>
              <stat.icon className="w-5 h-5 text-accent-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">{stat.num}</p>
              <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ================================================================ */}
      {/* FEATURES GRID                                                    */}
      {/* ================================================================ */}
      <Section id="features" className="relative z-10 py-20 md:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything you need to manage contracts intelligently
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              From extraction to insights, Clausemate handles the entire contract lifecycle.
            </p>
          </div>

          <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5" {...stagger.parent}>
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} />
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ================================================================ */}
      {/* HOW IT WORKS                                                     */}
      {/* ================================================================ */}
      <Section id="how-it-works" className="relative z-10 py-20 md:py-28 px-4 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Three steps to contract clarity
            </h2>
            <p className="text-lg text-slate-400">Get started in under two minutes.</p>
          </div>

          <motion.div className="grid md:grid-cols-3 gap-10 md:gap-8 relative" {...stagger.parent}>
            {/* Connector lines (desktop) */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] border-t border-dashed border-white/10" aria-hidden="true" />

            {[
              { num: '01', icon: Upload, title: 'Upload your contracts', desc: 'Drag and drop up to 5 PDFs per contract. Add main agreements, SOWs, amendments, T&Cs, and more.' },
              { num: '02', icon: Sparkles, title: 'AI extracts everything', desc: 'Claude Sonnet 4.6 handles primary analysis. Complex contracts automatically escalate to Gemini 2.5 Pro for deeper review.' },
              { num: '03', icon: BarChart3, title: 'Act on insights', desc: 'View your dashboard, timeline, and AI-generated recommendations. Find risks, reduce costs, never miss a renewal.' },
            ].map((step, i) => (
              <motion.div key={i} className="text-center md:text-left relative" {...stagger.child}>
                <div className="w-14 h-14 rounded-2xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mx-auto md:mx-0 mb-4">
                  <step.icon className="w-6 h-6 text-accent-400" />
                </div>
                <span className="text-xs font-bold text-accent-400 uppercase tracking-wider">{step.num}</span>
                <h3 className="text-lg font-semibold text-white mt-2 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ================================================================ */}
      {/* AI PIPELINE SHOWCASE                                             */}
      {/* ================================================================ */}
      <Section className="relative z-10 py-20 md:py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Multi-AI intelligence, one seamless workflow
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Our smart routing engine picks the right model for each contract, ensuring thorough analysis every time.
            </p>
          </div>

          {/* Flow diagram */}
          <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-3 justify-center mb-14">
            {/* Upload node */}
            <div className="bg-white/[0.05] border border-white/10 rounded-xl px-5 py-4 text-center min-w-[140px]">
              <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
              <p className="text-sm font-medium text-white">Upload PDFs</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Up to 5 files</p>
            </div>

            <div className="text-slate-600 text-lg hidden lg:block">→</div>
            <div className="text-slate-600 text-lg lg:hidden">↓</div>

            {/* Claude node */}
            <div className="bg-accent-500/10 border border-accent-500/20 rounded-xl px-5 py-4 text-center min-w-[160px]">
              <div className="w-6 h-6 bg-accent-500/30 rounded-md flex items-center justify-center mx-auto mb-1.5">
                <span className="text-xs font-bold text-accent-300">C</span>
              </div>
              <p className="text-sm font-medium text-white">Claude Sonnet 4.6</p>
              <p className="text-[10px] text-accent-400 mt-0.5">Primary Analysis</p>
            </div>

            <div className="text-slate-600 text-lg hidden lg:block">→</div>
            <div className="text-slate-600 text-lg lg:hidden">↓</div>

            {/* Decision node */}
            <div className="relative">
              <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rotate-45 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-xs font-bold text-amber-400 -rotate-45">Complex?</span>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-3">
              {/* YES path */}
              <div className="flex flex-col lg:flex-row items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-amber-400 uppercase">Yes</span>
                  <span className="text-slate-600 hidden lg:inline">→</span>
                  <span className="text-slate-600 lg:hidden">↓</span>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-5 py-4 text-center min-w-[160px]">
                  <div className="w-6 h-6 bg-blue-500/30 rounded-md flex items-center justify-center mx-auto mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                  </div>
                  <p className="text-sm font-medium text-white">Gemini 2.5 Pro</p>
                  <p className="text-[10px] text-blue-400 mt-0.5">Deep Analysis</p>
                </div>
              </div>
            </div>

            <div className="text-slate-600 text-lg hidden lg:block">→</div>
            <div className="text-slate-600 text-lg lg:hidden">↓</div>

            {/* Results node */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-4 text-center min-w-[140px]">
              <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
              <p className="text-sm font-medium text-white">Results Ready</p>
              <p className="text-[10px] text-emerald-400 mt-0.5">With confidence score</p>
            </div>
          </div>

          {/* Info cards */}
          <motion.div className="grid md:grid-cols-3 gap-5" {...stagger.parent}>
            {[
              { title: 'Auto-Escalation', desc: 'Low confidence or high-complexity contracts trigger automatic model switching for thorough analysis.' },
              { title: 'Type-Aware Routing', desc: 'Rental, insurance, and service contracts always get multi-model analysis for complex legal terms.' },
              { title: 'Confidence Scoring', desc: 'Every extraction includes a confidence score (0-1.0) so you know exactly what needs human review.' },
            ].map((card, i) => (
              <motion.div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5" {...stagger.child}>
                <h4 className="text-sm font-semibold text-white mb-1.5">{card.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ================================================================ */}
      {/* PRODUCT SHOWCASE                                                 */}
      {/* ================================================================ */}
      <Section className="relative z-10 py-20 md:py-28 px-4 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              See Clausemate in action
            </h2>
            <p className="text-lg text-slate-400">
              A powerful dashboard designed for clarity, not complexity.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-2 mb-8">
            {showcaseTabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === i ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-1.5 shadow-2xl shadow-black/40">
            <div className="rounded-xl bg-navy-900/80 p-5 sm:p-6 min-h-[300px]">
              <div className="flex items-center gap-1.5 mb-5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 0 && (
                  <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                    {/* Dashboard mock */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {[
                        { label: 'Contracts', val: '24' },
                        { label: 'Monthly', val: '$2,847' },
                        { label: 'Expiring', val: '3' },
                        { label: 'Auto-Renew', val: '8' },
                      ].map((s, i) => (
                        <div key={i} className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.04]">
                          <p className="text-[10px] text-slate-500">{s.label}</p>
                          <p className="text-lg font-bold text-white">{s.val}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.04]">
                        <p className="text-[10px] text-slate-500 mb-2">Spending by Category</p>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full border-4 border-accent-500 border-t-emerald-400 border-r-amber-400" />
                          <div className="space-y-1 text-[10px]">
                            <p className="text-slate-400"><span className="inline-block w-2 h-2 rounded-full bg-accent-500 mr-1" />Insurance 42%</p>
                            <p className="text-slate-400"><span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1" />SaaS 31%</p>
                            <p className="text-slate-400"><span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1" />Rental 27%</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.04]">
                        <p className="text-[10px] text-slate-500 mb-2">AI Recommendations</p>
                        <div className="space-y-2">
                          {['Renegotiate SaaS license — save $120/mo', 'Cancel unused subscription — $45/mo', 'Bundle insurance policies — save $30/mo'].map((r, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <Sparkles className="w-3 h-3 text-accent-400 mt-0.5 flex-shrink-0" />
                              <p className="text-[10px] text-slate-400">{r}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 1 && (
                  <motion.div key="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                    {/* Contract analysis mock */}
                    <div className="mb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-accent-500/20 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-accent-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Home and Liability Insurance</p>
                          <p className="text-[10px] text-slate-500">Univé — Insurance — $22.52/mo</p>
                        </div>
                        <span className="ml-auto text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">0.92 confidence</span>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3">
                      <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.04]">
                        <p className="text-[10px] text-slate-500 mb-2">Parties (4)</p>
                        {['N.V. Univé Schade — Insurer', 'Univé Noord-Holland — Provider', 'A.H. Shadravan — Insured'].map((p, i) => (
                          <p key={i} className="text-[10px] text-slate-400 border-l-2 border-accent-500/30 pl-2 mb-1.5">{p}</p>
                        ))}
                      </div>
                      <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.04]">
                        <p className="text-[10px] text-slate-500 mb-2">Key Terms (21)</p>
                        {['Premium: €22.52/mo incl. tax', 'Home contents: €14.18/mo', 'Liability: €8.34/mo', 'Package discount: 2%'].map((t, i) => (
                          <p key={i} className="text-[10px] text-slate-400 flex items-start gap-1 mb-1"><span className="w-1 h-1 rounded-full bg-accent-500 mt-1.5 flex-shrink-0" />{t}</p>
                        ))}
                      </div>
                      <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.04]">
                        <p className="text-[10px] text-slate-500 mb-2">Risks (2)</p>
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded p-2 mb-2">
                          <p className="text-[10px] font-medium text-amber-400">Unspecified Deductibles</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">€0 deductible excludes mobile electronics</p>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-2">
                          <p className="text-[10px] font-medium text-emerald-400">Referenced Terms Not Provided</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">External T&Cs not included in documents</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 2 && (
                  <motion.div key="timeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                    {/* Timeline mock */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-px flex-1 bg-white/5" />
                        {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => (
                          <span key={m} className="text-[9px] text-slate-600 w-8 text-center">{m}</span>
                        ))}
                      </div>
                      {[
                        { name: 'Home Insurance', color: 'bg-accent-500', width: '75%', start: '8%' },
                        { name: 'AWS Subscription', color: 'bg-emerald-500', width: '100%', start: '0%' },
                        { name: 'Office Lease', color: 'bg-amber-500', width: '50%', start: '25%' },
                        { name: 'CRM License', color: 'bg-rose-500', width: '33%', start: '0%' },
                      ].map((bar, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-400 w-28 truncate">{bar.name}</span>
                          <div className="flex-1 bg-white/[0.03] rounded-full h-5 relative">
                            <div className={`${bar.color}/40 h-full rounded-full absolute`} style={{ width: bar.width, left: bar.start }} />
                          </div>
                        </div>
                      ))}
                      <div className="mt-3 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5 flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                        <p className="text-[10px] text-rose-300">CRM License expires in 12 days — cancellation deadline in 5 days</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Section>

      {/* ================================================================ */}
      {/* PRICING                                                          */}
      {/* ================================================================ */}
      <Section id="pricing" className="relative z-10 py-20 md:py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-slate-400">Start free. Upgrade when you need more.</p>
          </div>

          <motion.div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto" {...stagger.parent}>
            {pricing.map((plan, i) => (
              <motion.div
                key={i}
                className={`rounded-2xl p-8 relative ${plan.highlighted ? 'bg-gradient-to-b from-accent-500/[0.08] to-accent-600/[0.03] border border-accent-500/20 shadow-lg shadow-accent-500/10' : 'bg-white/[0.03] border border-white/[0.06]'}`}
                {...stagger.child}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-semibold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-sm text-slate-500">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlighted ? 'text-accent-400' : 'text-slate-500'}`} />
                      <span className="text-sm text-slate-400">{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login"
                  className={`block w-full py-3 rounded-xl font-medium text-center text-sm transition-colors ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ================================================================ */}
      {/* FINAL CTA                                                        */}
      {/* ================================================================ */}
      <Section className="relative z-10 py-20 md:py-28 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-accent-600 to-accent-500 rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
            {/* Decorative glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" aria-hidden="true" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" aria-hidden="true" />

            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 relative">
              Ready to take control of your contracts?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto relative">
              Join Clausemate and let AI handle the complexity. Start with our free plan today.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-white text-accent-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/90 shadow-lg transition-colors relative"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </Section>

      {/* ================================================================ */}
      {/* FOOTER                                                           */}
      {/* ================================================================ */}
      <footer className="relative z-10 py-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-accent-500 to-indigo-400 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">C</span>
            </div>
            <span className="text-sm font-medium text-slate-400">Clausemate</span>
            <span className="text-slate-600 text-sm ml-1">— AI-powered contract management</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link to="/login" className="hover:text-white transition-colors">Sign in</Link>
          </div>
          <p className="text-sm text-slate-600">
            &copy; 2026 Clausemate. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
