import Link from "next/link"
import StatusPage, { statusButton, statusLink } from "@/app/components/StatusPage"

// A car, article or page that does not exist (or has been sold and removed).
export default function SiteNotFound() {
    return (
        <StatusPage code="404" title="We could not find that page" message="The car or page you are looking for may have been sold, moved or removed. Have a look at the cars we have right now.">
            <Link href="/search" className={statusButton}>Browse cars</Link>
            <Link href="/" className={statusLink}>Go to the home page</Link>
        </StatusPage>
    )
}
