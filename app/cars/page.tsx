import { redirect } from "next/navigation";

// The car listing now uses the app-style Search screen; every /cars link (with its filters) opens /search.
// The previous listing page is kept in Pages/CarListing.
export default async function Page({ searchParams }: PageProps<"/cars">) {
  const raw = await searchParams;
  const query = new URLSearchParams(Object.entries(raw).flatMap(([key, value]) => (typeof value === "string" ? [[key, value]] : []))).toString();
  redirect(query ? `/search?${query}` : "/search");
}
