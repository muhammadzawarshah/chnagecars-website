import { BlogsPage } from "@/app/Pages/Dashboard/Console/BlogPages";
import type { ConsoleQuery } from "@/app/lib/dashboard/console";

export const metadata = { title: "Blogs" };
export default async function Page({ searchParams }: { searchParams: Promise<ConsoleQuery> }) {
  return <BlogsPage query={await searchParams} />;
}
