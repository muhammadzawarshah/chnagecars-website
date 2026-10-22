"use client"

import { startTransition, useActionState, useEffect } from "react"
import { manageConsole, ActionState } from "@/app/lib/dashboard/console-actions"
import { button } from "../ui/format"

export default function ManagementForm({ action, id, children, label = "Save", className = "flex flex-wrap items-end gap-3", onSuccess, footer, danger = false }: { action: string, id?: string, children?: React.ReactNode, label?: string, className?: string, onSuccess?: () => void, footer?: React.ReactNode, danger?: boolean }) {
    const [state, submit, pending] = useActionState(manageConsole, {} as ActionState)
    // Lets a dialog close itself once the change is saved.
    useEffect(() => { if (state.success) onSuccess?.() }, [state, onSuccess])
    // Submitted by hand rather than with `action`, so React does not clear the fields when the API refuses the change.
    return <form className={className} onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); startTransition(() => submit(data)) }}>
        <input type="hidden" name="action" value={action} />
        {id && <input type="hidden" name="id" value={id} />}
        {children}
        {state.error && footer !== undefined && <p role="alert" className="col-span-full m-0 rounded-lg bg-[#fdecea] px-3 py-2 text-sm text-[#b42318]">{state.error}</p>}
        {footer !== undefined
            // Dialog layout: secondary actions and the submit button in a right-aligned footer.
            ? <div className="col-span-full flex justify-end gap-3">{footer}<button className={danger ? button.danger : button.gold} disabled={pending}>{pending ? "Saving…" : label}</button></div>
            : <button className={button.gold} disabled={pending}>{pending ? "Saving…" : label}</button>}
        {state.error && footer === undefined && <p role="alert" className="w-full text-sm text-red-700">{state.error}</p>}
        {state.success && footer === undefined && <p role="status" className="w-full text-sm text-green-800">{state.success}</p>}
    </form>
}
