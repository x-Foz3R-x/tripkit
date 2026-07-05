import "~/styles/globals.css";
import { type Metadata } from "next";
import { BottomNav } from "~/components/bottom-nav";
import { Nerko_One, Commissioner, Inconsolata } from "next/font/google";

const fontHeading = Nerko_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-heading",
});

const fontBody = Commissioner({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
});

const fontMono = Inconsolata({
  subsets: ["latin", "latin-ext"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "TripKit",
  description: "Baza wyjazdu i organizacja w jednym miejscu.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pl"
      className={`${fontHeading.variable} ${fontBody.variable} ${fontMono.variable} dark`}
    >
      <body className="bg-theme-bg font-body text-theme-text selection:bg-theme-primary/30 antialiased">
        <main className="mx-auto min-h-screen max-w-md px-4 pt-4 pb-24">{children}</main>

        <BottomNav />
      </body>
    </html>
  );
}
