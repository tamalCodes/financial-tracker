"use client";

import { useAuth } from "@/features/auth/AuthContext";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

interface AuthFormProps {
  initialMode?: "login" | "signup";
}

type AuthMode = "login" | "signup";
type OAuthProvider = "google" | "apple";

export default function AuthForm({ initialMode = "login" }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [error, setError] = useState(
    searchParams.get("error") === "oauth"
      ? "Unable to continue with that provider."
      : "",
  );
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const { signIn, signInWithOAuth, signUp, user } = useAuth();
  const isLogin = mode === "login";

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [router, user]);

  const switchMode = () => {
    setMode((current) => (current === "login" ? "signup" : "login"));
    setError("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(
          email,
          password,
          fullName.trim(),
          Number(openingBalance.replace(/,/g, "")) || 0,
        );
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to continue. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: OAuthProvider) => {
    setError("");
    setOauthLoading(provider);
    try {
      await signInWithOAuth(provider);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to continue with that provider.",
      );
      setOauthLoading(null);
    }
  };

  const heading = isLogin ? "Welcome back." : "Create account";
  const subheading = isLogin
    ? "Your everyday money, in one clear place."
    : "Your financial overview starts here.";

  return (
    <main className="kh-auth-page">
      <section className="kh-auth" aria-label="Kharcha authentication">
        <aside className="kh-auth__story">
          <Brand variant="desktop" />
          <div className="kh-auth__story-content">
            <MoneyLoop variant="desktop" />
            <div className="kh-auth__story-heading">
              <span aria-hidden="true" />
              <h1>Money, clearly.</h1>
              <p>Track what comes in, what goes out, and what keeps growing.</p>
            </div>
          </div>
          <div className="kh-auth__glow" aria-hidden="true" />
        </aside>

        <section className="kh-auth__form-panel">
          <div className="kh-auth__form-wrap">
            <div className="kh-auth__mobile-intro">
              <Brand variant="mobile" />
              <FormHeading heading={heading} subheading={subheading} />
              <MoneyLoop variant="mobile" />
            </div>

            <div className="kh-auth__desktop-heading">
              <FormHeading heading={heading} subheading={subheading} />
            </div>

            <form className="kh-auth__form" onSubmit={handleSubmit}>
              <div className="kh-auth__social-row">
                <SocialButton
                  provider="google"
                  loading={oauthLoading === "google"}
                  disabled={loading || oauthLoading !== null}
                  onClick={handleOAuth}
                />
                <SocialButton
                  provider="apple"
                  loading={oauthLoading === "apple"}
                  disabled={loading || oauthLoading !== null}
                  onClick={handleOAuth}
                />
              </div>

              <div className="kh-auth__divider" aria-hidden="true">
                <span />
                <small>or continue with email</small>
                <span />
              </div>

              {!isLogin && (
                <AuthField
                  id="fullName"
                  label="Full name"
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Aarav Sharma"
                  autoComplete="name"
                  required
                />
              )}

              <AuthField
                id="email"
                label="Email address"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />

              <div className="kh-auth__field">
                <div className="kh-auth__password-label">
                  <label htmlFor="password">Password</label>
                  {isLogin && <button type="button">Forgot password?</button>}
                </div>
                <div className="kh-auth__password-input">
                  <input
                    id="password"
                    type={passwordVisible ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={6}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="kh-auth__eye"
                    onClick={() => setPasswordVisible((visible) => !visible)}
                    aria-label={
                      passwordVisible ? "Hide password" : "Show password"
                    }
                  >
                    {passwordVisible ? (
                      <EyeOff aria-hidden="true" />
                    ) : (
                      <Eye aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="kh-auth__balance">
                  <AuthField
                    id="openingBalance"
                    label="Current bank balance"
                    value={openingBalance}
                    onChange={(value) =>
                      setOpeningBalance(value.replace(/[^0-9,]/g, ""))
                    }
                    placeholder="e.g. 70,000"
                    inputMode="numeric"
                    pattern="[0-9,]*"
                  />
                  <p>Used once to set your opening balance.</p>
                </div>
              )}

              {error && (
                <p className="kh-auth__error" role="alert">
                  {error}
                </p>
              )}

              <button
                className="kh-auth__primary"
                type="submit"
                disabled={loading || oauthLoading !== null}
              >
                {loading
                  ? "Please wait..."
                  : isLogin
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>

            <p className="kh-auth__security">
              <LockKeyhole aria-hidden="true" />
              Protected with bank-level 256-bit encryption
            </p>

            <p className="kh-auth__switch">
              {isLogin ? "New to Kharcha?" : "Already have an account?"}{" "}
              <button type="button" onClick={switchMode}>
                {isLogin ? "Create account" : "Sign in"}
              </button>
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

function FormHeading({
  heading,
  subheading,
}: {
  heading: string;
  subheading: string;
}) {
  return (
    <header className="kh-auth__heading">
      <h2>{heading}</h2>
      <p>{subheading}</p>
    </header>
  );
}

function Brand({ variant }: { variant: "desktop" | "mobile" }) {
  return (
    <div className={`kh-auth__brand kh-auth__brand--${variant}`}>
      <span className="kh-auth__mark" aria-hidden="true">
        ₹
      </span>
      <span>Kharcha</span>
    </div>
  );
}

function SocialButton({
  provider,
  loading,
  disabled,
  onClick,
}: {
  provider: OAuthProvider;
  loading: boolean;
  disabled: boolean;
  onClick: (provider: OAuthProvider) => void;
}) {
  const label = provider === "google" ? "Google" : "Apple";
  return (
    <button
      className="kh-auth__social"
      type="button"
      disabled={disabled}
      onClick={() => onClick(provider)}
    >
      {provider === "google" ? <GoogleIcon /> : <AppleIcon />}
      {loading ? "Opening..." : label}
    </button>
  );
}

function AuthField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  required,
  inputMode,
  pattern,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  pattern?: string;
}) {
  return (
    <div className="kh-auth__field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        inputMode={inputMode}
        pattern={pattern}
        placeholder={placeholder}
      />
    </div>
  );
}

function MoneyLoop({ variant }: { variant: "desktop" | "mobile" }) {
  const rawId = useId().replace(/:/g, "");
  const desktop = variant === "desktop";
  const pathId = `kh-path-${rawId}`;
  const gradientId = `kh-gradient-${rawId}`;
  const path = desktop
    ? "M20 158 C110 186 200 78 280 78 C360 78 430 158 540 110"
    : "M20 82 C120 104 200 30 280 32 C360 34 440 88 540 58";

  return (
    <section
      className={`kh-loop kh-loop--${variant}`}
      aria-label="The money loop: Income, Spending, Growth"
    >
      <div className="kh-loop__eyebrow">
        <span />
        THE MONEY LOOP
      </div>
      <div className="kh-loop__stage">
        <svg
          viewBox={desktop ? "0 0 560 240" : "0 0 560 120"}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
              <stop
                offset="0"
                stopColor="var(--kh-accent)"
                stopOpacity="0.08"
              />
              <stop
                offset="0.45"
                stopColor="var(--kh-accent)"
                stopOpacity="0.95"
              />
              <stop
                offset="1"
                stopColor="var(--kh-accent)"
                stopOpacity="0.22"
              />
            </linearGradient>
          </defs>
          <path
            id={pathId}
            className="kh-loop__base"
            d={path}
            stroke={`url(#${gradientId})`}
          />
          <path className="kh-loop__dash" d={path} />
          <g className="kh-loop__motion">
            {[0, 1.7, 3.4].map((begin, index) => (
              <circle
                key={begin}
                className={index ? "kh-loop__trail" : "kh-loop__marker"}
                r={index ? 1.8 : 3.4}
              >
                <animateMotion
                  dur="7s"
                  begin={`${begin}s`}
                  repeatCount="indefinite"
                >
                  <mpath href={`#${pathId}`} />
                </animateMotion>
              </circle>
            ))}
          </g>
          {desktop ? <DesktopNodes /> : <MobileNodes />}
        </svg>
        {desktop && <DesktopCallouts />}
      </div>
      {!desktop && <MobileLabels />}
    </section>
  );
}

function DesktopNodes() {
  return (
    <g className="kh-loop__nodes">
      {[
        [20, 158],
        [280, 78],
        [540, 110],
      ].map(([cx, cy], index) => (
        <g key={`${cx}-${cy}`}>
          <circle
            className="kh-loop__pulse"
            cx={cx}
            cy={cy}
            r="12"
            style={{ animationDelay: `${index * 1.3}s` }}
          />
          <circle className="kh-loop__ring" cx={cx} cy={cy} r="7" />
          <circle className="kh-loop__dot" cx={cx} cy={cy} r="2.5" />
        </g>
      ))}
    </g>
  );
}

function MobileNodes() {
  return (
    <g className="kh-loop__nodes kh-loop__nodes--mobile">
      {[
        [20, 82],
        [280, 32],
        [540, 58],
      ].map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          className="kh-loop__dot"
          cx={cx}
          cy={cy}
          r="3"
        />
      ))}
    </g>
  );
}

function DesktopCallouts() {
  const steps = [
    {
      number: "01",
      label: "Income",
      detail: "Track every credit.",
      className: "kh-loop__callout--income",
    },
    {
      number: "02",
      label: "Spending",
      detail: "Give every spend context.",
      className: "kh-loop__callout--spending",
    },
    {
      number: "03",
      label: "Growth",
      detail: "Make room for next.",
      className: "kh-loop__callout--growth",
    },
  ];
  return (
    <ol className="kh-loop__callouts">
      {steps.map((step) => (
        <li key={step.number} className={step.className}>
          <p>
            <span>{step.number}</span>
            {step.label}
          </p>
          <small>{step.detail}</small>
        </li>
      ))}
    </ol>
  );
}

function MobileLabels() {
  return (
    <ol className="kh-loop__mobile-labels">
      <li>
        <span>01</span>Income
      </li>
      <li>
        <span>02</span>Spending
      </li>
      <li>
        <span>03</span>Growth
      </li>
    </ol>
  );
}

function GoogleIcon() {
  return (
    <svg
      className="kh-auth__social-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.27c0-.75-.07-1.47-.2-2.16H12v4.09h5.23a4.47 4.47 0 0 1-1.94 2.93v2.65h3.14c1.84-1.7 2.92-4.2 2.92-7.51Z"
      />
      <path
        fill="#34A853"
        d="M12 21.75c2.62 0 4.82-.87 6.43-2.36l-3.14-2.65c-.87.58-1.98.93-3.29.93-2.53 0-4.67-1.71-5.44-4.01H3.32v2.73A9.75 9.75 0 0 0 12 21.75Z"
      />
      <path
        fill="#FBBC05"
        d="M6.56 13.66a5.86 5.86 0 0 1 0-3.72V7.21H3.32a9.75 9.75 0 0 0 0 9.18l3.24-2.73Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.93c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.82 3 14.62 2.25 12 2.25a9.75 9.75 0 0 0-8.68 4.96l3.24 2.73c.77-2.3 2.91-4.01 5.44-4.01Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      className="kh-auth__social-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M16.76 12.5c0-2.24 1.83-3.32 1.91-3.37a4.1 4.1 0 0 0-3.22-1.75c-1.35-.14-2.66.81-3.35.81-.7 0-1.75-.8-2.89-.78A4.28 4.28 0 0 0 5.6 9.6c-1.57 2.72-.4 6.72 1.1 8.91.75 1.07 1.62 2.27 2.77 2.23 1.12-.05 1.54-.71 2.89-.71 1.34 0 1.72.71 2.9.69 1.2-.02 1.95-1.07 2.67-2.15a8.85 8.85 0 0 0 1.22-2.5 3.86 3.86 0 0 1-2.39-3.57Zm-2.2-6.53A3.91 3.91 0 0 0 15.46 3a4.03 4.03 0 0 0-2.6 1.35 3.72 3.72 0 0 0-.93 2.87 3.32 3.32 0 0 0 2.63-1.25Z"
      />
    </svg>
  );
}
