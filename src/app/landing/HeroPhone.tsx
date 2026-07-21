import styles from "./landing.module.css";

function TrendLine() {
  return (
    <svg className={styles.phoneTrend} viewBox="0 0 300 96" aria-hidden="true">
      <defs>
        <linearGradient id="hero-phone-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--c-accent-4)" stopOpacity=".32" />
          <stop offset="1" stopColor="var(--c-accent-4)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className={styles.phoneTrendFill} d="M0 82 C24 72 35 46 58 56 S98 70 119 49 S155 64 180 37 S221 47 245 25 S278 25 300 7 V96 H0Z" />
      <path d="M0 82 C24 72 35 46 58 56 S98 70 119 49 S155 64 180 37 S221 47 245 25 S278 25 300 7" />
      <circle cx="300" cy="7" r="5" />
    </svg>
  );
}

function PhoneIcon({ children }: { children: React.ReactNode }) {
  return <span className={styles.phoneIcon}>{children}</span>;
}

export default function HeroPhone() {
  return (
    <div className={styles.heroPhone} data-hero-visual role="img" aria-label="Kharcha mobile dashboard showing left-in-bank balance, bills, SIPs and recent payments">
      <div className={styles.heroPhoneMotion}>
        <div className={styles.heroPhoneGlow} aria-hidden="true" />
        <div className={styles.phoneHardware} aria-hidden="true">
          <span className={styles.phoneSideButton} />
          <span className={styles.phoneSideButtonTwo} />
          <div className={styles.phoneScreen}>
          <div className={styles.phoneStatus}><span>9:41</span><i /><span>● ◔ ▰</span></div>
          <header className={styles.phoneHeader}>
            <span className={styles.phoneBrandMark}>₹</span>
            <strong>Kharcha</strong>
            <span className={styles.phoneAvatar}>A</span>
          </header>

          <section className={styles.phoneBalance}>
            <div className={styles.phoneBalanceTop}><span>LEFT IN BANK</span><b>On track</b></div>
            <strong>₹48,260</strong>
            <small>June 2026</small>
            <TrendLine />
          </section>

          <div className={styles.phoneQuickGrid}>
            <div><PhoneIcon>▤</PhoneIcon><p><strong>Bills &amp; EMIs</strong><span>3 this month</span></p></div>
            <div><PhoneIcon>↗</PhoneIcon><p><strong>SIPs</strong><span>Next ₹8,000</span></p></div>
          </div>

          <section className={styles.phonePayments}>
            <div className={styles.phonePaymentsTitle}><h3>Recent payments</h3><span>37 this month</span></div>
            <div className={styles.phoneBars}>{[38, 64, 48, 76, 56, 88, 45, 70].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>
            <div className={styles.phonePaymentRow}><PhoneIcon>●</PhoneIcon><strong>Coffee</strong><span>−₹220</span></div>
            <div className={styles.phonePaymentRow}><PhoneIcon>↗</PhoneIcon><strong>SIP investment</strong><span>−₹8,000</span></div>
          </section>

          <div className={styles.phoneAsk}><span className={styles.phoneAskOrb}>₹</span><p><strong>Ask Kharcha</strong><span>What can I help with?</span></p><b>›</b></div>

          <nav className={styles.phoneNav} aria-label="Dashboard preview navigation">
            <span className={styles.phoneNavActive}>⌂</span><span>◔</span><span>▤</span><span>☷</span>
          </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
