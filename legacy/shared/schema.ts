import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, bigint, timestamp, boolean, jsonb, pgEnum, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const cardBackRarity = pgEnum('card_back_rarity', ['COMMON', 'RARE', 'SUPER_RARE', 'LEGENDARY']);
export const allInResult = pgEnum('all_in_result', ['WIN', 'LOSE', 'PUSH']);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  xp: integer("xp").default(0), // XP total pour statistiques
  currentLevelXP: integer("current_level_xp").default(0), // XP dans le niveau actuel (0-499)
  level: integer("level").default(1),
  seasonXp: integer("season_xp").default(0), // XP pour la saison courante du battlepass
  coins: bigint("coins", { mode: "number" }).default(5000),
  gems: bigint("gems", { mode: "number" }).default(0),
  selectedAvatarId: text("selected_avatar_id").default("face-with-tears-of-joy"),
  ownedAvatars: jsonb("owned_avatars").default([]), // Array of owned avatar IDs
  selectedCardBackId: text("selected_card_back_id"),
  privacySettings: jsonb("privacy_settings").default({
    profileVisibility: "public",
    showStats: true,
    showLevel: true,
    allowMessages: true,
    dataCollection: true
  }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  membershipType: text("membership_type").default("normal"), // 'normal', 'premium'
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  maxStreak21: integer("max_streak_21").default(0), // Max streak atteint en mode 21 Streak
  currentStreak21: integer("current_streak_21").default(0), // Streak actuel en mode 21 Streak
  totalStreakWins: integer("total_streak_wins").default(0), // Total des victoires en mode streak
  totalStreakEarnings: bigint("total_streak_earnings", { mode: "number" }).default(0), // Total des gains en mode streak
  tickets: integer("tickets").default(3), // Number of tickets user has for All-in mode
  bonusCoins: bigint("bonus_coins", { mode: "number" }).default(0), // Non-withdrawable rebate coins from losses
  allInLoseStreak: integer("all_in_lose_streak").default(0), // Track consecutive All-in losses
  referralCode: text("referral_code").unique(), // Unique 6-character referral code
  referredBy: varchar("referred_by"), // ID of user who referred this user
  referralCount: integer("referral_count").default(0), // Number of users referred
  referralRewardClaimed: boolean("referral_reward_claimed").default(false), // Whether reward for being referred has been claimed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gameStats = pgTable("game_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  gameType: text("game_type").notNull(), // 'practice', 'cash', 'counting'
  handsPlayed: integer("hands_played").default(0),
  handsWon: integer("hands_won").default(0),
  handsLost: integer("hands_lost").default(0),
  handsPushed: integer("hands_pushed").default(0),
  totalWinnings: bigint("total_winnings", { mode: "number" }).default(0),
  totalLosses: bigint("total_losses", { mode: "number" }).default(0),
  blackjacks: integer("blackjacks").default(0),
  busts: integer("busts").default(0),
  correctDecisions: integer("correct_decisions").default(0),
  totalDecisions: integer("total_decisions").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  itemType: text("item_type").notNull(), // 'card_back', 'theme', 'avatar'
  itemId: text("item_id").notNull(),
  acquiredAt: timestamp("acquired_at").defaultNow(),
});

export const dailySpins = pgTable("daily_spins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  lastSpinAt: timestamp("last_spin_at").defaultNow(),
  reward: jsonb("reward"),
});

export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  achievementId: text("achievement_id").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

export const challenges = pgTable("challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeType: text("challenge_type").notNull(), // 'wins', 'hands', 'blackjacks', 'streak', 'coins_won'
  title: text("title").notNull(),
  description: text("description").notNull(),
  targetValue: integer("target_value").notNull(),
  reward: bigint("reward", { mode: "number" }).notNull(), // coins reward
  difficulty: text("difficulty").notNull(), // 'easy', 'medium', 'hard'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const userChallenges = pgTable("user_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id"), // Changed to uuid to match existing database
  challengeId: varchar("challenge_id").references(() => challenges.id),
  currentProgress: integer("current_progress").default(0),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  rewardClaimed: boolean("reward_claimed").default(false),
  startedAt: timestamp("started_at").defaultNow(),
});

// Battlepass Seasons Table
export const seasons = pgTable("seasons", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), // Keep UUID for existing data
  seasonIdentifier: varchar("season_identifier"), // YYYY-MM format for season comparison (nullable for migration)
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  maxXp: integer("max_xp").default(500),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Battle Pass Rewards Claims Table
export const battlePassRewards = pgTable("battle_pass_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  seasonId: varchar("season_id").references(() => seasons.id),
  tier: integer("tier").notNull(),
  isPremium: boolean("is_premium").default(false),
  rewardType: text("reward_type").notNull(), // 'coins', 'gems', 'tickets'
  rewardAmount: bigint("reward_amount", { mode: "number" }).notNull(),
  claimedAt: timestamp("claimed_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const insertGameStatsSchema = createInsertSchema(gameStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  acquiredAt: true,
});

export const insertDailySpinSchema = createInsertSchema(dailySpins).omit({
  id: true,
  lastSpinAt: true,
});

export const insertBattlePassRewardSchema = createInsertSchema(battlePassRewards).omit({
  id: true,
  claimedAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  unlockedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertGameStats = z.infer<typeof insertGameStatsSchema>;
export type GameStats = typeof gameStats.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;
export type InsertDailySpin = z.infer<typeof insertDailySpinSchema>;
export type DailySpin = typeof dailySpins.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  createdAt: true,
});

export const insertUserChallengeSchema = createInsertSchema(userChallenges).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertSeasonSchema = createInsertSchema(seasons).omit({
  id: true,
  createdAt: true,
});

// Gem Transactions Table
export const gemTransactions = pgTable("gem_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  transactionType: text("transaction_type").notNull(), // 'purchase', 'reward', 'spend', 'refund'
  amount: bigint("amount", { mode: "number" }).notNull(), // positive for gaining gems, negative for spending
  description: text("description").notNull(),
  relatedId: varchar("related_id"), // reference to purchase, challenge, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Gem Purchases Table (for things you can buy with gems)
export const gemPurchases = pgTable("gem_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  itemType: text("item_type").notNull(), // 'avatar', 'theme', 'card_back', 'coins', 'boost'
  itemId: text("item_id").notNull(),
  gemCost: bigint("gem_cost", { mode: "number" }).notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow(),
});

export const insertGemTransactionSchema = createInsertSchema(gemTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertGemPurchaseSchema = createInsertSchema(gemPurchases).omit({
  id: true,
  purchasedAt: true,
});

export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challenges.$inferSelect;
export type InsertUserChallenge = z.infer<typeof insertUserChallengeSchema>;
export type UserChallenge = typeof userChallenges.$inferSelect;
export type InsertSeason = z.infer<typeof insertSeasonSchema>;
export type Season = typeof seasons.$inferSelect;
export type InsertGemTransaction = z.infer<typeof insertGemTransactionSchema>;
export type GemTransaction = typeof gemTransactions.$inferSelect;
export type InsertGemPurchase = z.infer<typeof insertGemPurchaseSchema>;
export type GemPurchase = typeof gemPurchases.$inferSelect;

// Card back selection schema for PATCH /api/user/selected-card-back - unified with corrected schema above
export type SelectCardBack = z.infer<typeof selectCardBackSchema>;
export type InsertBattlePassReward = z.infer<typeof insertBattlePassRewardSchema>;
export type BattlePassReward = typeof battlePassRewards.$inferSelect;

// 21 Streak Weekly Leaderboard Table
export const streakLeaderboard = pgTable("streak_leaderboard", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  weekStartDate: timestamp("week_start_date").notNull(), // Début de la semaine (lundi)
  bestStreak: integer("best_streak").notNull(), // Meilleur streak de la semaine
  totalStreakGames: integer("total_streak_games").default(0), // Nombre de parties en mode streak
  totalStreakEarnings: bigint("total_streak_earnings", { mode: "number" }).default(0), // Gains de la semaine
  rank: integer("rank"), // Position dans le classement
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStreakLeaderboardSchema = createInsertSchema(streakLeaderboard).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStreakLeaderboard = z.infer<typeof insertStreakLeaderboardSchema>;
export type StreakLeaderboard = typeof streakLeaderboard.$inferSelect;

// Card Backs Table
export const cardBacks = pgTable("card_backs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  rarity: cardBackRarity("rarity").notNull(),
  priceGems: bigint("price_gems", { mode: "number" }).notNull(),
  imageUrl: text("image_url").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Card Backs - Collection for each user
export const userCardBacks = pgTable("user_card_backs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  cardBackId: varchar("card_back_id").references(() => cardBacks.id),
  source: text("source").notNull(), // 'purchase', 'reward', 'battlepass', 'achievement'
  acquiredAt: timestamp("acquired_at").defaultNow(),
}, (table) => ({
  uniqueUserCardBack: sql`UNIQUE(${table.userId}, ${table.cardBackId})`,
}));

export const insertCardBackSchema = createInsertSchema(cardBacks).omit({
  id: true,
  createdAt: true,
});

export const insertUserCardBackSchema = createInsertSchema(userCardBacks).omit({
  id: true,
  acquiredAt: true,
});

export const selectCardBackSchema = z.object({
  cardBackId: z.string().min(1, "Card back ID is required"),
});

export type InsertCardBack = z.infer<typeof insertCardBackSchema>;
export type CardBack = typeof cardBacks.$inferSelect;
export type InsertUserCardBack = z.infer<typeof insertUserCardBackSchema>;
export type UserCardBack = typeof userCardBacks.$inferSelect;

// Bet Drafts Table for server-side bet validation
export const betDrafts = pgTable("bet_drafts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  betId: varchar("bet_id").notNull().unique(), // Client-generated ID for tracking
  userId: varchar("user_id").references(() => users.id).notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  mode: text("mode"), // 'classic', 'high-stakes', etc.
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const insertBetDraftSchema = createInsertSchema(betDrafts).omit({
  id: true,
  createdAt: true,
});

export type InsertBetDraft = z.infer<typeof insertBetDraftSchema>;
export type BetDraft = typeof betDrafts.$inferSelect;

// Bet API validation schemas
export const betPrepareSchema = z.object({
  betId: z.string().min(1, "Bet ID is required"),
  amount: z.number().positive("Bet amount must be positive"),
  mode: z.string().optional()
});

export const betCommitSchema = z.object({
  betId: z.string().min(1, "Bet ID is required")
});

export type BetPrepareRequest = z.infer<typeof betPrepareSchema>;
export type BetCommitRequest = z.infer<typeof betCommitSchema>;

export const claimBattlePassTierSchema = z.object({
  tier: z.number().int().min(1).max(50),
  isPremium: z.boolean().optional().default(false),
});

export type ClaimBattlePassTierRequest = z.infer<typeof claimBattlePassTierSchema>;

// All-in Runs Table - Track All-in game history with AUTHORITATIVE security
export const allInRuns = pgTable("all_in_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  preBalance: bigint("pre_balance", { mode: "number" }).notNull(), // Coins before the bet
  betAmount: bigint("bet_amount", { mode: "number" }).notNull(), // Amount bet (equals preBalance)
  result: allInResult("result").notNull(), // Game outcome: WIN or LOSE
  multiplier: integer("multiplier").notNull(), // 3 on win, 0 on lose
  payout: bigint("payout", { mode: "number" }).notNull(), // Net coins added on win
  rebate: bigint("rebate", { mode: "number" }).notNull(), // 5% rebate to bonusCoins on loss
  
  // AUTHORITATIVE SECURITY FIELDS
  gameId: varchar("game_id").notNull().unique(), // Server-generated game session ID
  gameHash: text("game_hash").notNull().unique(), // UNIQUE deterministic hash for idempotence
  deckSeed: text("deck_seed").notNull(), // Secure random seed for deck generation
  deckHash: text("deck_hash").notNull(), // Hash of shuffled deck for verification
  
  // Game state audit fields
  playerHand: jsonb("player_hand"), // Store player cards for audit
  dealerHand: jsonb("dealer_hand"), // Store dealer cards for audit
  isBlackjack: boolean("is_blackjack").notNull().default(false),
  playerTotal: integer("player_total"),
  dealerTotal: integer("dealer_total"),
  ticketConsumed: boolean("ticket_consumed").notNull().default(true), // Track if ticket was consumed
  
  // 🔒 SECURITY AUDIT FIELDS
  clientIp: text("client_ip"), // Track client IP for fraud detection
  userAgent: text("user_agent"), // Track user agent for fraud detection
  sessionId: text("session_id"), // Link to session for audit trail
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // 🔒 CRITICAL SECURITY CONSTRAINTS
  uniqueUserGameId: sql`UNIQUE(${table.userId}, ${table.gameId})`, // Prevent user from accessing other user's games
  uniqueGameHash: sql`UNIQUE(${table.gameHash})`, // Enforce idempotence - prevent replay attacks
  uniqueGameId: sql`UNIQUE(${table.gameId})`, // Redundant with .unique() but explicit for clarity
}));

// Config Table - Server configuration values
export const config = pgTable("config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(), // Configuration key
  value: text("value").notNull(), // JSON stringified value
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAllInRunSchema = createInsertSchema(allInRuns).omit({
  id: true,
  createdAt: true,
});

export const insertConfigSchema = createInsertSchema(config).omit({
  id: true,
  updatedAt: true,
});

// Friends Table - Many-to-many relationship for friendships
export const friendships = pgTable("friendships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id").references(() => users.id).notNull(), // User who sent the friend request
  recipientId: varchar("recipient_id").references(() => users.id).notNull(), // User who received the friend request
  status: text("status").notNull().default("pending"), // 'pending', 'accepted', 'rejected', 'blocked'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Prevent duplicate friendship requests
  uniqueFriendship: sql`UNIQUE(${table.requesterId}, ${table.recipientId})`,
  // Prevent users from adding themselves as friends
  checkNotSelf: sql`CHECK(${table.requesterId} != ${table.recipientId})`,
}));

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Rank Rewards Claimed Table - Track which rank rewards users have claimed
export const rankRewardsClaimed = pgTable("rank_rewards_claimed", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  rankKey: text("rank_key").notNull(), // 'cow', 'fish', 'fox', etc.
  gemsAwarded: integer("gems_awarded").notNull(),
  claimedAt: timestamp("claimed_at").defaultNow(),
}, (table) => ({
  // Prevent claiming the same rank reward twice
  uniqueUserRank: sql`UNIQUE(${table.userId}, ${table.rankKey})`,
}));

export const insertRankRewardClaimedSchema = createInsertSchema(rankRewardsClaimed).omit({
  id: true,
  claimedAt: true,
});

export type InsertAllInRun = z.infer<typeof insertAllInRunSchema>;
export type AllInRun = typeof allInRuns.$inferSelect;
export type InsertConfig = z.infer<typeof insertConfigSchema>;
export type Config = typeof config.$inferSelect;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Friendship = typeof friendships.$inferSelect;
export type InsertRankRewardClaimed = z.infer<typeof insertRankRewardClaimedSchema>;
export type RankRewardClaimed = typeof rankRewardsClaimed.$inferSelect;

// Referral schemas
export const submitReferralCodeSchema = z.object({
  code: z.string().min(6).max(6).regex(/^[A-Z0-9]+$/, "Code must contain only uppercase letters and numbers"),
});
