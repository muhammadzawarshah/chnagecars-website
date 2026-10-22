"use client"

import { useState } from "react"
import Icon from "../ui/Icon"
import Modal from "../ui/Modal"
import { button, input } from "../ui/format"
import ManagementForm from "./ManagementForm"

const label = (value: string) => value.replaceAll("_", " ")

// One "Update dealer" button; status, reason and plan are edited together in a dialog.
export default function DealerUpdate({ id, name, status, plan, reason }: { id: string, name: string, status: string, plan: string, reason: string }) {
    const [open, setOpen] = useState(false)
    const [nextStatus, setNextStatus] = useState(status)
    const needsReason = nextStatus !== status && nextStatus !== "APPROVED"
    return <>
        <button type="button" className={button.gold} onClick={() => { setNextStatus(status); setOpen(true) }}><Icon name="edit" size={16} />Update dealer</button>
        <Modal open={open} onClose={() => setOpen(false)} title="Update dealer" subtitle={name}>
            <ManagementForm action="dealer-update" id={id} label="Save changes" className="grid gap-4" onSuccess={() => setOpen(false)}
                footer={<button type="button" className={button.outline} onClick={() => setOpen(false)}>Cancel</button>}>
                <input type="hidden" name="currentStatus" value={status} />
                <input type="hidden" name="currentPlan" value={plan} />
                <label className="grid gap-1 text-sm font-bold">Status
                    <select name="status" className={`${input} w-full font-normal`} value={nextStatus} onChange={event => setNextStatus(event.target.value)}>
                        {["PENDING", "APPROVED", "REJECTED", "SUSPENDED"].map(option => <option key={option} value={option} disabled={option === "PENDING" && status !== "PENDING"}>{label(option)}</option>)}
                    </select>
                </label>
                {needsReason && <label className="grid gap-1 text-sm font-bold">Reason<span className="text-xs font-normal text-[#6b6862]">Shown to the dealer when rejecting or suspending.</span>
                    <textarea name="reason" rows={3} required maxLength={1000} defaultValue={reason} className="w-full rounded-lg border border-[#d9d4c8] p-3 text-sm font-normal outline-none focus:border-gold" />
                </label>}
                <label className="grid gap-1 text-sm font-bold">Subscription plan
                    <select name="plan" className={`${input} w-full font-normal`} defaultValue={plan}>
                        {["BASIC", "SILVER", "GOLD"].map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                </label>
            </ManagementForm>
        </Modal>
    </>
}
