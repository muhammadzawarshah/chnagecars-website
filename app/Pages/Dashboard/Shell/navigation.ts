import { Permission, can } from "@/app/lib/dashboard/permissions"
import { Role } from "@/app/lib/dashboard/types"
import { IconName } from "../ui/Icon"

export type NavItem = {
    href: string
    label: string
    icon: IconName
    exact?: boolean
}

type NavDefinition = Omit<NavItem, "href"> & { path: string, permission: Permission }

const consoleItems: NavDefinition[] = [
    { path: "", label: "Overview", icon: "overview", exact: true, permission: "platform.view" },
    { path: "/dealers", label: "Dealers", icon: "dealers", permission: "dealers.view" },
    { path: "/compare", label: "Compare dealers", icon: "compare", permission: "dealers.compare" },
    { path: "/listings", label: "Listings", icon: "listings", permission: "listings.moderate" },
    { path: "/staff", label: "Admins & staff", icon: "staff", permission: "staff.manage" },
];

const dealerItems: NavDefinition[] = [
    { path: "", label: "Overview", icon: "overview", exact: true, permission: "inventory.own" },
    { path: "/inventory", label: "Inventory", icon: "listings", permission: "inventory.own" },
    { path: "/leads", label: "Leads", icon: "leads", permission: "leads.own" },
];

function build(items: NavDefinition[], role: Role, base: string): NavItem[] {
    return items.filter((item) => can(role, item.permission)).map(({ path, permission: _permission, ...item }) => ({ ...item, href: `${base}${path}` }));
}

// Admin and super admin share one console; the menu shows only what the role may use.
export function consoleNav(role: Role, base: string) {
    return build(consoleItems, role, base);
}

// The dealer menu, also used when a super admin opens a dealer's dashboard.
export function dealerNav(base: string) {
    return build(dealerItems, "dealer", base);
}
