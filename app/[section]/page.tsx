import { notFound } from "next/navigation";
import DashboardClient from "../DashboardClient";

const sections = {
  pay: "Pay",
  trade: "Trade",
  wealth: "Wealth",
  profile: "Profile",
} as const;

type Section = keyof typeof sections;

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (!(section in sections)) {
    notFound();
  }

  return <DashboardClient initialTab={sections[section as Section]} />;
}
