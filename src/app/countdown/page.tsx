import { CountdownPage } from "@/components/countdown-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payload Deactivation | TIGERS-X",
  description:
    "Archived payload deactivation page with UTC clock and mission status.",
};

export default function CountdownRoute() {
  return <CountdownPage />;
}
