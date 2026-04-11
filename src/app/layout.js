import "./globals.css";

export const metadata = {
  title: "ThreadLine — Digital Intelligence Platform",
  description: "Investigate identities, trace digital footprints, and map threat landscapes with ThreadLine's OSINT intelligence engine.",
  keywords: ["OSINT", "cybersecurity", "digital intelligence", "threat analysis", "investigation"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  );
}
