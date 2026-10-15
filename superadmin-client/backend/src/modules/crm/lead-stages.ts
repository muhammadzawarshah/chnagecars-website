import { LeadStage } from '../../generated/prisma/client';

const L = LeadStage;

/** FR-44 pipeline order: New → Contacted → Qualified → Negotiation → Offer Sent → Won / Lost. */
export const PIPELINE: LeadStage[] = [L.NEW, L.CONTACTED, L.QUALIFIED, L.NEGOTIATION, L.OFFER_SENT];
export const CLOSED: LeadStage[] = [L.WON, L.LOST];

export type StageCheck = { ok: true } | { ok: false; reason: string };

/**
 * Rules:
 *  - Open leads move forward (stages may be skipped), OFFER_SENT may fall back to NEGOTIATION.
 *  - WON is possible once a lead is QUALIFIED; LOST is possible from any open stage.
 *  - WON/LOST are closed; only members who manage all leads may reopen (back to CONTACTED).
 */
export function checkStageChange(from: LeadStage, to: LeadStage, canReopen: boolean): StageCheck {
  if (from === to) return { ok: false, reason: `Lead is already ${to}` };

  if (CLOSED.includes(from)) {
    if (to === L.CONTACTED && canReopen) return { ok: true };
    return { ok: false, reason: canReopen ? 'Closed leads can only be reopened to CONTACTED' : 'Only managers can reopen closed leads' };
  }
  if (to === L.LOST) return { ok: true };
  if (to === L.WON) {
    return PIPELINE.indexOf(from) >= PIPELINE.indexOf(L.QUALIFIED)
      ? { ok: true }
      : { ok: false, reason: 'A lead must be qualified before it can be won' };
  }
  if (from === L.OFFER_SENT && to === L.NEGOTIATION) return { ok: true };
  if (to === L.NEW) return { ok: false, reason: 'Leads cannot move back to NEW' };
  return PIPELINE.indexOf(to) > PIPELINE.indexOf(from)
    ? { ok: true }
    : { ok: false, reason: `Cannot move a lead back from ${from} to ${to}` };
}
