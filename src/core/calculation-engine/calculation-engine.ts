import { MANAGE_FEE } from 'src/modules/sessions/sessions.constants';

export type CostStrategy = 1 | 2 | 3;

export interface CalculationParticipant {
  userId: number;
  typeSnapshot: number; // 1 = internal, 2 = guest
}

export interface CalculationInput {
  courtPrice: number;
  shuttlecockTotal: number;
  otherCost: number;
  subsidyAvailable: number;
  costStrategy: CostStrategy;
  participants: CalculationParticipant[];
}

export interface UserCostResult {
  user_id: number;
  type_snapshot: number;
  cost_share: number;
  subsidy_share: number;
  final_amount: number;
}

export interface CalculationResult {
  total_cost: number;
  subsidy_used: number;
  subsidy_remaining: number;
  per_user: UserCostResult[];
  metadata: Record<string, unknown>;
}

export interface UserCostBreakdown {
  user_id: number;
  type_snapshot: number;
  court_cost_share: number;
  shuttlecock_cost_share: number;
  manage_fee: number;
  subsidy_share: number;
  other_cost_share: number;
  total: number;
}

export interface BreakdownInput {
  courtTotal: number;
  shuttlecockTotal: number;
  otherCost: number;
  subsidyUsed: number;
  totalInternal: number;
  costStrategy: CostStrategy;
  participants: CalculationParticipant[];
}

/**
 * Pure cost calculation engine — no DB access, no side effects.
 *
 * Strategies:
 *   1 = equal_split     — total net cost divided equally among ALL participants
 *   2 = internal_only   — total net cost divided only among INTERNAL participants; guests pay 0
 *   3 = weighted        — internal pays 1.0x weight, guest pays 0.5x weight
 */
export class CalculationEngine {
  static calculate(input: CalculationInput): CalculationResult {
    const { courtPrice, shuttlecockTotal, otherCost, subsidyAvailable, costStrategy, participants } = input;

    const totalCost = courtPrice + shuttlecockTotal + otherCost;
    const subsidyUsed = Math.min(subsidyAvailable, totalCost);
    const subsidyRemaining = subsidyAvailable - subsidyUsed;
    const netCost = totalCost - subsidyUsed;

    if (participants.length === 0) {
      return {
        total_cost: totalCost,
        subsidy_used: subsidyUsed,
        subsidy_remaining: subsidyRemaining,
        per_user: [],
        metadata: { strategy: costStrategy, total_participants: 0 },
      };
    }

    const weights = CalculationEngine.resolveWeights(participants, costStrategy);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    const costShares = distributeAmount(totalCost, weights, totalWeight);
    const finalAmounts = distributeAmount(netCost, weights, totalWeight);

    const internalCount = participants.filter((p) => p.typeSnapshot === 1).length;
    const guestCount = participants.filter((p) => p.typeSnapshot === 2).length;

    const perUser: UserCostResult[] = participants.map((p, i) => ({
      user_id: p.userId,
      type_snapshot: p.typeSnapshot,
      cost_share: costShares[i],
      subsidy_share: costShares[i] - finalAmounts[i],
      final_amount: finalAmounts[i],
    }));

    return {
      total_cost: totalCost,
      subsidy_used: subsidyUsed,
      subsidy_remaining: subsidyRemaining,
      per_user: perUser,
      metadata: {
        strategy: costStrategy,
        total_participants: participants.length,
        internal_count: internalCount,
        guest_count: guestCount,
        total_weight: totalWeight,
      },
    };
  }

  static buildBreakdown(input: BreakdownInput): UserCostBreakdown[] {
    const { courtTotal, shuttlecockTotal, otherCost, subsidyUsed, totalInternal, costStrategy, participants } = input;
    const weights = CalculationEngine.resolveWeights(participants, costStrategy);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    const courtShares = distributeAmount(courtTotal, weights, totalWeight);
    const shuttlecockShares = distributeAmount(shuttlecockTotal, weights, totalWeight);
    const otherShares = distributeAmount(otherCost, weights, totalWeight);
    const subsidyPerInternal = totalInternal > 0 ? Math.floor(subsidyUsed / totalInternal) : 0;

    return participants.map((p, i) => {
      const subsidyShare = p.typeSnapshot === 1 ? subsidyPerInternal : 0;
      const total = courtShares[i] + shuttlecockShares[i] + MANAGE_FEE + otherShares[i] - subsidyShare;
      return {
        user_id: p.userId,
        type_snapshot: p.typeSnapshot,
        court_cost_share: courtShares[i],
        shuttlecock_cost_share: shuttlecockShares[i],
        manage_fee: MANAGE_FEE,
        subsidy_share: subsidyShare,
        other_cost_share: otherShares[i],
        total,
      };
    });
  }

  private static resolveWeights(participants: CalculationParticipant[], strategy: CostStrategy): number[] {
    if (strategy === 1) {
      // equal split — everyone weight 1
      return participants.map(() => 1);
    }
    if (strategy === 2) {
      // internal only — guests weight 0
      return participants.map((p) => (p.typeSnapshot === 1 ? 1 : 0));
    }
    // weighted — internal = 1.0, guest = 0.5
    return participants.map((p) => (p.typeSnapshot === 1 ? 1.0 : 0.5));
  }
}

/**
 * Distributes `total` (integer) proportionally among `weights`.
 * Uses floor + remainder distribution to guarantee sum equals `total`.
 */
function distributeAmount(total: number, weights: number[], totalWeight: number): number[] {
  if (totalWeight === 0) return weights.map(() => 0);

  const shares = weights.map((w) => Math.floor((total * w) / totalWeight));
  const allocated = shares.reduce((sum, s) => sum + s, 0);
  let remainder = total - allocated;

  for (let i = 0; i < shares.length && remainder > 0; i++) {
    if (weights[i] > 0) {
      shares[i]++;
      remainder--;
    }
  }

  return shares;
}
