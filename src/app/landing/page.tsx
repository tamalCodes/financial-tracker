import Link from "next/link";
import Image from "next/image";
import LandingMotion from "./LandingMotion";
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
    <Link className={styles.brand} href="/landing" aria-label="Kharcha home">
      <span className={styles.brandMark}>₹</span>
      <span>Kharcha</span>
    </Link>
  );
}

function ProductPreview() {
  return (
    <div className={styles.preview} aria-label="Preview of Kharcha dashboard">
      <div className={styles.previewTop}><span className={styles.previewLogo}>K</span><span>June 2026</span><span className={styles.previewAvatar}>AS</span></div>
      <div className={styles.previewBody}>
        <aside className={styles.previewSide}><span className={styles.activeDot} />Overview<span>Spending</span><span>Investments</span><span>Plans</span></aside>
        <div className={styles.previewMain}>
          <p>LEFT IN BANK</p><strong>₹48,260<span>.24</span></strong>
          <div className={styles.previewGraph}><i /><i /><i /><i /><i /><i /><i /><i /><svg viewBox="0 0 250 76" preserveAspectRatio="none" aria-hidden="true"><path d="M0 66 C18 58, 25 63, 41 46 S69 52, 87 35 S112 48, 131 24 S158 44, 180 29 S209 35, 250 8" /></svg></div>
          <div className={styles.previewTiles}><div><small>Earned</small><b>₹89,000</b></div><div><small>Spent</small><b>₹32,740</b></div><div><small>Invested</small><b>₹8,000</b></div></div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className={styles.page}>
      <LandingMotion />
      <div className={styles.navShell} data-landing-nav>
        <nav className={styles.nav} aria-label="Main navigation"><Brand /><div className={styles.navLinks}><a href="#how">How it works</a><a href="#features">Why Kharcha</a><a href="#stories">Stories</a></div><div className={styles.navActions}><Link href="/login">Log in</Link><Link className={styles.smallCta} href="/signup">Start free</Link></div><button className={styles.menuToggle} data-nav-toggle type="button" aria-label="Open navigation" aria-expanded="false"><i /><i /></button></nav>
        <div className={styles.navMenu} data-nav-menu aria-hidden="true"><div className={styles.navMenuLabel}>EXPLORE KHARCHA</div><a href="#how">How it works <span>↗</span></a><a href="#features">Why Kharcha <span>↗</span></a><a href="#stories">Member stories <span>↗</span></a><div className={styles.navMenuFoot}><div><small>START HERE</small><Link href="/signup">Create your free account</Link></div><div><small>ALREADY TRACKING?</small><Link href="/login">Log in to Kharcha</Link></div></div></div>
      </div>
      <section className={styles.hero} id="top">
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}><span /> PERSONAL FINANCE, CLARIFIED</div>
            <h1>Your money.<br /><em>In its place.</em></h1>
            <p>Kharcha brings your everyday money into one clear, thoughtful view — so you can spend, save and grow with confidence.</p>
            <div className={styles.heroActions}><Link className={styles.primaryCta} href="/signup">Start Tracking <span>→</span></Link></div>
            <div className={styles.trust}><div className={styles.faceStack}><Image src="/landing/testimonial-riya.png" alt="Riya" width={54} height={54} /><Image src="/landing/testimonial-meera.png" alt="Meera" width={54} height={54} /><Image src="/landing/testimonial-aarav.png" alt="Aarav" width={54} height={54} /></div><span>Made for people building calmer money habits.</span></div>
          </div>
          <div className={styles.heroVisual} data-hero-visual>
            <div className={styles.orbit}><i className={styles.orbitDot} /></div><div className={styles.orbitTwo} /><div className={styles.goldCoin}>₹</div>
            <ProductPreview />
            <div className={styles.floatingCard}><span>THIS MONTH</span><b>On track</b><small>₹15,520 left to spend</small><div><i /><i /><i /><i /><i /></div></div>
          </div>
        </div>
        <section className={styles.proof} aria-label="Every part of your money">
          <p>ONE QUIET PLACE FOR EVERY PART OF YOUR MONEY</p>
          <div>{moneyAreas.map(([label, icon], index) => <span key={label} style={{ animationDelay: `${0.55 + index * 0.09}s` }}><MoneyAreaIcon area={icon} />{label}</span>)}</div>
        </section>
      </section>

      <section className={styles.story} id="how">
        <div className={styles.sectionIntro}><span className={styles.eyebrow}><i /> THE MONEY LOOP</span><h2>Less chasing.<br /><em>More knowing.</em></h2><p>Financial clarity does not need more tabs, alerts, or noise. It needs a simple rhythm you can return to.</p></div>
        <div className={styles.featureList}>{features.map(([number, title, copy]) => <article key={number} className={styles.feature}><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div><b>↗</b></article>)}</div>
      </section>

      <section className={styles.depth} data-nav-tone="dark" id="features"><div className={styles.depthHeader}><span className={styles.eyebrow}><i /> DESIGNED FOR REAL LIFE</span><h2>Everything you need.<br /><em>Nothing you do not.</em></h2><p>Follow your money from income to intention, without turning your life into a spreadsheet.</p></div><div className={styles.depthGrid}><article className={styles.depthFeature}><span>01 / MONTHLY VIEW</span><h3>Start with what is left.</h3><p>Your balance, earned and spent — set in context at first glance.</p><div className={styles.balanceCard}><small>LEFT IN BANK</small><strong>₹48,260</strong><p>↑ ₹6,350 from last month</p></div></article><article className={styles.depthFeature}><span>02 / SPENDING</span><h3>Every spend has a place.</h3><p>Gentle categories replace guesswork with a pattern you can understand.</p><div className={styles.listCard}><div><i />Groceries <b>−₹2,840</b></div><div><i />Dinner with friends <b>−₹1,260</b></div><div><i />Metro card <b>−₹750</b></div></div></article></div></section>

      <section className={styles.stories} id="stories"><div className={styles.storyLead}><span className={styles.eyebrow}><i /> PEOPLE, NOT PERSONAS</span><h2>Clarity looks different<br /><em>on everyone.</em></h2><p>Small, honest habits. Less guilt. More room to choose what comes next.</p></div><div className={styles.storyCards}><article className={styles.personCard}><Image src="/landing/testimonial-meera.png" alt="Portrait of fictional Kharcha member Meera Iyer" width={112} height={112}/><p>“I stopped trying to be perfect with money. I only had to be <em>aware</em> of it.”</p><strong>Meera Iyer</strong><small>Chennai</small></article><article className={`${styles.personCard} ${styles.personCardShift}`}><Image src="/landing/testimonial-aarav.png" alt="Portrait of fictional Kharcha member Aarav Sharma" width={112} height={112}/><p>“Now I can see where my salary goes before month-end surprises me.”</p><strong>Aarav Sharma</strong><small>Bengaluru</small></article></div></section>

      <section className={styles.closing} data-nav-tone="dark"><div className={styles.closingCopy}><span className={styles.eyebrow}><i /> READY WHEN YOU ARE</span><h2>Make space<br />for what matters.</h2><p>Your money has a story. Kharcha helps it make sense.</p><Link className={styles.primaryCta} href="/signup">Start with Kharcha <span>→</span></Link></div><div className={styles.freedomVisual} aria-hidden="true"><Image className={styles.freedomImage} src="/landing/freedom-cutout.png" alt="" width={1200} height={675} sizes="(max-width: 800px) 620px, 680px" loading="eager" /></div></section>

      <footer className={styles.footer} data-nav-tone="dark"><div className={styles.footerTop}><div className={styles.footerBrand}><Brand /><p>Your everyday money,<br />in one clear place.</p><div className={styles.socials}><a href="#top" aria-label="Kharcha on X">𝕏</a><a href="#top" aria-label="Kharcha on Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.7" r="1" className={styles.instagramDot}/></svg></a></div></div>{footerGroups.map(([heading, ...items]) => <div className={styles.footerGroup} key={heading}><h3>{heading}</h3>{items.map(item => <a href="#top" key={item}>{item}</a>)}</div>)}</div><div className={styles.footerBottom}><span>© 2026 Kharcha. Made for clearer days.</span><div><a href="#top">Terms</a><a href="#top">Privacy</a></div></div></footer>
    </main>
  );
}
