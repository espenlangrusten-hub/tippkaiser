import type { Metadata } from "next";
import { ProfileScreen } from "@/components/profile/ProfileScreen";

export const metadata: Metadata = {
  title: "Mein Profil",
  description: "Verwalte dein Tippkaiser-Profil, deinen Avatar und deine Anmeldung.",
  alternates: { canonical: "/profil" },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ProfileScreen />;
}
