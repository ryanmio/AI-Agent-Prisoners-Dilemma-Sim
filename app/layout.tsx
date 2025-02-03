import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import type React from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Prisoner's Dilemma Simulator",
  description:
    "Experience the classic game theory scenario with AI agents. Explore trust, betrayal, and strategic decision-making in this interactive simulation.",
  openGraph: {
    title: "Prisoner's Dilemma Simulator",
    description:
      "Experience the classic game theory scenario with AI agents. Explore trust, betrayal, and strategic decision-making in this interactive simulation.",
    type: "website",
    url: "https://v0-scratch-iulfijaqkmz.vercel.app",
    siteName: "Prisoner's Dilemma Simulator",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}

