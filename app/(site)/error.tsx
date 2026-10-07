"use client"

import Link from "next/link"
import { useEffect } from "react"
import StatusPage, { statusButton, statusLink } from "@/app/components/StatusPage"

// Shown inside the site's header and footer when a page cannot load (for example the API is unreachable).
export default function SiteError({ error, retry }: { error: Error & { digest?: string }, retry: () => void }) {
    useEffect(() => {
        console.error("Page failed to load", error.digest ?? "", error)
    }, [error])

    return (
        <StatusPage code="Temporarily unavailable" title="We could not load this page" message="Something went wrong on our side. Please try again in a moment. If it keeps happening, our team is already looking into it.">
            <button type="button" onClick={() => retry()} className={statusButton}>Try again</button>
            <Link href="/" className={statusLink}>Go to the home page</Link>
        </StatusPage>
    )
}
