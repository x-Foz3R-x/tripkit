import "~/styles/globals.css";
import { type Metadata } from "next";
import { BottomNav } from "~/components/bottom-nav";

export const metadata: Metadata = {
  title: "TripKit - Baza",
  description: "Modularna aplikacja do zarządzania wyjazdami",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl" className="dark">
      <body className="bg-witch-bg font-sans text-gray-100 antialiased">
        {/* Główny kontener na treść (dodajemy padding na dole żeby pasek nie zasłaniał treści) */}
        <main className="mx-auto min-h-screen max-w-md pb-24 pt-4 px-4">
          {children}
        </main>
        
        <BottomNav />
      </body>
    </html>
  );
}