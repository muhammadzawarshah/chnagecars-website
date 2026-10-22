import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { superadminHome } from "@/app/lib/dashboard/superadmin"

// Old links and bookmarks to the super admin console go to the separate superadmin app,
// which serves the same paths.
export function GET(request: NextRequest) {
    return NextResponse.redirect(new URL(superadminHome(request.nextUrl.pathname + request.nextUrl.search), request.url))
}
