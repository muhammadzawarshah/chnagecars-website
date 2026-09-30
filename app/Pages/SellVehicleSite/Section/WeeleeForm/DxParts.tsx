// Shared pieces of the DevExtreme editors used by the WeeLee form.

export function editorBorder(valid: boolean, invalid: boolean, focused: boolean) {
    if (valid) return "border-2 border-gold";
    if (invalid) return focused ? "border border-[#d9534f]" : "border border-[rgba(217,83,79,0.4)]";
    if (focused) return "border border-[#337ab7]";
    return "border border-[#c8c8c8] hover:border-[rgba(51,122,183,0.4)]";
}

export function Placeholder({ text, top = false }: { text: string, top?: boolean }) {
    return (
        <div className={`pointer-events-none absolute top-0 left-0 flex max-w-full font-dx text-lg leading-[1.35715] text-[#999] ${top ? "" : "h-full items-center"}`}>
            <span className="truncate pt-[7px] pr-[9px] pb-2 pl-[9px]">{text}</span>
        </div>
    )
}

export function InvalidBadge() {
    return <span className="pointer-events-none absolute top-1/2 right-1 -mt-[9px] size-[18px] rounded-full bg-[#d9534f] text-center font-dx text-[13px] leading-[18px] font-bold text-white">!</span>
}

export function ValidBadge({ right }: { right: string }) {
    return <span className={`pointer-events-none absolute top-1/2 ${right} z-1 -mt-[9px] size-[18px] rounded-full bg-gold text-center font-dx text-[13px] leading-[18px] font-bold text-white`}>✔</span>
}

export function InvalidMessage({ text }: { text: string }) {
    return <div className="absolute top-[calc(100%+1px)] left-[-1px] z-10 rounded-[4px] bg-[#d9534f] p-2.5 font-dx text-[11.9px] leading-[normal] whitespace-nowrap text-white">{text}</div>
}
