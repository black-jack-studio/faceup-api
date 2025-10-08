import { db } from './db.js';
import { cardBacks, userCardBacks } from '@shared/schema';
import { sql } from 'drizzle-orm';

interface CardBackData {
  name: string;
  description: string;
  rarity: 'COMMON' | 'RARE' | 'SUPER_RARE' | 'LEGENDARY';
  priceGems: number;
  sourceFile: string;
}

// Map the 5 new PNG card back designs to database records
const cardBackMapping: CardBackData[] = [
  {
    name: 'Geometric Green',
    description: 'Elegant emerald design with geometric patterns and target motif',
    rarity: 'COMMON',
    priceGems: 100,
    sourceFile: 'Capture_d_écran_2025-09-16_à_19.51.06-removebg-preview_1758046179538.png'
  },
  {
    name: 'Minimalist White',
    description: 'Clean white design with flowing organic curves',
    rarity: 'RARE',
    priceGems: 250,
    sourceFile: 'cgcg-removebg-preview_1758046179539.png'
  },
  {
    name: 'Royal Purple',
    description: 'Luxurious purple card back with diamond celestial pattern',
    rarity: 'SUPER_RARE',
    priceGems: 500,
    sourceFile: 'image-removebg-preview_1758046179539.png'
  },
  {
    name: 'Stellar Blue',
    description: 'Cosmic blue design with star and orbital patterns',
    rarity: 'RARE',
    priceGems: 250,
    sourceFile: 'kuyvh-removebg-preview_1758046179539.png'
  },
  {
    name: 'Radiant Black',
    description: 'Premium black design with radiant sunburst pattern',
    rarity: 'LEGENDARY',
    priceGems: 1000,
    sourceFile: 'kyv-removebg-preview_1758046179540.png'
  },
  {
    name: 'Orbital Hypnosis',
    description: 'Mesmerizing white design with hypnotic orbital circles and cosmic energy',
    rarity: 'LEGENDARY',
    priceGems: 1000,
    sourceFile: 'cgcg-removebg-preview_1758055631062.png'
  }
];

async function getCardBackImageUrl(fileName: string): Promise<string> {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  
  // Dual-mode approach: static assets for development, object storage for production
  if (!bucketId) {
    // Static mode: serve from public folder
    return `/card-backs/${fileName}`;
  } else {
    // Cloud mode: TODO - implement real object storage upload with SDK
    // For now, return static URL even in cloud mode
    return `/card-backs/${fileName}`;
  }
}

export async function addSingleCardBack(cardData: CardBackData): Promise<void> {
  console.log(`🎴 Adding single card back: ${cardData.name}...`);
  
  try {
    // Check if card back already exists
    const existingCardBack = await db.select()
      .from(cardBacks)
      .where(sql`${cardBacks.name} = ${cardData.name}`)
      .limit(1);
    
    if (existingCardBack.length > 0) {
      console.log(`✅ Card back "${cardData.name}" already exists - skipping`);
      return;
    }
    
    // Create standardized file name based on name
    const standardFileName = `${cardData.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    
    // Get image URL (static or cloud)
    const imageUrl = await getCardBackImageUrl(standardFileName);
    
    // Insert into database
    await db.insert(cardBacks).values({
      name: cardData.name,
      rarity: cardData.rarity,
      priceGems: cardData.priceGems,
      imageUrl: imageUrl,
      isActive: true
    });
    
    console.log(`✅ Added ${cardData.name} (${cardData.rarity}) - ${cardData.priceGems} gems - ${imageUrl}`);
    
  } catch (error) {
    console.error(`❌ Error adding card back "${cardData.name}":`, error);
    throw error;
  }
}

export async function seedCardBacks(): Promise<void> {
  console.log('🎴 Starting card back seeding with new PNG designs...');
  
  try {
    // DISABLED: Card back seeding disabled - using classic card back only
    console.log('🚫 Card back seeding disabled - using classic card back fallback only');
    return;
    
    for (let i = 0; i < cardBackMapping.length; i++) {
      const cardData = cardBackMapping[i];
      console.log(`📤 Processing ${cardData.name}...`);
      
      // Create standardized file name based on name
      const standardFileName = `${cardData.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      
      // Get image URL (static or cloud)
      const imageUrl = await getCardBackImageUrl(standardFileName);
      
      // Insert into database
      await db.insert(cardBacks).values({
        name: cardData.name,
        rarity: cardData.rarity,
        priceGems: cardData.priceGems,
        imageUrl: imageUrl,
        isActive: true
      });
      
      console.log(`✅ Seeded ${cardData.name} (${cardData.rarity}) - ${cardData.priceGems} gems - ${imageUrl}`);
    }
    
    console.log('🎴 Card back seeding completed successfully!');
    console.log('📊 Summary:');
    cardBackMapping.forEach(card => {
      console.log(`   ${card.name}: ${card.rarity} - ${card.priceGems} gems`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding card backs:', error);
    throw error;
  }
}

// Auto-run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedCardBacks()
    .then(() => {
      console.log('✅ Seeding complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}