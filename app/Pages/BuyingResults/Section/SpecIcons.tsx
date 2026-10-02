// Grey outline icons used in the app's result cards.

const props = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "#a3a3a3", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className: "shrink-0" };

export function YearIcon() {
    return <svg {...props}><rect x="3.5" y="5" width="17" height="15.5" rx="1.5" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></svg>
}

export function MileageIcon() {
    return <svg {...props}><path d="M4.2 17a9 9 0 1 1 15.6 0" /><path d="M12 13.5l4-4" /><circle cx="12" cy="13.5" r="1.3" /><path d="M7 17h10" /></svg>
}

export function FuelIcon() {
    return <svg {...props}><path d="M4.5 21V5a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 14.5 5v16M3 21h13" /><path d="M7 7.5h5v4H7z" /><path d="M14.5 10h2a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 0 3 0V8.5L18 5.5" /></svg>
}

export function GearboxIcon() {
    return <svg {...props}><path d="M5 4v16M12 4v8M19 4v8M5 12h14" /><circle cx="5" cy="4" r="1" /><circle cx="12" cy="4" r="1" /><circle cx="19" cy="4" r="1" /></svg>
}

export function BodyIcon() {
    return <svg {...props}><path d="M3.5 16.5v-4.2l2-4.8A2 2 0 0 1 7.3 6.3h9.4a2 2 0 0 1 1.8 1.2l2 4.8v4.2z" /><path d="M3.5 12.3h17" /><path d="M6 16.5V19M18 16.5V19" /><circle cx="7.5" cy="14.2" r=".8" fill="#a3a3a3" /><circle cx="16.5" cy="14.2" r=".8" fill="#a3a3a3" /></svg>
}

export function EngineIcon() {
    return <svg {...props}><path d="M3 10v6M3 13h2.5M5.5 9.5h3.5V7.5h5v2h3l2 2.5H21v4h-2l-2 2.5H8.5L5.5 16z" /><path d="M10 7.5V5.5h3" /></svg>
}

export function PinIcon() {
    return <svg width="12" height="15" viewBox="0 0 10 13" fill="none" stroke="#957e4e" strokeWidth="1.1" className="shrink-0"><path d="M5 12s4-4.3 4-7.2A4 4 0 0 0 1 4.8C1 7.7 5 12 5 12z" /><circle cx="5" cy="4.8" r="1.4" /></svg>
}

export function InfoIcon() {
    return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#957e4e" strokeWidth="1.3" className="shrink-0"><circle cx="8" cy="8" r="6.8" /><path d="M8 7.2v4.3" strokeLinecap="round" /><circle cx="8" cy="4.8" r=".7" fill="#957e4e" stroke="none" /></svg>
}
