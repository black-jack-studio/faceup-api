// Card Back Types
export interface CardBack {
  id: string;
  name: string;
  slug: string;
  rarity: 'COMMON' | 'RARE' | 'SUPER_RARE' | 'LEGENDARY';
  imageUrl: string;
  width: number;
  height: number;
  bytes: number;
  sha256: string;
  description?: string;
}

export interface UserCardBack {
  id: string;
  userId: string;
  cardBackId: string;
  source: string;
  acquiredAt: string;
  cardBack: CardBack;
}

// Card backs data - exactement les 9 cartes autorisées plus Classic (défaut)
export const cardBacksData = {
  "version": "2.0.0",
  "cards": [
    {
      "id": "dot-classic-022",
      "name": "Dot",
      "slug": "dot-classic",
      "rarity": "COMMON",
      "imageUrl": "/card-backs/dot-classic-022.webp",
      "width": 512,
      "height": 742,
      "bytes": 0,
      "sha256": ""
    },
    {
      "id": "heart-large-024",
      "name": "Heart",
      "slug": "heart-large",
      "rarity": "COMMON",
      "imageUrl": "/card-backs/heart-large-024.webp",
      "width": 512,
      "height": 742,
      "bytes": 0,
      "sha256": ""
    },
    {
      "id": "spade-large-025",
      "name": "Spade",
      "slug": "spade-large",
      "rarity": "COMMON",
      "imageUrl": "/card-backs/spade-large-025.webp",
      "width": 1536,
      "height": 2226,
      "bytes": 0,
      "sha256": ""
    },
    {
      "id": "diamond-large-026",
      "name": "Diamond",
      "slug": "diamond-large",
      "rarity": "COMMON",
      "imageUrl": "/card-backs/diamond-large-026.webp",
      "width": 1536,
      "height": 2226,
      "bytes": 0,
      "sha256": ""
    },
    {
      "id": "club-large-027",
      "name": "Club",
      "slug": "club-large",
      "rarity": "COMMON",
      "imageUrl": "/card-backs/club-large-027.webp",
      "width": 1536,
      "height": 2226,
      "bytes": 0,
      "sha256": ""
    },
    {
      "id": "teddy-bear-large-036",
      "name": "Teddy Bear",
      "slug": "teddy-bear-large",
      "rarity": "COMMON",
      "imageUrl": "/card-backs/teddy-bear-large-036.webp",
      "width": 1536,
      "height": 2226,
      "bytes": 9128,
      "sha256": ""
    },
    {
      "id": "dino-large-038",
      "name": "Dino",
      "slug": "dino-large",
      "rarity": "COMMON",
      "imageUrl": "/card-backs/dino-large-038.png",
      "width": 512,
      "height": 512,
      "bytes": 0,
      "sha256": ""
    },
    {
      "id": "lys-design-039",
      "name": "Lys design",
      "slug": "lys-design",
      "rarity": "COMMON",
      "imageUrl": "/card-backs/lys-design-039.png",
      "width": 512,
      "height": 512,
      "bytes": 0,
      "sha256": ""
    },
    {
      "id": "jack-lion-040",
      "name": "Jack Lion",
      "slug": "jack-lion",
      "rarity": "COMMON",
      "imageUrl": "/card-backs/jack-lion-040.png",
      "width": 512,
      "height": 512,
      "bytes": 0,
      "sha256": ""
    }
  ]
};

// Utility functions
export const sortCardBacksByRarity = (cardBacks: UserCardBack[]): UserCardBack[] => {
  const rarityOrder = { 'COMMON': 0, 'RARE': 1, 'SUPER_RARE': 2, 'LEGENDARY': 3 };
  return [...cardBacks].sort((a, b) => {
    const rarityA = rarityOrder[a.cardBack.rarity as keyof typeof rarityOrder] ?? 0;
    const rarityB = rarityOrder[b.cardBack.rarity as keyof typeof rarityOrder] ?? 0;
    return rarityA - rarityB;
  });
};

export const getCardBackById = (id: string): CardBack | undefined => {
  return cardBacksData.cards.find(card => card.id === id) as CardBack | undefined;
};

export const getCardBacksByRarity = (rarity: CardBack['rarity']): CardBack[] => {
  return cardBacksData.cards.filter(card => card.rarity === rarity) as CardBack[];
};

export const getAllCardBacks = (): CardBack[] => {
  return cardBacksData.cards as CardBack[];
};

export const getDefaultCardBack = (): CardBack => {
  // Default card back is the classic one, return null since it's handled by backend
  return {
    id: 'default',
    name: 'Classic',
    slug: 'classic',
    rarity: 'COMMON',
    imageUrl: '/card-backs/classic.webp',
    width: 512,
    height: 742,
    bytes: 0,
    sha256: ''
  };
};

export const getRarityColor = (rarity: CardBack['rarity']): string => {
  const colors: Record<CardBack['rarity'], string> = {
    COMMON: 'text-zinc-300',
    RARE: 'text-blue-300',
    SUPER_RARE: 'text-violet-300',
    LEGENDARY: 'text-amber-300',
  };
  return colors[rarity] ?? colors.COMMON;
};

export const getRarityBackground = (rarity: CardBack['rarity']): string => {
  const backgrounds: Record<CardBack['rarity'], string> = {
    COMMON: 'bg-white/10',
    RARE: 'bg-blue-500/10',
    SUPER_RARE: 'bg-violet-500/10',
    LEGENDARY: 'bg-amber-500/10',
  };
  return backgrounds[rarity] ?? backgrounds.COMMON;
};

export const getRarityDisplayName = (rarity: CardBack['rarity']): string => {
  const names = {
    'COMMON': 'Common',
    'RARE': 'Rare',
    'SUPER_RARE': 'Super Rare',
    'LEGENDARY': 'Legendary'
  };
  return names[rarity] || names.COMMON;
};