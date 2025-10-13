import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  bigint,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  uuid,
} from "drizzle-orm/pg-core";

export const cardBackRarity = pgEnum("card_back_rarity", [
  "COMMON",
  "RARE",
  "SUPER_RARE",
  "LEGENDARY",
]);

export const allInResult = pgEnum("all_in_result", ["WIN", "LOSE", "PUSH"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  xp: integer("xp").default(0),
  currentLevelXP: integer("current_level_xp").default(0),
  level: integer("level").default(1),
  seasonXp: integer("season_xp").default(0),
  coins: bigint("coins", { mode: "number" }).default(5000),
  gems: bigint("gems", { mode: "number" }).default(0),
  selectedAvatarId: text("selected_avatar_id").default("face-with-tears-of-joy"),
  ownedAvatars: jsonb("owned_avatars").default([]),
  selectedCardBackId: text("selected_card_back_id"),
  privacySettings: jsonb("privacy_settings").default({
    profileVisibility: "public",
    showStats: true,
    showLevel: true,
    allowMessages: true,
    dataCollection: true,
  }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  membershipType: text("membership_type").default("normal"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  maxStreak21: integer("max_streak_21").default(0),
  currentStreak21: integer("current_streak_21").default(0),
  totalStreakWins: integer("total_streak_wins").default(0),
  totalStreakEarnings: bigint("total_streak_earnings", { mode: "number" }).default(0),
  tickets: integer("tickets").default(3),
  bonusCoins: bigint("bonus_coins", { mode: "number" }).default(0),
  allInLoseStreak: integer("all_in_lose_streak").default(0),
  referralCode: text("referral_code").unique(),
  referredBy: varchar("referred_by"),
  referralCount: integer("referral_count").default(0),
  referralRewardClaimed: boolean("referral_reward_claimed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gameStats = pgTable("game_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  gameType: text("game_type").notNull(),
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
  itemType: text("item_type").notNull(),
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
  challengeType: text("challenge_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  targetValue: integer("target_value").notNull(),
  reward: bigint("reward", { mode: "number" }).notNull(),
  difficulty: text("difficulty").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const userChallenges = pgTable("user_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id"),
  challengeId: varchar("challenge_id").references(() => challenges.id),
  currentProgress: integer("current_progress").default(0),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  rewardClaimed: boolean("reward_claimed").default(false),
  startedAt: timestamp("started_at").defaultNow(),
});

export const seasons = pgTable("seasons", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  seasonIdentifier: varchar("season_identifier"),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  maxXp: integer("max_xp").default(500),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const battlePassRewards = pgTable("battle_pass_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  seasonId: varchar("season_id").references(() => seasons.id),
  tier: integer("tier").notNull(),
  isPremium: boolean("is_premium").default(false),
  rewardType: text("reward_type").notNull(),
  rewardAmount: bigint("reward_amount", { mode: "number" }).notNull(),
  claimedAt: timestamp("claimed_at").defaultNow(),
});

export const gemTransactions = pgTable("gem_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  transactionType: text("transaction_type").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  description: text("description").notNull(),
  relatedId: varchar("related_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gemPurchases = pgTable("gem_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  itemType: text("item_type").notNull(),
  itemId: text("item_id").notNull(),
  gemCost: bigint("gem_cost", { mode: "number" }).notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow(),
});

export const streakLeaderboard = pgTable("streak_leaderboard", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  weekStartDate: timestamp("week_start_date").notNull(),
  bestStreak: integer("best_streak").notNull(),
  totalStreakGames: integer("total_streak_games").default(0),
  totalStreakEarnings: bigint("total_streak_earnings", { mode: "number" }).default(0),
  rank: integer("rank"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cardBacks = pgTable("card_backs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  rarity: cardBackRarity("rarity").notNull(),
  priceGems: bigint("price_gems", { mode: "number" }).notNull(),
  imageUrl: text("image_url").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userCardBacks = pgTable(
  "user_card_backs",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").references(() => users.id),
    cardBackId: varchar("card_back_id").references(() => cardBacks.id),
    source: text("source").notNull(),
    acquiredAt: timestamp("acquired_at").defaultNow(),
  },
  (table) => ({
    uniqueUserCardBack: sql`UNIQUE(${table.userId}, ${table.cardBackId})`,
  }),
);

export const betDrafts = pgTable("bet_drafts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  betId: varchar("bet_id").notNull().unique(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  mode: text("mode"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const allInRuns = pgTable(
  "all_in_runs",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").references(() => users.id).notNull(),
    preBalance: bigint("pre_balance", { mode: "number" }).notNull(),
    betAmount: bigint("bet_amount", { mode: "number" }).notNull(),
    result: allInResult("result").notNull(),
    multiplier: integer("multiplier").notNull(),
    payout: bigint("payout", { mode: "number" }).notNull(),
    rebate: bigint("rebate", { mode: "number" }).notNull(),
    gameId: varchar("game_id").notNull().unique(),
    gameHash: text("game_hash").notNull().unique(),
    deckSeed: text("deck_seed").notNull(),
    deckHash: text("deck_hash").notNull(),
    playerHand: jsonb("player_hand"),
    dealerHand: jsonb("dealer_hand"),
    isBlackjack: boolean("is_blackjack").notNull().default(false),
    playerTotal: integer("player_total"),
    dealerTotal: integer("dealer_total"),
    ticketConsumed: boolean("ticket_consumed").notNull().default(true),
    clientIp: text("client_ip"),
    userAgent: text("user_agent"),
    sessionId: text("session_id"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    uniqueUserGameId: sql`UNIQUE(${table.userId}, ${table.gameId})`,
    uniqueGameHash: sql`UNIQUE(${table.gameHash})`,
    uniqueGameId: sql`UNIQUE(${table.gameId})`,
  }),
);

export const config = pgTable("config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const friendships = pgTable(
  "friendships",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    requesterId: varchar("requester_id").references(() => users.id).notNull(),
    recipientId: varchar("recipient_id").references(() => users.id).notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    uniqueFriendship: sql`UNIQUE(${table.requesterId}, ${table.recipientId})`,
    checkNotSelf: sql`CHECK(${table.requesterId} != ${table.recipientId})`,
  }),
);

export const rankRewardsClaimed = pgTable("rank_rewards_claimed", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  rankKey: text("rank_key").notNull(),
  gemsAwarded: integer("gems_awarded").notNull(),
  claimedAt: timestamp("claimed_at").defaultNow(),
}, (table) => ({
  uniqueUserRank: sql`UNIQUE(${table.userId}, ${table.rankKey})`,
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type GameStats = typeof gameStats.$inferSelect;
export type InsertGameStats = typeof gameStats.$inferInsert;
export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = typeof inventory.$inferInsert;
export type DailySpin = typeof dailySpins.$inferSelect;
export type InsertDailySpin = typeof dailySpins.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;
export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = typeof challenges.$inferInsert;
export type UserChallenge = typeof userChallenges.$inferSelect;
export type InsertUserChallenge = typeof userChallenges.$inferInsert;
export type Season = typeof seasons.$inferSelect;
export type InsertSeason = typeof seasons.$inferInsert;
export type BattlePassReward = typeof battlePassRewards.$inferSelect;
export type InsertBattlePassReward = typeof battlePassRewards.$inferInsert;
export type GemTransaction = typeof gemTransactions.$inferSelect;
export type InsertGemTransaction = typeof gemTransactions.$inferInsert;
export type GemPurchase = typeof gemPurchases.$inferSelect;
export type InsertGemPurchase = typeof gemPurchases.$inferInsert;
export type StreakLeaderboard = typeof streakLeaderboard.$inferSelect;
export type InsertStreakLeaderboard = typeof streakLeaderboard.$inferInsert;
export type CardBack = typeof cardBacks.$inferSelect;
export type InsertCardBack = typeof cardBacks.$inferInsert;
export type UserCardBack = typeof userCardBacks.$inferSelect;
export type InsertUserCardBack = typeof userCardBacks.$inferInsert;
export type BetDraft = typeof betDrafts.$inferSelect;
export type InsertBetDraft = typeof betDrafts.$inferInsert;
export type AllInRun = typeof allInRuns.$inferSelect;
export type InsertAllInRun = typeof allInRuns.$inferInsert;
export type Config = typeof config.$inferSelect;
export type InsertConfig = typeof config.$inferInsert;
export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = typeof friendships.$inferInsert;
export type RankRewardClaimed = typeof rankRewardsClaimed.$inferSelect;
export type InsertRankRewardClaimed = typeof rankRewardsClaimed.$inferInsert;
