"use client";

import { Eye, EyeOff, IndianRupee, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";

interface AuthFormProps {
  initialMode?: "login" | "signup";
}

export default function AuthForm({ initialMode = "login" }: AuthFormProps) {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const actionLabel = isLogin ? "Sign in" : "Create account";

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [router, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, fullName.trim(), Number(openingBalance) || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f6f2] text-[#181917] dark:bg-[#15130f] dark:text-[#f4f4ef]">
      <section className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="auth-showcase relative hidden overflow-hidden border-r border-[#dcdcd4] p-10 dark:border-white/10 lg:flex lg:flex-col xl:p-14">
          <Brand prominent />
          <MoneyRitual />
          <div className="relative mt-auto max-w-sm pb-3">
            <div className="mb-7 h-px w-10 bg-[#181917]/35 dark:bg-white/35" />
            <h1 className="text-[clamp(2.75rem,5vw,5.75rem)] font-medium leading-[0.95] tracking-[-0.065em]">
              Money,
              <br />
              clearly.
            </h1>
            <p className="mt-7 text-sm leading-6 text-[#62635e] dark:text-white/52">
              Track what comes in, what goes out, and what keeps growing.
            </p>
          </div>
        </aside>

        <div className="auth-form-panel flex min-h-screen items-center px-5 py-10 sm:px-10 lg:px-[clamp(3.5rem,9vw,10rem)]">
          <div className="w-full max-w-[390px]">
            <div className="mb-14 lg:hidden">
              <Brand />
            </div>

            <header className="mb-9">
              <h2 className="text-[2rem] font-medium leading-none tracking-[-0.045em] sm:text-[2.35rem]">
                {isLogin ? "Welcome back" : "Create account"}
              </h2>
              <p className="mt-3 text-sm text-[#62635e] dark:text-white/52">
                {isLogin
                  ? "Your everyday money, in one clear place."
                  : "Your financial overview starts here."}
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-5">
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

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    className={fieldClassName}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 grid w-12 place-items-center text-[#74756f] transition-colors hover:text-[#181917] dark:text-white/45 dark:hover:text-white"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <AuthField
                    id="openingBalance"
                    label="Current bank balance"
                    value={openingBalance}
                    onChange={(value) => setOpeningBalance(value.replace(/[^0-9]/g, ""))}
                    placeholder="e.g. 70,000"
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                  <p className="mt-2 text-xs leading-5 text-[#777871] dark:text-white/43">
                    Used once to set your opening balance.
                  </p>
                </div>
              )}

              {error && (
                <div className="border-l-2 border-red-600 bg-red-50 px-3 py-2.5 dark:border-red-400 dark:bg-red-500/10">
                  <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-[#181917] px-5 py-3.5 text-sm font-semibold text-white transition-[background-color,transform] hover:-translate-y-px hover:bg-[#353630] disabled:cursor-not-allowed disabled:opacity-55 dark:bg-[#f4f4ef] dark:text-[#181917] dark:hover:bg-white"
              >
                {loading ? "Please wait..." : actionLabel}
              </button>
            </form>

            <p className="mt-7 text-sm text-[#62635e] dark:text-white/52">
              {isLogin ? "New to Kharcha?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin((current) => !current)}
                className="font-medium text-[#181917] underline decoration-[#9fa096] underline-offset-4 transition-colors hover:decoration-[#181917] dark:text-white dark:decoration-white/40 dark:hover:decoration-white"
              >
                {isLogin ? "Create account" : "Sign in"}
              </button>
            </p>

            {isLogin && <TrustRail />}
          </div>
        </div>
      </section>
    </main>
  );
}

function Brand({ prominent = false }: { prominent?: boolean }) {
  return (
    <div className={`relative z-10 flex items-center ${prominent ? "gap-4" : "gap-3"}`}>
      <div className={`grid place-items-center border border-[#181917]/15 bg-[#f6f6f2] text-[#181917] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] dark:border-white/15 dark:bg-[#f4f4ef] ${prominent ? "h-14 w-14 rounded-[20px]" : "h-10 w-10 rounded-[14px]"}`}>
        <IndianRupee className={prominent ? "h-6 w-6" : "h-[18px] w-[18px]"} strokeWidth={1.8} />
      </div>
      <p className={prominent ? "text-[1.35rem] font-semibold tracking-[-0.045em]" : "text-base font-semibold tracking-[-0.03em]"}>Kharcha</p>
    </div>
  );
}

function MoneyRitual() {
  return (
    <div className="auth-ritual pointer-events-none" aria-label="Money tracking routine visualisation">
      <div className="auth-ritual__topline">
        <p>Money, in motion</p>
        <span><Sparkles className="h-3 w-3" /> Signal on</span>
      </div>
      <div className="auth-ritual__stage" aria-hidden="true">
        <div className="auth-ritual__halo" />
        <svg className="auth-ritual__path" viewBox="0 0 440 230" fill="none">
          <path id="auth-money-flow" d="M38 167C88 181 106 155 144 121C182 87 204 57 249 72C292 86 307 154 390 110" />
          <circle className="auth-ritual__marker" r="3.5">
            <animateMotion className="auth-ritual__motion" dur="7s" repeatCount="indefinite">
              <mpath href="#auth-money-flow" />
            </animateMotion>
          </circle>
        </svg>
        <ol className="auth-ritual__flow">
          <RitualStep number="01" label="Income" detail="Track every credit." />
          <RitualStep number="02" label="Spending" detail="Give every spend context." />
          <RitualStep number="03" label="Growth" detail="Make room for next." />
        </ol>
      </div>
    </div>
  );
}

function TrustRail() {
  const messages = [
    "Track the habit.",
    "Understand the pattern.",
    "Grow the next move.",
  ];

  return (
    <aside className="auth-trust-rail" aria-label="Kharcha principles">
      <div className="auth-trust-rail__track">
        {[...messages, ...messages].map((message, index) => (
          <span key={`${message}-${index}`}><i />{message}</span>
        ))}
      </div>
    </aside>
  );
}

function RitualStep({ number, label, detail }: { number: string; label: string; detail: string }) {
  return (
    <li className={`auth-ritual__step auth-ritual__step--${number}`}>
      <p>{number}</p>
      <strong>{label}</strong>
      <small>{detail}</small>
    </li>
  );
}

const fieldClassName =
  "w-full rounded-xl border border-[#cfcfc7] bg-white/20 px-3.5 py-3 text-base text-[#181917] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#979790] focus:border-[#181917] focus:bg-white/60 focus:shadow-[0_0_0_3px_rgba(141,154,100,0.18)] dark:border-white/18 dark:bg-white/[0.02] dark:text-white dark:placeholder:text-white/32 dark:focus:border-white dark:focus:bg-white/[0.04] dark:focus:shadow-[0_0_0_3px_rgba(141,154,100,0.16)]";

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
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        inputMode={inputMode}
        pattern={pattern}
        className={fieldClassName}
        placeholder={placeholder}
      />
    </div>
  );
}
