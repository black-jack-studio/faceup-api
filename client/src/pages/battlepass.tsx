import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Clock, HelpCircle } from 'lucide-react';
import { useUserStore } from '@/store/user-store';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiFetch } from "@/lib/api";
import { reloadCoinsBalance } from '@/lib/store-sync';
import Coin from '@/icons/Coin';
import Gem from '@/icons/Gem';
import freeChestIcon from '@assets/cofre-de-madera-3d-icon-png-download-6786354_1758880709054.webp';
import premiumChestIcon from '@assets/chest-3d-icon-png-download-8478872_1758881061557.webp';
import claimedFreeChestIcon from '@assets/coffrez_1759075255040.png';
import claimedPremiumChestIcon from '@assets/image_1759075926080.png';
import ticketIcon from '@assets/admission-ticket_1758705583427.png';

interface PassTier {
  tier: number;
  xpRequired: number;
  freeReward: boolean;
  premiumReward: boolean;
  premiumEffect?: 'golden' | 'blue' | 'purple';
}

// Define 50 Battle Pass tiers - Special rewards every 10 tiers, regular rewards on all other tiers
const BATTLE_PASS_TIERS: PassTier[] = [
  // Tiers 1-9: Regular rewards with chests
  { tier: 1, xpRequired: 10, freeReward: true, premiumReward: true },
  { tier: 2, xpRequired: 20, freeReward: true, premiumReward: true },
  { tier: 3, xpRequired: 30, freeReward: true, premiumReward: true },
  { tier: 4, xpRequired: 40, freeReward: true, premiumReward: true },
  { tier: 5, xpRequired: 50, freeReward: true, premiumReward: true },
  { tier: 6, xpRequired: 60, freeReward: true, premiumReward: true },
  { tier: 7, xpRequired: 70, freeReward: true, premiumReward: true },
  { tier: 8, xpRequired: 80, freeReward: true, premiumReward: true },
  { tier: 9, xpRequired: 90, freeReward: true, premiumReward: true },
  // Tier 10: First special reward tier - Card themed
  { tier: 10, xpRequired: 100, freeReward: true, premiumReward: true, premiumEffect: 'golden' },
  // Tiers 11-19: Regular rewards with chests
  { tier: 11, xpRequired: 110, freeReward: true, premiumReward: true },
  { tier: 12, xpRequired: 120, freeReward: true, premiumReward: true },
  { tier: 13, xpRequired: 130, freeReward: true, premiumReward: true },
  { tier: 14, xpRequired: 140, freeReward: true, premiumReward: true },
  { tier: 15, xpRequired: 150, freeReward: true, premiumReward: true },
  { tier: 16, xpRequired: 160, freeReward: true, premiumReward: true },
  { tier: 17, xpRequired: 170, freeReward: true, premiumReward: true },
  { tier: 18, xpRequired: 180, freeReward: true, premiumReward: true },
  { tier: 19, xpRequired: 190, freeReward: true, premiumReward: true },
  // Tier 20: Second special reward tier - Gem themed
  { tier: 20, xpRequired: 200, freeReward: true, premiumReward: true, premiumEffect: 'golden' },
  // Tiers 21-29: Regular rewards with chests
  { tier: 21, xpRequired: 210, freeReward: true, premiumReward: true },
  { tier: 22, xpRequired: 220, freeReward: true, premiumReward: true },
  { tier: 23, xpRequired: 230, freeReward: true, premiumReward: true },
  { tier: 24, xpRequired: 240, freeReward: true, premiumReward: true },
  { tier: 25, xpRequired: 250, freeReward: true, premiumReward: true },
  { tier: 26, xpRequired: 260, freeReward: true, premiumReward: true },
  { tier: 27, xpRequired: 270, freeReward: true, premiumReward: true },
  { tier: 28, xpRequired: 280, freeReward: true, premiumReward: true },
  { tier: 29, xpRequired: 290, freeReward: true, premiumReward: true },
  // Tier 30: Third special reward tier - Coin themed
  { tier: 30, xpRequired: 300, freeReward: true, premiumReward: true, premiumEffect: 'golden' },
  // Tiers 31-39: Premium only rewards with chests
  { tier: 31, xpRequired: 310, freeReward: false, premiumReward: true },
  { tier: 32, xpRequired: 320, freeReward: false, premiumReward: true },
  { tier: 33, xpRequired: 330, freeReward: false, premiumReward: true },
  { tier: 34, xpRequired: 340, freeReward: false, premiumReward: true },
  { tier: 35, xpRequired: 350, freeReward: false, premiumReward: true },
  { tier: 36, xpRequired: 360, freeReward: false, premiumReward: true },
  { tier: 37, xpRequired: 370, freeReward: false, premiumReward: true },
  { tier: 38, xpRequired: 380, freeReward: false, premiumReward: true },
  { tier: 39, xpRequired: 390, freeReward: false, premiumReward: true },
  // Tier 40: Fourth special reward tier - Premium only - Lucky themed
  { tier: 40, xpRequired: 400, freeReward: false, premiumReward: true, premiumEffect: 'golden' },
  // Tiers 41-49: Premium only rewards with chests
  { tier: 41, xpRequired: 410, freeReward: false, premiumReward: true },
  { tier: 42, xpRequired: 420, freeReward: false, premiumReward: true },
  { tier: 43, xpRequired: 430, freeReward: false, premiumReward: true },
  { tier: 44, xpRequired: 440, freeReward: false, premiumReward: true },
  { tier: 45, xpRequired: 450, freeReward: false, premiumReward: true },
  { tier: 46, xpRequired: 460, freeReward: false, premiumReward: true },
  { tier: 47, xpRequired: 470, freeReward: false, premiumReward: true },
  { tier: 48, xpRequired: 480, freeReward: false, premiumReward: true },
  { tier: 49, xpRequired: 490, freeReward: false, premiumReward: true },
  // Tier 50: Final special reward tier - Premium only - Ultimate themed
  { tier: 50, xpRequired: 500, freeReward: false, premiumReward: true, premiumEffect: 'golden' }
];

const SEASON_MAX_XP = 500; // Same rule as in profile: 500 XP per level

interface SeasonInfoResponse {
  seasonName?: string;
  seasonId?: string;
  wasReset?: boolean;
  timeRemaining?: {
    days: number;
    hours: number;
    minutes: number;
  };
}

export default function BattlePassPage() {
  const user = useUserStore((state) => state.user);
  const [, navigate] = useLocation();
  const [hasPremiumPass, setHasPremiumPass] = useState(false);
  const [claimedTiers, setClaimedTiers] = useState<{freeTiers: number[], premiumTiers: number[]} | null>(null);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [lastReward, setLastReward] = useState<{ type: 'coins' | 'gems' | 'tickets'; amount: number } | null>(null);
  const [claimingTier, setClaimingTier] = useState<{ tier: number; isPremium: boolean } | null>(null);

  // Fetch season info with auto-reset check
  const { data: seasonInfo } = useQuery<SeasonInfoResponse>({
    queryKey: ['/api/seasons/info'],
    refetchInterval: 300000, // Update every 5 minutes
  });

  // Fetch real-time season countdown
  const { data: timeRemaining } = useQuery({
    queryKey: ['/api/seasons/time-remaining'],
    refetchInterval: 60000, // Update every minute
  });

  // Fetch claimed tiers - always refetch on mount to prevent duplicate claims
  const { data: claimedTiersData, isLoading: isLoadingClaimedTiers, isFetching: isFetchingClaimedTiers } = useQuery({
    queryKey: ['/api/battlepass/claimed-tiers', user?.id],
    enabled: !!user?.id,
    refetchOnMount: 'always', // Always refetch when component mounts
    staleTime: 0, // Always consider data stale to ensure fresh data
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ['/api/subscription/status'],
    refetchInterval: 300000, // Update every 5 minutes (reduced from 1 minute)
    staleTime: 240000, // Consider data fresh for 4 minutes
    gcTime: 600000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  React.useEffect(() => {
    if (claimedTiersData) {
      const data = claimedTiersData as any;
      if (data.freeTiers && data.premiumTiers) {
        setClaimedTiers({
          freeTiers: data.freeTiers || [],
          premiumTiers: data.premiumTiers || []
        });
      } else if (Array.isArray(data.claimedTiers)) {
        // Fallback for old API format
        setClaimedTiers({ freeTiers: data.claimedTiers, premiumTiers: [] });
      } else {
        // Initialize with empty arrays if no data
        setClaimedTiers({ freeTiers: [], premiumTiers: [] });
      }
    }
  }, [claimedTiersData]);

  // Show loading skeleton while claimed tiers data is loading on first load
  const isDataLoading = isLoadingClaimedTiers || (claimedTiers === null && isFetchingClaimedTiers);

  if (!user) return null;

  // Memoized calculations to avoid unnecessary re-renders
  const userLevel = useMemo(() => user.level || 1, [user.level]);
  const currentXP = useMemo(() => user.currentLevelXP || 0, [user.currentLevelXP]);
  const progressPercentage = useMemo(() => Math.min((currentXP / SEASON_MAX_XP) * 100, 100), [currentXP]);

  // Use real time remaining from API, fallback to default values
  const { daysRemaining, hoursRemaining } = useMemo(() => {
    const seasonTime = timeRemaining as { days: number; hours: number; minutes: number } | undefined;
    return {
      daysRemaining: seasonTime?.days ?? 30,
      hoursRemaining: seasonTime?.hours ?? 0
    };
  }, [timeRemaining]);

  const handleUnlockPremium = useCallback(() => {
    navigate('/premium');
  }, [navigate]);

  // Check if user has premium subscription - memoized
  const isUserPremium = useMemo(() => 
    (subscriptionData as any)?.isActive || user?.membershipType === 'premium' || false, 
    [subscriptionData, user?.membershipType]
  );

  const handleClaimTier = useCallback(async (tier: number, isPremium = false) => {
    const isUnlocked = userLevel >= tier;
    if (!isUnlocked) return;
    
    // Check if already claimed - don't proceed if data is still loading
    if (!claimedTiers) return;
    
    const relevantTiers = isPremium ? (claimedTiers?.premiumTiers || []) : (claimedTiers?.freeTiers || []);
    if (relevantTiers.includes(tier)) return;

    // Prevent multiple simultaneous claims
    if (claimingTier) return;

    // OPTIMISTIC UPDATE: Immediately update claimed tiers for better UX
    setClaimedTiers(prev => {
      if (!prev) return prev;
      return {
        freeTiers: isPremium ? (prev.freeTiers || []) : [...(prev.freeTiers || []), tier],
        premiumTiers: isPremium ? [...(prev.premiumTiers || []), tier] : (prev.premiumTiers || [])
      };
    });

    // Set claiming state to prevent multiple clicks
    setClaimingTier({ tier, isPremium });

    try {
      const response = await apiFetch('/api/battlepass/claim-tier', {
        method: 'POST',
        body: JSON.stringify({ tier, isPremium })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Transform server response to animation format
        const reward = data.reward;
        let animationReward: { type: 'coins' | 'gems' | 'tickets'; amount: number } | null = null;
        
        if (reward.coins > 0) {
          animationReward = { type: 'coins', amount: reward.coins };
        } else if (reward.gems > 0) {
          animationReward = { type: 'gems', amount: reward.gems };
        } else if (reward.tickets > 0) {
          animationReward = { type: 'tickets', amount: reward.tickets };
        }
        
        setLastReward(animationReward);
        setShowRewardAnimation(true);
        
        // Invalidate and refetch to ensure claimed tiers are persisted
        await queryClient.invalidateQueries({ 
          queryKey: ['/api/battlepass/claimed-tiers']
        });
        
        // Invalidate user data for balance display
        await queryClient.invalidateQueries({
          queryKey: ['/api/user/profile']
        });
        await reloadCoinsBalance();
        
      } else {
        // ROLLBACK optimistic update on error
        setClaimedTiers(prev => {
          if (!prev) return prev;
          return {
            freeTiers: isPremium ? (prev.freeTiers || []) : (prev.freeTiers || []).filter(t => t !== tier),
            premiumTiers: isPremium ? (prev.premiumTiers || []).filter(t => t !== tier) : (prev.premiumTiers || [])
          };
        });
        
        const errorData = await response.json();
        if (errorData.message === "Premium subscription required to claim premium rewards") {
          handleUnlockPremium();
        }
      }
    } catch (error) {
      console.error('Failed to claim tier:', error);
      
      // ROLLBACK optimistic update on error
      setClaimedTiers(prev => {
        if (!prev) return prev;
        return {
          freeTiers: isPremium ? (prev.freeTiers || []) : (prev.freeTiers || []).filter(t => t !== tier),
          premiumTiers: isPremium ? (prev.premiumTiers || []).filter(t => t !== tier) : (prev.premiumTiers || [])
        };
      });
    } finally {
      // Always reset claiming state when done
      setClaimingTier(null);
    }
  }, [userLevel, claimedTiers, claimingTier, handleUnlockPremium]);


  // Get special emoji and theme for reward tiers
  const getRewardTheme = (tierNumber: number, isPremium: boolean) => {
    // Special rewards for every 10th tier
    switch (tierNumber) {
      case 10:
        return {
          emoji: isPremium ? '🃏' : '🎯', // Joker card / Target
          cardRef: 'Ace High',
          description: isPremium ? 'Royal Cards' : 'Lucky Strike',
          isSpecial: true
        };
      case 20:
        return {
          emoji: isPremium ? '💎' : '🎰', // Diamond / Slot machine
          cardRef: 'Double Down',
          description: isPremium ? 'Precious Gems' : 'Jackpot',
          isSpecial: true
        };
      case 30:
        return {
          emoji: isPremium ? '👑' : '🪙', // Crown / Coin
          cardRef: 'Triple Seven',
          description: isPremium ? 'Royal Treasury' : 'Golden Coins',
          isSpecial: true
        };
      case 40:
        return {
          emoji: isPremium ? '⭐' : '🍀', // Star / Four-leaf clover
          cardRef: 'Four of a Kind',
          description: isPremium ? 'Legendary Star' : 'Lucky Clover',
          isSpecial: true
        };
      case 50:
        return {
          emoji: isPremium ? '🏆' : '🎊', // Trophy / Party popper
          cardRef: 'Royal Flush',
          description: isPremium ? 'Champion Trophy' : 'Grand Celebration',
          isSpecial: true
        };
      default:
        // Regular rewards for all other tiers
        return {
          emoji: isPremium ? '💰' : '🪙', // Premium chest / Regular coins
          cardRef: `Tier ${tierNumber}`,
          description: '',
          isSpecial: false
        };
    }
  };

  const RewardBox = ({ tier, isPremium = false, isUnlocked = false }: { tier: PassTier; isPremium?: boolean; isUnlocked?: boolean }) => {
    const hasReward = isPremium ? tier.premiumReward : tier.freeReward;
    if (!hasReward) {
      // Show empty progression slots for non-reward tiers
      return (
        <div className="relative w-32 h-32 rounded-3xl border-2 border-gray-800 bg-gray-900/30 flex items-center justify-center opacity-40">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-500">{tier.tier}</span>
          </div>
        </div>
      );
    }

    // Check if this specific tier/type is claimed
    // Handle loading state - don't show as claimed/unclaimed while loading
    if (isDataLoading || claimedTiers === null) {
      return (
        <div className={`relative ${tier.premiumEffect ? 'w-36 h-36' : 'w-32 h-32'} rounded-3xl border-2 border-gray-700 bg-gray-800 flex items-center justify-center`}>
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-gray-600 rounded-lg"></div>
          </div>
          {hasReward && (
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white text-xs px-1 py-0.5 rounded-full font-bold">
              {tier.tier}
            </div>
          )}
        </div>
      );
    }

    const relevantTiers = isPremium ? (claimedTiers?.premiumTiers || []) : (claimedTiers?.freeTiers || []);
    const isClaimed = relevantTiers.includes(tier.tier);
    
    // Check if this specific tier is currently being claimed
    const isCurrentlyClaiming = claimingTier?.tier === tier.tier && claimingTier?.isPremium === isPremium;
    
    const canClaim = isPremium ? 
      (isUnlocked && isUserPremium && !isClaimed && !isCurrentlyClaiming && !claimingTier) : 
      (isUnlocked && !isClaimed && !isCurrentlyClaiming && !claimingTier);

    const rewardTheme = getRewardTheme(tier.tier, isPremium);
    const isSpecialTier = tier.premiumEffect !== undefined; // Special tiers have premium effects
    
    let glowStyle = {};
    let bgStyle = 'bg-gray-800 border-gray-700';

    // Override all styles with black background and green border if claimed
    if (isClaimed) {
      bgStyle = 'bg-black border-green-500';
    } else {
      // Apply special effects only for unclaimed special tiers (10, 20, 30, 40, 50)
      if (isPremium && tier.premiumEffect && isSpecialTier) {
        switch (tier.premiumEffect) {
          case 'golden':
            glowStyle = {
              boxShadow: '0 0 30px rgba(255, 215, 0, 0.4), inset 0 0 20px rgba(255, 215, 0, 0.1)'
            };
            bgStyle = 'bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border-yellow-600/50';
            break;
          case 'blue':
            glowStyle = {
              boxShadow: '0 0 30px rgba(59, 130, 246, 0.4), inset 0 0 20px rgba(59, 130, 246, 0.1)'
            };
            bgStyle = 'bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border-blue-600/50';
            break;
          case 'purple':
            glowStyle = {
              boxShadow: '0 0 30px rgba(147, 51, 234, 0.4), inset 0 0 20px rgba(147, 51, 234, 0.1)'
            };
            bgStyle = 'bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-600/50';
            break;
        }
      } else if (isSpecialTier && !isPremium) {
        // Special tiers for free column - transparent with border only
        bgStyle = 'border-gray-700';
      } else if (!isSpecialTier) {
        // Regular styling for non-special tiers
        bgStyle = isPremium ? 'bg-purple-900/20 border-purple-600/30' : 'border-gray-700';
      }
    }

    return (
      <motion.div
        className={`relative ${isSpecialTier ? 'w-36 h-36' : 'w-32 h-32'} rounded-3xl border-2 flex items-center justify-center ${bgStyle} ${
          canClaim ? 'cursor-pointer hover:scale-105 !border-white' : ''
        }`}
        style={glowStyle}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: tier.tier * 0.1 }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (canClaim) {
            handleClaimTier(tier.tier, isPremium);
          }
        }}
        whileHover={canClaim ? { scale: 1.05 } : {}}
        whileTap={canClaim ? { scale: 0.95 } : {}}
      >
        {/* Reward Content */}
        <div className="text-center">
          {isClaimed ? (
            <div className="flex flex-col items-center">
              <img 
                src={isPremium ? claimedPremiumChestIcon : claimedFreeChestIcon} 
                alt="Claimed reward" 
                className="w-24 h-24 filter drop-shadow-lg mb-1"
              />
            </div>
          ) : isCurrentlyClaiming ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin w-16 h-16 border-4 border-gray-300 border-t-yellow-500 rounded-full"></div>
              <div className="text-xs mt-2 text-yellow-400 font-semibold">Claiming...</div>
            </div>
          ) : canClaim ? (
            <div className="flex flex-col items-center animate-pulse">
              {/* All tiers display chest icon */}
              <img 
                src={isPremium ? premiumChestIcon : freeChestIcon} 
                alt="Reward chest" 
                className="w-24 h-24 filter drop-shadow-lg"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center opacity-70">
              {/* All tiers display chest icon (locked) */}
              <img 
                src={isPremium ? premiumChestIcon : freeChestIcon} 
                alt="Locked reward" 
                className="w-24 h-24 filter drop-shadow-lg"
              />
            </div>
          )}
        </div>
        
        
        {/* Tier badge for all tiers */}
        {hasReward && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-white text-xs font-bold flex items-center justify-center">
            <div className="bg-white text-black px-2 py-1 rounded-full flex items-center justify-center">
              {tier.tier}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Sticky Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="flex items-center justify-between p-6">
          <button
            onClick={() => navigate('/')}
            className="text-white/80 hover:text-white transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-white">{seasonInfo?.seasonName || 'Battle Pass'}</h1>
          <div className="w-6 h-6"></div>
        </div>
      </div>

      {/* Main content with top padding to account for sticky header */}
      <div className="flex-1 pt-28 p-6">
        {/* XP Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#60A5FA] font-bold text-lg">XP {currentXP} / {SEASON_MAX_XP}</span>
            <div className="flex items-center text-white/60">
              <Clock className="w-5 h-5 mr-2" />
              <span className="text-lg">{daysRemaining}d {hoursRemaining}h</span>
            </div>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#60A5FA] to-blue-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              data-testid="xp-progress-bar"
            />
          </div>
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="rounded-3xl p-4 text-center border border-gray-700" style={{ backgroundColor: '#000000' }}>
            <span className="text-white/80 font-bold text-lg">Free</span>
          </div>
          <div className="rounded-3xl p-4 text-center border border-white/20" style={{ backgroundColor: '#000000' }}>
            <div className="flex items-center justify-center space-x-2">
              <Star className="w-5 h-5 text-white fill-white" />
              <span className="text-white font-bold text-lg">Premium</span>
            </div>
          </div>
        </div>

        {/* Rewards Grid */}
        <div className="space-y-4 mb-8">
          {BATTLE_PASS_TIERS.map((tier) => {
            const isUnlocked = userLevel >= tier.tier;
            const hasRewards = tier.freeReward || tier.premiumReward;
            
            return (
            <motion.div
              key={tier.tier}
              className={`grid grid-cols-2 gap-6 ${!isUnlocked ? 'opacity-50' : ''} py-2`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: tier.tier * 0.02 }}
            >
              {/* Free Reward */}
              <div className="relative flex justify-center">
                <RewardBox tier={tier} isPremium={false} isUnlocked={isUnlocked} />
              </div>
              
              {/* Premium Reward */}
              <div className="relative flex justify-center">
                <RewardBox tier={tier} isPremium={true} isUnlocked={isUnlocked} />
              </div>
              
            </motion.div>);
          })}
        </div>

        {/* Padding bottom for sticky button */}
        <div className="pb-16"></div>
      </div>

      {/* Sticky Bottom Button - Only show for non-premium users */}
      {!isUserPremium && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-black/90 backdrop-blur-md border-t border-gray-800">
          <motion.button
            onClick={handleUnlockPremium}
            className="w-full bg-white text-black font-bold text-lg py-4 rounded-2xl hover:bg-gray-100 transition-colors shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            data-testid="button-unlock-premium-rewards"
          >
            Unlock premium rewards
          </motion.button>
        </div>
      )}

      {/* Reward Animation Modal - Optimized for performance */}
      {showRewardAnimation && lastReward && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          style={{ willChange: 'opacity' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={() => setShowRewardAnimation(false)}
        >
          <motion.div
            className="flex items-center space-x-4"
            style={{ willChange: 'transform' }}
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 25,
              duration: 0.4 
            }}
          >
            <motion.div
              className="text-6xl font-black text-white"
              style={{ willChange: 'transform' }}
              animate={{
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 1.2,
                repeat: 2, // Limit repeats to avoid infinite animations
                ease: "easeInOut"
              }}
            >
              +{lastReward.amount}
            </motion.div>
            
            <motion.div
              style={{ willChange: 'transform' }}
              animate={{
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 1,
                repeat: 2, // Limit repeats to avoid infinite animations
                ease: "easeInOut"
              }}
            >
              {lastReward.type === 'coins' ? (
                <Coin size={64} glow />
              ) : lastReward.type === 'gems' ? (
                <Gem className="w-16 h-16" />
              ) : (
                <img src={ticketIcon} alt="Ticket" className="w-16 h-16" />
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}