import Form from "next/form"
import Link from "next/link"
import { notFound } from "next/navigation"
import { LEADS_ENABLED } from "@/app/lib/dashboard/features"
import { ConsoleQuery, consoleGet, list, paginationQuery, PageData, queryValue, record, Row, text } from "@/app/lib/dashboard/console"
import Card from "../ui/Card"
import DealerLogo from "../ui/DealerLogo"
import PageHeader from "../ui/PageHeader"
import StatusBadge from "../ui/StatusBadge"
import { button, formatRand, input, table } from "../ui/format"
import ManagementForm from "./ManagementForm"
import FormDialog from "./FormDialog"
import FilterButton from "./FilterButton"
import ImageField from "./ImageField"
import { websiteImage } from "@/app/lib/site"
import VehicleReview from "./VehicleReview"
import DealerReview from "./DealerReview"
import Icon from "../ui/Icon"
import StaffConsole, { StaffMember } from "./StaffConsole"

const base = "/dashboard/super-admin"
// Dealers and vehicles keep their original DealerTrade (numeric) IDs; users and leads use UUIDs.
const uuid = /^[0-9a-f-]{36}$/i
const marketplaceId = /^(?:\d+|[0-9a-f-]{36})$/i
const statusOptions = (items: string[]) => items.map(value => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)
function Field({ name, label, value = "", type = "text", required = true }: { name: string, label: string, value?: string, type?: string, required?: boolean }) {
    return <label className="grid gap-1 text-sm">{label}<input className={input} name={name} type={type} defaultValue={value} required={required} /></label>
}
function Select({ name, label, options, value }: { name: string, label: string, options: string[], value?: string }) {
    return <label className="grid gap-1 text-sm">{label}<select className={input} name={name} defaultValue={value}>{statusOptions(options)}</select></label>
}
function Heading({ title, children }: { title: string, children?: React.ReactNode }) {
    return <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="m-0 text-lg font-bold">{title}</h2>{children}</div>
}
function Area({ name, label, value = "", required = false, rows = 4, hint }: { name: string, label: string, value?: string, required?: boolean, rows?: number, hint?: string }) {
    return <label className="grid gap-1 text-sm"><span className="flex items-baseline justify-between gap-2">{label}{hint && <span className="text-xs text-[#6b6862]">{hint}</span>}</span><textarea className={`${input} h-auto py-2 leading-6`} name={name} defaultValue={value} required={required} rows={rows} /></label>
}
function Check({ name = "isActive", label = "Show on the website", checked = true }: { name?: string, label?: string, checked?: boolean }) {
    return <label className="flex items-center gap-2 text-sm"><input type="checkbox" name={name} defaultChecked={checked} className="size-4 accent-gold" /> {label}</label>
}
// datetime-local in South African time (the actions read it back the same way).
const sastInput = (value: unknown) => text(value) ? new Date(text(value)).toLocaleString("sv-SE", { timeZone: "Africa/Johannesburg" }).replace(" ", "T").slice(0, 16) : ""
function DateField({ name, label, value }: { name: string, label: string, value?: unknown }) {
    return <label className="grid gap-1 text-sm">{label}<input className={input} type="datetime-local" name={name} defaultValue={sastInput(value)} /></label>
}
function Thumb({ src, wide = false }: { src: unknown, wide?: boolean }) {
    // eslint-disable-next-line @next/next/no-img-element -- images from any host
    return text(src) ? <img src={websiteImage(text(src))} alt="" className={`${wide ? "h-12 w-40" : "size-12"} rounded-md border border-[#ebe8e1] bg-[#f7f5f0] object-contain`} /> : <span className="text-xs text-[#6b6862]">No image</span>
}
// Server-rendered on every request, so "now" is the time of the request.
const requestTime = () => Date.now()
function Shown({ active, from, until }: { active: unknown, from?: unknown, until?: unknown }) {
    const now = requestTime(), starts = text(from) ? Date.parse(text(from)) : 0, ends = text(until) ? Date.parse(text(until)) : Infinity
    const state = active !== true ? "off" : starts > now ? "scheduled" : ends <= now ? "ended" : "live"
    return <StatusBadge status={state} />
}
const Delete = ({ action, row, name }: { action: string, row: Row, name: string }) => <FormDialog small danger icon="trash" trigger="Delete" title={`Delete ${name}?`} subtitle={text(row.title) || text(row.name) || text(row.question)} action={action} id={text(row.id)} submitLabel="Delete"><p className="m-0 text-sm text-[#6b6862]">This removes it from the website straight away and cannot be undone.</p></FormDialog>
const Actions = ({ children }: { children: React.ReactNode }) => <div className="flex flex-wrap justify-end gap-1.5">{children}</div>
const PLACEMENTS: [string, string][] = [["HOME_HERO", "Home – top (next to search)"], ["HOME_DEALERS", "Home – under Featured dealers"], ["HOME_BOTTOM", "Home – bottom of the page"]]

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
// Filters apply with a client-side navigation (next/form): only the results change, the page stays put.
function Search({ query, statuses, section }: { query: ConsoleQuery, statuses?: string[], section: string }) {
    const dealerId = queryValue(query, "dealerId"), q = queryValue(query, "q"), status = statuses?.includes(queryValue(query, "status")) ? queryValue(query, "status") : ""
    const applied = [q && `search “${q}”`, status && `status ${status.replaceAll("_", " ")}`].filter(Boolean)
    return <div className="grid gap-3">
        <Form action="" scroll={false} className="flex flex-wrap gap-3">{dealerId && <input type="hidden" name="dealerId" value={dealerId} />}<input aria-label="Search" className={input} name="q" placeholder="Search records" defaultValue={q} maxLength={100} />{statuses && <select aria-label="Status" className={input} name="status" defaultValue={status}><option value="">All statuses</option>{statusOptions(statuses)}</select>}<FilterButton /></Form>
        {applied.length > 0 && <p className="m-0 flex flex-wrap items-center gap-2 rounded-lg bg-[#f7f2e6] px-3 py-2 text-sm"><Icon name="search" size={14} className="text-gold" /><span>Filtered by <strong>{applied.join(" · ")}</strong></span><Link href={`${base}/${section}${dealerId ? `?dealerId=${encodeURIComponent(dealerId)}` : ""}`} scroll={false} className="font-bold text-gold">Clear filters</Link></p>}
    </div>
}
const link = (kind: string, label: string): Column => ({ label: "Manage", value: row => <Link className={button.small} href={`${base}/manage/${kind}/${text(row.id)}`}>{label}</Link> })

export async function ManagementPage({ section, query }: { section: string, query: ConsoleQuery }) {
    let content: React.ReactNode, title: string, subtitle = "Live platform data. Changes are checked by the API and recorded in the audit trail."
    if (["dealers", "listings", "staff", "customers", ...(LEADS_ENABLED ? ["leads"] : []), "audit"].includes(section)) {
        title = ({ dealers: "Dealers", listings: "Listings & review queue", staff: "Admins & staff", customers: "Customers", leads: "Leads & enquiries", audit: "Audit trail" } as Record<string, string>)[section]
        const options: Record<string, string[]> = { dealers: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"], listings: ["DRAFT", "PENDING_REVIEW", "APPROVED", "PUBLISHED", "RESERVED", "SOLD", "REJECTED", "SUSPENDED", "ARCHIVED"], staff: ["ACTIVE", "SUSPENDED"], customers: ["ACTIVE", "SUSPENDED", "DELETED"] }
        const status = queryValue(query, "status")
        const extras: Record<string, string> = {}
        if (options[section]?.includes(status)) extras.status = status
        if (section === "customers") extras.role = "CUSTOMER"
        const dealerId = section === "listings" ? queryValue(query, "dealerId") : ""
        if (dealerId && marketplaceId.test(dealerId)) extras.dealerId = dealerId
        const path = ({ dealers: "/admin/dealers", listings: "/admin/vehicles", staff: "/admin/users", customers: "/admin/users", leads: "/admin/console/leads", audit: "/admin/audit-logs" } as Record<string, string>)[section]
        if (section === "staff") {
            // The website adapter returns only administrator accounts.
            const [staff, me] = await Promise.all([consoleGet<StaffMember[]>("/web/dashboard/staff"), consoleGet<Row>("/auth/me")])
            return <StaffConsole staff={staff} meId={text(me.id)} />
        } else {
            if (section === "audit") extras.action = queryValue(query, "q").slice(0, 80)
            // The listings and the dealer they are filtered by load together.
            const [data, dealer] = await Promise.all([consoleGet<PageData>(path + paginationQuery(section === "audit" ? { ...query, q: undefined } : query, extras)), extras.dealerId ? consoleGet<Row>(`/admin/dealers/${extras.dealerId}`) : undefined])
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
            content = <>{dealer && <Card><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><DealerLogo name={text(dealer.name)} src={text(dealer.logoUrl)} /><div><h2 className="m-0 text-base font-bold">{text(dealer.name)}</h2><p className="m-0 mt-1 text-sm text-[#6b6862]">Showing this dealer’s listings only</p></div></div><Link href={`${base}/manage/dealers/${text(dealer.id)}`} className={button.outline}><Icon name="back" size={16} />Back to dealer</Link></div></Card>}<Search query={query} statuses={options[section]} section={section} /><DataTable rows={data.data} columns={columns} /><Pager page={data} query={query} section={section} /></>
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
        const active = (r: Row = {}, fallback = false) => <label className="flex items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={r.isActive === undefined ? fallback : r.isActive === true} /> Active</label>
        const edit = (title: string, action: string, r: Row, fields: React.ReactNode) => <FormDialog small trigger="Edit" title={title} subtitle={text(r.name)} action={action} id={text(r.id)}>{fields}</FormDialog>
        const modelColumns: Column[] = [col("name", "Model"), { label: "Variants", value: r => <Link className={button.small} href={`${base}/catalogue?make=${selected}&model=${text(r.id)}`}>View variants</Link> }, { label: "Edit", value: r => edit("Edit model", "model-update", r, <><Field name="name" label="Name" value={text(r.name)} />{active(r)}</>) }]
        const variantFields = (r: Row) => <><Field name="name" label="Variant name" value={text(r.name)} /><Field name="yearFrom" label="Year from" type="number" value={text(r.yearFrom)} /><Field name="basePrice" label="Base price (R)" type="number" value={text(r.basePrice) || "0"} />{active(r, true)}</>
        const makeName = text(makes.find(x => text(x.id) === selected)?.name)
        content = <>
            <Heading title="Makes"><FormDialog trigger="Add make" icon="plus" title="Add make" action="make-create" submitLabel="Add make"><Field name="name" label="Make name" /></FormDialog></Heading>
            <DataTable rows={makes} columns={[col("name", "Make"), col("isActive", "Active"), { label: "Models", value: r => <Link className={button.small} href={`${base}/catalogue?make=${text(r.id)}`}>View models</Link> }, { label: "Edit", value: r => edit("Edit make", "make-update", r, <><Field name="name" label="Name" value={text(r.name)} />{active(r)}</>) }]} />
            {selected && makes.some(x => text(x.id) === selected) && <>
                <Heading title={`Models · ${makeName}`}><FormDialog trigger="Add model" icon="plus" title="Add model" subtitle={makeName} action="model-create" submitLabel="Add model"><input type="hidden" name="makeId" value={selected} /><Field name="name" label="Model name" /></FormDialog></Heading>
                <DataTable rows={models} columns={modelColumns} />
            </>}
            {selectedModel && <>
                <Heading title={`Variants · ${text(selectedModel.name)}`}><FormDialog trigger="Add variant" icon="plus" title="Add variant" subtitle={text(selectedModel.name)} action="variant-create" submitLabel="Add variant"><input type="hidden" name="modelId" value={modelId} />{variantFields({})}</FormDialog></Heading>
                <DataTable rows={variants} columns={[col("name", "Variant"), { label: "Edit", value: r => edit("Edit variant", "variant-update", r, variantFields(r)) }]} />
            </>}
            <Heading title="Body categories"><FormDialog trigger="Add category" icon="plus" title="Add body category" action="category-create" submitLabel="Add category"><Field name="name" label="Name" />{active({}, true)}</FormDialog></Heading>
            <DataTable rows={categories} columns={[col("name", "Category"), { label: "Edit", value: r => edit("Edit body category", "category-update", r, <><Field name="name" label="Name" value={text(r.name)} />{active(r)}</>) }]} />
        </>
    } else if (section === "content") {
        title = "Content"
        subtitle = "Blogs, home page content and the website's information pages."
        const pages = await consoleGet<Row[]>("/admin/pages")
        const links: [string, string, string][] = [["blogs", "Blogs", "Articles with their own editor, publishing, categories and SEO."], ["specials", "Specials", "The home page Specials slider and each special's page."], ["featured-dealers", "Featured dealers", "The home page Featured Dealers slider and each dealer's page."], ["testimonials", "Testimonials", "Customer reviews on the home page."], ["ads", "Ad banners", "Adverts on the home page."], ["media", "Videos & podcasts", "YouTube videos and podcast episodes."], ["faqs", "FAQs", "Questions and answers."]]
        content = <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{links.map(([path, name, about]) => <Link key={path} href={`${base}/${path}`} className="rounded-xl border border-[#ebe8e1] bg-white p-4 text-ink no-underline transition hover:border-gold"><strong className="block">{name}</strong><span className="mt-1 block text-sm text-[#6b6862]">{about}</span><span className="mt-3 inline-block text-sm font-bold text-gold">Manage →</span></Link>)}</div>
            <Heading title="Information pages"><FormDialog trigger="Create draft page" icon="plus" title="Create draft page" action="page-create" submitLabel="Create page"><Field name="title" label="Title" /><Field name="slug" label="URL slug" /><Field name="body" label="Body" /></FormDialog></Heading>
            <DataTable rows={pages} columns={[col("title", "Page"), col("status", "Status"), { label: "Publish", value: r => <FormDialog small trigger="Change status" title="Change page status" subtitle={text(r.title)} action="page-status" id={text(r.id)}><Select name="status" label="Status" options={["DRAFT", "PUBLISHED", "ARCHIVED"]} value={text(r.status)} /></FormDialog> }]} />
        </>
    } else if (section === "ads") {
        title = "Ad banners"
        subtitle = "Adverts on the website home page. A banner shows only while it is switched on and inside its dates; with several in one place, the lowest order number shows."
        const rows = await consoleGet<Row[]>("/admin/ad-banners")
        const fields = (r: Row = {}) => <>
            <Field name="title" label="Name (for your reference)" value={text(r.title)} />
            <label className="grid gap-1 text-sm">Where it shows<select className={input} name="placement" defaultValue={text(r.placement) || "HOME_HERO"}>{PLACEMENTS.map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label>
            <ImageField name="imageUrl" label="Banner image" value={text(r.imageUrl)} required wide />
            <Field name="linkUrl" label="Link (where a click goes)" value={text(r.linkUrl)} required={false} />
            <Field name="altText" label="Image description (for screen readers)" value={text(r.altText)} required={false} />
            <div className="grid gap-4 sm:grid-cols-2"><DateField name="startsAt" label="Show from (optional)" value={r.startsAt} /><DateField name="endsAt" label="Show until (optional)" value={r.endsAt} /></div>
            <Field name="sortOrder" label="Order (lower shows first)" type="number" value={text(r.sortOrder) || "0"} required={false} />
            <Check checked={r.isActive !== false} />
        </>
        content = <>
            <Heading title={`${rows.length} banner${rows.length === 1 ? "" : "s"}`}><FormDialog trigger="Add banner" icon="plus" title="Add ad banner" action="ad-create" submitLabel="Add banner" width={640}>{fields()}</FormDialog></Heading>
            <DataTable rows={rows} columns={[
                { label: "Banner", value: r => <Thumb src={r.imageUrl} wide /> }, col("title", "Name"),
                { label: "Where", value: r => PLACEMENTS.find(([value]) => value === text(r.placement))?.[1] ?? text(r.placement) },
                { label: "Shown", value: r => <Shown active={r.isActive} from={r.startsAt} until={r.endsAt} /> }, col("sortOrder", "Order"),
                { label: "Actions", value: r => <Actions><FormDialog small trigger="Edit" title="Edit ad banner" subtitle={text(r.title)} action="ad-update" id={text(r.id)} width={640}>{fields(r)}</FormDialog><Delete action="ad-delete" row={r} name="this banner" /></Actions> },
            ]} />
        </>
    } else if (section === "testimonials") {
        title = "Testimonials"
        subtitle = "Customer reviews in the home page Testimonials slider, in order (lowest number first)."
        const rows = await consoleGet<Row[]>("/admin/testimonials")
        const fields = (r: Row = {}) => <>
            <Field name="name" label="Customer name" value={text(r.name)} />
            <Area name="text" label="Review" value={text(r.text)} required rows={8} />
            <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm">Stars<select className={input} name="rating" defaultValue={text(r.rating) || "5"}>{["5", "4", "3", "2", "1"].map(value => <option key={value} value={value}>{"★".repeat(Number(value))}</option>)}</select></label>
                <Field name="sortOrder" label="Order (lower shows first)" type="number" value={text(r.sortOrder) || "0"} required={false} />
            </div>
            <ImageField name="photoUrl" label="Customer photo (optional)" value={text(r.photoUrl)} />
            <Check checked={r.isActive !== false} />
        </>
        content = <>
            <Heading title={`${rows.length} testimonial${rows.length === 1 ? "" : "s"}`}><FormDialog trigger="Add testimonial" icon="plus" title="Add testimonial" action="testimonial-create" submitLabel="Add testimonial" width={640}>{fields()}</FormDialog></Heading>
            <DataTable rows={rows} columns={[
                { label: "Customer", value: r => <strong>{text(r.name)}</strong> },
                { label: "Review", value: r => <span className="line-clamp-2 max-w-130 text-sm">{text(r.text)}</span> },
                { label: "Stars", value: r => <span className="whitespace-nowrap text-gold">{"★".repeat(Number(r.rating) || 5)}</span> },
                { label: "Shown", value: r => <Shown active={r.isActive} /> }, col("sortOrder", "Order"),
                { label: "Actions", value: r => <Actions><FormDialog small trigger="Edit" title="Edit testimonial" subtitle={text(r.name)} action="testimonial-update" id={text(r.id)} width={640}>{fields(r)}</FormDialog><Delete action="testimonial-delete" row={r} name="this testimonial" /></Actions> },
            ]} />
        </>
    } else if (section === "featured-dealers") {
        title = "Featured dealers"
        subtitle = "Dealers in the home page \"Our Featured Dealers\" slider. Each has its own page at /featured-dealer/<address>; link it to a marketplace dealer to show that dealer's cars there."
        const rows = await consoleGet<Row[]>("/admin/featured-dealers")
        const fields = (r: Row = {}) => <>
            <Field name="name" label="Dealer name" value={text(r.name)} />
            <ImageField name="logoUrl" label="Logo" value={text(r.logoUrl)} />
            <Area name="description" label="Short description (home page card)" value={text(r.description)} rows={3} hint="Up to 500 characters" />
            <Area name="about" label="About text (dealer page)" value={text(r.about)} rows={8} hint="One paragraph per line" />
            <div className="grid gap-4 sm:grid-cols-2">
                <Field name="slug" label="Page address /featured-dealer/…" value={text(r.slug)} required={false} />
                <Field name="dealerId" label="Linked dealer ID (from Dealers)" value={text(r.dealerId)} required={false} />
            </div>
            <Field name="sortOrder" label="Order (lower shows first)" type="number" value={text(r.sortOrder) || "0"} required={false} />
            <Check checked={r.isActive !== false} />
        </>
        content = <>
            <Heading title={`${rows.length} featured dealer${rows.length === 1 ? "" : "s"}`}><FormDialog trigger="Add featured dealer" icon="plus" title="Add featured dealer" action="featured-create" submitLabel="Add dealer" width={700}>{fields()}</FormDialog></Heading>
            <DataTable rows={rows} columns={[
                { label: "Logo", value: r => <Thumb src={r.logoUrl} /> },
                { label: "Dealer", value: r => <><strong>{text(r.name)}</strong><span className="block text-xs text-[#6b6862]">/featured-dealer/{text(r.slug)}</span></> },
                { label: "Linked dealer", value: r => text(record(r.dealer).id) ? <Link href={`${base}/manage/dealers/${text(record(r.dealer).id)}`} className="font-bold text-gold">{text(record(r.dealer).name)}</Link> : <span className="text-xs text-[#6b6862]">Not linked</span> },
                { label: "Shown", value: r => <Shown active={r.isActive} /> }, col("sortOrder", "Order"),
                { label: "Actions", value: r => <Actions><FormDialog small trigger="Edit" title="Edit featured dealer" subtitle={text(r.name)} action="featured-update" id={text(r.id)} width={700}>{fields(r)}</FormDialog><Delete action="featured-delete" row={r} name="this featured dealer" /></Actions> },
            ]} />
        </>
    } else if (section === "specials") {
        title = "Specials"
        subtitle = "Specials and promotions in the home page Specials slider. Each has its own page at /specials/<address>; it shows while switched on and inside its dates."
        const rows = await consoleGet<Row[]>("/admin/promotions")
        const fields = (r: Row = {}) => <>
            <Field name="title" label="Title" value={text(r.title)} />
            <ImageField name="bannerUrl" label="Image" value={text(r.bannerUrl)} required />
            <Area name="description" label="Text (e.g. price or saving)" value={text(r.description)} rows={3} />
            <div className="grid gap-4 sm:grid-cols-2"><DateField name="startsAt" label="Starts (empty: now)" value={r.startsAt} /><DateField name="endsAt" label="Ends (optional)" value={r.endsAt} /></div>
            <Check checked={r.isActive !== false} />
        </>
        content = <>
            <Heading title={`${rows.length} special${rows.length === 1 ? "" : "s"}`}><FormDialog trigger="Add special" icon="plus" title="Add special" action="special-create" submitLabel="Add special" width={640}>{fields()}</FormDialog></Heading>
            <DataTable rows={rows} columns={[
                { label: "Image", value: r => <Thumb src={r.bannerUrl} /> },
                { label: "Special", value: r => <><strong>{text(r.title)}</strong><span className="block text-xs text-[#6b6862]">/specials/{text(r.slug)}</span></> },
                { label: "Text", value: r => <span className="line-clamp-2 max-w-90 text-sm">{text(r.description) || "—"}</span> },
                { label: "Shown", value: r => <Shown active={r.isActive} from={r.startsAt} until={r.endsAt} /> },
                date("endsAt", "Ends"),
                { label: "Actions", value: r => <Actions><FormDialog small trigger="Edit" title="Edit special" subtitle={text(r.title)} action="special-update" id={text(r.id)} width={640}>{fields(r)}</FormDialog><Delete action="special-delete" row={r} name="this special" /></Actions> },
            ]} />
        </>
    } else if (section === "media") {
        title = "Videos & podcasts"
        subtitle = "YouTube videos and podcast episodes. Only published items are offered to the website and app."
        const data = await consoleGet<PageData>("/admin/media" + paginationQuery(query))
        const fields = (r: Row = {}) => <>
            <label className="grid gap-1 text-sm">Type<select className={input} name="type" defaultValue={text(r.type) || "VIDEO"}><option value="VIDEO">Video</option><option value="PODCAST">Podcast</option></select></label>
            <Field name="title" label="Title" value={text(r.title)} />
            <Field name="url" label="Link (YouTube, Spotify, …)" value={text(r.url)} />
            <Area name="description" label="Description (optional)" value={text(r.description)} rows={3} />
            <ImageField name="thumbnailUrl" label="Thumbnail (optional)" value={text(r.thumbnailUrl)} />
            <input type="hidden" name="currentStatus" value={text(r.status) || "DRAFT"} />
            <Check name="published" label="Published" checked={text(r.status) === "PUBLISHED"} />
        </>
        content = <>
            <Heading title={`${data.meta.total} item${data.meta.total === 1 ? "" : "s"}`}><FormDialog trigger="Add video or podcast" icon="plus" title="Add video or podcast" action="media-create" submitLabel="Add" width={640}>{fields()}</FormDialog></Heading>
            <DataTable rows={data.data} columns={[
                { label: "Thumbnail", value: r => <Thumb src={r.thumbnailUrl} /> },
                { label: "Title", value: r => <><strong>{text(r.title)}</strong><a href={text(r.url)} target="_blank" rel="noopener noreferrer" className="block max-w-80 truncate text-xs text-gold">{text(r.url)}</a></> },
                { label: "Type", value: r => text(r.type) === "PODCAST" ? "Podcast" : "Video" },
                { label: "Status", value: r => <StatusBadge status={text(r.status).toLowerCase()} /> },
                { label: "Actions", value: r => <Actions><FormDialog small trigger="Edit" title="Edit video or podcast" subtitle={text(r.title)} action="media-update" id={text(r.id)} width={640}>{fields(r)}</FormDialog><Delete action="media-delete" row={r} name="this item" /></Actions> },
            ]} />
            <Pager page={data} query={query} section={section} />
        </>
    } else if (section === "faqs") {
        title = "FAQs"
        subtitle = "Questions and answers, grouped by category and shown in order."
        const rows = await consoleGet<Row[]>("/admin/faqs")
        const fields = (r: Row = {}) => <>
            <Field name="question" label="Question" value={text(r.question)} />
            <Area name="answer" label="Answer" value={text(r.answer)} required rows={6} />
            <div className="grid gap-4 sm:grid-cols-2">
                <Field name="category" label="Category (optional)" value={text(r.category)} required={false} />
                <Field name="sortOrder" label="Order (lower shows first)" type="number" value={text(r.sortOrder) || "0"} required={false} />
            </div>
            <Check checked={r.isActive !== false} />
        </>
        content = <>
            <Heading title={`${rows.length} question${rows.length === 1 ? "" : "s"}`}><FormDialog trigger="Add FAQ" icon="plus" title="Add FAQ" action="faq-create" submitLabel="Add FAQ" width={640}>{fields()}</FormDialog></Heading>
            <DataTable rows={rows} columns={[
                { label: "Question", value: r => <><strong>{text(r.question)}</strong><span className="mt-1 line-clamp-2 block max-w-130 text-xs text-[#6b6862]">{text(r.answer)}</span></> },
                { label: "Category", value: r => text(r.category) || "—" },
                { label: "Shown", value: r => <Shown active={r.isActive} /> }, col("sortOrder", "Order"),
                { label: "Actions", value: r => <Actions><FormDialog small trigger="Edit" title="Edit FAQ" subtitle={text(r.question)} action="faq-update" id={text(r.id)} width={640}>{fields(r)}</FormDialog><Delete action="faq-delete" row={r} name="this FAQ" /></Actions> },
            ]} />
        </>
    } else if (section === "reports") {
        title = "Reports"
        const stats = await consoleGet<Row>("/admin/stats")
        content = <><Summary values={record(stats.dealers)} /><Summary values={record(record(stats.vehicles).byStatus)} />{LEADS_ENABLED && <Summary values={record(stats.enquiriesLast30Days)} />}<Summary values={record(stats.bidding)} /><Card><h2 className="mb-3 font-bold">Export records</h2><p className="text-sm">CSV exports are limited to 100 records per page. Choose the page to export.</p><form action="/api/super-admin/export" className="flex flex-wrap gap-3"><select name="kind" className={input} aria-label="Export type">{statusOptions(["dealers", "vehicles", "customers", ...(LEADS_ENABLED ? ["leads"] : []), "audit"])}</select><Field name="page" label="Page" type="number" value="1" /><button className={button.gold}>Download CSV</button></form></Card><DataTable rows={list(stats.topMakes)} columns={[col("make", "Make"), col("listings", "Listings")]} /></>
    } else notFound()
    return <div className="grid gap-5"><PageHeader title={title} subtitle={subtitle} />{content}</div>
}

export async function ManagementDetail({ kind, id }: { kind: string, id: string }) {
    if (!["dealers", "vehicles", "users", ...(LEADS_ENABLED ? ["leads"] : [])].includes(kind) || !(kind === "dealers" || kind === "vehicles" ? marketplaceId : uuid).test(id)) notFound()
    // A dealer's profile and its first listings load together.
    const [data, stock] = await Promise.all([
        consoleGet<Row>(kind === "leads" ? `/admin/console/leads/${id}` : `/admin/${kind}/${id}`),
        kind === "dealers" ? consoleGet<PageData>(`/admin/vehicles?dealerId=${id}&pageSize=2&page=1`) : undefined,
    ])
    if (kind === "vehicles") return <VehicleReview data={data} />
    if (kind === "dealers" && stock) return <DealerReview data={data} vehicles={stock.data} total={stock.meta.total} />
    const heading = text(data.name) || text(data.title) || `${text(data.firstName)} ${text(data.lastName)}`
    let controls: React.ReactNode
    if (kind === "leads") controls = <>
        <ManagementForm action="lead-assign" id={id}><label className="grid gap-1 text-sm">Assigned to<select name="memberId" className={input} defaultValue={text(data.assignedToId)}><option value="">Unassigned</option>{list(data.members).map(member => <option key={text(member.id)} value={text(member.id)}>{text(record(member.user).firstName)} {text(record(member.user).lastName)}</option>)}</select></label></ManagementForm>
        <ManagementForm action="lead-stage" id={id}><Select name="stage" label="Stage" value={text(data.stage)} options={["NEW", "CONTACTED", "QUALIFIED", "NEGOTIATION", "OFFER_SENT", "WON", "LOST"]} /><Field name="reason" label="Reason (lost)" required={false} /></ManagementForm>
        <h2 className="font-bold">Contact history</h2><DataTable rows={list(data.activities)} columns={[col("type", "Type"), col("note", "Note"), date("createdAt", "Time")]} />
    </>
    else if (kind !== "users") notFound()
    const back = <Link href={`${base}/${kind === "users" ? data.role === "CUSTOMER" ? "customers" : "staff" : kind === "leads" ? "leads" : "dealers"}`} className={button.outline}>Back to list</Link>
    if (kind === "users") {
        // Status and role in one dialog; the current status stays listed so a deleted account is never reactivated by accident.
        const status = text(data.status), role = text(data.role)
        const canChangeRole = !data.dealerMember && role !== "SUPER_ADMIN"
        const update = <FormDialog trigger="Update account" title="Update account" subtitle={heading} action="user-update" id={id}>
            <input type="hidden" name="currentStatus" value={status} />
            <Select name="status" label="Status" options={[...new Set(["ACTIVE", "SUSPENDED", status].filter(Boolean))]} value={status} />
            <Field name="reason" label="Reason (kept in the audit trail)" required={false} />
            {canChangeRole && <><input type="hidden" name="currentRole" value={role} /><Select name="role" label="Role" options={["CUSTOMER", "ADMIN"]} value={role} /></>}
            <p className="m-0 text-sm text-[#6b6862]">Suspension and role changes sign the person out everywhere. You cannot change your own account here.</p>
        </FormDialog>
        return <div className="grid gap-5"><PageHeader title={heading} subtitle={`Current status: ${status} · ${id}`} actions={<>{back}{update}</>} /><Summary values={Object.fromEntries(["email", "phone", "city", "province", "role", "activeSessions"].filter(k => data[k] !== undefined).map(k => [k, data[k]]))} /></div>
    }
    return <div className="grid gap-5"><PageHeader title={heading} subtitle={`Current status: ${text(data.status) || text(data.stage)} · ${id}`} />{back}<Summary values={Object.fromEntries(["email", "phone", "city", "province", "role", "colour", "latitude", "longitude", "price", "activeSessions"].filter(k => data[k] !== undefined).map(k => [k, data[k]]))} /><Card><div className="grid gap-5">{controls}</div></Card></div>
}
