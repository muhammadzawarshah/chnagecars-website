"use client"

import { useActionState, useState } from "react"
import { sendNotification } from "@/app/lib/dashboard/notification-actions"
import Card from "../ui/Card"
import PageHeader from "../ui/PageHeader"
import { button, input } from "../ui/format"

export default function NotificationComposer({ pushConfigured, apps }: { pushConfigured: boolean; apps: { id: string; name: string }[] }) {
    const [state, action, pending] = useActionState(sendNotification, {})
    const [audience, setAudience] = useState("customers")
    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    return <div>
        <PageHeader title="Notifications" subtitle="Send announcements to Change Cars customers and dealers." />
        {!pushConfigured && <p role="status" className="mb-5 rounded-xl bg-amber-50 p-4 text-sm">Phone push needs Firebase configuration. Users can still receive notifications in the app and over their live connection.</p>}
        <div className="grid gap-5 lg:grid-cols-2">
            <Card title="New notification">
                <form action={action} className="grid gap-4">
                    <label className="grid gap-2 text-sm font-bold">App
                        <select name="appId" className={input} defaultValue="changecars" disabled={pending}>
                            {apps.map(app => <option key={app.id} value={app.id}>{app.name}</option>)}
                        </select>
                    </label>
                    <label className="grid gap-2 text-sm font-bold">Audience
                        <select name="audience" className={input} value={audience} onChange={e => setAudience(e.target.value)} disabled={pending}>
                            <option value="customers">All active customers</option><option value="dealers">All active dealers</option>
                            <option value="all">All active customers and dealers</option><option value="selected">Selected users</option>
                        </select>
                    </label>
                    {audience === "selected" && <label className="grid gap-2 text-sm font-bold">User IDs (separated by commas or new lines)<textarea className={input} name="userIds" required rows={3} disabled={pending} /></label>}
                    <label className="grid gap-2 text-sm font-bold">Title<input name="title" className={input} required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} disabled={pending} /></label>
                    <label className="grid gap-2 text-sm font-bold">Message<textarea name="body" className={input} required maxLength={1000} rows={6} value={body} onChange={e => setBody(e.target.value)} disabled={pending} /></label>
                    {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
                    {state.success && <p role="status" className="text-sm text-green-700">{state.success}</p>}
                    <button className={button.gold} disabled={pending}>{pending ? "Queuing…" : "Send notification"}</button>
                </form>
            </Card>
            <Card title="Preview">
                <div className="rounded-xl border border-gray-200 p-4"><p className="text-xs font-bold text-gray-500">CHANGECARS</p><h3 className="mt-2 break-words font-bold">{title || "Notification title"}</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm">{body || "Your message will appear here."}</p></div>
                <p className="mt-4 text-sm text-gray-600">Connected users receive a live event. Registered Android and iOS devices receive a push notification. Missed notifications remain in the user’s inbox. Sends are recorded in the audit trail.</p>
            </Card>
        </div>
    </div>
}
