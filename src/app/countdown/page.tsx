import { CountdownPage } from "@/components/countdown-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payload Deactivation Countdown | TIGERS-X",
  description:
    "Live countdown to Experiment Cube Deactivation with UTC clock and ISS link pass status.",
};

export default function CountdownRoute() {
  return <CountdownPage />;
}
