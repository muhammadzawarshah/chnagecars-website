"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Card from "../ui/Card"
import Icon from "../ui/Icon"
import PageHeader from "../ui/PageHeader"
import StatCard from "../ui/StatCard"
import StatusBadge from "../ui/StatusBadge"
import { button, formatDateTime, input, table } from "../ui/format"
import ManagementForm from "./ManagementForm"

export type StaffMember = {
    id: string
    name: string
    email: string
    role: "super-admin" | "admin"
    status: "active" | "invited" | "disabled"
    lastActive: string
}

type Dialog = { kind: "invite" } | { kind: "manage", member: StaffMember }

const ROLE_LABELS = { "super-admin": "Super admin", "admin": "Admin" }
const FILTERS = [["all", "All"], ["admin", "Admins"], ["invited", "Invited"], ["disabled", "Suspended"]] as const

function initials(name: string) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?"
}

function Field({ name, label, type = "text", placeholder, required = true, wide = false }: { name: string, label: string, type?: string, placeholder?: string, required?: boolean, wide?: boolean }) {
    return (
        <label className={`grid gap-1.5 text-sm font-bold text-ink ${wide ? "col-span-full" : ""}`}>
            {label}
            <input className={`${input} h-11 font-normal`} name={name} type={type} placeholder={placeholder} required={required} />
        </label>
    )
}

export default function StaffConsole({ staff, meId }: { staff: StaffMember[], meId: string }) {
    const [dialog, setDialog] = useState<Dialog | null>(null)
    const [notice, setNotice] = useState("")
    const [query, setQuery] = useState("")
    const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("all")
    const ref = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        const element = ref.current
        if (!element) return
        if (dialog && !element.open) element.showModal()
        if (!dialog && element.open) element.close()
    }, [dialog])

    const close = useCallback(() => setDialog(null), [])
    const saved = useCallback((message: string) => () => { setNotice(message); setDialog(null) }, [])

    const counts = {
        total: staff.length,
        superAdmins: staff.filter((member) => member.role === "super-admin").length,
        admins: staff.filter((member) => member.role === "admin").length,
        pending: staff.filter((member) => member.status === "invited").length,
        suspended: staff.filter((member) => member.status === "disabled").length,
    }
    const rows = useMemo(() => {
        const needle = query.trim().toLowerCase()
        return staff.filter((member) =>
            (filter === "all" || member.role === filter || member.status === filter)
            && (!needle || member.name.toLowerCase().includes(needle) || member.email.toLowerCase().includes(needle)))
    }, [staff, query, filter])

    const member = dialog?.kind === "manage" ? dialog.member : null
    const isMe = member?.id === meId

    return (
        <div>
            <PageHeader
                title="Admins & staff"
                subtitle="Everyone who can sign in to the CHANGECARS console. There is one super admin; everyone else is an admin."
                actions={<button type="button" className={button.gold} onClick={() => { setNotice(""); setDialog({ kind: "invite" }) }}><Icon name="plus" size={16} />Invite administrator</button>}
            />

            {notice && (
                <div role="status" className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[#cfe9d9] bg-[#e7f5ec] px-4 py-3 text-sm font-bold text-[#1f7a4a]">
                    <span className="flex items-center gap-2"><Icon name="check" size={16} />{notice}</span>
                    <button type="button" aria-label="Dismiss" className="cursor-pointer border-0 bg-transparent text-[#1f7a4a]" onClick={() => setNotice("")}><Icon name="close" size={16} /></button>
                </div>
            )}

            <div className="mb-5 grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2 max-[600px]:gap-3">
                <StatCard label="Team members" value={String(counts.total)} icon="staff" hint={`${counts.superAdmins} super admin${counts.superAdmins === 1 ? "" : "s"} · ${counts.admins} admin${counts.admins === 1 ? "" : "s"}`} />
                <StatCard label="Active" value={String(counts.total - counts.pending - counts.suspended)} icon="check" hint="Signed in at least once" />
                <StatCard label="Invitations pending" value={String(counts.pending)} icon="leads" hint="Have not set a password yet" />
                <StatCard label="Suspended" value={String(counts.suspended)} icon="close" hint="Cannot sign in" />
            </div>

            <Card>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter team members">
                        {FILTERS.map(([value, label]) => (
                            <button key={value} type="button" role="tab" aria-selected={filter === value} onClick={() => setFilter(value)}
                                className={`h-8.5 cursor-pointer rounded-full border px-3.5 text-xs font-bold transition ${filter === value ? "border-gold bg-gold text-white" : "border-[#d9d4c8] bg-white text-ink hover:border-gold hover:text-gold"}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                    <label className="relative flex items-center">
                        <span className="pointer-events-none absolute left-3 text-[#6b6862]"><Icon name="search" size={16} /></span>
                        <input aria-label="Search team members" className={`${input} w-72 pl-9 max-[600px]:w-full`} placeholder="Search by name or email" value={query} onChange={(event) => setQuery(event.target.value)} />
                    </label>
                </div>

                <div className={table.wrap}>
                    <table className={table.table}>
                        <thead><tr>
                            <th className={table.head}>Team member</th>
                            <th className={table.head}>Role</th>
                            <th className={table.head}>Status</th>
                            <th className={table.head}>Last signed in</th>
                            <th className={`${table.head} text-right`}>Actions</th>
                        </tr></thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id} className={table.row}>
                                    <td className={table.cell}>
                                        <div className="flex items-center gap-3">
                                            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-sm font-black text-gold">{initials(row.name)}</span>
                                            <span className="min-w-0">
                                                <span className="block font-bold text-ink">{row.name}{row.id === meId && <span className="ml-2 rounded-full bg-[#f0eeea] px-2 py-0.5 text-[11px] font-bold text-[#5c5850]">You</span>}</span>
                                                <span className="block truncate text-xs text-[#6b6862]">{row.email}</span>
                                            </span>
                                        </div>
                                    </td>
                                    <td className={table.cell}>
                                        <span className={`inline-flex rounded-full px-2.5 py-0.75 text-xs font-bold ${row.role === "super-admin" ? "bg-gold/15 text-[#7a6230]" : "bg-[#e8f0fb] text-[#1f5fae]"}`}>{ROLE_LABELS[row.role]}</span>
                                    </td>
                                    <td className={table.cell}><StatusBadge status={row.status === "disabled" ? "suspended" : row.status} /></td>
                                    <td className={`${table.cell} whitespace-nowrap text-[#6b6862]`}>{row.lastActive ? formatDateTime(row.lastActive) : "Never"}</td>
                                    <td className={`${table.cell} text-right`}>
                                        <button type="button" className={button.small} onClick={() => { setNotice(""); setDialog({ kind: "manage", member: row }) }}>Manage</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!rows.length && <p className="m-0 px-5 py-10 text-center text-sm text-[#6b6862]">No team members match this filter.</p>}
                </div>
            </Card>

            <dialog ref={ref} onClose={close} onClick={(event) => { if (event.target === ref.current) close() }}
                className="m-auto w-[min(560px,calc(100vw-32px))] rounded-2xl border-0 bg-white p-0 text-ink shadow-[0_24px_64px_rgba(26,26,26,0.25)] backdrop:bg-[rgba(26,26,26,0.55)]">
                {dialog && (
                    <div className="p-6 max-[480px]:p-5">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="m-0 text-xl font-bold">{dialog.kind === "invite" ? "Invite an administrator" : member?.name}</h2>
                                <p className="mt-1 mb-0 text-sm text-[#6b6862]">{dialog.kind === "invite" ? "They receive an email with a link to set their password." : member?.email}</p>
                            </div>
                            <button type="button" aria-label="Close" className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-[#f4f2ee] text-ink hover:bg-[#ebe8e1]" onClick={close}><Icon name="close" size={16} /></button>
                        </div>

                        {dialog.kind === "invite" && (
                            <ManagementForm action="invite" label="Send invitation" className="grid grid-cols-2 gap-4 max-[480px]:grid-cols-1"
                                onSuccess={saved("Invitation sent. The new administrator appears below.")}
                                footer={<button type="button" className={button.outline} onClick={close}>Cancel</button>}>
                                <Field name="firstName" label="First name" placeholder="e.g. Thandi" />
                                <Field name="lastName" label="Last name" placeholder="e.g. Mokoena" />
                                <Field name="email" label="Work email" type="email" placeholder="name@changecars.co.za" wide />
                                <p className="col-span-full m-0 flex gap-2 rounded-lg bg-[#f7f5f0] p-3 text-sm text-[#5c5850]"><Icon name="staff" size={18} className="shrink-0 text-gold" /><span>They join as an <strong className="text-ink">Admin</strong>: they review dealers and listings, but cannot manage administrators or platform settings. The platform has one super admin.</span></p>
                                <hr className="col-span-full m-0 border-0 border-t border-[#ebe8e1]" />
                            </ManagementForm>
                        )}

                        {member && (isMe ? (
                            <p className="m-0 rounded-lg bg-[#f7f5f0] p-4 text-sm text-[#5c5850]">This is the platform&apos;s only super admin account. Its role and access cannot be changed here, so the console can never be left without a super admin.</p>
                        ) : (
                            <div className="grid gap-6">
                                <dl className="m-0 grid grid-cols-3 gap-4 rounded-xl bg-[#f7f5f0] p-4 text-sm max-[480px]:grid-cols-1">
                                    <div><dt className="text-xs font-bold text-[#6b6862] uppercase">Role</dt><dd className="m-0 mt-1 font-bold">{ROLE_LABELS[member.role]}</dd></div>
                                    <div><dt className="text-xs font-bold text-[#6b6862] uppercase">Status</dt><dd className="m-0 mt-1"><StatusBadge status={member.status === "disabled" ? "suspended" : member.status} /></dd></div>
                                    <div><dt className="text-xs font-bold text-[#6b6862] uppercase">Last signed in</dt><dd className="m-0 mt-1 font-bold">{member.lastActive ? formatDateTime(member.lastActive) : "Never"}</dd></div>
                                </dl>


                                <section className={`rounded-xl border p-4 ${member.status === "disabled" ? "border-[#cfe9d9] bg-[#f3faf6]" : "border-[#f3c9c4] bg-[#fdf6f5]"}`}>
                                    <h3 className="m-0 mb-1 text-base font-bold">{member.status === "disabled" ? "Restore access" : "Suspend access"}</h3>
                                    <p className="mt-0 mb-3 text-sm text-[#6b6862]">{member.status === "disabled" ? "They can sign in again straight away." : "They are signed out everywhere and cannot sign in until restored."}</p>
                                    <ManagementForm action="user-status" id={member.id} label={member.status === "disabled" ? "Restore access" : "Suspend access"} className="grid gap-3"
                                        danger={member.status !== "disabled"}
                                        onSuccess={saved(member.status === "disabled" ? `${member.name} can sign in again.` : `${member.name} was suspended.`)}
                                        footer={null}>
                                        <input type="hidden" name="status" value={member.status === "disabled" ? "ACTIVE" : "SUSPENDED"} />
                                        {member.status !== "disabled" && <Field name="reason" label="Reason (kept in the audit trail)" placeholder="e.g. Left the company" required={false} wide />}
                                    </ManagementForm>
                                </section>
                                <div className="flex justify-end border-t border-[#ebe8e1] pt-4"><button type="button" className={button.outline} onClick={close}>Close</button></div>
                            </div>
                        ))}
                    </div>
                )}
            </dialog>
        </div>
    )
}
