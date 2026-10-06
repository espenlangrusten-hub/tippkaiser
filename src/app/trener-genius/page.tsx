import type { Metadata } from "next";
import { TrenerGeniusGame } from "./TrenerGeniusGame";
export const metadata: Metadata = {
  title: "Trainer-Genie – Tägliches Trainer-Quiz",
  description: "Vier Fragen zu Trainern im deutschen Fußball. Setz dich auf die Bank und geh offensiv – oder nicht.",
  alternates: { canonical: "/trener-genius" },
};
export default function TrenerGeniusPage() { return <TrenerGeniusGame />; }
