import CustomerApps, { type CustomerApp } from "@/app/Pages/Dashboard/Console/CustomerApps"
import { consoleGet } from "@/app/lib/dashboard/console"

export const metadata = { title: "Customer apps" }
export default async function Page() {
    return <CustomerApps apps={await consoleGet<CustomerApp[]>("/admin/customer-apps")} />
}
