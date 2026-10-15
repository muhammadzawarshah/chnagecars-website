import { Permission, can } from "@/app/lib/dashboard/permissions"
import { Role } from "@/app/lib/dashboard/types"
import { IconName } from "../ui/Icon"

export type NavItem = {
    href: string
    label: string
    icon: IconName
    exact?: boolean
    activePaths?: string[]
}

type NavDefinition = Omit<NavItem, "href"> & { path: string, permission: Permission }

const consoleItems: NavDefinition[] = [
    { path: "", label: "Overview", icon: "overview", exact: true, permission: "platform.view" },
    { path: "/dealers", activePaths: ["/manage/dealers"], label: "Dealers", icon: "dealers", permission: "dealers.view" },
    { path: "/compare", label: "Compare dealers", icon: "compare", permission: "dealers.compare" },
    { path: "/listings", activePaths: ["/manage/vehicles"], label: "Listings", icon: "listings", permission: "listings.moderate" },
    { path: "/staff", label: "Admins & staff", icon: "staff", permission: "staff.manage" },
    ...[
        // Leads & enquiries is hidden for now; the page still works at /leads.
        ["customers", "Customers", "staff"], ["blogs", "Blogs", "blog"],
        ["catalogue", "Catalogue", "listings"], ["quality", "Data quality", "check"],
        // Feed imports, App snapshots and Background processing are developer tools: still
        // reachable by URL (/imports, /snapshots, /system) but kept out of the menu.
        ["content", "Content", "website"], ["reports", "Reports", "compare"],
        ["audit", "Audit trail", "eye"], ["settings", "Settings", "menu"],
    ].map(([path, label, icon]) => ({ path: `/${path}`, label, icon: icon as IconName, permission: "console.manage" as Permission })),
];

const dealerItems: NavDefinition[] = [
    { path: "", label: "Overview", icon: "overview", exact: true, permission: "inventory.own" },
    { path: "/inventory", label: "Inventory", icon: "listings", permission: "inventory.own" },
    { path: "/leads", label: "Leads", icon: "leads", permission: "leads.own" },
];

function build(items: NavDefinition[], role: Role, base: string): NavItem[] {
    return items.filter((item) => can(role, item.permission)).map((item) => ({
        label: item.label, icon: item.icon, exact: item.exact, href: `${base}${item.path}`, activePaths: item.activePaths?.map(path => `${base}${path}`),
    }));
}

// Admin and super admin share one console; the menu shows only what the role may use.
export function consoleNav(role: Role, base: string) {
    return build(consoleItems, role, base);
}

// The dealer menu, also used when a super admin opens a dealer's dashboard.
export function dealerNav(base: string) {
    return build(dealerItems, "dealer", base);
}
