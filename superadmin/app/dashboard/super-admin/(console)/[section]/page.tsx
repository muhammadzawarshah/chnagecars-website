import { ManagementPage } from "@/app/Pages/Dashboard/Console/ManagementPages";
import type { ConsoleQuery } from "@/app/lib/dashboard/console";

export default async function Page({ params, searchParams }: { params: Promise<{ section: string }>, searchParams: Promise<ConsoleQuery> }) {
  return <ManagementPage section={(await params).section} query={await searchParams} />;
}
