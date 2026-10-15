import { BlogEditPage } from "@/app/Pages/Dashboard/Console/BlogPages";

export const metadata = { title: "Edit blog" };
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ saved?: string }> }) {
  return <BlogEditPage id={(await params).id} justCreated={(await searchParams).saved === "1"} />;
}
