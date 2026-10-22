import { ReactNode } from "react"

export default function PageHeader({ title, subtitle, actions }: { title: string, subtitle?: ReactNode, actions?: ReactNode }) {
    return (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
                <h1 className="m-0 text-[26px] leading-8 font-light text-ink uppercase max-[600px]:text-[22px]">{title}</h1>
                {subtitle && <p className="mt-1.5 mb-0 text-sm text-[#6b6862]">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
        </div>
    )
}
