"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClarionMark } from "@/app/_components/Brand";

type Persona = "developer" | "manager" | "finance";

const PERSONAS: { value: Persona; label: string; hint: string }[] = [
  {
    value: "developer",
    label: "Developer",
    hint: "Build alerts, PRs, incidents.",
  },
  {
    value: "manager",
    label: "Manager",
    hint: "People, meetings, decisions.",
  },
  {
    value: "finance",
    label: "Finance / HR",
    hint: "Bills, points, renewals.",
  },
];

function StepDots({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={3}
      aria-valuenow={step}
      className="flex items-center justify-center gap-2"
    >
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`h-1.5 w-1.5 rounded-full transition-colors ${
            n === step
              ? "bg-stone-900 dark:bg-stone-100"
              : "bg-stone-300 dark:bg-stone-700"
          }`}
        />
      ))}
    </div>
  );
}

function EnvelopeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="m3.5 6 8.5 7 8.5-7" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <path d="m5.5 5.5 13 13" />
      <path d="m18.5 5.5-13 13" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m4 12 5 5L20 6" />
    </svg>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [persona, setPersona] = useState<Persona>("finance");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goBack = () => {
    setError(null);
    setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));
  };

  const goNext = () => {
    setError(null);
    setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
  };

  const finish = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona }),
      });
      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }
      router.push("/");
    } catch (e) {
      setSubmitting(false);
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg space-y-10">
        <div className="flex items-center justify-center gap-2 text-stone-900 dark:text-stone-100">
          <ClarionMark size="sm" />
          <span className="font-medium tracking-tight text-sm">Clarion</span>
        </div>

        <StepDots step={step} />

        {step === 1 && (
          <section className="space-y-6 text-center">
            <h1 className="text-2xl font-medium tracking-tight">
              Clarity from the chaos.
            </h1>
            <p className="text-sm text-stone-500 leading-relaxed max-w-md mx-auto">
              Clarion reads what lands in your mailbox and surfaces the handful
              of things that actually need you — bills coming due, points about
              to expire, real humans still waiting on a reply. Ask it anything
              else, anytime.
            </p>
            <div className="pt-2 flex items-center justify-center">
              <button
                type="button"
                onClick={goNext}
                className="bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-8">
            <h1 className="text-2xl font-medium tracking-tight text-center">
              How it works
            </h1>
            <ul className="divide-y divide-stone-200 dark:divide-stone-900">
              <li className="flex items-center gap-4 py-4">
                <span className="text-stone-500 dark:text-stone-400 shrink-0">
                  <EnvelopeIcon />
                </span>
                <span className="text-sm text-stone-700 dark:text-stone-300">
                  We read what lands in your inbox.
                </span>
              </li>
              <li className="flex items-center gap-4 py-4">
                <span className="text-stone-500 dark:text-stone-400 shrink-0">
                  <SparkIcon />
                </span>
                <span className="text-sm text-stone-700 dark:text-stone-300">
                  Claude summarises the day.
                </span>
              </li>
              <li className="flex items-center gap-4 py-4">
                <span className="text-stone-500 dark:text-stone-400 shrink-0">
                  <CheckIcon />
                </span>
                <span className="text-sm text-stone-700 dark:text-stone-300">
                  You skim three things and move on.
                </span>
              </li>
            </ul>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={goBack}
                className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={goNext}
                className="bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-8">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-medium tracking-tight">
                Pick a persona
              </h1>
              <p className="text-sm text-stone-500">
                We&rsquo;ll tune the digest to what you care about.
              </p>
            </div>

            <div role="radiogroup" aria-label="Persona" className="space-y-2">
              {PERSONAS.map((p) => {
                const selected = persona === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPersona(p.value)}
                    className={`w-full text-left px-4 py-3 rounded-md border transition-colors ${
                      selected
                        ? "border-stone-900 dark:border-stone-100 bg-stone-100/60 dark:bg-stone-900/40"
                        : "border-stone-200 dark:border-stone-900 hover:bg-stone-100/40 dark:hover:bg-stone-900/30"
                    }`}
                  >
                    <div className="text-sm font-medium text-stone-900 dark:text-stone-100">
                      {p.label}
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {p.hint}
                    </div>
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="text-xs text-stone-500 text-center" role="alert">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={submitting}
                className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors disabled:opacity-40"
              >
                Back
              </button>
              <button
                type="button"
                onClick={finish}
                disabled={submitting}
                className="bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? "Finishing…" : "Finish"}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
