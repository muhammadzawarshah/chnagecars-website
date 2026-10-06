import { Role } from "./types"

// Stand-in for the signed-in user until login is connected to the backend.
// The real version reads the session cookie/token and returns the user's role and dealer.
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

export async function getDashboardUser(role: Role): Promise<DashboardUser> {
    return demoUsers[role];
}
