import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nowy wyjazd | Wyjezdnik",
  description: "Utwórz nowy wyjazd i skonfiguruj jego najważniejsze elementy.",
};

export default function CreateTripLayout({ children }: { children: React.ReactNode }) {
  return children;
}
