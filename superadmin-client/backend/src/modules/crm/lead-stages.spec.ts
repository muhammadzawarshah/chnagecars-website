import { LeadStage as L } from '../../generated/prisma/client';
import { checkStageChange } from './lead-stages';

describe('lead stages (FR-44)', () => {
  it('moves forward through the pipeline, skipping allowed', () => {
    expect(checkStageChange(L.NEW, L.CONTACTED, false).ok).toBe(true);
    expect(checkStageChange(L.CONTACTED, L.NEGOTIATION, false).ok).toBe(true);
    expect(checkStageChange(L.NEGOTIATION, L.OFFER_SENT, false).ok).toBe(true);
  });

  it('does not move backwards, except offer sent → negotiation', () => {
    expect(checkStageChange(L.QUALIFIED, L.CONTACTED, true).ok).toBe(false);
    expect(checkStageChange(L.CONTACTED, L.NEW, true).ok).toBe(false);
    expect(checkStageChange(L.OFFER_SENT, L.NEGOTIATION, false).ok).toBe(true);
  });

  it('wins only after qualification; loses from any open stage', () => {
    expect(checkStageChange(L.NEW, L.WON, false).ok).toBe(false);
    expect(checkStageChange(L.QUALIFIED, L.WON, false).ok).toBe(true);
    expect(checkStageChange(L.NEW, L.LOST, false).ok).toBe(true);
  });

  it('closed leads reopen only for managers and only to CONTACTED', () => {
    expect(checkStageChange(L.LOST, L.CONTACTED, false).ok).toBe(false);
    expect(checkStageChange(L.LOST, L.CONTACTED, true).ok).toBe(true);
    expect(checkStageChange(L.WON, L.NEGOTIATION, true).ok).toBe(false);
  });

  it('rejects no-op changes', () => {
    expect(checkStageChange(L.NEW, L.NEW, true).ok).toBe(false);
  });
});
