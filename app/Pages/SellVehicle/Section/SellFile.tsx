import { ReactNode } from "react"

type SellFileProps = {
    placeholder: string
    icon: ReactNode
    multiple?: boolean
    accept?: string
    files: string[]
    error?: boolean
    onChange: (files: string[]) => void
}

export default function SellFile({ placeholder, icon, multiple = false, accept, files, error = false, onChange }: SellFileProps) {
    return (
        <>
            <label className={`flex h-9.5 w-full cursor-pointer items-center gap-2.5 rounded-md border bg-[#fafafa] px-3 text-[11.5px] ${error ? "border-[#e53935]" : "border-[#e0e0e0]"}`}>
                <span className="flex w-4 shrink-0 justify-center">{icon}</span>
                <span className={`truncate ${files.length ? "text-[#222]" : "text-[#9e9e9e]"}`}>{files.length ? files.join(", ") : placeholder}</span>
                <input type="file" multiple={multiple} accept={accept} className="hidden" onChange={(e) => onChange([...(e.target.files ?? [])].map((file) => file.name))} />
            </label>
        </>
    )
}
