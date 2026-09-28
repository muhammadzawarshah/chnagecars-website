import { ReactNode } from "react"

type LoginFieldProps = {
    type: string
    placeholder: string
    value: string
    error: string
    icon: ReactNode
    onChange: (value: string) => void
}

export default function LoginField({ type, placeholder, value, error, icon, onChange }: LoginFieldProps) {
    return (
        <>
            <div>
                <label className="flex h-11 items-center gap-4.5 border-b-2 border-[#d9d9d9] focus-within:border-[#957e4e]">
                    <span className="flex w-5 shrink-0 justify-center">{icon}</span>
                    <input
                        type={type}
                        value={value}
                        placeholder={placeholder}
                        onChange={(e) => onChange(e.target.value)}
                        className="h-full w-full border-0 bg-transparent font-roboto text-[17px] text-black outline-none placeholder:text-[#a6a4a4]"
                    />
                </label>
                {error && <p className="mt-1.5 mb-0 text-xs text-[#e53935]">{error}</p>}
            </div>
        </>
    )
}
