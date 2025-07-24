import "@/styles/globals.css";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { type Metadata } from "next";
import { Orbitron, Share_Tech_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
  title: "NeuroHub",
  description:
    "NeuroHub is a platform for Collaborating on a GitHub Repository",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

import { TRPCReactProvider } from "@/trpc/react";

// Orbitron is a futuristic sans-serif font, Share Tech Mono is a techy monospace
const orbitron = Orbitron({
  variable: "--font-futuristic-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const shareTechMono = Share_Tech_Mono({
  variable: "--font-futuristic-mono",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${orbitron.variable} ${shareTechMono.variable} antialiased `}
        >
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <TRPCReactProvider>{children}</TRPCReactProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
