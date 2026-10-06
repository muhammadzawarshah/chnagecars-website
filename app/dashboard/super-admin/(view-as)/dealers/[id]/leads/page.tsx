import { DealerLeadsPage } from "@/app/Pages/Dashboard/Dealer/dealerPages";

export const metadata = { title: "Leads" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DealerLeadsPage dealerId={id} basePath={`/dashboard/super-admin/dealers/${id}`} />;
}
