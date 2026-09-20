export type KycStep = "identity" | "aadhaar" | "liveness" | "bank" | "consent" | "complete";
export type KycStatus = "not_started" | "in_progress" | "pending_review" | "verified" | "rejected";

export type KycSession = {
  id: string;
  provider: string;
  mode: "sandbox" | "live";
  status: KycStatus;
  currentStep: KycStep;
  createdAt: string;
};

export const KYC_STEPS: { id: KycStep; title: string; description: string }[] = [
  { id: "identity", title: "Mobile & PAN", description: "Verify contact details and PAN format." },
  { id: "aadhaar", title: "Aadhaar / DigiLocker", description: "Use UIDAI offline XML or a configured DigiLocker provider." },
  { id: "liveness", title: "Selfie & liveness", description: "Capture a selfie and complete provider liveness checks." },
  { id: "bank", title: "Bank verification", description: "Verify account number and IFSC through a configured provider." },
  { id: "consent", title: "Consent", description: "Record required declarations, consent and e-sign reference." },
  { id: "complete", title: "KYC status", description: "Track KRA/provider review and activation status." },
];

export function getKycMode(): "sandbox" | "live" {
  return process.env.KYC_MODE === "live" ? "live" : "sandbox";
}

export function getKycProvider() {
  return process.env.KYC_PROVIDER || "sandbox";
}

export function validPan(value: string) {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value.trim().toUpperCase());
}

export function validIndianMobile(value: string) {
  return /^[6-9][0-9]{9}$/.test(value.replace(/\D/g, "").slice(-10));
}

export function validIfsc(value: string) {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.trim().toUpperCase());
}
