"use client"

import { useEffect } from "react"

// Last-resort page when even the root layout fails. It renders its own document, so styles are inline.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }, retry: () => void }) {
    useEffect(() => {
        console.error("The site failed to load", error.digest ?? "", error)
    }, [error])

    return (
        <html lang="en">
            <body style={{ margin: 0, background: "#f8fafd", fontFamily: "Lato, Arial, sans-serif" }}>
                <title>CHANGECARS</title>
                <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center" }}>
                    <div style={{ maxWidth: 520 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, letterSpacing: 3, color: "#957e4e", textTransform: "uppercase" }}>CHANGECARS</p>
                        <h1 style={{ margin: "12px 0 0", fontSize: 30, lineHeight: "38px", color: "#1a1a1a" }}>We could not load the site</h1>
                        <p style={{ margin: "16px 0 0", fontSize: 16, lineHeight: "24px", color: "#555" }}>Something went wrong on our side. Please try again in a moment.</p>
                        <button type="button" onClick={() => retry()} style={{ marginTop: 32, height: 44, padding: "0 28px", border: 0, borderRadius: 5, background: "#957e4d", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                            Try again
                        </button>
                    </div>
                </main>
            </body>
        </html>
    )
}
