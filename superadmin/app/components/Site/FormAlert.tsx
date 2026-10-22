// A small message inside a form, right where the visitor is looking (never a pop-up or toast).
// "dark" sits on the gold or photo-backed cards, "light" on white forms. Renders nothing without a message.
export default function FormAlert({ message, tone = "light", className = "" }: { message?: string, tone?: "light" | "dark", className?: string }) {
    if (!message) return null
    const look = tone === "dark"
        ? "border-l-[3px] border-[#ff4d4d] bg-black/55 text-white"
        : "border border-[#f3c9c6] bg-[#fdf1f0] text-[#b3261e]"
    return (
        <p role="alert" aria-live="assertive" className={`m-0 flex items-start gap-2 rounded-[5px] px-3 py-2.5 text-left font-sans text-[13px] leading-[18px] ${look} ${className}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mt-px shrink-0">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8 4.5v4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="8" cy="11.3" r="0.9" fill="currentColor" />
            </svg>
            <span>{message}</span>
        </p>
    )
}
