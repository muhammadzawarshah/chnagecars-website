import { consoleGet, record, PageData, requireSuperAdmin, text } from "@/app/lib/dashboard/console"
import { makeCsv } from "@/app/lib/dashboard/csv"
import { LEADS_ENABLED } from "@/app/lib/dashboard/features"

const definitions = {
    dealers: { path: "/admin/dealers", columns: ["id", "name", "email", "city", "province", "status", "plan"] },
    vehicles: { path: "/admin/vehicles", columns: ["id", "title", "dealerId", "status", "price", "colour", "latitude", "longitude"] },
    customers: { path: "/admin/users", columns: ["id", "firstName", "lastName", "email", "status"] },
    leads: { path: "/admin/console/leads", columns: ["id", "name", "stage", "source", "createdAt", "dealer"] },
    audit: { path: "/admin/audit-logs", columns: ["id", "actorId", "actorRole", "action", "entityType", "entityId", "createdAt"] },
} as const

export async function GET(request: Request) {
    await requireSuperAdmin()
    const query = new URL(request.url).searchParams
    const kind = query.get("kind") ?? ""
    if (!Object.hasOwn(definitions, kind) || (kind === "leads" && !LEADS_ENABLED)) return new Response("Invalid export type", { status: 400 })
    const definition = definitions[kind as keyof typeof definitions]
    const page = Number(query.get("page") || "1")
    if (!Number.isSafeInteger(page) || page < 1 || page > 10000) return new Response("Invalid page", { status: 400 })
    const result = await consoleGet<PageData>(`${definition.path}?page=${page}&pageSize=100${kind === "customers" ? "&role=CUSTOMER" : ""}`)
    const rows = result.data.map(row => definition.columns.map(key => key === "dealer" ? text(record(row[key]).name) : row[key]))
    return new Response(makeCsv([...definition.columns], rows), { headers: {
        "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${kind}-page-${page}.csv"`,
        "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    } })
}
