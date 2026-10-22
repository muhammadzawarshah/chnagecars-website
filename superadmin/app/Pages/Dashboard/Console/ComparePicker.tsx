"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import Icon from "../ui/Icon"
import { input } from "../ui/format"
import { MAX_COMPARE } from "./DealersTable"

type ComparePickerProps = {
    base: string
    selected: { id: string, name: string, color: string }[]
    options: { id: string, name: string }[]
}

export default function ComparePicker({ base, selected, options }: ComparePickerProps) {

    const router = useRouter();
    const ids = selected.map((dealer) => dealer.id);
    const href = (next: string[]) => `${base}/compare?ids=${next.join(",")}`;
    const available = options.filter((option) => !ids.includes(option.id));

    return (
        <>
            <div className="flex flex-wrap items-center gap-2">
                {selected.map((dealer) => (
                    <span key={dealer.id} className="flex h-9 items-center gap-2 rounded-full border border-[#e3dfd6] bg-white pr-1.5 pl-3 text-sm font-bold">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: dealer.color }}></span>
                        {dealer.name}
                        <Link href={href(ids.filter((id) => id !== dealer.id))} aria-label={`Remove ${dealer.name}`} className="flex size-6 items-center justify-center rounded-full text-[#8a857b] hover:bg-[#f0eeea] hover:text-ink"><Icon name="close" size={13} /></Link>
                    </span>
                ))}
                {ids.length < MAX_COMPARE && available.length > 0 && (
                    <label>
                        <span className="sr-only">Add dealer to compare</span>
                        <select value="" onChange={(event) => event.target.value && router.push(href([...ids, event.target.value]))} className={`${input} cursor-pointer`}>
                            <option value="">+ Add dealer</option>
                            {available.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                        </select>
                    </label>
                )}
            </div>
        </>
    )
}
