import { redirect } from "next/navigation"
import { authGet, backendEnabled } from "../backend/client"
import { Role } from "./types"

// The signed-in user for the dashboards. With API_URL set it comes from the login session
// (cookie set by the login form, refreshed by proxy.ts); without it the demo users below are used.
export type DashboardUser = {
    name: string
    role: Role
    dealerId?: string
}

const demoUsers: Record<Role, DashboardUser> = {
    "super-admin": { name: "Zawar Shah", role: "super-admin" },
    "admin": { name: "Natasha Pillay", role: "admin" },
    "dealer": { name: "Thabo Nkosi", role: "dealer", dealerId: "d1" },
};

type ApiUser = {
    firstName: string
    lastName: string
    role: "CUSTOMER" | "DEALER" | "ADMIN" | "SUPER_ADMIN"
    dealer: { id: string } | null
}

const roles: Partial<Record<ApiUser["role"], Role>> = { SUPER_ADMIN: "super-admin", ADMIN: "admin", DEALER: "dealer" };

export const dashboardHome: Record<Role, string> = {
    "super-admin": "/dashboard/super-admin",
    "admin": "/dashboard/admin",
    "dealer": "/dashboard/dealer",
};

// `role` is the dashboard being opened. A user who may not open it is sent to their own
// dashboard (a super admin may also use the admin console); visitors without a dashboard go home.
export async function getDashboardUser(role: Role): Promise<DashboardUser> {
    if (!backendEnabled()) return demoUsers[role];
    const me = await authGet<ApiUser>("/auth/me");
    if (!me) redirect("/login");
    const actual = roles[me.role];
    if (!actual) redirect("/");
    if (actual !== role && !(actual === "super-admin" && role === "admin")) redirect(dashboardHome[actual]);
    return { name: `${me.firstName} ${me.lastName}`.trim(), role: actual, dealerId: me.dealer?.id };
}
