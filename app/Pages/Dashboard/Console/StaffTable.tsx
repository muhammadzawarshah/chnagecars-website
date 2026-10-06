import { roleLabels } from "@/app/lib/dashboard/permissions"
import { StaffUser } from "@/app/lib/dashboard/types"
import Card from "../ui/Card"
import StatusBadge from "../ui/StatusBadge"
import { formatDateTime, table } from "../ui/format"

export default function StaffTable({ staff }: { staff: StaffUser[] }) {
    return (
        <>
            <Card>
                <div className={table.wrap}>
                    <table className={table.table}>
                        <thead><tr><th className={table.head}>Name</th><th className={table.head}>Role</th><th className={table.head}>Status</th><th className={table.head}>Last active</th></tr></thead>
                        <tbody>
                            {staff.map((user) => (
                                <tr key={user.id} className={table.row}>
                                    <td className={table.cell}>
                                        <p className="m-0 font-bold">{user.name}</p>
                                        <p className="m-0 text-xs text-[#6b6862]">{user.email}</p>
                                    </td>
                                    <td className={table.cell}><span className={`text-xs font-bold uppercase ${user.role === "super-admin" ? "text-gold" : "text-[#5c5850]"}`}>{roleLabels[user.role]}</span></td>
                                    <td className={table.cell}><StatusBadge status={user.status} /></td>
                                    <td className={`${table.cell} whitespace-nowrap`}>{formatDateTime(user.lastActive)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </>
    )
}
