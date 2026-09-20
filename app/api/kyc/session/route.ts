import { NextResponse } from "next/server";
import { getKycMode, getKycProvider, type KycSession } from "@/lib/kyc";

export async function POST() {
  const mode = getKycMode();
  const session: KycSession = {
    id: crypto.randomUUID(),
    provider: getKycProvider(),
    mode,
    status: "in_progress",
    currentStep: "identity",
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({
    session,
    notice:
      mode === "sandbox"
        ? "Sandbox KYC session created. No regulated KYC approval is being issued."
        : "Live KYC session created. Provider callbacks must determine final approval status.",
  });
}
