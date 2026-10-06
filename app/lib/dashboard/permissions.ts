import { Role } from "./types"

// What each role may do. Screens and navigation check permissions, never role names,
// so adding a role or moving a right is a one-line change here.
export type Permission =
    | "platform.view"
    | "dealers.view"
    | "dealers.manage"
    | "dealers.compare"
    | "dealers.viewAs"
    | "listings.moderate"
    | "staff.manage"
    | "inventory.own"
    | "leads.own"

const allPermissions: Permission[] = [
    "platform.view", "dealers.view", "dealers.manage", "dealers.compare", "dealers.viewAs",
    "listings.moderate", "staff.manage", "inventory.own", "leads.own",
];

export const rolePermissions: Record<Role, Permission[]> = {
    "super-admin": allPermissions,
    "admin": ["platform.view", "dealers.view", "dealers.manage", "listings.moderate"],
    "dealer": ["inventory.own", "leads.own"],
};

export const roleLabels: Record<Role, string> = {
    "super-admin": "Super Admin",
    "admin": "Admin",
    "dealer": "Dealer",
};

export function can(role: Role, permission: Permission) {
    return rolePermissions[role].includes(permission);
}
