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
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pl"
      className={`${fontHeading.variable} ${fontBody.variable} ${fontMono.variable} dark`}
    >
      <body className="bg-theme-bg font-body text-theme-text selection:bg-theme-primary/30 relative min-h-screen overflow-x-hidden antialiased">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="bg-theme-primary/10 absolute top-[-10%] left-[-20%] h-[50vh] w-[70vw] rounded-full blur-[100px]" />

          <div className="bg-theme-accent/50 absolute right-[-10%] bottom-[-20%] h-[40vh] w-[60vw] rounded-full blur-[120px]" />

          <div className="via-theme-bg/50 to-theme-bg absolute inset-0 bg-linear-to-b from-transparent" />
        </div>

        <main className="relative z-10 mx-auto min-h-screen max-w-md px-4 pt-4 pb-24">
          {children}
        </main>

        <BottomNav />
      </body>
    </html>
  );
}
