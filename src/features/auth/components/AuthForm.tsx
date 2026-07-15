"use client";

import { useAuth } from "@/features/auth/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";

interface AuthFormProps {
  initialMode?: "login" | "signup";
}

type AuthMode = "login" | "signup";
type OAuthProvider = "google" | "apple";
type LoginStep = "email" | "password";
type SignupStep = 1 | 2 | 3;

const SIGNUP_STEPS = {
  1: {
    heading: "What’s your full name?",
    subheading: "We’ll use it to personalize your dashboard.",
  },
  2: {
    heading: "Set up your account",
    subheading: "Use your email and a strong password to keep it secure.",
  },
  3: {
    heading: "What’s your current balance?",
    subheading: "This gives your tracker its starting point.",
  },
} as const;

function passwordIssues(value: string) {
  return {
    length: value.length >= 8,
    lowercase: /[a-z]/.test(value),
    uppercase: /[A-Z]/.test(value),
    number: /\d/.test(value),
  };
}

function isStrongPassword(value: string) {
  return Object.values(passwordIssues(value)).every(Boolean);
}

const TESTIMONIALS = [
  {
    quote:
      "Finally I can see where my salary goes every month — Kharcha replaced my three spreadsheets in a week.",
    name: "Aarav Sharma",
    location: "Bengaluru",
    image: "/auth-testimonials/aarav-sharma.png",
  },
  {
    quote:
      "The monthly view makes it much easier to plan what I can spend without second-guessing every purchase.",
    name: "Meera Iyer",
    location: "Chennai",
    image: "/auth-testimonials/meera-iyer.png",
  },
  {
    quote:
      "I used to put off tracking expenses. Now it takes a minute, and I know exactly where I stand.",
    name: "Neha Kapoor",
    location: "Mumbai",
    image: "/auth-testimonials/neha-kapoor.png",
  },
  {
    quote:
      "Kharcha gave me a routine I can keep. I check in once a day instead of avoiding my finances for weeks.",
    name: "Kabir Menon",
    location: "Kochi",
    image: "/auth-testimonials/kabir-menon.png",
  },
  {
    quote:
      "Seeing money in one place has made my monthly goals feel much more achievable.",
    name: "Riya Desai",
    location: "Pune",
    image: "/auth-testimonials/riya-desai.png",
  },
] as const;

export default function AuthForm({ initialMode = "login" }: AuthFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loginStep, setLoginStep] = useState<LoginStep>("email");
  const [signupStep, setSignupStep] = useState<SignupStep>(1);
  const { signIn, signInWithOAuth, signUp, user } = useAuth();
  const isLogin = mode === "login";

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [router, user]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "oauth") {
      setError("Unable to continue with that provider.");
    }
  }, []);

  useEffect(() => {
    if (isLogin) return;

    const frame = window.requestAnimationFrame(() => {
      const fieldId = window.matchMedia("(max-width: 600px)").matches
        ? "mobile-fullName"
        : "desktop-fullName";
      document.getElementById(fieldId)?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isLogin]);

  const switchMode = () => {
    setMode((current) => (current === "login" ? "signup" : "login"));
    setError("");
    setLoginStep("email");
    setSignupStep(1);
    setPassword("");
    setPasswordVisible(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (isLogin && loginStep === "email") {
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        setError("Enter a valid email address.");
        return;
      }
      setLoginStep("password");
      return;
    }

    if (!isLogin && !openingBalance.trim()) {
      setError("Enter your current bank balance to continue.");
      return;
    }

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

  const advanceSignup = () => {
    setError("");
    if (signupStep === 1) {
      if (!fullName.trim()) {
        setError("Enter your full name to continue.");
        return;
      }
    }
    if (signupStep === 2) {
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        setError("Enter a valid email address.");
        return;
      }
      if (!isStrongPassword(password)) {
        setError("Use a stronger password before continuing.");
        return;
      }
    }
    setSignupStep((step) => Math.min(step + 1, 3) as SignupStep);
  };

  const heading = isLogin ? "Welcome back" : "Create account";
  const subheading = isLogin
    ? "Your everyday money, in one clear place."
    : "Your financial overview starts here.";
  const mobileSignupCopy = SIGNUP_STEPS[signupStep];

  return (
    <main className={`kh-auth-page${isLogin ? " kh-auth-page--login" : ""}`}>
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
              <FormHeading
                heading={isLogin ? heading : mobileSignupCopy.heading}
                subheading={isLogin ? subheading : mobileSignupCopy.subheading}
              />
              {!isLogin && <SignupProgress step={signupStep} />}
              <MoneyLoop variant="mobile" />
            </div>

            <div className="kh-auth__desktop-heading">
              <FormHeading heading={heading} subheading={subheading} />
            </div>

            <form className={`kh-auth__form${!isLogin ? ` kh-auth__form--signup kh-auth__form--signup-step-${signupStep}` : ""}`} onSubmit={handleSubmit} noValidate>
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

              {isLogin ? (
                <>
                  <AuthField
                    id="email"
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={(value) => {
                      setEmail(value);
                      if (loginStep === "password") {
                        setLoginStep("email");
                        setPassword("");
                      }
                    }}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                  {loginStep === "password" && (
                <div
                  className="kh-auth__password-reveal"
                >
                  <PasswordField
                    password={password}
                    passwordVisible={passwordVisible}
                    isLogin
                    onPasswordChange={setPassword}
                    onVisibilityChange={() =>
                      setPasswordVisible((visible) => !visible)
                    }
                  />
                </div>
                  )}
                </>
              ) : (
                <>
                  <div className="kh-auth__desktop-signup">
                    <SignupFields
                      idPrefix="desktop-"
                      fullName={fullName}
                      email={email}
                      password={password}
                      openingBalance={openingBalance}
                      passwordVisible={passwordVisible}
                      onFullNameChange={setFullName}
                      onEmailChange={setEmail}
                      onPasswordChange={setPassword}
                      onBalanceChange={setOpeningBalance}
                      onVisibilityChange={() => setPasswordVisible((visible) => !visible)}
                    />
                  </div>
                  <div className="kh-auth__mobile-signup">
                    <MobileSignupStep
                      step={signupStep}
                      fullName={fullName}
                      email={email}
                      password={password}
                      openingBalance={openingBalance}
                      passwordVisible={passwordVisible}
                      onFullNameChange={setFullName}
                      onEmailChange={setEmail}
                      onPasswordChange={setPassword}
                      onBalanceChange={setOpeningBalance}
                      onVisibilityChange={() => setPasswordVisible((visible) => !visible)}
                      onBack={() => setSignupStep((step) => Math.max(step - 1, 1) as SignupStep)}
                      onNext={advanceSignup}
                    />
                  </div>
                </>
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
                    ? "Continue"
                    : "Start tracking with Kharcha"}
              </button>
            </form>

            <p className="kh-auth__switch">
              {isLogin ? "New to Kharcha?" : "Already have an account?"}{" "}
              <button type="button" onClick={switchMode}>
                {isLogin ? "Create account" : "Sign in"}
              </button>
            </p>

            {isLogin && <Testimonial />}
          </div>
        </section>
      </section>
    </main>
  );
}

type SignupFieldsProps = {
  idPrefix: string;
  fullName: string;
  email: string;
  password: string;
  openingBalance: string;
  passwordVisible: boolean;
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onBalanceChange: (value: string) => void;
  onVisibilityChange: () => void;
};

function SignupFields({
  idPrefix,
  fullName,
  email,
  password,
  openingBalance,
  passwordVisible,
  onFullNameChange,
  onEmailChange,
  onPasswordChange,
  onBalanceChange,
  onVisibilityChange,
}: SignupFieldsProps) {
  return (
    <>
      <AuthField id={`${idPrefix}fullName`} label="Full name" value={fullName} onChange={onFullNameChange} placeholder="Aarav Sharma" autoComplete="name" required />
      <AuthField id={`${idPrefix}email`} label="Email address" type="email" value={email} onChange={onEmailChange} placeholder="you@example.com" autoComplete="email" required />
      <PasswordField password={password} passwordVisible={passwordVisible} isLogin={false} onPasswordChange={onPasswordChange} onVisibilityChange={onVisibilityChange} id={`${idPrefix}password`} />
      <PasswordRequirements password={password} />
      <BalanceField id={`${idPrefix}openingBalance`} value={openingBalance} onChange={onBalanceChange} required />
    </>
  );
}

function MobileSignupStep({
  step,
  fullName,
  email,
  password,
  openingBalance,
  passwordVisible,
  onFullNameChange,
  onEmailChange,
  onPasswordChange,
  onBalanceChange,
  onVisibilityChange,
  onBack,
  onNext,
}: Omit<SignupFieldsProps, "idPrefix"> & { step: SignupStep; onBack: () => void; onNext: () => void }) {
  return (
    <div className="kh-auth__signup-step">
      {step > 1 && <button className="kh-auth__back" type="button" onClick={onBack}>Back</button>}
      {step === 1 && <AuthField id="mobile-fullName" label="Full name" value={fullName} onChange={onFullNameChange} placeholder="Aarav Sharma" autoComplete="name" required />}
      {step === 2 && <>
        <AuthField id="mobile-email" label="Email address" type="email" value={email} onChange={onEmailChange} placeholder="you@example.com" autoComplete="email" required />
        <PasswordField password={password} passwordVisible={passwordVisible} isLogin={false} onPasswordChange={onPasswordChange} onVisibilityChange={onVisibilityChange} id="mobile-password" />
        <PasswordRequirements password={password} />
      </>}
      {step === 3 && <BalanceField id="mobile-openingBalance" value={openingBalance} onChange={onBalanceChange} required />}
      {step < 3 && <button className="kh-auth__primary" type="button" onClick={onNext}>Continue</button>}
    </div>
  );
}

function BalanceField({ id, value, onChange, required }: { id: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <div className="kh-auth__balance">
      <AuthField id={id} label="Current bank balance" value={value} onChange={(nextValue) => onChange(nextValue.replace(/[^0-9,]/g, ""))} placeholder="e.g. 70,000" inputMode="numeric" pattern="[0-9,]*" required={required} />
      <p>Used once to set your opening balance.</p>
    </div>
  );
}

function PasswordRequirements({ password }: { password: string }) {
  const issues = passwordIssues(password);
  return <ul className="kh-auth__password-rules" aria-label="Password requirements">
    <li className={issues.length ? "is-met" : undefined}>8+ characters</li>
    <li className={issues.uppercase && issues.lowercase ? "is-met" : undefined}>Uppercase and lowercase</li>
    <li className={issues.number ? "is-met" : undefined}>At least one number</li>
  </ul>;
}

function SignupProgress({ step }: { step: SignupStep }) {
  return <p className="kh-auth__progress" aria-label={`Step ${step} of 3`}><span>{step}</span> / 3</p>;
}

function PasswordField({
  password,
  passwordVisible,
  isLogin,
  onPasswordChange,
  onVisibilityChange,
  id = "password",
}: {
  password: string;
  passwordVisible: boolean;
  isLogin: boolean;
  onPasswordChange: (value: string) => void;
  onVisibilityChange: () => void;
  id?: string;
}) {
  return (
    <div className="kh-auth__field">
      <div className="kh-auth__password-label">
        <label htmlFor={id}>Password</label>
        {isLogin && <button type="button">Forgot password?</button>}
      </div>
      <div className="kh-auth__password-input">
        <input
          id={id}
          type={passwordVisible ? "text" : "password"}
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          required
          minLength={isLogin ? 1 : 8}
          autoComplete={isLogin ? "current-password" : "new-password"}
          placeholder="Enter your password"
        />
        <button
          type="button"
          className="kh-auth__eye"
          onClick={onVisibilityChange}
          aria-label={passwordVisible ? "Hide password" : "Show password"}
        >
          {passwordVisible ? (
            <EyeOff aria-hidden="true" />
          ) : (
            <Eye aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

function Testimonial() {
  const [activeIndex, setActiveIndex] = useState(0);
  const testimonial = TESTIMONIALS[activeIndex];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rotation = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % TESTIMONIALS.length);
    }, 8000);

    return () => window.clearInterval(rotation);
  }, [activeIndex]);

  return (
    <aside className="kh-auth__testimonial" aria-label="Customer stories">
      <div className="kh-auth__testimonial-card" key={testimonial.name}>
        <p>“{testimonial.quote}”</p>
        <footer>
          <Image
            className="kh-auth__testimonial-avatar"
            src={testimonial.image}
            alt=""
            width={36}
            height={36}
          />
          <span className="kh-auth__testimonial-person">
            <strong>{testimonial.name}</strong>
            <span>{testimonial.location}</span>
          </span>
        </footer>
      </div>
      <div
        className="kh-auth__testimonial-dots"
        aria-label="Choose a customer story"
      >
        {TESTIMONIALS.map((item, index) => (
          <button
            type="button"
            className={index === activeIndex ? "is-active" : undefined}
            key={item.name}
            aria-label={`Show testimonial from ${item.name}`}
            aria-pressed={index === activeIndex}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </aside>
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
  const markerRadius = desktop ? 3.5 : 7;
  const trailRadius = desktop ? 1.7 : 3;
  const path = "M20 158 C110 186 200 78 280 78 C360 78 430 158 540 110";

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
          viewBox="0 0 560 240"
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
                stopOpacity="0.62"
              />
              <stop
                offset="1"
                stopColor="var(--kh-accent)"
                stopOpacity="0.18"
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
                r={index ? trailRadius : markerRadius}
              >
                <animateMotion
                  dur="11s"
                  begin={`${begin}s`}
                  calcMode="paced"
                  repeatCount="indefinite"
                >
                  <mpath href={`#${pathId}`} />
                </animateMotion>
              </circle>
            ))}
          </g>
          {desktop ? <DesktopNodes /> : <MobileNodes />}
        </svg>
        {desktop ? <DesktopCallouts /> : <MobileCallouts />}
      </div>
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
            r="9"
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
        [20, 158],
        [280, 78],
        [540, 110],
      ].map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          className="kh-loop__dot"
          cx={cx}
          cy={cy}
          r="6"
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

function MobileCallouts() {
  return (
    <ol className="kh-loop__mobile-callouts">
      <li className="kh-loop__mobile-callout--income">
        <p><span>01</span>Income</p>
      </li>
      <li className="kh-loop__mobile-callout--spending">
        <p><span>02</span>Spending</p>
      </li>
      <li className="kh-loop__mobile-callout--growth">
        <p><span>03</span>Growth</p>
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
