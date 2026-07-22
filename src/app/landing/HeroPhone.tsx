import Image from "next/image";
import styles from "./landing.module.css";

function CompanionPhone({
  className,
  eyebrow,
  title,
  amount,
  children,
}: {
  className: string;
  eyebrow: string;
  title: string;
  amount: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${styles.heroCompanion} ${className}`} aria-hidden="true">
      <div className={styles.companionIsland} />
      <div className={styles.companionHeader}><span>₹</span><i /></div>
      <small>{eyebrow}</small>
      <h2>{title}</h2>
      <strong>{amount}</strong>
      {children}
      <div className={styles.companionNav}><b /><i /><i /><i /></div>
    </div>
  );
}

export default function HeroPhone() {
  return (
    <div className={styles.heroPhone} role="img" aria-label="Three Kharcha app views for monthly balance, spending and investments">
      <div className={styles.heroPhoneHalo} aria-hidden="true" />
      <CompanionPhone className={styles.heroCompanionSpending} eyebrow="THIS MONTH" title="Spending" amount="₹18,420">
        <div className={styles.companionDonut}><span>64%</span></div>
        <div className={styles.companionLegend}><span><i />Essentials</span><b>₹11,840</b></div>
        <div className={styles.companionLegend}><span><i />Lifestyle</span><b>₹6,580</b></div>
      </CompanionPhone>
      <CompanionPhone className={styles.heroCompanionInvesting} eyebrow="PORTFOLIO" title="Investments" amount="₹1,28,600">
        <svg className={styles.companionChart} viewBox="0 0 180 82">
          <path d="M2 69 C20 64 25 47 43 51 S70 61 84 41 S111 45 126 27 S153 29 178 8" />
          <path className={styles.companionChartFill} d="M2 69 C20 64 25 47 43 51 S70 61 84 41 S111 45 126 27 S153 29 178 8 V82 H2Z" />
        </svg>
        <div className={styles.companionReturn}><span>Monthly SIP</span><b>₹8,000</b></div>
      </CompanionPhone>
      <Image
        className={styles.heroPhoneImage}
        src="/landing/hero-phone-hand-v5.png"
        alt="Kharcha dashboard showing left-in-bank balance, bills, SIPs and recent payments on a phone held in one hand"
        width={1024}
        height={1536}
        sizes="(max-width: 450px) 82vw, (max-width: 800px) 360px, 450px"
        priority
      />
    </div>
  );
}
