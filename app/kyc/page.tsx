import type { Metadata } from "next";
import KycClient from "./KycClient";

export const metadata: Metadata = {
  title: "KYC Onboarding — FinOrbit",
  description: "Secure identity and account verification flow for FinOrbit",
};

export default function KycPage() {
  return <KycClient />;
}
