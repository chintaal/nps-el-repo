import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PROJECT MIRAGE — Threat Deception Console',
  description: 'Real-time adversary deception and forensic triage dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-mirage-bg text-gray-100 font-mono antialiased overflow-hidden">
        {children}
      </body>
    </html>
  )
}
