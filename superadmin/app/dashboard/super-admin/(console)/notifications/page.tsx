import NotificationComposer from "@/app/Pages/Dashboard/Console/NotificationComposer"
import { consoleGet } from "@/app/lib/dashboard/console"

export const metadata = { title: "Notifications" }
export default async function Page() {
    const [status, apps] = await Promise.all([
        consoleGet<{ pushConfigured: boolean }>("/admin/notifications/status"),
        consoleGet<{ id: string; name: string; enabled: boolean }[]>("/admin/customer-apps"),
    ])
    return <NotificationComposer pushConfigured={status.pushConfigured} apps={apps.filter(app => app.enabled)} />
}
