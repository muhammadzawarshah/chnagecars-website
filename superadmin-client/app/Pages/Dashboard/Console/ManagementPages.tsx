import Link from "next/link"
import { notFound } from "next/navigation"
import { ConsoleQuery, consoleGet, list, paginationQuery, PageData, queryValue, record, Row, text } from "@/app/lib/dashboard/console"
import Card from "../ui/Card"
import DealerLogo from "../ui/DealerLogo"
import PageHeader from "../ui/PageHeader"
import StatusBadge from "../ui/StatusBadge"
import { button, formatRand, input, table } from "../ui/format"
import ManagementForm from "./ManagementForm"
import VehicleReview from "./VehicleReview"
import DealerReview from "./DealerReview"
import Icon from "../ui/Icon"
import StaffConsole, { StaffMember } from "./StaffConsole"

const base = "/dashboard/super-admin"
const statusOptions = (items: string[]) => items.map(value => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)
function Field({ name, label, value = "", type = "text", required = true }: { name: string, label: string, value?: string, type?: string, required?: boolean }) {
    return <label className="grid gap-1 text-sm">{label}<input className={input} name={name} type={type} defaultValue={value} required={required} /></label>
}
function Select({ name, label, options, value }: { name: string, label: string, options: string[], value?: string }) {
    return <label className="grid gap-1 text-sm">{label}<select className={input} name={name} defaultValue={value}>{statusOptions(options)}</select></label>
}
function Summary({ values }: { values: Row }) {
    return <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{Object.entries(values).map(([name, value]) => <Card key={name}><p className="text-sm text-[#6b6862]">{name.replace(/([A-Z])/g, " $1")}</p><strong className="text-xl">{text(value) || "—"}</strong></Card>)}</div>
}
type Column = { label: string, value: (row: Row) => React.ReactNode }
function DataTable({ rows, columns }: { rows: Row[], columns: Column[] }) {
    return <Card><div className={table.wrap}><table className={table.table}><thead><tr>{columns.map(c => <th key={c.label} className={table.head}>{c.label}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={text(row.id) || text(row.revision) || i} className={table.row}>{columns.map(c => <td key={c.label} className={table.cell}>{c.value(row)}</td>)}</tr>)}</tbody></table>{!rows.length && <p className="p-5 text-sm">No records match these filters.</p>}</div></Card>
}
const col = (key: string, label = key): Column => ({ label, value: row => text(row[key]) || "—" })
const date = (key: string, label: string): Column => ({ label, value: row => text(row[key]) ? <span className="whitespace-nowrap">{new Date(text(row[key])).toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span> : "—" })
function Pager({ page, query, section }: { page: PageData, query: ConsoleQuery, section: string }) {
    const href = (n: number) => { const p = new URLSearchParams(); for (const [k, v] of Object.entries(query)) if (typeof v === "string" && !["page", "notice"].includes(k)) p.set(k, v); p.set("page", String(n)); return `${base}/${section}?${p}` }
    return <div className="flex items-center justify-between gap-3 text-sm"><span>{page.meta.total.toLocaleString()} records · Page {page.meta.page} of {page.meta.pageCount}</span><div className="flex gap-2">{page.meta.page > 1 && <Link className={button.outline} href={href(page.meta.page - 1)}>Previous</Link>}{page.meta.page < page.meta.pageCount && <Link className={button.outline} href={href(page.meta.page + 1)}>Next</Link>}</div></div>
}
function Search({ query, statuses }: { query: ConsoleQuery, statuses?: string[] }) {
    return <form className="flex flex-wrap gap-3">{queryValue(query, "dealerId") && <input type="hidden" name="dealerId" value={queryValue(query, "dealerId")} />}<input aria-label="Search" className={input} name="q" placeholder="Search records" defaultValue={queryValue(query, "q")} maxLength={100} />{statuses && <select aria-label="Status" className={input} name="status" defaultValue={queryValue(query, "status")}><option value="">All statuses</option>{statusOptions(statuses)}</select>}<button className={button.outline}>Search</button></form>
}
const link = (kind: string, label: string): Column => ({ label: "Manage", value: row => <Link className={button.small} href={`${base}/manage/${kind}/${text(row.id)}`}>{label}</Link> })

export async function ManagementPage({ section, query }: { section: string, query: ConsoleQuery }) {
    let content: React.ReactNode, title: string, subtitle = "Live platform data. Changes are checked by the API and recorded in the audit trail."
    if (["dealers", "listings", "staff", "customers", "leads", "audit"].includes(section)) {
        title = ({ dealers: "Dealers", listings: "Listings & review queue", staff: "Admins & staff", customers: "Customers", leads: "Leads & enquiries", audit: "Audit trail" } as Record<string, string>)[section]
        const options: Record<string, string[]> = { dealers: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"], listings: ["DRAFT", "PENDING_REVIEW", "APPROVED", "PUBLISHED", "RESERVED", "SOLD", "REJECTED", "SUSPENDED", "ARCHIVED"], staff: ["ACTIVE", "SUSPENDED"], customers: ["ACTIVE", "SUSPENDED", "DELETED"] }
        const status = queryValue(query, "status")
        const extras: Record<string, string> = {}
        if (options[section]?.includes(status)) extras.status = status
        if (section === "customers") extras.role = "CUSTOMER"
        const dealerId = section === "listings" ? queryValue(query, "dealerId") : ""
        if (dealerId && /^[0-9a-f-]{36}$/i.test(dealerId)) extras.dealerId = dealerId
        const path = ({ dealers: "/admin/dealers", listings: "/admin/vehicles", staff: "/admin/users", customers: "/admin/users", leads: "/admin/console/leads", audit: "/admin/audit-logs" } as Record<string, string>)[section]
        if (section === "staff") {
            // The website adapter returns only administrator accounts.
            const [staff, me] = await Promise.all([consoleGet<StaffMember[]>("/web/dashboard/staff"), consoleGet<Row>("/auth/me")])
            return <StaffConsole staff={staff} meId={text(me.id)} />
        } else {
            if (section === "audit") extras.action = queryValue(query, "q").slice(0, 80)
            const data = await consoleGet<PageData>(path + paginationQuery(section === "audit" ? { ...query, q: undefined } : query, extras))
            const columns: Column[] = section === "dealers" ? [{ label: "Dealer", value: row => <div className="flex items-center gap-3"><DealerLogo name={text(row.name)} src={text(row.logoUrl)} /><span className="font-bold">{text(row.name)}</span></div> }, col("city", "City"), col("plan", "Plan"), col("status", "Status"), link("dealers", "Review dealer")]
                : section === "listings" ? [
                    // eslint-disable-next-line @next/next/no-img-element -- dealer and feed photos from any host
                    { label: "Photo", value: r => text(r.primaryImageUrl) ? <img src={text(r.primaryImageUrl)} alt="" className="h-12 w-16 rounded-md object-cover" /> : <span className="text-xs text-[#6b6862]">No photo</span> },
                    { label: "Vehicle", value: r => <Link href={`${base}/manage/vehicles/${text(r.id)}`} className="font-bold text-ink no-underline hover:text-gold">{text(r.title)}</Link> },
                    { label: "Dealer", value: r => text(record(r.dealer).name) || "—" },
                    { label: "Year", value: r => <span className="whitespace-nowrap">{text(r.year) || "—"}</span> },
                    { label: "Mileage", value: r => typeof r.mileage === "number" ? <span className="whitespace-nowrap">{r.mileage.toLocaleString("en-ZA")} km</span> : "—" },
                    { label: "Price", value: r => typeof r.price === "number" ? <span className="whitespace-nowrap">{formatRand(r.price)}</span> : "—" },
                    { label: "Status", value: r => <StatusBadge status={text(r.status).replaceAll("_", " ").toLowerCase()} /> },
                    date("updatedAt", "Updated"),
                    link("vehicles", "Review listing"),
                ]
                : section === "customers" ? [{ label: "Name", value: r => `${text(r.firstName)} ${text(r.lastName)}` }, col("email", "Email"), col("status", "Status"), link("users", "Manage account")]
                : section === "leads" ? [col("name", "Customer"), { label: "Dealer", value: r => text(record(r.dealer).name) }, { label: "Vehicle", value: r => text(record(r.vehicle).title) || "General enquiry" }, col("stage", "Stage"), col("source", "Source"), col("phone", "Phone"), date("createdAt", "Received"), link("leads", "Manage lead")]
                : [col("actorRole", "Actor role"), col("actorId", "Actor ID"), col("action", "Action"), col("entityType", "Record type"), col("entityId", "Record ID"), date("createdAt", "Time"), { label: "Changes", value: r => <details><summary className="cursor-pointer">Previous / new values</summary><pre className="max-w-96 overflow-auto text-xs">{JSON.stringify({ before: r.before, after: r.after }, null, 2)}</pre></details> }]
            const dealer = extras.dealerId ? await consoleGet<Row>(`/admin/dealers/${extras.dealerId}`) : undefined
            content = <>{dealer && <Card><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><DealerLogo name={text(dealer.name)} src={text(dealer.logoUrl)} /><div><h2 className="m-0 text-base font-bold">{text(dealer.name)}</h2><p className="m-0 mt-1 text-sm text-[#6b6862]">Showing this dealer’s listings only</p></div></div><Link href={`${base}/manage/dealers/${text(dealer.id)}`} className={button.outline}><Icon name="back" size={16} />Back to dealer</Link></div></Card>}<Search query={query} statuses={options[section]} /><DataTable rows={data.data} columns={columns} /><Pager page={data} query={query} section={section} /></>
            if (section === "leads") subtitle = "Paginated dealer enquiries and assignment status. Dealer teams retain their existing lead workflows."
            if (section === "audit") subtitle = "Who changed what, when, and the previous and new values."
        }
    } else if (section === "quality") {
        title = "Data quality"
        const data = await consoleGet<Row>("/admin/console/quality")
        content = <><Summary values={record(data.counts)} /><h2 className="text-lg font-bold">Colour names</h2><DataTable rows={list(data.colours)} columns={[col("name", "Colour"), col("cars", "Cars")]} /><h2 className="text-lg font-bold">Listings needing attention (latest 50)</h2><DataTable rows={list(data.samples)} columns={[col("title", "Vehicle"), col("colour", "Colour"), col("price", "Price"), col("latitude", "Latitude"), col("longitude", "Longitude"), link("vehicles", "Review")]} /><h2 className="text-lg font-bold">Possible duplicate stock numbers (top 50)</h2><DataTable rows={list(data.duplicateStockNumbers)} columns={[col("dealerId", "Dealer ID"), col("stockNumber", "Stock number"), col("count", "Cars")]} /></>
    } else if (section === "snapshots") {
        title = "App snapshots"
        const [manifest, history] = await Promise.all([consoleGet<Row>("/vehicle-filters/manifest"), consoleGet<Row[]>("/admin/console/snapshots")])
        content = <><Summary values={{ cars: manifest.total, generatedAt: manifest.generated_at, compressedBytes: manifest.compressed_bytes }} /><Card><h2 className="font-bold">Current revision</h2><p className="break-all text-sm">{text(manifest.revision)}</p><p className="break-all text-xs">SHA256: {text(manifest.sha256)}</p><ManagementForm action="refresh-snapshot" label="Refresh snapshot" /></Card><DataTable rows={history} columns={[col("revision", "Revision"), col("total", "Cars"), date("generatedAt", "Generated")]} /></>
    } else if (section === "imports" || section === "system") {
        title = section === "imports" ? "Feed imports & images" : "Background processing"
        const [health, events] = await Promise.all([consoleGet<Row>("/admin/system/outbox"), consoleGet<PageData>("/admin/system/outbox/events" + paginationQuery(query))])
        let feed: React.ReactNode
        if (section === "imports") {
            const data = await consoleGet<Row>("/admin/console/imports")
            feed = <><Summary values={{ importedVehicles: data.total, ...record(data.images) }} /><p className="text-sm">{text(data.note)}</p><DataTable rows={list(data.latest)} columns={[col("title", "Vehicle"), col("status", "Status"), date("updatedAt", "Vehicle updated"), link("vehicles", "Review")]} /></>
        }
        content = <>{feed}<Summary values={{ ...record(health.byStatus), oldestPendingSeconds: health.oldestPendingAgeSeconds }} /><h2 className="text-lg font-bold">Failed background events</h2><DataTable rows={events.data} columns={[col("type", "Type"), col("attempts", "Attempts"), col("lastError", "Last error"), date("createdAt", "Created"), { label: "Retry", value: row => <ManagementForm action="retry-event" id={text(row.id)} label="Retry event" /> }]} /><Pager page={events} query={query} section={section} /></>
    } else if (section === "settings") {
        title = "Platform settings"
        const data = await consoleGet<Row>("/admin/console/settings")
        subtitle = text(data.mode)
        content = <Summary values={Object.fromEntries(Object.entries(data).filter(([key]) => key !== "mode"))} />
    } else if (section === "catalogue") {
        title = "Vehicle catalogue"
        const [makes, categories] = await Promise.all([consoleGet<Row[]>("/admin/catalogue/makes"), consoleGet<Row[]>("/admin/catalogue/categories")])
        const selected = queryValue(query, "make")
        const models = makes.some(x => text(x.id) === selected) ? await consoleGet<Row[]>(`/admin/catalogue/makes/${selected}/models`) : []
        const modelId = queryValue(query, "model")
        const selectedModel = models.find(x => text(x.id) === modelId)
        const variants = selectedModel ? await consoleGet<Row[]>(`/admin/catalogue/models/${modelId}/variants`) : []
        const modelColumns: Column[] = [col("name", "Model"), { label: "Variants", value: r => <Link className={button.small} href={`${base}/catalogue?make=${selected}&model=${text(r.id)}`}>View variants</Link> }, { label: "Edit", value: r => <ManagementForm action="model-update" id={text(r.id)}><Field name="name" label="Name" value={text(r.name)} /><label><input name="isActive" type="checkbox" defaultChecked={r.isActive === true} /> Active</label></ManagementForm> }]
        const variantFields = (r: Row) => <><Field name="name" label="Variant name" value={text(r.name)} /><Field name="yearFrom" label="Year from" type="number" value={text(r.yearFrom)} /><Field name="basePrice" label="Base price (R)" type="number" value={text(r.basePrice) || "0"} /><label><input name="isActive" type="checkbox" defaultChecked={r.isActive !== false} /> Active</label></>
        content = <><Card><h2 className="mb-3 text-lg font-bold">Add make</h2><ManagementForm action="make-create"><Field name="name" label="Make name" /></ManagementForm></Card><DataTable rows={makes} columns={[col("name", "Make"), col("isActive", "Active"), { label: "Models", value: r => <Link className={button.small} href={`${base}/catalogue?make=${text(r.id)}`}>View models</Link> }, { label: "Edit", value: r => <ManagementForm action="make-update" id={text(r.id)}><Field name="name" label="Name" value={text(r.name)} /><label><input name="isActive" type="checkbox" defaultChecked={r.isActive === true} /> Active</label></ManagementForm> }]} />{selected && makes.some(x => text(x.id) === selected) && <><Card><h2 className="mb-3 text-lg font-bold">Add model</h2><ManagementForm action="model-create"><input type="hidden" name="makeId" value={selected} /><Field name="name" label="Model name" /></ManagementForm></Card><DataTable rows={models} columns={modelColumns} /></>}{selectedModel && <><Card><h2 className="mb-3 font-bold">Add variant for {text(selectedModel.name)}</h2><ManagementForm action="variant-create"><input type="hidden" name="modelId" value={modelId} />{variantFields({})}</ManagementForm></Card><DataTable rows={variants} columns={[col("name", "Variant"), { label: "Edit", value: r => <ManagementForm action="variant-update" id={text(r.id)}>{variantFields(r)}</ManagementForm> }]} /></>}<Card><h2 className="mb-3 font-bold">Add body category</h2><ManagementForm action="category-create"><Field name="name" label="Name" /><label><input name="isActive" type="checkbox" defaultChecked /> Active</label></ManagementForm></Card><DataTable rows={categories} columns={[col("name", "Category"), { label: "Edit", value: r => <ManagementForm action="category-update" id={text(r.id)}><Field name="name" label="Name" value={text(r.name)} /><label><input name="isActive" type="checkbox" defaultChecked={r.isActive === true} /> Active</label></ManagementForm> }]} /></>
    } else if (section === "content") {
        title = "Content & promotions"
        const [faqs, pages, promotions] = await Promise.all([consoleGet<Row[]>("/admin/faqs"), consoleGet<Row[]>("/admin/pages"), consoleGet<Row[]>("/admin/promotions")])
        const publish = (kind: "page"): Column => ({ label: "Publish", value: r => <ManagementForm action={`${kind}-status`} id={text(r.id)}><Select name="status" label="Status" options={["DRAFT", "PUBLISHED", "ARCHIVED"]} value={text(r.status)} /></ManagementForm> })
        content = <><Card><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="m-0 text-base font-bold">Blogs</h2><p className="m-0 mt-1 text-sm text-[#6b6862]">Blog articles have their own editor with publishing, categories and SEO.</p></div><Link href={`${base}/blogs`} className={button.gold}>Open blogs</Link></div></Card>
            <Card><h2 className="mb-3 font-bold">Add FAQ</h2><ManagementForm action="faq-create"><Field name="question" label="Question" /><Field name="answer" label="Answer" /><label><input type="checkbox" name="isActive" defaultChecked /> Active</label></ManagementForm></Card><DataTable rows={faqs} columns={[col("question", "FAQ"), { label: "Edit", value: r => <ManagementForm action="faq-update" id={text(r.id)}><Field name="question" label="Question" value={text(r.question)} /><Field name="answer" label="Answer" value={text(r.answer)} /><label><input name="isActive" type="checkbox" defaultChecked={r.isActive === true} /> Active</label></ManagementForm> }]} />
            <Card><h2 className="mb-3 font-bold">Create draft page</h2><ManagementForm action="page-create"><Field name="title" label="Title" /><Field name="slug" label="URL slug" /><Field name="body" label="Body" /></ManagementForm></Card><DataTable rows={pages} columns={[col("title", "Page"), col("status", "Status"), publish("page")]} /><Card><h2 className="mb-3 font-bold">Create promotion</h2><ManagementForm action="promotion-create"><Field name="title" label="Title" /><Field name="startsAt" label="Starts (UTC)" type="datetime-local" /><Field name="endsAt" label="Ends (UTC)" type="datetime-local" /></ManagementForm></Card><h2 className="font-bold">Promotions</h2><DataTable rows={promotions} columns={[col("title", "Promotion"), col("isActive", "Active"), date("startsAt", "Starts"), date("endsAt", "Ends"), { label: "Edit", value: r => <ManagementForm action="promotion-update" id={text(r.id)}><Field name="title" label="Title" value={text(r.title)} /><label><input name="isActive" type="checkbox" defaultChecked={r.isActive === true} /> Active</label></ManagementForm> }]} /></>
    } else if (section === "reports") {
        title = "Reports"
        const stats = await consoleGet<Row>("/admin/stats")
        content = <><Summary values={record(stats.dealers)} /><Summary values={record(record(stats.vehicles).byStatus)} /><Summary values={record(stats.enquiriesLast30Days)} /><Summary values={record(stats.bidding)} /><Card><h2 className="mb-3 font-bold">Export records</h2><p className="text-sm">CSV exports are limited to 100 records per page. Choose the page to export.</p><form action="/api/super-admin/export" className="flex flex-wrap gap-3"><select name="kind" className={input} aria-label="Export type">{statusOptions(["dealers", "vehicles", "customers", "leads", "audit"])}</select><Field name="page" label="Page" type="number" value="1" /><button className={button.gold}>Download CSV</button></form></Card><DataTable rows={list(stats.topMakes)} columns={[col("make", "Make"), col("listings", "Listings")]} /></>
    } else notFound()
    return <div className="grid gap-5"><PageHeader title={title} subtitle={subtitle} />{content}</div>
}

export async function ManagementDetail({ kind, id }: { kind: string, id: string }) {
    if (!["dealers", "vehicles", "users", "leads"].includes(kind) || !/^[0-9a-f-]{36}$/i.test(id)) notFound()
    const data = await consoleGet<Row>(kind === "leads" ? `/admin/console/leads/${id}` : `/admin/${kind}/${id}`)
    if (kind === "vehicles") return <VehicleReview data={data} />
    if (kind === "dealers") {
        const stock = await consoleGet<PageData>(`/admin/vehicles?dealerId=${id}&pageSize=2&page=1`)
        return <DealerReview data={data} vehicles={stock.data} total={stock.meta.total} />
    }
    const heading = text(data.name) || text(data.title) || `${text(data.firstName)} ${text(data.lastName)}`
    let controls: React.ReactNode
    if (kind === "leads") controls = <>
        <ManagementForm action="lead-assign" id={id}><label className="grid gap-1 text-sm">Assigned to<select name="memberId" className={input} defaultValue={text(data.assignedToId)}><option value="">Unassigned</option>{list(data.members).map(member => <option key={text(member.id)} value={text(member.id)}>{text(record(member.user).firstName)} {text(record(member.user).lastName)}</option>)}</select></label></ManagementForm>
        <ManagementForm action="lead-stage" id={id}><Select name="stage" label="Stage" value={text(data.stage)} options={["NEW", "CONTACTED", "QUALIFIED", "NEGOTIATION", "OFFER_SENT", "WON", "LOST"]} /><Field name="reason" label="Reason (lost)" required={false} /></ManagementForm>
        <h2 className="font-bold">Contact history</h2><DataTable rows={list(data.activities)} columns={[col("type", "Type"), col("note", "Note"), date("createdAt", "Time")]} />
    </>
    else if (kind === "users") controls = <>
        <ManagementForm action="user-status" id={id}><Select name="status" label="Status" options={["ACTIVE", "SUSPENDED"]} value={text(data.status)} /><Field name="reason" label="Reason" required={false} /></ManagementForm>
        {!data.dealerMember && data.role !== "SUPER_ADMIN" && <ManagementForm action="user-role" id={id}><Select name="role" label="Role" options={["CUSTOMER", "ADMIN"]} value={text(data.role)} /></ManagementForm>}
        <p className="text-sm">Suspension and role changes revoke sessions. You cannot change your own account here.</p>
    </>
    else notFound()
    return <div className="grid gap-5"><PageHeader title={heading} subtitle={`Current status: ${text(data.status) || text(data.stage)} · ${id}`} /><Link href={`${base}/${kind === "users" ? data.role === "CUSTOMER" ? "customers" : "staff" : kind === "leads" ? "leads" : "dealers"}`} className={button.outline}>Back to list</Link><Summary values={Object.fromEntries(["email", "phone", "city", "province", "role", "colour", "latitude", "longitude", "price", "activeSessions"].filter(k => data[k] !== undefined).map(k => [k, data[k]]))} /><Card><div className="grid gap-5">{controls}</div></Card></div>
}
