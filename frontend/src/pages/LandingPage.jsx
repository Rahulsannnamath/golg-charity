import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../App.css'

const marqueeItems = [
  'Stripe Ready',
  'Stableford Engine',
  'Monthly Draws',
  'Charity Smart Split',
  'Proof Verification',
  'Admin Ops',
]

const bentoItems = [
  {
    title: 'Subscriber Control Center',
    metric: '2,184 Active',
    desc: 'Track subscription state, score history, and draw entries in one place.',
  },
  {
    title: 'Prize Pool Sync',
    metric: 'INR 12.4L',
    desc: 'Pool auto-updates from active plans and rollover jackpot logic.',
  },
  {
    title: 'Charity Impact',
    metric: 'INR 4.8L',
    desc: 'Transparent contribution tracking by user-selected charities.',
  },
  {
    title: 'Winner Verification',
    metric: '48 Pending',
    desc: 'Evidence upload, admin review, and payout progression pipeline.',
  },
]

const showcaseSteps = [
  {
    number: '01',
    title: 'Create Space',
    desc: 'Set your profile, choose a subscription plan, and activate your dashboard.',
  },
  {
    number: '02',
    title: 'Invite Team',
    desc: 'Bring golf partners and run community campaigns around your favorite charity.',
  },
  {
    number: '03',
    title: 'Track Scores',
    desc: 'Save your last five Stableford rounds with automatic replacement logic.',
  },
]

const pricingPlans = [
  {
    name: 'Monthly Drive',
    price: 'INR 999',
    detail: 'For players testing momentum month by month.',
    points: ['Draw eligibility', '5-score history', '10% charity default'],
  },
  {
    name: 'Yearly Champion',
    price: 'INR 9,799',
    detail: 'Best value with stronger monthly pool contribution.',
    points: ['18% savings', 'Priority support', 'Bonus charity badges'],
    featured: true,
  },
  {
    name: 'Partner Team',
    price: 'Custom',
    detail: 'Built for companies, clubs, and multi-player squads.',
    points: ['Team dashboard', 'Campaign controls', 'Regional reports'],
  },
]

const testimonials = [
  {
    quote:
      'We finally launched a golf platform that feels modern and mission-driven, not generic.',
    author: 'Aditi R.',
    role: 'Product Lead',
  },
  {
    quote:
      'The score flow is insanely clear. I can update rounds quickly and track draw status instantly.',
    author: 'Vikram S.',
    role: 'Subscriber',
  },
  {
    quote:
      'Admin simulation before publishing draws gave us confidence and reduced payout disputes.',
    author: 'Noah D.',
    role: 'Ops Admin',
  },
]

const faqs = [
  {
    q: 'How are winners validated?',
    a: 'Winners upload score proof, admins verify it, and payout states move from pending to paid.',
  },
  {
    q: 'How does 5-score retention work?',
    a: 'Only the latest five scores are saved. Any new entry automatically removes the oldest score.',
  },
  {
    q: 'Can users increase charity contribution?',
    a: 'Yes. Every subscriber can raise their percentage beyond the 10% minimum at any time.',
  },
]



function LandingPage() {
  const { isAuthenticated, logout } = useAuth()
  const [openFaq, setOpenFaq] = useState(0)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
  }, [])

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
    })

    lenis.on('scroll', ScrollTrigger.update)

    const ticker = (time) => {
      lenis.raf(time * 1000)
    }

    gsap.ticker.add(ticker)
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
      gsap.ticker.remove(ticker)
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [])

  useEffect(() => {
    const elements = gsap.utils.toArray('.reveal-up')

    elements.forEach((el) => {
      gsap.fromTo(
        el,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 84%',
            toggleActions: 'play none none none',
          },
        },
      )
    })
  }, [])

  useEffect(() => {
    const handleMouseMove = (event) => {
      const x = (event.clientX / window.innerWidth) * 100
      const y = (event.clientY / window.innerHeight) * 100
      document.documentElement.style.setProperty('--mouse-x', `${x}%`)
      document.documentElement.style.setProperty('--mouse-y', `${y}%`)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const layers = gsap.utils.toArray('.parallax-layer')

    layers.forEach((layer, index) => {
      gsap.to(layer, {
        yPercent: (index + 1) * 9,
        ease: 'none',
        scrollTrigger: {
          trigger: '.cartoon-app',
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
        },
      })
    })
  }, [])

  return (
    <main className="cartoon-app">
      <div className="bg-animated" aria-hidden="true">
        <div className="bg-grid parallax-layer" />
        <div className="bg-noise parallax-layer" />
        <span className="bg-orb orb-a parallax-layer" />
        <span className="bg-orb orb-b parallax-layer" />
        <span className="bg-orb orb-c parallax-layer" />
        <div className="bg-streaks parallax-layer">
          <span />
          <span />
          <span />
        </div>
      </div>

      <section className="hero-frame">
        <nav className="cartoon-nav">
          <div className="brand-mark">Drive for Good</div>
          <div className="nav-links">
            <a href="#features">Product</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">Resources</a>
          </div>
          <div className="nav-auth-actions">
            {isAuthenticated ? (
              <>
                <Link className="nav-login-btn" to="/dashboard">Dashboard</Link>
                <button className="nav-signup-btn" type="button" onClick={logout}>Logout</button>
              </>
            ) : (
              <>
                <Link className="nav-login-btn" to="/login">Login</Link>
                <Link className="nav-signup-btn" to="/signup">Sign Up</Link>
              </>
            )}
          </div>
        </nav>

        <div className="hero-copy reveal-up">
          <p className="hero-tag">Golf Charity Subscription Platform</p>
          <h1>Build Momentum. Win Fairly. Support Better Causes.</h1>
          <p>
            A cinematic frontend inspired by premium startup dashboards, adapted for
            your PRD and ready for backend modules.
          </p>
          <div className="hero-actions">
            <Link className="app-btn" to={isAuthenticated ? '/dashboard' : '/signup'}>
              {isAuthenticated ? 'Open Dashboard' : 'Start Subscription'}
            </Link>
            <Link className="ghost-btn" to={isAuthenticated ? '/scores' : '/login'}>
              {isAuthenticated ? 'Add Score' : 'Explore Demo'}
            </Link>
          </div>
        </div>

        <div className="pill-track reveal-up">
          {[...marqueeItems, ...marqueeItems].map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </section>

      <section className="butter-section reveal-up" id="features">
        <p className="section-kicker">How It Works</p>
        <h2>Smooth as Butter.</h2>

        <div className="floating-nav">
          <span className="dot-face">◉</span>
          <span>Product</span>
          <span>Solutions</span>
          <span>Pricing</span>
          <span>Resources</span>
          <Link className="mini-cta" to="/signup">Get App</Link>
        </div>

        <div className="work-grid">
          {showcaseSteps.map((step) => (
            <article className="work-card" key={step.number}>
              <p className="step-number">{step.number}</p>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
              <button className="arrow-btn" type="button">
                →
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="content-wrap reveal-up">
        <div className="section-head">
          <p className="section-kicker">Bento Grid</p>
          <h2>Startup-style metrics tuned for charity golf ops</h2>
        </div>
        <div className="bento-grid">
          {bentoItems.map((item, index) => (
            <motion.article
              className={`bento-card bento-${index + 1}`}
              key={item.title}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <p>{item.title}</p>
              <h3>{item.metric}</h3>
              <span>{item.desc}</span>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="content-wrap reveal-up">
        <div className="section-head">
          <p className="section-kicker">Scroll Showcase</p>
          <h2>Visual flow for draw, scores, and winner verification</h2>
        </div>
        <div className="showcase-layout">
          <div className="showcase-sticky">
            <h3>Monthly Draw Engine</h3>
            <p>Random or weighted mode with simulation and publish controls.</p>
            <div className="draw-balls">
              <span>07</span>
              <span>14</span>
              <span>22</span>
              <span>33</span>
              <span>41</span>
            </div>
          </div>
          <div className="showcase-list">
            {[
              'Subscriber updates latest score and date',
              'System preserves only five recent rounds',
              'Eligibility is auto-evaluated for draw tiers',
              'Winner uploads proof for admin verification',
            ].map((item) => (
              <article key={item}>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="content-wrap reveal-up" id="pricing">
        <div className="section-head">
          <p className="section-kicker">Pricing</p>
          <h2>Plans designed for growth and contribution</h2>
        </div>
        <div className="pricing-grid">
          {pricingPlans.map((plan) => (
            <article className={plan.featured ? 'price-card featured' : 'price-card'} key={plan.name}>
              <h3>{plan.name}</h3>
              <p className="amount">{plan.price}</p>
              <p>{plan.detail}</p>
              <ul>
                {plan.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="content-wrap reveal-up">
        <div className="section-head">
          <p className="section-kicker">Testimonials</p>
          <h2>What early users say</h2>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((item) => (
            <article key={item.author}>
              <p className="quote">"{item.quote}"</p>
              <p className="author">{item.author}</p>
              <p className="role">{item.role}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-wrap reveal-up" id="faq">
        <div className="section-head">
          <p className="section-kicker">FAQ</p>
          <h2>Common implementation questions</h2>
        </div>
        <div className="faq-wrap">
          {faqs.map((item, index) => (
            <article className="faq-item" key={item.q}>
              <button
                className="faq-btn"
                type="button"
                onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
              >
                <span>{item.q}</span>
                <span>{openFaq === index ? '-' : '+'}</span>
              </button>
              {openFaq === index && <p>{item.a}</p>}
            </article>
          ))}
        </div>
      </section>

     

      <footer className="site-footer">
        <p>Digital Heroes Sample Build · Golf Charity Platform</p>
      </footer>
    </main>
  )
}

export default LandingPage
