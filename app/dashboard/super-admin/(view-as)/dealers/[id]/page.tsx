import { DealerHomePage } from "@/app/Pages/Dashboard/Dealer/dealerPages";

export const metadata = { title: "Overview" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DealerHomePage dealerId={id} basePath={`/dashboard/super-admin/dealers/${id}`} />;
}
