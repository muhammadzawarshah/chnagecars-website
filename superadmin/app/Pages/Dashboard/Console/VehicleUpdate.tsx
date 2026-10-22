"use client"

import { useState } from "react"
import Icon from "../ui/Icon"
import Modal from "../ui/Modal"
import { button, input } from "../ui/format"
import ManagementForm from "./ManagementForm"

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
const NEEDS_REASON = ["reject", "suspend", "archive"]
// Statuses in which the backend accepts price, colour, description and stock number changes.
const EDITABLE = ["DRAFT", "REJECTED", "APPROVED", "PUBLISHED", "RESERVED", "SUSPENDED"]

export type VehicleValues = { price: string, specialPrice: string, colour: string, stockNumber: string, description: string, isFeatured: boolean, isSpecial: boolean }

const statusLabel = (status: string) => { const words = status.replaceAll("_", " ").toLowerCase(); return words.charAt(0).toUpperCase() + words.slice(1) }

function Section({ title, children }: { title: string, children: React.ReactNode }) {
    return <fieldset className="m-0 grid gap-3 border-0 border-t border-[#ebe8e1] p-0 pt-4 first:border-t-0 first:pt-0"><legend className="float-left mb-1 w-full p-0 text-xs font-bold tracking-wide text-[#6b6862] uppercase">{title}</legend>{children}</fieldset>
}
function Field({ name, label, value, type = "text", required = false }: { name: string, label: string, value: string, type?: string, required?: boolean }) {
    return <label className="grid gap-1 text-sm font-bold">{label}<input className={`${input} w-full font-normal`} name={name} type={type} defaultValue={value} required={required} /></label>
}

// One "Update listing" button; status, listing details and website highlights are edited together in a dialog.
export default function VehicleUpdate({ id, title, status, values }: { id: string, title: string, status: string, values: VehicleValues }) {
    const [open, setOpen] = useState(false)
    const [transition, setTransition] = useState("")
    const actions = ACTIONS[status] ?? []
    const editable = EDITABLE.includes(status)
    return <>
        <button type="button" className={button.gold} onClick={() => { setTransition(""); setOpen(true) }}><Icon name="edit" size={16} />Update listing</button>
        <Modal open={open} onClose={() => setOpen(false)} title="Update listing" subtitle={title} width={640}>
            <ManagementForm action="vehicle-update" id={id} label="Save changes" className="grid gap-4" onSuccess={() => setOpen(false)}
                footer={<button type="button" className={button.outline} onClick={() => setOpen(false)}>Cancel</button>}>
                {editable && <>
                    <input type="hidden" name="current-price" value={values.price} />
                    <input type="hidden" name="current-specialPrice" value={values.specialPrice} />
                    <input type="hidden" name="current-colour" value={values.colour} />
                    <input type="hidden" name="current-stockNumber" value={values.stockNumber} />
                    <input type="hidden" name="current-description" value={values.description} />
                </>}
                <input type="hidden" name="current-isFeatured" value={String(values.isFeatured)} />
                <input type="hidden" name="current-isSpecial" value={String(values.isSpecial)} />

                <Section title="Status">
                    {actions.length ? <>
                        <label className="grid gap-1 text-sm font-bold">Action
                            <select name="transition" className={`${input} w-full font-normal`} value={transition} onChange={event => setTransition(event.target.value)}>
                                <option value="">Keep as {statusLabel(status)}</option>
                                {actions.map(action => <option key={action} value={action}>{ACTION_LABELS[action]}</option>)}
                            </select>
                        </label>
                        {NEEDS_REASON.includes(transition) && <label className="grid gap-1 text-sm font-bold">Reason<span className="text-xs font-normal text-[#6b6862]">Required to reject, suspend or archive.</span>
                            <textarea name="reason" rows={2} required maxLength={1000} className="w-full rounded-lg border border-[#d9d4c8] p-3 text-sm font-normal outline-none focus:border-gold" />
                        </label>}
                    </> : <p className="m-0 text-sm text-[#6b6862]">No admin actions are available for a {statusLabel(status).toLowerCase()} listing.</p>}
                </Section>

                {editable && <Section title="Listing details">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field name="price" label="Price (R)" type="number" value={values.price} required />
                        <Field name="specialPrice" label="Special price (R)" type="number" value={values.specialPrice} />
                        <Field name="colour" label="Colour" value={values.colour} />
                        <Field name="stockNumber" label="Stock number" value={values.stockNumber} />
                    </div>
                    <label className="grid gap-1 text-sm font-bold">Description<textarea name="description" rows={5} defaultValue={values.description} className="w-full rounded-lg border border-[#d9d4c8] p-3 text-sm font-normal outline-none focus:border-gold" /></label>
                </Section>}

                <Section title="Highlight on the website">
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isFeatured" defaultChecked={values.isFeatured} /> Featured</label>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isSpecial" defaultChecked={values.isSpecial} /> On special</label>
                    </div>
                </Section>
            </ManagementForm>
        </Modal>
    </>
}
