import { finishUpload, prepareUpload, type FormResult } from "./actions"

// Helpers the website's forms use on submit. They read inputs by the labels the inputs
// already have, call the Server Actions safely and upload picked files, so the forms'
// markup stays as designed.

export type FieldValues = Record<string, string | boolean>

// { "<aria-label or name>": value } for every input, select and textarea inside `root`.
export function readFields(root: HTMLElement | null): FieldValues {
    const values: FieldValues = {}
    if (!root) return values
    root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea").forEach((element) => {
        const key = element.getAttribute("aria-label") ?? element.getAttribute("name") ?? element.id
        if (!key) return
        if (element instanceof HTMLInputElement && element.type === "checkbox") values[key] = element.checked
        else if (element instanceof HTMLInputElement && element.type === "file") values[key] = element.files?.[0]?.name ?? ""
        else values[key] = element.value.trim()
    })
    return values
}

// Files picked in the file inputs inside `root` (only inputs that allow several files when `multiple` is set).
export function pickedFiles(root: ParentNode | null, options: { multiple?: boolean } = {}): File[] {
    const files: File[] = []
    root?.querySelectorAll<HTMLInputElement>("input[type=file]").forEach((input) => {
        if (options.multiple !== undefined && input.multiple !== options.multiple) return
        files.push(...Array.from(input.files ?? []))
    })
    return files
}

// Last part of the current URL path, e.g. the slug in /specials/<slug> or /car/<title>-<id>.
export function lastPathPart() {
    return decodeURIComponent(window.location.pathname.split("/").filter(Boolean).pop() ?? "")
}

// First field message, or the general message.
export function firstMessage(result: { message: string, fields: Record<string, string> }) {
    return Object.values(result.fields)[0] ?? result.message
}

const OFFLINE = "We could not reach CHANGECARS. Please check your internet connection and try again."

// Runs a Server Action; if the request itself fails (offline, server restarting) the form gets a message instead of a crash.
export async function callAction<T extends { ok: boolean }>(action: () => Promise<T>): Promise<T | { ok: false, message: string, fields: Record<string, string> }> {
    try {
        return await action()
    } catch (error) {
        console.error("Request failed", error)
        return { ok: false, message: OFFLINE, fields: {} }
    }
}

// ───────────── files ─────────────

export type UploadKind = "photo" | "document"

const MB = 1024 * 1024
const RULES: Record<UploadKind, { types: string[], maxBytes: number, maxFiles: number, typeMessage: string }> = {
    photo: { types: ["image/jpeg", "image/png", "image/webp"], maxBytes: 10 * MB, maxFiles: 20, typeMessage: "Photos must be JPG, PNG or WebP images" },
    document: { types: ["application/pdf", "image/jpeg", "image/png"], maxBytes: 5 * MB, maxFiles: 2, typeMessage: "Documents must be PDF, JPG or PNG files" },
}

// Checks picked files before the form is sent, so the visitor can fix them first. Returns "" when all is well.
export function checkFiles(files: File[], kind: UploadKind) {
    const rule = RULES[kind]
    if (files.length > rule.maxFiles) return kind === "photo" ? `Please choose at most ${rule.maxFiles} photos` : `Please choose at most ${rule.maxFiles} documents`
    const wrongType = files.find((file) => !rule.types.includes(file.type))
    if (wrongType) return `${rule.typeMessage} ("${wrongType.name}" is not)`
    const tooLarge = files.find((file) => file.size > rule.maxBytes)
    if (tooLarge) return `"${tooLarge.name}" is larger than ${rule.maxBytes / MB} MB`
    return ""
}

// Uploads files for a submitted form, one at a time, straight to storage. Never throws.
export async function uploadFiles(token: string | undefined, files: File[], kind: UploadKind): Promise<{ failed: number, message: string }> {
    if (!token || files.length === 0) return { failed: 0, message: "" }
    let failed = 0
    let message = ""
    for (const file of files) {
        try {
            const slot = await prepareUpload(token, kind, file.type)
            if (!slot.ok) throw new Error(slot.message)
            const response = await fetch(slot.uploadUrl, { method: "PUT", body: file, headers: { "content-type": slot.contentType }, signal: AbortSignal.timeout(120_000) })
            if (!response.ok) throw new Error(`Upload failed (${response.status})`)
            const done: FormResult = await finishUpload(token, kind, slot.storageKey, slot.contentType, file.name)
            if (!done.ok) throw new Error(done.message)
        } catch (error) {
            failed++
            if (!message) message = error instanceof Error && error.message && !/^Upload failed|fetch|network/i.test(error.message) ? error.message : ""
            console.error(`Uploading "${file.name}" failed`, error)
        }
    }
    return { failed, message }
}

// Text for the thank-you screen when some files did not upload (the request itself was saved).
export function uploadProblem(failed: number, total: number, kind: UploadKind, detail: string) {
    if (!failed) return ""
    const what = kind === "photo" ? (total === 1 ? "your photo" : failed === total ? "your photos" : `${failed} of your ${total} photos`) : "your document"
    return `We received your details, but ${what} could not be uploaded${detail ? ` (${detail})` : ""}. Our team will ask you for ${failed === 1 ? "it" : "them"} when they contact you.`
}
