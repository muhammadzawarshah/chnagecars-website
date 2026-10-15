import Link from "next/link";
import StatusPage, { statusLink } from "./components/StatusPage";
export default function NotFound() {
  return <StatusPage code="404" title="Page not found" message="This page is not available in the superadmin app."><Link href="/dashboard/super-admin" className={statusLink}>Open superadmin</Link></StatusPage>;
}
