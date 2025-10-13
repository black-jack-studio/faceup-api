import { z } from "zod";

export const insertUserSchema = z
  .object({
    username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
    email: z.string(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const betPrepareSchema = z.object({
  betId: z.string(),
  amount: z.number().int().positive(),
  mode: z.enum(["classic", "all-in", "high-stakes"]).optional(),
});

export const betCommitSchema = z.object({
  betId: z.string(),
});

export const insertGameStatsSchema = z.object({
  gameType: z.enum(["classic", "all-in", "high-stakes"]).optional(),
  handsPlayed: z.number().int().nonnegative().optional(),
  handsWon: z.number().int().nonnegative().optional(),
  handsLost: z.number().int().nonnegative().optional(),
  handsPushed: z.number().int().nonnegative().optional(),
  busts: z.number().int().nonnegative().optional(),
  correctDecisions: z.number().int().nonnegative().optional(),
  totalDecisions: z.number().int().nonnegative().optional(),
  blackjacks: z.number().int().nonnegative().optional(),
  totalWinnings: z.number().int().optional(),
  totalLosses: z.number().int().optional(),
  userId: z.string(),
});

export const claimBattlePassTierSchema = z.object({
  tier: z.number().int().positive(),
  isPremium: z.boolean(),
});

export const selectCardBackSchema = z.object({
  cardBackId: z.string().min(1, "Card back ID is required"),
});

export const submitReferralCodeSchema = z
  .object({
    code: z.string().min(3).max(16),
  })
  .transform(({ code }) => ({ code: code.toUpperCase() }));
