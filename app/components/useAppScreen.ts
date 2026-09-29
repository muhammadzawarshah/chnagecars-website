"use client"

import { usePathname } from "next/navigation"

// Pages that copy an app screen on mobile: they bring their own top bar,
// so the site AppBar and floating buttons are hidden below 981px.
const appScreens: string[] = [];

export default function useAppScreen() {
    const pathname = usePathname();
    return appScreens.some((path) => pathname.startsWith(path));
}
