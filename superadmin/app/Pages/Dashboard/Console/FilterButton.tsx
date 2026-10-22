"use client"

import { useFormStatus } from "react-dom"
import { button } from "../ui/format"

// Submit button for a filter <Form>: filters apply without a full page reload, so show that one is running.
export default function FilterButton({ label = "Search" }: { label?: string }) {
    const { pending } = useFormStatus()
    return <button className={button.outline} disabled={pending} aria-busy={pending}>{pending ? "Applying…" : label}</button>
}
