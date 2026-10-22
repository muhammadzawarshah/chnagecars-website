"use client"

import { useState } from "react"
import Icon, { IconName } from "../ui/Icon"
import Modal from "../ui/Modal"
import { button } from "../ui/format"
import ManagementForm from "./ManagementForm"

// A button that opens a console form in a dialog, so pages show records rather than open forms.
// `small` is the row-level "Edit" style used inside tables.
export default function FormDialog({ trigger, title, subtitle, action, id, submitLabel = "Save changes", icon = "edit", small = false, danger = false, width, children }: {
    trigger: string, title: string, subtitle?: string, action: string, id?: string, submitLabel?: string, icon?: IconName, small?: boolean, danger?: boolean, width?: number, children: React.ReactNode,
}) {
    const [open, setOpen] = useState(false)
    return <>
        <button type="button" className={small ? button.small : button.gold} onClick={() => setOpen(true)}><Icon name={icon} size={small ? 13 : 16} />{trigger}</button>
        <Modal open={open} onClose={() => setOpen(false)} title={title} subtitle={subtitle} width={width}>
            <ManagementForm action={action} id={id} label={submitLabel} className="grid gap-4" danger={danger} onSuccess={() => setOpen(false)}
                footer={<button type="button" className={button.outline} onClick={() => setOpen(false)}>Cancel</button>}>
                {children}
            </ManagementForm>
        </Modal>
    </>
}
