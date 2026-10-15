import { DealerMemberRole, DealerPermission } from '../../generated/prisma/client';

const P = DealerPermission;

/**
 * Default permissions per dealership role (BR-14):
 *  - STAFF   → manage assigned leads
 *  - SALES   → leads + enquiries + inventory view
 *  - MANAGER → inventory, staff, leads, bidding for the dealership
 *  - OWNER   → everything
 * Members can be granted extra permissions individually (FR-45).
 */
export const ROLE_PERMISSIONS: Record<DealerMemberRole, DealerPermission[]> = {
  OWNER: Object.values(P),
  MANAGER: [
    P.BRANCHES_MANAGE,
    P.STAFF_MANAGE,
    P.INVENTORY_VIEW,
    P.INVENTORY_MANAGE,
    P.INVENTORY_PUBLISH,
    P.ENQUIRIES_VIEW,
    P.ENQUIRIES_RESPOND,
    P.LEADS_VIEW_ALL,
    P.LEADS_MANAGE_ALL,
    P.LEADS_MANAGE_ASSIGNED,
    P.LEADS_ASSIGN,
    P.BIDDING_VIEW,
    P.BIDDING_PARTICIPATE,
    P.REPORTS_VIEW,
  ],
  SALES: [P.INVENTORY_VIEW, P.ENQUIRIES_VIEW, P.ENQUIRIES_RESPOND, P.LEADS_MANAGE_ASSIGNED, P.BIDDING_VIEW],
  STAFF: [P.INVENTORY_VIEW, P.LEADS_MANAGE_ASSIGNED],
};

export function effectivePermissions(role: DealerMemberRole, extra: DealerPermission[] = []): DealerPermission[] {
  return [...new Set([...ROLE_PERMISSIONS[role], ...extra])];
}

/** Only owners and managers see every branch; other members are scoped to their branch if they have one. */
export function hasDealershipWideScope(role: DealerMemberRole): boolean {
  return role === DealerMemberRole.OWNER || role === DealerMemberRole.MANAGER;
}
