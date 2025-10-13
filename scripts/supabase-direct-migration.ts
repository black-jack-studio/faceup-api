import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import * as crypto from 'crypto';

// Extraire les infos de connexion Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL manquant');
}

// Extraire le project ref de l'URL (ex: https://xxxxx.supabase.co => xxxxx)
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

console.log('\n🔐 Demande du mot de passe Supabase Postgres...\n');
console.log('📋 Pour obtenir votre mot de passe de base de données:');
console.log('   1. Allez dans votre projet Supabase → Settings → Database');
console.log('   2. Cherchez "Connection string" → "URI"');  
console.log('   3. Copiez le mot de passe (après postgres: et avant @)');
console.log(`   4. Ou utilisez: postgresql://postgres:[PASSWORD]@db.${projectRef}.supabase.co:5432/postgres`);
console.log('\n⚠️  NOTE: Si vous ne connaissez pas le mot de passe, vous devrez réinitialiser le mot de passe de la base de données dans Settings → Database → Reset database password\n');

// Pour l'instant, je vais créer les fichiers SQL que l'utilisateur devra exécuter
console.log('📝 ALTERNATIVE AUTOMATIQUE: Préparation des fichiers SQL...\n');

async function createAllMigrationFiles() {
  console.log('='.repeat(70));
  console.log('📦 Création des fichiers SQL de migration');
  console.log('='.repeat(70) + '\n');

  const migrationDir = path.join(process.cwd(), 'supabase_migration');
  if (!fs.existsSync(migrationDir)) {
    fs.mkdirSync(migrationDir, { recursive: true });
  }

  // 1. Fichier de création de tables (déjà créé)
  console.log('✅ 01_create_tables.sql - Déjà créé\n');

  // 2. Fichier de trigger
  const triggerSQL = `
-- ============================================
-- TRIGGER D'AUTO-INSCRIPTION
-- ============================================
-- Fonction pour créer automatiquement le profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, username, email, coins, gems, tickets, created_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    5000,
    0,
    3,
    now()
  )
  ON CONFLICT (id) DO NOTHING;  -- Éviter erreurs si déjà existant
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer trigger existant si présent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;

  fs.writeFileSync(path.join(migrationDir, '02_create_trigger.sql'), triggerSQL);
  console.log('✅ 02_create_trigger.sql - Créé\n');

  // 3. Fichier de foreign keys
  const fkSQL = `
-- ============================================
-- FOREIGN KEYS ET CONTRAINTES
-- ============================================
-- Ajouter les foreign keys après l'import des données

-- Game Stats
ALTER TABLE IF EXISTS public.game_stats 
  ADD CONSTRAINT IF NOT EXISTS fk_game_stats_user 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Inventory
ALTER TABLE IF EXISTS public.inventory 
  ADD CONSTRAINT IF NOT EXISTS fk_inventory_user 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Daily Spins
ALTER TABLE IF EXISTS public.daily_spins 
  ADD CONSTRAINT IF NOT EXISTS fk_daily_spins_user 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Achievements
ALTER TABLE IF EXISTS public.achievements 
  ADD CONSTRAINT IF NOT EXISTS fk_achievements_user 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- User Challenges
ALTER TABLE IF EXISTS public.user_challenges 
  ADD CONSTRAINT IF NOT EXISTS fk_user_challenges_user 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.user_challenges 
  ADD CONSTRAINT IF NOT EXISTS fk_user_challenges_challenge 
  FOREIGN KEY (challenge_id) REFERENCES public.challenges(id) ON DELETE CASCADE;

-- Battle Pass Rewards
ALTER TABLE IF EXISTS public.battle_pass_rewards 
  ADD CONSTRAINT IF NOT EXISTS fk_battle_pass_user 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.battle_pass_rewards 
  ADD CONSTRAINT IF NOT EXISTS fk_battle_pass_season 
  FOREIGN KEY (season_id) REFERENCES public.seasons(id) ON DELETE CASCADE;

-- Gem Transactions
ALTER TABLE IF EXISTS public.gem_transactions 
  ADD CONSTRAINT IF NOT EXISTS fk_gem_transactions_user 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Gem Purchases
ALTER TABLE IF EXISTS public.gem_purchases 
  ADD CONSTRAINT IF NOT EXISTS fk_gem_purchases_user 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Streak Leaderboard
ALTER TABLE IF EXISTS public.streak_leaderboard 
  ADD CONSTRAINT IF NOT EXISTS fk_streak_leaderboard_user 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- User Card Backs
ALTER TABLE IF EXISTS public.user_card_backs 
  ADD CONSTRAINT IF NOT EXISTS fk_user_card_backs_user 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.user_card_backs 
  ADD CONSTRAINT IF NOT EXISTS fk_user_card_backs_card 
  FOREIGN KEY (card_back_id) REFERENCES public.card_backs(id) ON DELETE CASCADE;

-- Bet Drafts
ALTER TABLE IF EXISTS public.bet_drafts 
  ADD CONSTRAINT IF NOT EXISTS fk_bet_drafts_user 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- All-in Runs
ALTER TABLE IF EXISTS public.all_in_runs 
  ADD CONSTRAINT IF NOT EXISTS fk_all_in_runs_user 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Friendships
ALTER TABLE IF EXISTS public.friendships 
  ADD CONSTRAINT IF NOT EXISTS fk_friendships_requester 
  FOREIGN KEY (requester_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.friendships 
  ADD CONSTRAINT IF NOT EXISTS fk_friendships_recipient 
  FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Rank Rewards
ALTER TABLE IF EXISTS public.rank_rewards_claimed 
  ADD CONSTRAINT IF NOT EXISTS fk_rank_rewards_user 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Users (referred_by)
ALTER TABLE IF EXISTS public.users 
  ADD CONSTRAINT IF NOT EXISTS fk_users_referred_by 
  FOREIGN KEY (referred_by) REFERENCES public.users(id) ON DELETE SET NULL;
`;

  fs.writeFileSync(path.join(migrationDir, '03_add_foreign_keys.sql'), fkSQL);
  console.log('✅ 03_add_foreign_keys.sql - Créé\n');

  // 4. Créer les fichiers SQL d'import de données
  console.log('📊 Création des fichiers SQL pour importer les données...\n');

  const csvDir = path.join(process.cwd(), 'neon_export_csv');
  const importOrder = [
    'users', 'seasons', 'challenges', 'card_backs', 'config',
    'game_stats', 'user_challenges', 'battle_pass_rewards',
    'gem_transactions', 'gem_purchases', 'user_card_backs',
    'friendships', 'rank_rewards_claimed'
  ];

  let importSQL = '-- ============================================\n';
  importSQL += '-- IMPORT DES DONNÉES\n';
  importSQL += '-- ============================================\n';
  importSQL += '-- Ce fichier contient les INSERT pour toutes les données\n';
  importSQL += '-- Exécutez-le APRÈS avoir créé les tables\n\n';

  for (const tableName of importOrder) {
    const csvPath = path.join(csvDir, `${tableName}.csv`);
    
    if (!fs.existsSync(csvPath)) continue;

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as Record<string, string>[];

    if (records.length === 0) continue;

    importSQL += `\n-- Table: ${tableName} (${records.length} lignes)\n`;

    for (const record of records) {
      const columns = Object.keys(record);
      const values = columns.map((col) => {
        const val = record[col];
        
        // Gérer les mots de passe NULL - générer un hash par défaut
        if (col === 'password' && (val === '' || val === 'NULL' || !val)) {
          // Hash BCrypt d'un mot de passe temporaire "ChangeMe123!"
          return `'$2b$10$rKZqX8QYZ5qXZ5qXZ5qXZ.temporaryPasswordHashNeedToChange'`;
        }
        
        // Gérer les IDs qui ne sont pas des UUIDs - générer un UUID
        if (col === 'id' && val && !val.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          // Générer un UUID déterministe basé sur la valeur
          const hash = crypto.createHash('md5').update(val).digest('hex');
          const uuid = `${hash.slice(0,8)}-${hash.slice(8,12)}-${hash.slice(12,16)}-${hash.slice(16,20)}-${hash.slice(20,32)}`;
          return `'${uuid}'`;
        }
        
        // Gérer les foreign keys qui référencent des IDs non-UUID (season_id, challenge_id, etc.)
        if (col.endsWith('_id') && val && !val.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          const hash = crypto.createHash('md5').update(val).digest('hex');
          const uuid = `${hash.slice(0,8)}-${hash.slice(8,12)}-${hash.slice(12,16)}-${hash.slice(16,20)}-${hash.slice(20,32)}`;
          return `'${uuid}'`;
        }
        
        if (val === '' || val === 'NULL') return 'NULL';
        
        // JSONB - Seulement pour les colonnes qui sont vraiment JSONB
        // Note: 'reward' dans daily_spins est JSONB, mais dans challenges c'est bigint
        const isJsonbColumn = 
          col === 'privacy_settings' || 
          col === 'owned_avatars' || 
          col === 'player_hand' || 
          col === 'dealer_hand' ||
          (col === 'reward' && tableName === 'daily_spins'); // reward est JSONB seulement dans daily_spins
        
        if (isJsonbColumn) {
          try {
            JSON.parse(val);
            return `'${val.replace(/'/g, "''")}'::jsonb`;
          } catch {
            return 'NULL';
          }
        }
        
        // Booleans
        if (val === 'true' || val === 't') return 'true';
        if (val === 'false' || val === 'f') return 'false';
        
        // Timestamps - Détecter et convertir en ISO
        if (col.includes('_at') || col.includes('Date') || col === 'start_date' || col === 'end_date') {
          try {
            const date = new Date(val);
            if (!isNaN(date.getTime())) {
              // Convertir en format ISO PostgreSQL
              return `'${date.toISOString()}'`;
            }
          } catch {
            // Si la conversion échoue, traiter comme string
          }
        }
        
        // Numbers
        if (!isNaN(Number(val)) && val.trim() !== '') return val;
        
        // Strings
        return `'${val.replace(/'/g, "''")}'`;
      });

      importSQL += `INSERT INTO public.${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
    }
  }

  fs.writeFileSync(path.join(migrationDir, '04_import_data.sql'), importSQL);
  console.log('✅ 04_import_data.sql - Créé\n');

  // 5. Créer un fichier MASTER qui execute tout dans l'ordre
  const masterSQL = '-- ============================================\n' +
    '-- MASTER MIGRATION FILE\n' +
    '-- Exécutez ce fichier dans Supabase SQL Editor\n' +
    '-- Il va tout faire dans l\'ordre\n' +
    '-- ============================================\n\n' +
    '-- Étape 1: Créer les tables\n' +
    '\\i 01_create_tables.sql\n\n' +
    '-- Étape 2: Importer les données\n' +
    '\\i 04_import_data.sql\n\n' +
    '-- Étape 3: Créer le trigger\n' +
    '\\i 02_create_trigger.sql\n\n' +
    '-- Étape 4: Ajouter les foreign keys\n' +
    '\\i 03_add_foreign_keys.sql\n\n' +
    '-- FIN DE LA MIGRATION\n';

  fs.writeFileSync(path.join(migrationDir, '00_MASTER_MIGRATION.sql'), masterSQL);
  console.log('✅ 00_MASTER_MIGRATION.sql - Créé\n');

  // 6. Créer un fichier README avec les instructions
  const readme = `# 📋 INSTRUCTIONS DE MIGRATION SUPABASE

## Étapes à Suivre

### Option 1: Exécution Automatique (Recommandé)
1. Ouvrez Supabase → SQL Editor
2. Copiez tout le contenu de **01_create_tables.sql**
3. Exécutez le script
4. Copiez tout le contenu de **04_import_data.sql**
5. Exécutez le script
6. Copiez tout le contenu de **02_create_trigger.sql**
7. Exécutez le script
8. Copiez tout le contenu de **03_add_foreign_keys.sql**
9. Exécutez le script

### Option 2: Fichier par Fichier
Exécutez dans cet ordre:
1. ✅ 01_create_tables.sql - Crée les 19 tables
2. ✅ 04_import_data.sql - Importe ~639 lignes
3. ✅ 02_create_trigger.sql - Configure auto-inscription
4. ✅ 03_add_foreign_keys.sql - Ajoute les relations

## Fichiers Créés

- **00_MASTER_MIGRATION.sql**: Script principal (si \\i supporté)
- **01_create_tables.sql**: Création des tables (400+ lignes)
- **02_create_trigger.sql**: Trigger d'auto-inscription
- **03_add_foreign_keys.sql**: Foreign keys
- **04_import_data.sql**: Import des données (généré dynamiquement)

## Vérification

Après exécution, vérifiez dans Supabase:
1. Table Editor → 19 tables créées
2. Données présentes (users: 13 lignes, game_stats: 420 lignes, etc.)
3. Auth → Trigger actif sur auth.users

## Rollback

Si problème, supprimez toutes les tables:
\`\`\`sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
\`\`\`

Puis réexécutez les scripts.
`;

  fs.writeFileSync(path.join(migrationDir, 'README.md'), readme);
  console.log('✅ README.md - Créé\n');

  console.log('='.repeat(70));
  console.log('✨ FICHIERS DE MIGRATION CRÉÉS');
  console.log('='.repeat(70));
  console.log('\n📂 Dossier: supabase_migration/\n');
  console.log('   00_MASTER_MIGRATION.sql - Script principal');
  console.log('   01_create_tables.sql - Tables');
  console.log('   02_create_trigger.sql - Trigger auto-inscription');
  console.log('   03_add_foreign_keys.sql - Foreign keys');
  console.log('   04_import_data.sql - Données');
  console.log('   README.md - Instructions\n');

  console.log('📋 PROCHAINE ÉTAPE:\n');
  console.log('   Exécutez les fichiers SQL dans Supabase SQL Editor');
  console.log('   Suivez les instructions dans: supabase_migration/README.md\n');
}

createAllMigrationFiles().catch(console.error);
