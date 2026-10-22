import { ManagementDetail } from "@/app/Pages/Dashboard/Console/ManagementPages";

export default async function Page({ params }: { params: Promise<{ kind: string, id: string }> }) {
  return <ManagementDetail {...await params} />;
}
