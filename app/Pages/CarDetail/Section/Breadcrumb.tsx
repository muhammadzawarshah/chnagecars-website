"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

// "Return to results" only shows when the visitor came from a results page.
export default function Breadcrumb() {

    const [results, setResults] = useState<string | null>(null);

    useEffect(() => {
        try {
            const from = new URL(document.referrer);
            if (from.origin === window.location.origin && from.pathname === "/cars") setResults(from.pathname + from.search);
        } catch {}
    }, []);

    return (
        <>
            <nav className="text-base leading-[18.4px] text-black">
                {results && <><Link href={results} className="text-[#7c7c7c] no-underline">&lt; Return to results</Link> | </>}
                <Link href="/cars" className="text-[#7c7c7c] no-underline">Start new search</Link>
            </nav>
        </>
    )
}
