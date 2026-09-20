"use client";

import { useEffect, useMemo, useState } from "react";
import type { KycStep } from "@/lib/kyc";

type Session = {
  id: string;
  provider: string;
  mode: "sandbox" | "live";
  status: string;
  currentStep: KycStep;
};

type StepResult = {
  ok?: boolean;
  status?: string;
  message?: string;
  reference?: string;
};

const steps: { id: KycStep; label: string; short: string }[] = [
  { id: "identity", label: "Mobile & PAN", short: "1" },
  { id: "aadhaar", label: "Aadhaar / DigiLocker", short: "2" },
  { id: "liveness", label: "Selfie & liveness", short: "3" },
  { id: "bank", label: "Bank verification", short: "4" },
  { id: "consent", label: "Consent", short: "5" },
  { id: "complete", label: "Status", short: "6" },
];

const nextStep: Record<KycStep, KycStep> = {
  identity: "aadhaar",
  aadhaar: "liveness",
  liveness: "bank",
  bank: "consent",
  consent: "complete",
  complete: "complete",
};

export default function KycClient() {
  const [session, setSession] = useState<Session | null>(null);
  const [step, setStep] = useState<KycStep>("identity");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");

  const [mobile, setMobile] = useState("");
  const [pan, setPan] = useState("");
  const [otp, setOtp] = useState("");
  const [aadhaarMethod, setAadhaarMethod] = useState<"offline_xml" | "digilocker">("offline_xml");
  const [aadhaarRef, setAadhaarRef] = useState("");
  const [aadhaarConsent, setAadhaarConsent] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [declaration, setDeclaration] = useState(false);

  useEffect(() => {
    void createSession();
  }, []);

  async function createSession() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/kyc/session", { method: "POST" });
    const payload = await response.json();
    setSession(payload.session);
    setStep(payload.session.currentStep);
    setMessage(payload.notice || "");
    setLoading(false);
  }

  const progress = useMemo(() => {
    const index = steps.findIndex((item) => item.id === step);
    return Math.max(8, ((index + 1) / steps.length) * 100);
  }, [step]);

  async function verify(data: Record<string, unknown>) {
    if (!session) return;
    setBusy(true);
    setMessage("");

    const response = await fetch("/api/kyc/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, step, data }),
    });
    const payload = (await response.json()) as StepResult;

    if (!response.ok || !payload.ok) {
      setMessage(payload.message || "Verification failed.");
      setBusy(false);
      return;
    }

    setMessage(payload.message || "Verified.");
    if (payload.reference) setReference(payload.reference);
    setStep(nextStep[step]);
    setBusy(false);
  }

  function content() {
    if (step === "identity") {
      return (
        <>
          <div className="kycFormGrid">
            <label>
              Mobile number
              <div className="kycInputWrap"><span>+91</span><input value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" /></div>
            </label>
            <label>
              PAN
              <input value={pan} onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))} placeholder="ABCDE1234F" />
            </label>
            <label>
              OTP
              <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" />
              <small>Sandbox OTP: <b>123456</b></small>
            </label>
          </div>
          <button className="kycPrimary" disabled={busy} onClick={() => verify({ mobile, pan, otp })}>
            {busy ? "Checking…" : "Verify mobile & PAN"}
          </button>
        </>
      );
    }

    if (step === "aadhaar") {
      return (
        <>
          <div className="kycChoiceGrid">
            <button className={aadhaarMethod === "offline_xml" ? "selected" : ""} onClick={() => setAadhaarMethod("offline_xml")}>
              <b>Aadhaar Offline XML</b>
              <span>UIDAI digitally signed offline identity file</span>
            </button>
            <button className={aadhaarMethod === "digilocker" ? "selected" : ""} onClick={() => setAadhaarMethod("digilocker")}>
              <b>DigiLocker</b>
              <span>Fetch identity records through an authorized integration</span>
            </button>
          </div>
          <label>
            Sandbox document / reference ID
            <input value={aadhaarRef} onChange={(e) => setAadhaarRef(e.target.value)} placeholder="Enter any reference ID for sandbox" />
          </label>
          <label className="kycCheck">
            <input type="checkbox" checked={aadhaarConsent} onChange={(e) => setAadhaarConsent(e.target.checked)} />
            <span>I consent to use this identity document for KYC verification.</span>
          </label>
          <div className="kycSecurityNote">FinOrbit does not ask you to type or store your full Aadhaar number in this flow.</div>
          <button className="kycPrimary" disabled={busy} onClick={() => verify({ method: aadhaarMethod, reference: aadhaarRef, consent: aadhaarConsent })}>
            {busy ? "Checking…" : "Verify identity document"}
          </button>
        </>
      );
    }

    if (step === "liveness") {
      return (
        <>
          <div className="kycCamera">
            <div className={captured ? "face captured" : "face"}>{captured ? "✓" : "◉"}</div>
            <h3>{captured ? "Selfie captured" : "Selfie & liveness"}</h3>
            <p>In production this hands off to the contracted liveness provider. No biometric template is created by this sandbox.</p>
            <button onClick={() => setCaptured(true)}>{captured ? "Retake selfie" : "Capture sandbox selfie"}</button>
          </div>
          <button className="kycPrimary" disabled={busy || !captured} onClick={() => verify({ captured })}>
            {busy ? "Checking…" : "Run liveness check"}
          </button>
        </>
      );
    }

    if (step === "bank") {
      return (
        <>
          <div className="kycFormGrid">
            <label>
              Account holder name
              <input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Name as per bank" />
            </label>
            <label>
              Account number
              <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 18))} placeholder="Account number" />
            </label>
            <label>
              IFSC
              <input value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase().slice(0, 11))} placeholder="HDFC0001234" />
            </label>
          </div>
          <button className="kycPrimary" disabled={busy} onClick={() => verify({ accountName, accountNumber, ifsc })}>
            {busy ? "Checking…" : "Verify bank account"}
          </button>
        </>
      );
    }

    if (step === "consent") {
      return (
        <>
          <div className="kycConsentBox">
            <h3>Review & consent</h3>
            <p>You are submitting your KYC information for verification. In live mode, the final result comes from the configured regulated intermediary/KRA/provider — not from the FinOrbit browser UI.</p>
            <label className="kycCheck">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
              <span>I consent to KYC verification and processing of the submitted information for account onboarding.</span>
            </label>
            <label className="kycCheck">
              <input type="checkbox" checked={declaration} onChange={(e) => setDeclaration(e.target.checked)} />
              <span>I confirm that the information submitted is true and belongs to me.</span>
            </label>
          </div>
          <button className="kycPrimary" disabled={busy} onClick={() => verify({ accepted, declaration })}>
            {busy ? "Submitting…" : "Submit KYC"}
          </button>
        </>
      );
    }

    return (
      <div className="kycStatusCard">
        <div className="kycStatusIcon">✓</div>
        <p className="kycPill">SANDBOX SUBMITTED</p>
        <h2>KYC flow completed</h2>
        <p>Your sandbox submission completed successfully. This does not activate real banking or trading privileges.</p>
        {reference && <div className="kycReference"><span>Reference</span><b>{reference}</b></div>}
        <div className="kycLiveBox">
          <b>What changes in production?</b>
          <span>Provider/KRA callbacks determine Pending, Verified or Rejected status. Bank and broker activation only happens after a real approved response.</span>
        </div>
        <button className="kycSecondary" onClick={() => { setStep("identity"); setReference(""); void createSession(); }}>Start another sandbox KYC</button>
      </div>
    );
  }

  if (loading) {
    return <main className="kycPage"><div className="kycLoading">Creating secure KYC session…</div></main>;
  }

  return (
    <main className="kycPage">
      <header className="kycTopbar">
        <a href="/" className="kycBrand"><i>F</i><span><b>FinOrbit</b><small>KYC onboarding</small></span></a>
        <div className="kycMode"><span /> {session?.mode === "live" ? "LIVE PROVIDER" : "SANDBOX MODE"}</div>
      </header>

      <section className="kycShell">
        <aside className="kycSidebar">
          <p className="kycEyebrow">ACCOUNT VERIFICATION</p>
          <h1>Complete your KYC</h1>
          <p>One guided onboarding flow for identity, bank and compliance checks.</p>
          <div className="kycProgress"><i style={{ width: progress + "%" }} /></div>
          <div className="kycSteps">
            {steps.map((item, index) => {
              const currentIndex = steps.findIndex((s) => s.id === step);
              const done = index < currentIndex;
              const active = item.id === step;
              return (
                <div className={"kycStep " + (active ? "active " : "") + (done ? "done" : "")} key={item.id}>
                  <i>{done ? "✓" : item.short}</i>
                  <span><b>{item.label}</b><small>{done ? "Completed" : active ? "In progress" : "Upcoming"}</small></span>
                </div>
              );
            })}
          </div>
          <div className="kycAsideNote">
            <b>Privacy first</b>
            <span>Production secrets and provider tokens stay server-side. Sensitive verification results should be encrypted at rest.</span>
          </div>
        </aside>

        <section className="kycMain">
          <div className="kycCard">
            <div className="kycCardHead">
              <div>
                <p className="kycEyebrow">{steps.find((x) => x.id === step)?.label}</p>
                <h2>{step === "complete" ? "Verification status" : "Verify your details"}</h2>
              </div>
              {session && <small>Session {session.id.slice(0, 8)}</small>}
            </div>

            {message && <div className="kycMessage">{message}</div>}
            {content()}
          </div>

          <div className="kycLegal">
            <b>Production note</b>
            <span>FinOrbit's sandbox validates UX and application logic only. Real KYC must be performed through your contracted regulated intermediary/KRA/verification provider and their approved APIs.</span>
          </div>
        </section>
      </section>
    </main>
  );
}
