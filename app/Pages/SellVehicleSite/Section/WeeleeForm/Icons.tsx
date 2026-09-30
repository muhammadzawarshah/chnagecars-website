export function ChevronIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="10" viewBox="0 0 16 10" fill="none" className="block">
            <path d="M14.8107 1.81055C15.2249 1.39633 15.2249 0.72476 14.8107 0.310547C14.3964 -0.103666 13.7249 -0.103666 13.3107 0.310547L7.56066 6.06055L1.81066 0.310547C1.39645 -0.103666 0.724874 -0.103666 0.31066 0.310547C-0.103553 0.72476 -0.103553 1.39633 0.31066 1.81055L7.56066 9.06055L14.8107 1.81055Z" fill="#000000" />
        </svg>
    )
}

export function ClearIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" className="block">
            <circle cx="9" cy="9" r="7" fill="#999999" />
            <path d="M6.2 6.2L11.8 11.8M11.8 6.2L6.2 11.8" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    )
}

export function PinIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" className="block">
            <path d="M12 21.5C12 21.5 5 14.9 5 9.5C5 5.63 8.13 2.5 12 2.5C15.87 2.5 19 5.63 19 9.5C19 14.9 12 21.5 12 21.5Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
            <circle cx="12" cy="9.5" r="2.6" fill="currentColor" />
        </svg>
    )
}

export function EditIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="block size-[30.6px] fill-current">
            <path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z" />
        </svg>
    )
}

// The live form's Font Awesome glyphs fail to load, so the browser draws its "missing glyph" box instead.
export function MissingGlyph({ className }: { className: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 12" fill="none" className={className}>
            <rect x="0.5" y="0.5" width="8" height="11" stroke="currentColor" />
            <path d="M1.5 1.5L7.5 10.5M7.5 1.5L1.5 10.5" stroke="currentColor" />
        </svg>
    )
}
