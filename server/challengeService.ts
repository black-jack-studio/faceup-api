import { storage } from "./storage";
import type { Challenge, InsertChallenge } from "@shared/schema";

export class ChallengeService {
  // Types de challenges disponibles avec leurs configurations
  private static CHALLENGE_TEMPLATES = {
    easy: [
      {
        challengeType: 'hands',
        title: 'First Hand',
        description: 'Play 3 blackjack games',
        targetValue: 3,
        reward: 50,
        difficulty: 'easy'
      },
      {
        challengeType: 'hands',
        title: 'Beginner Player',
        description: 'Play 5 blackjack games',
        targetValue: 5,
        reward: 75,
        difficulty: 'easy'
      },
      {
        challengeType: 'wins',
        title: 'Daily Winner',
        description: 'Win 2 games',
        targetValue: 2,
        reward: 75,
        difficulty: 'easy'
      },
      {
        challengeType: 'wins',
        title: 'First Victory',
        description: 'Win 1 game',
        targetValue: 1,
        reward: 50,
        difficulty: 'easy'
      },
      {
        challengeType: 'blackjacks',
        title: 'Blackjack!',
        description: 'Get 1 blackjack',
        targetValue: 1,
        reward: 100,
        difficulty: 'easy'
      },
      {
        challengeType: 'coins_won',
        title: 'Small Profit',
        description: 'Win 100 coins',
        targetValue: 100,
        reward: 60,
        difficulty: 'easy'
      }
    ],
    medium: [
      {
        challengeType: 'hands',
        title: 'Marathon Player',
        description: 'Play 10 blackjack games',
        targetValue: 10,
        reward: 150,
        difficulty: 'medium'
      },
      {
        challengeType: 'hands',
        title: 'Active Player',
        description: 'Play 8 blackjack games',
        targetValue: 8,
        reward: 120,
        difficulty: 'medium'
      },
      {
        challengeType: 'wins',
        title: 'Winning Streak',
        description: 'Win 5 games',
        targetValue: 5,
        reward: 200,
        difficulty: 'medium'
      },
      {
        challengeType: 'wins',
        title: 'Good Player',
        description: 'Win 4 games',
        targetValue: 4,
        reward: 170,
        difficulty: 'medium'
      },
      {
        challengeType: 'blackjacks',
        title: 'Double Blackjack',
        description: 'Get 2 blackjacks',
        targetValue: 2,
        reward: 220,
        difficulty: 'medium'
      },
      {
        challengeType: 'coins_won',
        title: 'Coin Collector',
        description: 'Win 500 coins',
        targetValue: 500,
        reward: 250,
        difficulty: 'medium'
      },
      {
        challengeType: 'coins_won',
        title: 'Good Profit',
        description: 'Win 300 coins',
        targetValue: 300,
        reward: 200,
        difficulty: 'medium'
      }
    ],
    hard: [
      {
        challengeType: 'hands',
        title: 'Blackjack Master',
        description: 'Play 25 games',
        targetValue: 25,
        reward: 400,
        difficulty: 'hard'
      },
      {
        challengeType: 'hands',
        title: 'Hardcore Player',
        description: 'Play 20 games',
        targetValue: 20,
        reward: 350,
        difficulty: 'hard'
      },
      {
        challengeType: 'wins',
        title: 'Champion',
        description: 'Win 15 games',
        targetValue: 15,
        reward: 500,
        difficulty: 'hard'
      },
      {
        challengeType: 'wins',
        title: 'Expert',
        description: 'Win 12 games',
        targetValue: 12,
        reward: 450,
        difficulty: 'hard'
      },
      {
        challengeType: 'blackjacks',
        title: 'Blackjack King',
        description: 'Get 3 blackjacks',
        targetValue: 3,
        reward: 400,
        difficulty: 'hard'
      },
      {
        challengeType: 'coins_won',
        title: 'Casino King',
        description: 'Win 2000 coins',
        targetValue: 2000,
        reward: 750,
        difficulty: 'hard'
      },
      {
        challengeType: 'coins_won',
        title: 'Big Winner',
        description: 'Win 1500 coins',
        targetValue: 1500,
        reward: 600,
        difficulty: 'hard'
      }
    ]
  };

  // Generate a deterministic seed from date string for consistent but changing challenge selection
  private static getDateSeed(dateString: string): number {
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      const char = dateString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Create daily challenges
  static async createDailyChallenges(): Promise<Challenge[]> {
    // Calculate expiration at next midnight in French time
    const now = new Date();
    const nextFrenchMidnight = new Date(now);
    
    // If it's already after 22h UTC today, move to next day
    if (now.getUTCHours() >= 22) {
      nextFrenchMidnight.setUTCDate(nextFrenchMidnight.getUTCDate() + 1);
    }
    nextFrenchMidnight.setUTCHours(22, 0, 0, 0); // 22h UTC = 00h France summer (UTC+2)

    const challenges: Challenge[] = [];

    // Use date as seed for deterministic but changing selection
    const today = new Date();
    // Use French date (adjust for timezone)
    const frenchToday = new Date(today);
    if (today.getUTCHours() >= 22) {
      frenchToday.setUTCDate(frenchToday.getUTCDate() + 1);
    }
    const dateString = frenchToday.toISOString().split('T')[0]; // YYYY-MM-DD
    const dateSeed = this.getDateSeed(dateString);

    // Create 6 challenges: 2 easy, 2 medium, 2 hard
    const difficultiesOrder: ('easy' | 'medium' | 'hard')[] = ['easy', 'easy', 'medium', 'medium', 'hard', 'hard'];
    
    for (let i = 0; i < 6; i++) {
      const difficulty = difficultiesOrder[i];
      const templates = this.CHALLENGE_TEMPLATES[difficulty];
      
      // Use date seed + index for deterministic selection
      const templateIndex = (dateSeed + i) % templates.length;
      const selectedTemplate = templates[templateIndex];
      
      try {
        const challenge = await storage.createChallenge({
          ...selectedTemplate,
          expiresAt: nextFrenchMidnight
        });
        challenges.push(challenge);
        console.log(`✅ Created ${difficulty} challenge: ${selectedTemplate.title}`);
      } catch (error) {
        console.error(`Error creating ${difficulty} challenge:`, error);
      }
    }

    return challenges;
  }

  // Add today's new challenges to user (keeps incomplete challenges from previous days)
  static async refreshUserChallenges(userId: string, todaysChallenges: Challenge[]): Promise<void> {
    try {
      // Get user's current challenges
      const userChallenges = await storage.getUserChallenges(userId);
      
      // Only remove challenges that are completed AND claimed
      for (const userChallenge of userChallenges) {
        if (userChallenge.isCompleted && userChallenge.rewardClaimed && userChallenge.challengeId) {
          await storage.removeUserChallenge(userId, userChallenge.challengeId);
          console.log(`🧹 Cleaned up completed challenge ${userChallenge.challengeId} for user ${userId}`);
        }
      }
      
      // Assign today's challenges if not already assigned
      for (const challenge of todaysChallenges) {
        const hasChallenge = userChallenges.some(uc => uc.challengeId === challenge.id);
        
        if (!hasChallenge) {
          await storage.assignChallengeToUser(userId, challenge.id);
          console.log(`✨ Assigned new challenge ${challenge.title} to user ${userId}`);
        }
      }
    } catch (error) {
      console.error(`Error refreshing challenges for user ${userId}:`, error);
    }
  }

  // Assign challenges to all active users (legacy, kept for compatibility)
  static async assignChallengesToUser(userId: string, challenges: Challenge[]): Promise<void> {
    try {
      for (const challenge of challenges) {
        // Check if user already has this challenge
        const existingChallenges = await storage.getUserChallenges(userId);
        const hasChallenge = existingChallenges.some(uc => uc.challengeId === challenge.id);
        
        if (!hasChallenge) {
          await storage.assignChallengeToUser(userId, challenge.id);
        }
      }
    } catch (error) {
      console.error(`Error assigning challenges to user ${userId}:`, error);
    }
  }

  // Update progress automatically after a game
  static async updateChallengeProgress(
    userId: string,
    gameResult: {
      handsPlayed: number;
      handsWon: number;
      blackjacks: number;
      coinsWon: number;
    }
  ): Promise<{challengeId: string, reward: number}[]> {
    const completedChallenges: {challengeId: string, reward: number}[] = [];

    try {
      const userChallenges = await storage.getUserChallenges(userId);
      
      for (const userChallenge of userChallenges) {
        if (userChallenge.isCompleted) continue;

        const challenge = userChallenge.challenge;
        let newProgress = userChallenge.currentProgress || 0;

        // Calculate new progress based on challenge type
        switch (challenge.challengeType) {
          case 'hands':
            newProgress += gameResult.handsPlayed || 0;
            break;
          case 'wins':
            newProgress += gameResult.handsWon || 0;
            break;
          case 'blackjacks':
            newProgress += gameResult.blackjacks || 0;
            break;
          case 'coins_won':
            newProgress += Math.max(0, gameResult.coinsWon || 0); // Only count positive gains
            break;
        }

        // Update progress
        if (newProgress !== (userChallenge.currentProgress || 0)) {
          await storage.updateChallengeProgress(userId, challenge.id, newProgress);

          // Check if challenge is completed
          if (newProgress >= challenge.targetValue) {
            await storage.completeChallengeForUser(userId, challenge.id);
            
            // Award reward automatically
            const user = await storage.getUser(userId);
            if (user) {
              await storage.updateUserCoins(userId, (user.coins || 0) + challenge.reward);
              await storage.markChallengeRewardAsClaimed(userId, userChallenge.id);
              console.log(`✅ AUTO-REWARD: User ${userId} earned ${challenge.reward} coins for completing challenge ${challenge.id}`);
            }
            
            completedChallenges.push({
              challengeId: challenge.id,
              reward: challenge.reward
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error updating challenges for ${userId}:`, error);
    }

    return completedChallenges;
  }

  static async claimChallengeReward(userId: string, userChallengeId: string): Promise<{success: boolean, reward?: number, error?: string}> {
    try {
      const userChallenges = await storage.getUserChallenges(userId);
      const userChallenge = userChallenges.find(uc => uc.id === userChallengeId);
      
      if (!userChallenge) {
        return { success: false, error: "Challenge not found" };
      }
      
      if (!userChallenge.isCompleted) {
        return { success: false, error: "Challenge not completed yet" };
      }
      
      if (userChallenge.rewardClaimed) {
        return { success: false, error: "Rewards already claimed for this challenge" };
      }
      
      // Award the reward and mark as claimed in database atomically
      const user = await storage.getUser(userId);
      if (!user) {
        return { success: false, error: "User not found" };
      }
      
      // Update coins and mark reward as claimed
      await storage.updateUserCoins(userId, (user.coins || 0) + userChallenge.challenge.reward);
      await storage.markChallengeRewardAsClaimed(userId, userChallengeId);
      
      console.log(`✅ REWARD CLAIMED: User ${userId} claimed ${userChallenge.challenge.reward} coins for challenge ${userChallengeId}`);
      
      return { success: true, reward: userChallenge.challenge.reward };
    } catch (error) {
      console.error(`Error claiming challenge reward for user ${userId}, challenge ${userChallengeId}:`, error);
      return { success: false, error: "Internal server error" };
    }
  }

  // Get or create today's challenges
  static async getTodaysChallenges(): Promise<Challenge[]> {
    // First clean up old expired challenges
    await this.cleanupExpiredChallenges();
    
    const challenges = await storage.getChallenges();
    
    // Get current French date
    const now = new Date();
    const currentFrenchDay = new Date(now);
    
    // Adjust for French timezone (simple approximation)
    if (now.getUTCHours() >= 22) {
      currentFrenchDay.setUTCDate(currentFrenchDay.getUTCDate() + 1);
    }
    currentFrenchDay.setUTCHours(0, 0, 0, 0);
    
    // Check if there are already active challenges for today (French day)
    const todaysChallenges = challenges.filter(challenge => {
      const createdAt = new Date(challenge.createdAt || Date.now());
      const createdFrenchDay = new Date(createdAt);
      
      // Same logic for creation date
      if (createdAt.getUTCHours() >= 22) {
        createdFrenchDay.setUTCDate(createdFrenchDay.getUTCDate() + 1);
      }
      createdFrenchDay.setUTCHours(0, 0, 0, 0);
      
      return createdFrenchDay.getTime() === currentFrenchDay.getTime();
    });

    // If no challenges today, create new ones
    if (todaysChallenges.length === 0) {
      console.log('No challenges found for today, creating new challenges...');
      return await this.createDailyChallenges();
    }

    return todaysChallenges;
  }

  // New function to clean up expired challenges
  static async cleanupExpiredChallenges(): Promise<void> {
    try {
      await storage.cleanupExpiredChallenges();
    } catch (error) {
      console.error('Error during expired challenges cleanup:', error);
    }
  }

  // Function to get time remaining until next challenge reset (midnight French time)
  static getTimeUntilNextReset(): { hours: number; minutes: number; seconds: number } {
    try {
      const now = new Date();
      
      // Calculate next midnight at 22h UTC (= midnight UTC+2, French summer time)
      const nextReset = new Date(now);
      nextReset.setUTCHours(22, 0, 0, 0);
      
      // If it's already after 22h UTC today, move to next day
      if (now.getUTCHours() >= 22) {
        nextReset.setUTCDate(nextReset.getUTCDate() + 1);
      }
      
      const timeDiff = nextReset.getTime() - now.getTime();
      
      // Assurer que nous avons un temps positif
      if (timeDiff <= 0) {
        // Fallback: calculer pour demain
        const tomorrow = new Date(now);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        tomorrow.setUTCHours(22, 0, 0, 0);
        const fallbackDiff = tomorrow.getTime() - now.getTime();
        
        const hours = Math.max(0, Math.floor(fallbackDiff / (1000 * 60 * 60)));
        const minutes = Math.max(0, Math.floor((fallbackDiff % (1000 * 60 * 60)) / (1000 * 60)));
        const seconds = Math.max(0, Math.floor((fallbackDiff % (1000 * 60)) / 1000));
        
        return { hours, minutes, seconds };
      }
      
      const hours = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60)));
      const minutes = Math.max(0, Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60)));
      const seconds = Math.max(0, Math.floor((timeDiff % (1000 * 60)) / 1000));
      
      return { hours, minutes, seconds };
    } catch (error) {
      console.error('Error in getTimeUntilNextReset:', error);
      return { hours: 24, minutes: 0, seconds: 0 };
    }
  }
}