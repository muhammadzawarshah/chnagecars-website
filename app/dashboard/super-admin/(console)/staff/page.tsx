import { StaffPage } from "@/app/Pages/Dashboard/Console/consolePages";

export const metadata = { title: "Admins & staff" };

export default function Page() {
  return <StaffPage role="super-admin" />;
}
