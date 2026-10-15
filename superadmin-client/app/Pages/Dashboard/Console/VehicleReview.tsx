import { websiteUrl } from "@/app/lib/site"
import Link from "next/link"
import { list, record, Row, text } from "@/app/lib/dashboard/console"
import Card from "../ui/Card"
import PageHeader from "../ui/PageHeader"
import StatusBadge from "../ui/StatusBadge"
import { button, formatRand, input, table } from "../ui/format"
import ManagementForm from "./ManagementForm"

const base = "/dashboard/super-admin"

// Admin actions per status; mirrors the admin transitions in the backend vehicle lifecycle.
const ACTIONS: Record<string, string[]> = {
    PENDING_REVIEW: ["approve", "reject"],
    APPROVED: ["publish", "archive"],
    PUBLISHED: ["suspend", "archive"],
    RESERVED: ["suspend"],
    SUSPENDED: ["unsuspend", "archive"],
    SOLD: ["relist", "archive"],
    DRAFT: ["archive"],
    REJECTED: ["archive"],
}
const ACTION_LABELS: Record<string, string> = {
    approve: "Approve", reject: "Reject", publish: "Publish", suspend: "Suspend",
    unsuspend: "Unsuspend (publish again)", archive: "Archive", relist: "Relist",
}
// Statuses in which the backend accepts price, colour, description and stock number changes.
const EDITABLE = ["DRAFT", "REJECTED", "APPROVED", "PUBLISHED", "RESERVED", "SUSPENDED"]
const PUBLIC = ["PUBLISHED", "RESERVED", "SOLD"]

/** "FOUR_X_FOUR" → "Four x four"; UNKNOWN and empty values read as not specified. */
function label(value: unknown) {
    const raw = text(value)
    if (!raw || raw === "UNKNOWN") return "—"
    const words = raw.replaceAll("_", " ").toLowerCase()
    return words.charAt(0).toUpperCase() + words.slice(1)
}
function number(value: unknown, unit = "") {
    return typeof value === "number" ? `${value.toLocaleString("en-ZA")}${unit}` : "—"
}
function rand(value: unknown) {
    return typeof value === "number" ? formatRand(value) : "—"
}
function when(value: unknown) {
    const raw = text(value)
    return raw ? new Date(raw).toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"
}
/** The website's car page: /car/<title-slug>-<id without dashes>. */
function publicUrl(data: Row) {
    const slug = text(data.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    return `/car/${slug}-${text(data.id).replaceAll("-", "")}`
}

function Details({ items }: { items: [string, React.ReactNode][] }) {
    return (
        <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-4 max-[360px]:grid-cols-1">
            {items.map(([name, value]) => (
                <div key={name} className="min-w-0">
                    <dt className="text-xs font-bold tracking-wide text-[#6b6862] uppercase">{name}</dt>
                    <dd className="m-0 mt-1 text-sm font-semibold break-words text-ink">{value || "—"}</dd>
                </div>
            ))}
        </dl>
    )
}

function Field({ name, label, value = "", type = "text", required = false, placeholder }: { name: string, label: string, value?: string, type?: string, required?: boolean, placeholder?: string }) {
    return <label className="grid min-w-40 flex-1 gap-1 text-sm">{label}<input className={input} name={name} type={type} defaultValue={value} required={required} placeholder={placeholder} /></label>
}

function Photos({ images, title }: { images: Row[], title: string }) {
    const ready = images.filter((image) => text(image.url))
    if (!ready.length) return <p className="m-0 text-sm text-[#6b6862]">No photos uploaded.</p>
    const [primary, ...rest] = ready
    const src = (image: Row) => text(image.largeUrl) || text(image.url)
    return (
        <div className="grid gap-3">
            <a href={src(primary)} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg bg-[#f4f2ee]">
                {/* eslint-disable-next-line @next/next/no-img-element -- dealer and feed photos from any host */}
                <img src={src(primary)} alt={text(primary.altText) || title} className="aspect-[4/3] w-full object-cover" />
            </a>
            {rest.length > 0 && (
                <div className="grid grid-cols-6 gap-2 max-[600px]:grid-cols-4">
                    {rest.map((image) => (
                        <a key={text(image.id)} href={src(image)} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-md bg-[#f4f2ee]">
                            {/* eslint-disable-next-line @next/next/no-img-element -- dealer and feed photos from any host */}
                            <img src={text(image.thumbnailUrl) || src(image)} alt={text(image.altText) || title} className="aspect-square w-full object-cover" />
                        </a>
                    ))}
                </div>
            )}
            <p className="m-0 text-xs text-[#6b6862]">{ready.length} photo{ready.length === 1 ? "" : "s"} · click a photo to open it full size</p>
        </div>
    )
}

export default function VehicleReview({ data }: { data: Row }) {
    const id = text(data.id)
    const status = text(data.status)
    const title = text(data.title)
    const make = record(data.make), model = record(data.model), variant = record(data.variant), generation = record(data.generation)
    const dealer = record(data.dealer), branch = record(data.branch)
    const images = list(data.images)
    const actions = ACTIONS[status] ?? []
    const features = list(data.featureAssignments).map((item) => record(item.feature))
    const statusHistory = list(data.statusHistory), priceHistory = list(data.priceHistory)
    const onSpecial = data.isSpecial === true && typeof data.specialPrice === "number"

    return (
        <div className="grid gap-5">
            <PageHeader
                title={title}
                subtitle={`${[text(make.name), text(model.name), text(variant.name)].filter(Boolean).join(" · ")}${text(data.stockNumber) ? ` · Stock #${text(data.stockNumber)}` : ""}`}
                actions={<>
                    <Link href={`${base}/listings`} className={button.outline}>Back to listings</Link>
                    {PUBLIC.includes(status) && websiteUrl("/") && <a href={websiteUrl(publicUrl(data))} target="_blank" rel="noopener noreferrer" className={button.gold}>View on website</a>}
                </>}
            />

            <Card>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                    <span className="flex items-center gap-2"><span className="text-[#6b6862]">Status</span><StatusBadge status={status.replaceAll("_", " ").toLowerCase()} /></span>
                    <span className="flex items-center gap-2"><span className="text-[#6b6862]">Availability</span><strong>{label(data.availability)}</strong></span>
                    <span className="flex items-center gap-2"><span className="text-[#6b6862]">Featured</span><strong>{data.isFeatured === true ? "Yes" : "No"}</strong></span>
                    <span className="flex items-center gap-2"><span className="text-[#6b6862]">On special</span><strong>{data.isSpecial === true ? "Yes" : "No"}</strong></span>
                    <span className="flex items-center gap-2"><span className="text-[#6b6862]">Last updated</span><strong>{when(data.updatedAt)}</strong></span>
                </div>
                {text(data.reviewNotes) && <p className="m-0 mt-4 rounded-lg bg-[#fdf3dc] p-3 text-sm text-[#8a5a00]"><strong>Review notes:</strong> {text(data.reviewNotes)}</p>}
            </Card>

            <div className="grid grid-cols-[3fr_2fr] items-start gap-5 max-[1100px]:grid-cols-1">
                <div className="grid min-w-0 gap-5">
                    <Card title="Photos"><Photos images={images} title={title} /></Card>

                    <Card title="Specifications">
                        <Details items={[
                            ["Make", text(make.name)], ["Model", text(model.name)],
                            ["Variant", text(variant.name)], ["Generation", text(generation.name)],
                            ["Year", text(data.year)], ["Condition", label(data.condition)],
                            ["Mileage", number(data.mileage, " km")], ["Body type", list(data.categories).map((c) => text(c.name)).join(", ")],
                            ["Transmission", label(data.transmission)], ["Fuel", label(data.fuelType)],
                            ["Drivetrain", label(data.drivetrain)], ["Colour", text(data.colour)],
                            ["Engine", number(data.engineCapacityCc, " cc")], ["Power", number(data.powerKw, " kW")],
                            ["Cylinders", number(data.cylinders)], ["Seats", number(data.seats)],
                            ["Doors", number(data.doors)], ["Stock number", text(data.stockNumber)],
                            ["VIN (private)", text(data.vin)], ["Registration (private)", text(data.registrationNumber)],
                        ]} />
                    </Card>

                    <Card title="Description">
                        <p className="m-0 text-sm leading-6 whitespace-pre-line text-ink">{text(data.description) || "No description."}</p>
                    </Card>

                    <Card title={`Features (${features.length})`}>
                        {features.length
                            ? <ul className="m-0 grid grid-cols-2 gap-2 p-0 text-sm max-[600px]:grid-cols-1">{features.map((feature) => <li key={text(feature.id)} className="list-none rounded-md bg-[#f7f5f0] px-3 py-2"><strong>{text(feature.name)}</strong> <span className="text-[#6b6862]">· {label(feature.group)}</span></li>)}</ul>
                            : <p className="m-0 text-sm text-[#6b6862]">No features recorded.</p>}
                    </Card>

                    <Card title="Status history">
                        {statusHistory.length ? (
                            <div className={table.wrap}><table className={table.table}>
                                <thead><tr><th className={table.head}>From</th><th className={table.head}>To</th><th className={table.head}>Reason</th><th className={table.head}>When</th></tr></thead>
                                <tbody>{statusHistory.map((row) => <tr key={text(row.id)} className={table.row}><td className={table.cell}>{label(row.fromStatus)}</td><td className={table.cell}>{label(row.toStatus)}</td><td className={table.cell}>{text(row.reason) || "—"}</td><td className={table.cell}>{when(row.createdAt)}</td></tr>)}</tbody>
                            </table></div>
                        ) : <p className="m-0 text-sm text-[#6b6862]">No status changes recorded.</p>}
                    </Card>

                    <Card title="Price history">
                        {priceHistory.length ? (
                            <div className={table.wrap}><table className={table.table}>
                                <thead><tr><th className={table.head}>Old price</th><th className={table.head}>New price</th><th className={table.head}>When</th></tr></thead>
                                <tbody>{priceHistory.map((row) => <tr key={text(row.id)} className={table.row}><td className={table.cell}>{rand(row.oldPrice)}</td><td className={table.cell}>{rand(row.newPrice)}</td><td className={table.cell}>{when(row.createdAt)}</td></tr>)}</tbody>
                            </table></div>
                        ) : <p className="m-0 text-sm text-[#6b6862]">No price changes recorded.</p>}
                    </Card>

                    {typeof data.sourceData === "object" && data.sourceData !== null && (
                        <Card title="Original feed data">
                            <details>
                                <summary className="cursor-pointer text-sm font-bold">Show the data this listing was imported from</summary>
                                <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-[#f7f5f0] p-3 text-xs">{JSON.stringify(data.sourceData, null, 2)}</pre>
                            </details>
                        </Card>
                    )}
                </div>

                <div className="grid min-w-0 gap-5">
                    <Card title="Review action">
                        {actions.length ? (
                            <ManagementForm action="vehicle-transition" id={id} label="Apply">
                                <label className="grid min-w-40 flex-1 gap-1 text-sm">Action
                                    <select className={input} name="transition" defaultValue={actions[0]}>{actions.map((action) => <option key={action} value={action}>{ACTION_LABELS[action]}</option>)}</select>
                                </label>
                                <Field name="reason" label="Reason" placeholder="Needed to reject, suspend or archive" />
                            </ManagementForm>
                        ) : <p className="m-0 text-sm text-[#6b6862]">No admin actions are available for an {label(status).toLowerCase()} listing.</p>}
                    </Card>

                    <Card title="Price">
                        <Details items={[
                            ["Price", rand(data.price)],
                            ["Special price", onSpecial ? rand(data.specialPrice) : "—"],
                            ["Customer pays", rand(onSpecial ? data.specialPrice : data.price)],
                            ["Promotion", text(data.promotionId) ? "Linked" : "—"],
                        ]} />
                    </Card>

                    {EDITABLE.includes(status) && (
                        <Card title="Edit listing">
                            <ManagementForm action="vehicle-edit" id={id}>
                                <Field name="price" label="Price (R)" type="number" value={text(data.price)} required />
                                <Field name="specialPrice" label="Special price (R)" type="number" value={text(data.specialPrice)} />
                                <Field name="colour" label="Colour" value={text(data.colour)} />
                                <Field name="stockNumber" label="Stock number" value={text(data.stockNumber)} />
                                <label className="grid w-full gap-1 text-sm">Description<textarea name="description" defaultValue={text(data.description)} className={`${input} h-28 py-2`} /></label>
                            </ManagementForm>
                        </Card>
                    )}

                    <Card title="Highlight on the website">
                        <ManagementForm action="vehicle-flags" id={id}>
                            <label className="flex h-9.5 items-center gap-2 text-sm"><input type="checkbox" name="isFeatured" defaultChecked={data.isFeatured === true} /> Featured</label>
                            <label className="flex h-9.5 items-center gap-2 text-sm"><input type="checkbox" name="isSpecial" defaultChecked={data.isSpecial === true} /> On special</label>
                        </ManagementForm>
                    </Card>

                    <Card title="Dealer" action={text(dealer.id) && <Link href={`${base}/manage/dealers/${text(dealer.id)}`} className="text-sm font-bold text-gold">Review dealer</Link>}>
                        <Details items={[
                            ["Dealer", text(dealer.name)], ["Dealer status", label(dealer.status)],
                            ["Phone", text(branch.phone) || text(dealer.phone)], ["Email", text(branch.email) || text(dealer.email)],
                            ["Branch", text(branch.name)], ["Plan", label(dealer.plan)],
                        ]} />
                    </Card>

                    <Card title="Location">
                        <Details items={[
                            ["City", text(data.city)], ["Province", label(data.province)],
                            ["Address", text(branch.address)],
                            ["Map", typeof data.latitude === "number" && typeof data.longitude === "number"
                                ? <a href={`https://www.openstreetmap.org/?mlat=${data.latitude}&mlon=${data.longitude}#map=14/${data.latitude}/${data.longitude}`} target="_blank" rel="noopener noreferrer" className="text-gold">Open map</a>
                                : "—"],
                        ]} />
                    </Card>

                    <Card title="Performance">
                        <Details items={[
                            ["Views", number(data.viewCount)], ["Enquiries", number(data.enquiryCount)],
                            ["Saved by", number(data.favouriteCount)], ["Popularity score", number(data.popularityScore)],
                        ]} />
                    </Card>

                    <Card title="Timeline">
                        <Details items={[
                            ["Created", when(data.createdAt)], ["Submitted", when(data.submittedAt)],
                            ["Approved", when(data.approvedAt)], ["Published", when(data.publishedAt)],
                            ["Reserved until", when(data.reservedUntil)], ["Sold", when(data.soldAt)],
                            ["Archived", when(data.archivedAt)], ["Last updated", when(data.updatedAt)],
                        ]} />
                    </Card>
                </div>
            </div>
        </div>
    )
}
