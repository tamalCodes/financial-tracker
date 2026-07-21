import Link from "next/link";
import Image from "next/image";
import HeroPhone from "./HeroPhone";
import LandingMotion from "./LandingMotion";
import StoryRotator from "./StoryRotator";
import styles from "./landing.module.css";

const features = [
  ["01", "See every rupee", "Income, spending, bills and investments — all held in one calm monthly view."],
  ["02", "Spend with context", "Know what is left before you make a decision, not after you regret one."],
  ["03", "Make room for next", "A clear picture today gives your future plans a little more breathing room."],
];

const footerGroups = [
  ["Product", "Overview", "Spending", "Investments", "Bills & EMIs"],
  ["Company", "About Kharcha", "Careers", "Notes"],
  ["Support", "Help centre", "Contact", "Privacy"],
];

const moneyAreas = [
  ["Spending", "SPENDING"],
  ["Saving", "SAVING"],
  ["Investing", "INVESTING"],
  ["Bills", "BILLS"],
  ["Goals", "GOALS"],
] as const;

function MoneyAreaIcon({ area }: { area: string }) {
  const paths = {
    SPENDING: <><path d="M12 3v12" /><path d="m8 11 4 4 4-4" /><path d="M5 20h14" /></>,
    SAVING: <><path d="M5 9h14v10H5z" /><path d="M7 9V6h10v3" /><path d="M14 14h2" /></>,
    INVESTING: <><path d="m4 17 6-6 4 3 6-7" /><path d="M16 7h4v4" /></>,
    BILLS: <><path d="M7 3h10v18l-2-1.5-3 1.5-3-1.5L7 21z" /><path d="M10 8h4M10 12h4" /></>,
    GOALS: <><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /><path d="m16.5 7.5 3-3M16 4.5h3.5V8" /></>,
  } as const;

  return <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">{paths[area as keyof typeof paths]}</svg>;
}

function Brand() {
  return (
    <Link className={styles.brand} href="/" aria-label="Kharcha home">
      <span className={styles.brandMark}>₹</span>
      <span>Kharcha</span>
    </Link>
  );
}

export default function LandingPage() {
  return (
    <main className={styles.page} data-landing-root>
      <LandingMotion />
      <div className={styles.navShell} data-landing-nav>
        <nav className={styles.nav} aria-label="Main navigation"><Brand /><div className={styles.navLinks}><a href="#how">How it works</a><a href="#features">Why Kharcha</a><a href="#stories">Stories</a></div><div className={styles.navActions}><Link href="/auth">Log in</Link><Link className={styles.smallCta} href="/auth?mode=signup">Start free</Link></div><button className={styles.menuToggle} data-nav-toggle type="button" aria-label="Open navigation" aria-expanded="false"><i /><i /></button></nav>
        <div className={styles.navMenu} data-nav-menu aria-hidden="true"><div className={styles.navMenuLabel}>EXPLORE KHARCHA</div><a href="#how">How it works <span>↗</span></a><a href="#features">Why Kharcha <span>↗</span></a><a href="#stories">Member stories <span>↗</span></a><div className={styles.navMenuFoot}><div><small>START HERE</small><Link href="/auth?mode=signup">Create your free account</Link></div><div><small>ALREADY TRACKING?</small><Link href="/auth">Log in to Kharcha</Link></div></div></div>
      </div>
      <section className={styles.hero} id="top">
        <div className={styles.heroBackdrop} aria-hidden="true">
          <video className={styles.heroVideo} data-hero-video autoPlay muted loop playsInline preload="metadata" poster="/landing/hero-clouds-gold-poster.avif">
            <source src="/landing/hero-clouds-gold-mobile.webm" type="video/webm" media="(max-width: 800px)" />
            <source src="/landing/hero-clouds-gold.webm" type="video/webm" media="(min-width: 801px)" />
            <source src="/landing/hero-clouds-gold-mobile.mp4" type="video/mp4" media="(max-width: 800px)" />
            <source src="/landing/hero-clouds-gold.mp4" type="video/mp4" />
          </video>
          <div className={styles.heroVideoWash} />
        </div>
        <div className={styles.heroContent}>
          <div className={styles.heroCopy}>
            <h1>Your money.<br /><em>In its place.</em></h1>
            <p>Kharcha brings your everyday money into one clear, thoughtful view — so you can spend, save and grow with confidence.</p>
            <div className={styles.heroActions}><Link className={styles.primaryCta} href="/auth?mode=signup">Start Tracking <span>→</span></Link></div>
          </div>
          <HeroPhone />
        </div>
      </section>
      <section className={styles.proof} aria-label="Every part of your money">
          <p>ONE QUIET PLACE FOR EVERY PART OF YOUR MONEY</p>
          <div>{moneyAreas.map(([label, icon], index) => <span key={label} style={{ animationDelay: `${0.55 + index * 0.09}s` }}><MoneyAreaIcon area={icon} /><b>{label}</b></span>)}</div>
          <section className={styles.proofMarquee} data-money-rail aria-label="Swipe through money areas" tabIndex={0}>
            <div className={styles.proofTrack} data-money-rail-track>
              {[0, 1, 2].map((copy) => <div className={styles.proofLoop} key={copy} aria-hidden={copy === 1 ? undefined : "true"}>{moneyAreas.map(([label, icon]) => <span className={styles.proofPill} key={`${copy}-${label}`}><MoneyAreaIcon area={icon} /><b>{label}</b></span>)}</div>)}
            </div>
          </section>
      </section>

      <section className={styles.story} id="how">
        <div className={styles.sectionIntro}><span className={styles.eyebrow}><i /> THE MONEY LOOP</span><h2>Less chasing.<br /><em>More knowing.</em></h2><p>Financial clarity does not need more tabs, alerts, or noise. It needs a simple rhythm you can return to.</p></div>
        <div className={styles.featureList}>{features.map(([number, title, copy]) => <article key={number} className={styles.feature}><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div><b>↗</b></article>)}</div>
      </section>

      <section className={styles.depth} data-chapter-panel data-nav-tone="dark" id="features"><div className={styles.depthHeader}><span className={styles.eyebrow}><i /> DESIGNED FOR REAL LIFE</span><h2>Everything you need.<br /><em>Nothing you do not.</em></h2><p>Follow your money from income to intention, without turning your life into a spreadsheet.</p></div><div className={styles.depthGrid}><article className={styles.depthFeature}><span>01 / MONTHLY VIEW</span><h3>Start with what is left.</h3><p>Your balance, earned and spent — set in context at first glance.</p><div className={styles.balanceCard}><small>LEFT IN BANK</small><strong>₹48,260</strong><p>↑ ₹6,350 from last month</p></div></article><article className={styles.depthFeature}><span>02 / SPENDING</span><h3>Every spend has a place.</h3><p>Gentle categories replace guesswork with a pattern you can understand.</p><div className={styles.listCard}><div><i />Groceries <b>−₹2,840</b></div><div><i />Dinner with friends <b>−₹1,260</b></div><div><i />Metro card <b>−₹750</b></div></div></article></div></section>

      <div className={styles.storiesShell} data-depth-followup>
        <section className={styles.stories} id="stories">
          <div className={styles.storiesMain}>
            <div className={styles.storyLead}>
              <span className={styles.eyebrow}><i /> PEOPLE, NOT PERSONAS</span>
              <h2>Clarity looks different<br /><em>on everyone.</em></h2>
              <p>Not a perfect budget. A dependable view of what came in, what moved out, and what is still yours to use.</p>
            </div>
            <StoryRotator />
          </div>
          <div className={styles.storyProof} aria-label="What Kharcha keeps clear">
            <div><span>01</span><p><strong>Know the month</strong>Income, spending and investments together.</p></div>
            <div><span>02</span><p><strong>See commitments</strong>Bills, EMIs and SIPs before they surprise you.</p></div>
            <div><span>03</span><p><strong>Choose calmly</strong>Left-in-bank stays visible for every decision.</p></div>
          </div>
        </section>
      </div>

      <div className={styles.finalScreen}>
      <section className={styles.closing} data-nav-tone="dark"><div className={styles.closingCopy}><span className={styles.eyebrow}><i /> READY WHEN YOU ARE</span><h2>Make space<br />for what matters.</h2><p>Your money has a story. Kharcha helps it make sense.</p><Link className={styles.primaryCta} href="/auth?mode=signup">Start with Kharcha <span>→</span></Link></div><div className={styles.freedomVisual} aria-hidden="true"><Image className={styles.freedomImage} src="/landing/freedom-cutout.png" alt="" width={1200} height={675} sizes="(max-width: 1024px) 96vw, 680px" loading="eager" /></div></section>

      <footer className={styles.footer} data-nav-tone="dark"><div className={styles.footerTop}><div className={styles.footerBrand}><Brand /><p>Your everyday money,<br />in one clear place.</p><div className={styles.socials}><a href="#top" aria-label="Kharcha on X">𝕏</a><a href="#top" aria-label="Kharcha on Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.7" r="1" className={styles.instagramDot}/></svg></a></div></div><div className={styles.footerLinks}>{footerGroups.map(([heading, ...items]) => <div className={styles.footerGroup} key={heading}><h3>{heading}</h3>{items.map(item => <a href="#top" key={item}>{item}</a>)}</div>)}</div></div><div className={styles.footerBottom}><span>© 2026 Kharcha. Made for clearer days.</span><div><a href="#top">Terms</a><a href="#top">Privacy</a></div></div></footer>
      </div>
    </main>
  );
}
