import { ReactNode } from "react"

type AuthLink = {
    label: string
    strong: string
    onClick: () => void
}

type AuthFormProps = {
    title: string
    highlight: string
    description?: ReactNode
    primaryLabel: string
    compact?: boolean
    links: AuthLink[]
    onPrimary: () => void
    onClose: () => void
    children: ReactNode
}

export default function AuthForm({ title, highlight, description, primaryLabel, compact = false, links, onPrimary, onClose, children }: AuthFormProps) {

    const button = "float-right ml-3.75 block h-10 w-38 cursor-pointer rounded-[5px] bg-text-dark text-center text-sm leading-10 font-medium text-white shadow-[0_3px_6px_rgba(0,0,0,0.07)] transition duration-300 hover:opacity-80";

    return (
        <div className={`relative float-left w-3/5 overflow-auto max-[841px]:float-none max-[841px]:w-full max-[841px]:p-5 ${compact ? "px-17.5 pt-10.25 pb-0" : "px-17.5 pt-32.5 pb-7.5"}`}>
            <a onClick={onClose} className="absolute top-8 right-8 block size-3.75 cursor-pointer bg-[url(/img/close-popup.svg)] bg-contain bg-center bg-no-repeat"></a>
            <h4 className={`mx-0 mt-0 text-2xl leading-7.25 font-light text-white uppercase ${description ? "mb-3.75" : "mb-13.75"}`}>
                {title} <strong className="block text-[32px] font-bold">{highlight}</strong>
            </h4>
            {description}
            <ul className="m-0 flow-root p-0">
                {children}
                <li className="relative float-left clear-left mx-0 mt-0 mb-6.25 block h-11.25 w-full p-0 max-[841px]:[&>a]:my-5">
                    <a onClick={onPrimary} className={button}>{primaryLabel}</a>
                    <a onClick={onClose} className={button}>Close</a>
                </li>
            </ul>
            <div className="w-full overflow-hidden">
                {links.map((link) => (
                    <a key={link.label} onClick={link.onClick} className={`float-left cursor-pointer text-center text-xs text-white opacity-70 hover:opacity-100 ${links.length === 1 ? "w-full" : "w-1/2"}`}>
                        {link.label} <strong className="font-black underline">{link.strong}</strong>
                    </a>
                ))}
            </div>
        </div>
    )
}
