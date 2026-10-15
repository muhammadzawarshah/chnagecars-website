import { redirect } from "next/navigation"
import { authGet, backendEnabled } from "../backend/client"
import { Role } from "./types"

// The signed-in user for the dashboards. With API_URL set it comes from the login session
// (cookie set by the login form and refreshed by proxy.ts).
export type DashboardUser = {
    name: string
    role: Role
    dealerId?: string
}

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

// This standalone app admits SUPER_ADMIN accounts only.
export async function getDashboardUser(role: Role): Promise<DashboardUser> {
    if (!backendEnabled()) throw new Error("Configure API_URL before opening superadmin.");
    const me = await authGet<ApiUser>("/auth/me");
    if (!me) redirect("/login");
    const actual = roles[me.role];
    if (actual !== "super-admin" || role !== "super-admin") redirect("/login");
    return { name: `${me.firstName} ${me.lastName}`.trim(), role: actual, dealerId: me.dealer?.id };
}
