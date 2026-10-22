// The super admin console is its own app (superadmin/ in this repository), hosted separately.
// SUPERADMIN_URL is its address, e.g. https://admin.changecars.co.za. Without it super admins
// use the admin console here, which they are allowed to open.
export function superadminHome(path = "/dashboard/super-admin") {
    const base = process.env.SUPERADMIN_URL?.replace(/\/+$/, "");
    return base ? `${base}${path}` : "/dashboard/admin";
}
