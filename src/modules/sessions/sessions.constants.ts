export const SESSION_STATUS = {
  DRAFT: 1,
  FINALIZED: 2,
  LOCKED: 3,
} as const;

export const COST_STRATEGY = {
  EQUAL_SPLIT: 1,
  INTERNAL_ONLY: 2,
  WEIGHTED: 3,
} as const;

export const MANAGE_FEE = parseInt(process.env.MANAGE_FEE ?? '3000', 10);
