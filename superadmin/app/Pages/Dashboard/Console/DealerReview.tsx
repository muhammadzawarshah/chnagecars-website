import Link from "next/link"
import { list, record, Row, text } from "@/app/lib/dashboard/console"
import { openDealer } from "@/app/lib/dashboard/console-actions"
import Card from "../ui/Card"
import DealerLogo from "../ui/DealerLogo"
import Icon from "../ui/Icon"
import ListingPhoto from "../ui/ListingPhoto"
import StatusBadge from "../ui/StatusBadge"
import { button, formatRand, table } from "../ui/format"
import DealerUpdate from "./DealerUpdate"
import { LEADS_ENABLED } from "@/app/lib/dashboard/features"

const base = "/dashboard/super-admin"
const label = (value: unknown) => text(value).replaceAll("_", " ")
const date = (value: unknown) => text(value) ? new Date(text(value)).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Johannesburg" }) : "—"
function Details({ values }: { values: [string, unknown][] }) {
    return <dl className="m-0 grid gap-x-6 gap-y-5 sm:grid-cols-2">{values.map(([name, value]) => <div key={name} className="min-w-0"><dt className="text-xs font-bold tracking-wide text-[#6b6862] uppercase">{name}</dt><dd className="m-0 mt-1 break-words text-sm leading-6 text-ink">{label(value) || "Not provided"}</dd></div>)}</dl>
}
function Rows({ rows, columns, empty }: { rows: Row[], columns: { name: string, value: (row: Row) => React.ReactNode }[], empty: string }) {
    if (!rows.length) return <p className="m-0 text-sm text-[#6b6862]">{empty}</p>
    return <div className={table.wrap}><table className={table.table}><thead><tr>{columns.map(c => <th key={c.name} className={table.head}>{c.name}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={text(row.id) || i} className={table.row}>{columns.map(c => <td key={c.name} className={table.cell}>{c.value(row)}</td>)}</tr>)}</tbody></table></div>
}

export default function DealerReview({ data, vehicles, total }: { data: Row, vehicles: Row[], total: number }) {
    const id = text(data.id), name = text(data.name)
    const stats = record(data.stats)
    const vehicleStats = record(stats.vehiclesByStatus)
    const leads = Object.values(record(stats.leadsByStage)).reduce<number>((sum, count) => sum + (typeof count === "number" ? count : 0), 0)
    const metrics: [string, number][] = [["Total listings", total], ["Published", Number(vehicleStats.PUBLISHED) || 0], ["Sold", Number(vehicleStats.SOLD) || 0], ...(LEADS_ENABLED ? [["Leads", leads] as [string, number]] : [])]
    const listingsHref = `${base}/listings?dealerId=${encodeURIComponent(id)}`
    const website = text(data.website)
    const reason = text(data.suspensionReason) || text(data.rejectionReason)
    const reviews = ([["Google reviews", text(data.googleReviewUrl)], ["HelloPeter", text(data.hellopeterReviewUrl)]] as [string, string][]).filter(([, href]) => /^https:\/\//.test(href))
    return <div className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href={`${base}/dealers`} className={`${button.outline} w-fit`}><Icon name="back" size={16} />Back to dealers</Link>
            <form action={openDealer}><input type="hidden" name="id" value={id} /><button className={button.gold}><Icon name="eye" size={16} />Open dealer dashboard</button></form>
        </div>

        <Card><div className="flex flex-wrap items-center gap-5">
            <DealerLogo name={name} src={text(data.logoUrl)} large />
            <div className="min-w-0 flex-1 basis-48"><p className="m-0 mb-1 text-xs font-bold tracking-widest text-gold uppercase">Dealer profile</p><h1 className="m-0 text-2xl leading-tight font-bold break-words text-ink sm:text-3xl">{name}</h1><p className="m-0 mt-2 text-sm text-[#6b6862]">{[text(data.city), label(data.province)].filter(Boolean).join(", ") || "Location not provided"}</p><div className="mt-3 flex flex-wrap items-center gap-2"><StatusBadge status={label(data.status).toLowerCase()} /><span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-bold text-gold">{label(data.plan)} plan</span></div></div>
            <DealerUpdate id={id} name={name} status={text(data.status)} plan={text(data.plan)} reason={reason} />
        </div></Card>

        <div className={`grid grid-cols-2 gap-3 ${LEADS_ENABLED ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>{metrics.map(([name, value]) => <Card key={name}><p className="m-0 text-xs font-bold text-[#6b6862]">{name}</p><p className="m-0 mt-2 text-2xl font-bold text-ink">{value.toLocaleString("en-ZA")}</p></Card>)}</div>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="grid min-w-0 gap-6">
                <Card title="Contact & business details">
                    <Details values={[["Email", data.email], ["Phone", data.phone], ["Address", data.address], ["City", data.city], ["Province", data.province], ["Legal name", data.legalName], ["Registration number", data.registrationNumber], ["VAT number", data.vatNumber], ["Dealer licence", data.dealerLicenceNumber], ["Rating", data.rating]]} />
                    <div className="mt-5 border-t border-[#ebe8e1] pt-5"><p className="m-0 text-xs font-bold text-[#6b6862] uppercase">Website</p>{/^https?:\/\//i.test(website) ? <a href={website} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block break-all text-sm text-gold underline">{website}</a> : <p className="m-0 mt-1 text-sm">{website || "Not provided"}</p>}</div>
                    <div className="mt-5 border-t border-[#ebe8e1] pt-5"><p className="m-0 text-xs font-bold text-[#6b6862] uppercase">Reviews</p>
                        {reviews.length ? <div className="mt-2 flex flex-wrap gap-2">{reviews.map(([name, href]) => <a key={name} href={href} target="_blank" rel="noopener noreferrer" className={button.small}><Icon name="star" size={13} />{name}</a>)}</div> : <p className="m-0 mt-1 text-sm">Not provided</p>}
                    </div>
                    <div className="mt-5 border-t border-[#ebe8e1] pt-5"><h3 className="m-0 text-sm font-bold">About this dealer</h3><p className="m-0 mt-2 text-sm leading-6 whitespace-pre-line text-[#6b6862]">{text(data.description) || "No description provided."}</p></div>
                </Card>

                <Card title="Dealer listings" action={<Link href={listingsHref} className={button.small}>View all listings ({total})</Link>}>
                    {vehicles.length ? <div className="grid gap-4 sm:grid-cols-2">{vehicles.map(vehicle => <Link key={text(vehicle.id)} href={`${base}/manage/vehicles/${text(vehicle.id)}`} className="overflow-hidden rounded-xl border border-[#ebe8e1] text-ink no-underline transition hover:border-gold">
                        <ListingPhoto src={text(vehicle.primaryImageUrl)} title={text(vehicle.title)} />
                        <div className="p-4"><StatusBadge status={label(vehicle.status).toLowerCase()} /><h3 className="m-0 mt-3 text-base font-bold">{text(vehicle.title)}</h3><p className="m-0 mt-1 text-xs text-[#6b6862]">{[text(vehicle.year), typeof vehicle.mileage === "number" ? `${vehicle.mileage.toLocaleString("en-ZA")} km` : "", text(vehicle.stockNumber) ? `Stock ${text(vehicle.stockNumber)}` : ""].filter(Boolean).join(" · ")}</p><p className="m-0 mt-3 text-lg font-bold text-gold">{typeof vehicle.price === "number" ? formatRand(vehicle.price) : "Price not provided"}</p><span className="mt-3 inline-block text-xs font-bold">View listing →</span></div>
                    </Link>)}</div> : <p className="m-0 text-sm text-[#6b6862]">This dealer has no listings yet.</p>}
                </Card>

                <Card title="Branches"><Rows rows={list(data.branches)} empty="No branches recorded." columns={[
                    { name: "Branch", value: r => <><strong>{text(r.name)}</strong>{r.isHeadOffice === true && <span className="mt-1 block text-xs text-gold">Head office</span>}</> },
                    { name: "Address", value: r => <span className="whitespace-normal">{[text(r.address), text(r.city), label(r.province)].filter(Boolean).join(", ") || "—"}</span> },
                    { name: "Contact", value: r => <>{text(r.phone) || "—"}<span className="block text-xs">{text(r.email)}</span></> },
                ]} /></Card>
                <Card title="Dealer team"><Rows rows={list(data.members)} empty="No team members recorded." columns={[
                    { name: "Name", value: r => [text(record(r.user).firstName), text(record(r.user).lastName)].join(" ") },
                    { name: "Contact", value: r => <>{text(record(r.user).email)}<span className="block text-xs">{text(record(r.user).phone)}</span></> },
                    { name: "Role", value: r => label(r.role) },
                ]} /></Card>
                <Card title="Verification documents"><Rows rows={list(data.documents)} empty="No verification documents uploaded." columns={[
                    { name: "File", value: r => text(r.fileName) }, { name: "Type", value: r => label(r.type) },
                    { name: "View", value: r => /^https?:\/\//.test(text(r.downloadUrl)) ? <a href={text(r.downloadUrl)} target="_blank" rel="noopener noreferrer" className={button.small}>Open document</a> : "Unavailable" },
                ]} /></Card>
            </div>
            <div className="grid min-w-0 gap-6">
                <Card title="Account information"><Details values={[["Joined", date(data.createdAt)], ["Approved", date(data.approvedAt)], ["Last updated", date(data.updatedAt)], ["Bidding", data.biddingEnabled === true ? "Enabled" : "Disabled"], ...(reason ? [["Status reason", reason] as [string, unknown]] : [])]} /></Card>
            </div>
        </div>
    </div>
}
