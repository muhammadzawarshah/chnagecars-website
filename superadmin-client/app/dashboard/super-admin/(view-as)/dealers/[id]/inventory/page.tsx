import { DealerInventoryPage } from "@/app/Pages/Dashboard/Dealer/dealerPages";

export const metadata = { title: "Inventory" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DealerInventoryPage dealerId={id} basePath={`/dashboard/super-admin/dealers/${id}`} />;
}
