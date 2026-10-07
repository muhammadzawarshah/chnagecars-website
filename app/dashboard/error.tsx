"use client"

import Link from "next/link"
import { useEffect } from "react"
import StatusPage, { statusButton, statusLink } from "@/app/components/StatusPage"

// Dashboard screens that cannot load their data.
export default function DashboardError({ error, retry }: { error: Error & { digest?: string }, retry: () => void }) {
    useEffect(() => {
        console.error("Dashboard failed to load", error.digest ?? "", error)
    }, [error])

    return (
        <StatusPage code="Dashboard" title="This screen could not load" message="We could not fetch the latest figures right now. Please try again in a moment; your data is safe.">
            <button type="button" onClick={() => retry()} className={statusButton}>Try again</button>
            <Link href="/" className={statusLink}>Back to the website</Link>
        </StatusPage>
    )
}
