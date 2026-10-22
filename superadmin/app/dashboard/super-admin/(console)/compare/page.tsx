import { ComparePage } from "@/app/Pages/Dashboard/Console/consolePages";

export const metadata = { title: "Compare dealers" };

export default async function Page({ searchParams }: PageProps<"/dashboard/super-admin/compare">) {
  const { ids } = await searchParams;
  const list = (Array.isArray(ids) ? ids[0] : ids)?.split(",").filter(Boolean) ?? [];
  return <ComparePage role="super-admin" ids={[...new Set(list)]} />;
}
