import type { Metadata } from "next";
import { TrenerGeniusGame } from "./TrenerGeniusGame";
export const metadata: Metadata = { title: "Trainer-Genie", description: "Vier Fragen zu den Trainern im deutschen Fußball. Setz dich auf die Bank und entscheide, wann du offensiv gehst.", alternates: { canonical: "/trener-genius" } };
export default function TrenerGeniusPage() { return <TrenerGeniusGame />; }
