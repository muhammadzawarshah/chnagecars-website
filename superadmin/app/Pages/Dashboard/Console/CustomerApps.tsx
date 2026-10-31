"use client"

import { useActionState } from "react"
import { manageCustomerApp } from "@/app/lib/dashboard/customer-app-actions"
import Card from "../ui/Card"
import PageHeader from "../ui/PageHeader"
import { button, input } from "../ui/format"

export type CustomerApp = { id: string; name: string; dealerIds: string[]; resetUrl: string | null; enabled: boolean }
function AppStatus({ app }: { app: CustomerApp }) {
    const [state, action, pending] = useActionState(manageCustomerApp, {})
    return <form action={action} className="mt-3 grid gap-2">
        <input type="hidden" name="action" value="status" /><input type="hidden" name="id" value={app.id} /><input type="hidden" name="enabled" value={String(!app.enabled)} />
        <button className={button.outline} disabled={pending}>{pending ? "Updating…" : app.enabled ? "Disable app" : "Enable app"}</button>
        {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
        {state.success && <p role="status" className="text-sm text-green-700">{state.success}</p>}
    </form>
}
export default function CustomerApps({ apps }: { apps: CustomerApp[] }) {
    const [state, action, pending] = useActionState(manageCustomerApp, {})
    return <div>
        <PageHeader title="Customer apps" subtitle="Register branded dealer apps with independent customer accounts." />
        <div className="grid items-start gap-5 lg:grid-cols-2">
            <Card title="Register a dealer app">
                <form action={action} className="grid gap-4">
                    <input type="hidden" name="action" value="create" />
                    <label className="grid gap-2 text-sm font-bold">App name<input className={input} name="name" required maxLength={120} disabled={pending} /></label>
                    <label className="grid gap-2 text-sm font-bold">App ID<input className={input} name="id" placeholder="dealer-a" required pattern="[a-z0-9][a-z0-9-]{2,63}" maxLength={64} disabled={pending} /></label>
                    <label className="grid gap-2 text-sm font-bold">Dealer IDs<input className={input} name="dealerIds" placeholder="3490, 3491" required disabled={pending} /><span className="font-normal text-gray-600">Use the approved dealer IDs from the Dealers section. This app will show their inventory.</span></label>
                    <label className="grid gap-2 text-sm font-bold">Password reset URL<input className={input} name="resetUrl" type="url" placeholder="https://dealer.example.com/reset-password" required maxLength={2000} disabled={pending} /><span className="font-normal text-gray-600">Use this app’s HTTPS reset page or universal link, configured to submit resets through its own API base URL.</span></label>
                    {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
                    {state.success && <p role="status" className="text-sm text-green-700">{state.success}</p>}
                    <button className={button.gold} disabled={pending}>{pending ? "Registering…" : "Register app"}</button>
                </form>
            </Card>
            <div className="grid gap-4">{apps.map(app => <Card key={app.id} title={app.name}>
                <p className="text-sm">{app.enabled ? "Active" : "Disabled"} · {app.id}</p>
                <p className="mt-2 break-all text-sm text-gray-600">API base: {app.id === "changecars" ? "/api/v1" : `/api/v1/apps/${app.id}`}</p>
                {app.dealerIds.length > 0 && <p className="mt-2 text-sm">Dealers: {app.dealerIds.join(", ")}</p>}
                {app.id !== "changecars" && <AppStatus app={app} />}
            </Card>)}</div>
        </div>
    </div>
}
