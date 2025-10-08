import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Génère un code de parrainage unique de 6 caractères (A-Z, 0-9)
 * @returns Code de parrainage unique
 */
export async function generateUniqueReferralCode(): Promise<string> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    // Générer un code aléatoire de 6 caractères
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Vérifier si le code existe déjà
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.referralCode, code))
      .limit(1);

    if (existingUser.length === 0) {
      return code;
    }

    attempts++;
  }

  throw new Error('Failed to generate unique referral code after 10 attempts');
}

/**
 * Valide si un code de parrainage existe dans la base de données
 * @param code Code de parrainage à valider
 * @returns ID de l'utilisateur si le code existe, null sinon
 */
export async function validateReferralCode(code: string): Promise<string | null> {
  if (!code || code.length !== 6) {
    return null;
  }

  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.referralCode, code))
    .limit(1);

  return result.length > 0 ? result[0].id : null;
}

/**
 * Vérifie si un utilisateur peut encore entrer un code de parrainage
 * (moins de 48 heures depuis la création du compte)
 * @param userId ID de l'utilisateur
 * @returns true si l'utilisateur peut encore entrer un code
 */
export async function canEnterReferralCode(userId: string): Promise<boolean> {
  const user = await db
    .select({ 
      createdAt: users.createdAt,
      referredBy: users.referredBy
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user.length === 0) {
    return false;
  }

  // Si l'utilisateur a déjà un parrain, il ne peut plus en entrer un
  if (user[0].referredBy) {
    return false;
  }

  // Vérifier si moins de 48 heures se sont écoulées
  if (!user[0].createdAt) {
    return false;
  }

  const createdAt = new Date(user[0].createdAt);
  const now = new Date();
  const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

  return hoursSinceCreation < 48;
}
