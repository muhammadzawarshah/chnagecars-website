const paths = {
    overview: "M3 3h7v7H3zM14 3h7v4h-7zM14 11h7v10h-7zM3 14h7v7H3z",
    dealers: "M3 9l1.5-5h15L21 9M3 9h18M3 9v11h18V9M9 20v-6h6v6",
    compare: "M5 20V10M12 20V4M19 20v-7",
    listings: "M4 15l1.6-5.2A2 2 0 0 1 7.5 8.4h9a2 2 0 0 1 1.9 1.4L20 15M4 15h16v4H4zM7 19v2M17 19v2",
    staff: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c.6-3.8 3.4-6 7-6s6.4 2.2 7 6M16 4a4 4 0 0 1 0 7M18 15c2 .8 3.4 2.8 4 6",
    leads: "M4 4h16v12H8l-4 4zM8 9h8M8 12h5",
    website: "M10 6H5v13h13v-5M14 4h6v6M20 4l-9 9",
    menu: "M3 6h18M3 12h18M3 18h18",
    close: "M5 5l14 14M19 5L5 19",
    search: "M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM21 21l-5.2-5.2",
    up: "M12 19V5M5 12l7-7 7 7",
    down: "M12 5v14M5 12l7 7 7-7",
    eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    phone: "M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2",
    check: "M5 12l5 5 9-10",
    back: "M19 12H5M11 5l-7 7 7 7",
}

export type IconName = keyof typeof paths

export default function Icon({ name, size = 18, className = "" }: { name: IconName, size?: number, className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`shrink-0 ${className}`}>
            <path d={paths[name]} />
        </svg>
    )
}
