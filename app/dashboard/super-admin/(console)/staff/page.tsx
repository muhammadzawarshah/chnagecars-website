import { ManagementPage } from "@/app/Pages/Dashboard/Console/ManagementPages";
import type { ConsoleQuery } from "@/app/lib/dashboard/console";

export const metadata = { title: "Staff" };
export default async function Page({ searchParams }: { searchParams: Promise<ConsoleQuery> }) {
  return <ManagementPage section="staff" query={await searchParams} />;
}
