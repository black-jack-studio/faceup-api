import { db } from '../db';
import { users, gameStats } from '../../shared/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Vérifie et distribue les récompenses de parrainage quand un utilisateur atteint 11 victoires (Moo Rookie)
 * @param userId ID de l'utilisateur à vérifier
 * @returns Résultat de la distribution avec détails
 */
export async function checkAndDistributeReferralRewards(userId: string): Promise<{
  distributed: boolean;
  amount?: number;
  referrerAmount?: number;
  referrerId?: string;
}> {
  try {
    // Récupérer l'utilisateur avec ses infos de parrainage
    const user = await db
      .select({
        id: users.id,
        referredBy: users.referredBy,
        referralRewardClaimed: users.referralRewardClaimed,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return { distributed: false };
    }

    const currentUser = user[0];

    // Si pas de parrain ou récompenses déjà distribuées, ne rien faire
    if (!currentUser.referredBy || currentUser.referralRewardClaimed) {
      return { distributed: false };
    }

    // Compter le nombre total de victoires de l'utilisateur
    const stats = await db
      .select({
        totalWins: sql<number>`COALESCE(SUM(${gameStats.handsWon}), 0) + COALESCE(SUM(${gameStats.blackjacks}), 0)`,
      })
      .from(gameStats)
      .where(eq(gameStats.userId, userId));

    const totalWins = stats[0]?.totalWins || 0;

    // Si l'utilisateur n'a pas atteint 11 victoires, ne rien faire
    if (totalWins < 11) {
      return { distributed: false };
    }

    // ATOMIC TRANSACTION: Distribuer les récompenses
    await db.transaction(async (tx) => {
      // Vérifier à nouveau que les récompenses n'ont pas été distribuées (éviter race condition)
      const checkUser = await tx
        .select({ referralRewardClaimed: users.referralRewardClaimed })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (checkUser[0]?.referralRewardClaimed) {
        throw new Error('Rewards already claimed');
      }

      // Donner 10,000 coins au parrainé (utilisateur actuel)
      await tx
        .update(users)
        .set({
          coins: sql`${users.coins} + 10000`,
          referralRewardClaimed: true,
        })
        .where(eq(users.id, userId));

      // Donner 5,000 coins au parrain
      if (currentUser.referredBy) {
        await tx
          .update(users)
          .set({
            coins: sql`${users.coins} + 5000`,
          })
          .where(eq(users.id, currentUser.referredBy));
      }
    });

    console.log(`✨ Referral rewards distributed: ${userId} (10K) and ${currentUser.referredBy} (5K)`);

    return {
      distributed: true,
      amount: 10000,
      referrerAmount: 5000,
      referrerId: currentUser.referredBy,
    };
  } catch (error: any) {
    // Si erreur "Rewards already claimed", c'est ok, on ignore
    if (error.message === 'Rewards already claimed') {
      return { distributed: false };
    }
    console.error('Error distributing referral rewards:', error);
    throw error;
  }
}
