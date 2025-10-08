import { db } from '../db';
import { users } from '../../shared/schema';
import { isNull, eq } from 'drizzle-orm';
import { generateUniqueReferralCode } from './referral';

/**
 * Génère des codes de parrainage pour tous les utilisateurs qui n'en ont pas
 */
export async function generateReferralCodesForExistingUsers() {
  try {
    // Récupérer tous les utilisateurs sans code de parrainage
    const usersWithoutCode = await db
      .select({ id: users.id })
      .from(users)
      .where(isNull(users.referralCode));

    console.log(`📋 Found ${usersWithoutCode.length} users without referral codes`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of usersWithoutCode) {
      try {
        const referralCode = await generateUniqueReferralCode();
        
        await db
          .update(users)
          .set({ referralCode })
          .where(eq(users.id, user.id));

        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`✅ Generated ${successCount} codes...`);
        }
      } catch (error) {
        console.error(`❌ Error generating code for user ${user.id}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ Referral code generation complete: ${successCount} succeeded, ${errorCount} failed`);
  } catch (error) {
    console.error('❌ Error in generateReferralCodesForExistingUsers:', error);
    throw error;
  }
}
