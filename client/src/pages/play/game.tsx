import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { useChipsStore } from "@/store/chips-store";
import { useUserStore } from "@/store/user-store";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { reloadCoinsBalance } from "@/lib/store-sync";
import BlackjackTable from "@/components/game/blackjack-table";

export default function GameMode() {
  const [, navigate] = useLocation();
  const [bet, setBet] = useState(0);
  const [gameMode, setGameMode] = useState<"classic" | "high-stakes" | "all-in">("classic");
  const [showResult, setShowResult] = useState(false);
  const [resultType, setResultType] = useState<"win" | "loss" | "tie" | "blackjack" | null>(null);
  const [finalWinnings, setFinalWinnings] = useState(0);
  const queryClient = useQueryClient();
  
  const closeAnimation = () => {
    setShowResult(false);
    setResultType(null);
    resetGame();
    // Redirect to respective betting page based on game mode
    if (gameMode === "all-in") {
      navigate("/play/all-in");
    } else if (gameMode === "high-stakes") {
      navigate("/play/high-stakes");
    } else {
      navigate("/play/classic");
    }
  };
  const { setMode, startGame, dealInitialCards, gameState, resetGame, playerHand, dealerHand, result, playerTotal, dealerTotal } = useGameStore();
  const currentBet = useGameStore((state) => state.bet); // ✅ Reactive selector for bet
  const { addWinnings, setAllInBalance } = useChipsStore();
  const user = useUserStore((state) => state.user);

  // Mutation to post game statistics
  const postStatsMutation = useMutation({
    mutationFn: async (stats: {
      gameType: string;
      handsPlayed: number;
      handsWon: number;
      blackjacks: number;
      totalWinnings: number;
      totalLosses: number;
    }) => {
      const response = await apiRequest('POST', '/api/stats', stats);
      return await response.json();
    },
    onSuccess: (data) => {
      // Invalidate challenges and statistics cache to update them immediately
      queryClient.invalidateQueries({ queryKey: ['/api/challenges/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] }); // To update XP
      void reloadCoinsBalance().catch(() => console.warn('Failed to reload coins after game stats update'));
      
      // Display gained XP if present
      if (data.xpGained > 0) {
        console.log(`+${data.xpGained} XP gained!`);
      }
      
      // If level up, display rewards
      if (data.levelUp) {
        console.log(`🎉 Level ${data.levelUp.newLevel} reached!`);
        if (data.levelUp.rewards) {
          if (data.levelUp.rewards.coins) {
            console.log(`💰 +${data.levelUp.rewards.coins} coins received!`);
          }
          if (data.levelUp.rewards.gems) {
            console.log(`💎 +${data.levelUp.rewards.gems} gems received!`);
          }
        }
      }
      
      // Reload user data after game to sync XP
      const { loadUser } = useUserStore.getState();
      loadUser().catch(() => console.warn('Failed to reload user data'));
      
      // If challenges have been completed, store them for animation on home screen
      if (data.completedChallenges) {
        console.log('Completed challenges:', data.completedChallenges);
        
        // Completed challenges are now handled automatically by coin animation
      }
    },
    onError: (error) => {
      console.error('Error updating statistics:', error);
    },
  });

  // Extract bet amount and mode from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const betAmount = urlParams.get('bet');
    const mode = urlParams.get('mode') || "classic";
    
    setGameMode(mode as "classic" | "high-stakes" | "all-in");
    
    if (betAmount) {
      setBet(parseInt(betAmount));
    } else {
      // If no bet, return to the right page according to mode  
      if (mode === "all-in") {
        navigate("/play/all-in");
      } else if (mode === "high-stakes") {
        navigate("/play/high-stakes");
      } else {
        navigate("/play/classic");
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (bet > 0) {
      // All modes now use the same client-side dealing flow
      if (gameMode === "all-in") {
        console.log("🎯 All-in mode: Using standard Classic 21 flow with special payouts");
        setMode("classic"); // Use classic mode for All-in
        startGame("cash"); // Use cash mode for coin handling
        dealInitialCards(bet);
      } else {
        // Classic and high-stakes modes
        setMode(gameMode === "high-stakes" ? "high-stakes" : "classic");
        startGame("cash"); // Use cash mode for all coin-based games
        dealInitialCards(bet);
      }
    }
  }, [setMode, startGame, dealInitialCards, bet, gameMode]);

  // Calculate winnings and display result animation with delay
  useEffect(() => {
    if (gameState === "gameOver" && result !== null && !showResult) {
      // Wait 4 seconds to see dealer reveal cards before animation
      const delayTimer = setTimeout(() => {
        console.log("🔍 DEBUG Double Down - Starting payout calculation:");
        console.log("🔍 currentBet (from game store):", currentBet);
        console.log("🔍 result:", result);
        console.log("🔍 gameMode:", gameMode);
        
        let winnings = 0;
        let type: "win" | "loss" | "tie" | "blackjack" = "loss";
      
      // Check if it's a natural blackjack (2 cards that make 21)
      const playerHandValue = playerHand.reduce((sum, card) => {
        if (card.value === 'A') return sum + 11;
        if (['K', 'Q', 'J'].includes(card.value)) return sum + 10;
        return sum + parseInt(card.value);
      }, 0);
      const isPlayerBlackjack = playerHand.length === 2 && playerHandValue === 21;
      
      if (result === "win" && isPlayerBlackjack) {
        if (gameMode === "all-in") {
          // All-in blackjack = currentBet × 4 (règle: mise x 4)
          winnings = Math.floor(currentBet * 4);
        } else {
          // Natural blackjack = currentBet × 2.5 in High Stakes, × 2.5 in Classic
          winnings = Math.floor(gameMode === "high-stakes" ? currentBet * 2.5 : currentBet * 2.5);
        }
        type = "blackjack";
      } else if (result === "win") {
        if (gameMode === "all-in") {
          // All-in normal win = currentBet × 3 (règle: mise x 3)
          winnings = Math.floor(currentBet * 3);
        } else {
          // Normal win = currentBet × 2 in High Stakes, × 2 in Classic  
          winnings = Math.floor(gameMode === "high-stakes" ? currentBet * 2 : currentBet * 2);
        }
        type = "win";
        console.log("🔍 DEBUG Win calculated - winnings:", winnings);
      } else if (result === "push") {
        if (gameMode === "all-in") {
          // All-in push = on récupère notre mise (règle: récupérer la mise)
          winnings = Math.floor(currentBet);
        } else {
          // Tie = recover currentBet (normal modes)
          winnings = Math.floor(currentBet);
        }
        type = "tie";
      } else if (result === "lose") {
        if (gameMode === "all-in") {
          // All-in loss = recover 10% (server now uses 10% as configured, net loss 90%)
          winnings = Math.floor(currentBet * 0.1);
        } else {
          // Loss = nothing (currentBet already deducted)
          winnings = 0;
        }
        type = "loss";
      }

      // Apply streak multiplier for 21 Streak mode (high-stakes) - nouvelles règles
      if (gameMode === "high-stakes" && (type === "win" || type === "blackjack") && winnings > 0) {
        const currentStreak = user?.currentStreak21 || 0;
        // Nouvelles règles: Streak 0 = x2, Streak 1 = x3, Streak 2 = x4, etc. (streak + 2)
        // Pas de limite maximale de streak
        const streakMultiplier = currentStreak + 2;
        // Apply multiplier to bet amount (not to winnings which already include the bet)
        winnings = Math.floor(currentBet * streakMultiplier);
        
        // Log streak bonus for debugging
        console.log(`21 Streak bonus applied: ${streakMultiplier}x multiplier (streak: ${currentStreak})`);
      }
      
        // Handle balance update differently for All-in mode
        if (gameMode === "all-in") {
          // In All-in mode, the server returns the final balance, not winnings to add
          console.log("🔍 DEBUG All-in mode - Setting final balance:", winnings);
          setAllInBalance(winnings); // Replace balance with server-calculated amount
        } else {
          // Normal modes: add winnings to existing balance
          if (winnings > 0) {
            console.log("🔍 DEBUG Final winnings before addWinnings:", winnings);
            addWinnings(winnings);
            console.log("🔍 DEBUG addWinnings called with:", winnings);
          }
        }

        // Post statistics to update challenges
        // Calculate stats winnings (different from UI winnings for push results)
        let statsWinnings = 0;
        let statsLosses = 0;
        
        if (result === "win") {
          // For wins, stats winnings = total winnings amount
          statsWinnings = winnings;
        } else if (result === "push") {
          // For push, no net gain or loss in stats (this fixes the 21-21 streak bug)
          statsWinnings = 0;
          statsLosses = 0;
        } else if (result === "lose") {
          // For losses, record the loss amount
          statsLosses = currentBet;
        }
        
        postStatsMutation.mutate({
          gameType: gameMode === "high-stakes" ? "high-stakes" : gameMode === "all-in" ? "all-in" : "classic",
          handsPlayed: 1,
          handsWon: result === "win" ? 1 : 0,
          blackjacks: type === "blackjack" ? 1 : 0,
          totalWinnings: statsWinnings,
          totalLosses: statsLosses,
        });
        
        // Display animation
        setResultType(type);
        setFinalWinnings(winnings);
        setShowResult(true);
      }, 2000); // 2 second delay to see dealer reveal cards
      
      return () => clearTimeout(delayTimer);
    }
  }, [gameState, result, showResult, currentBet, playerHand, addWinnings, resetGame, navigate]);

  if (bet === 0) {
    return null; // Wait for bet to be set
  }

  const getResultAnimation = () => {
    if (!resultType) return {};
    
    switch (resultType) {
      case "win":
        return {
          text: "WIN",
          color: "text-green-400",
          bgColor: "bg-transparent",
          borderColor: "border-green-400",
          scale: [1, 1.1, 1],
        };
      case "blackjack":
        return {
          text: "BLACKJACK !",
          color: "text-yellow-400",
          bgColor: "bg-transparent",
          borderColor: "border-yellow-400",
          scale: [1, 1.2, 1],
        };
      case "tie":
        return {
          text: "Push",
          color: "text-yellow-400",
          bgColor: "bg-transparent",
          borderColor: "border-yellow-400",
          scale: [1, 1.05, 1],
        };
      case "loss":
        return {
          text: "LOSE",
          color: "text-red-400",
          bgColor: "bg-transparent",
          borderColor: "border-red-400",
          scale: [1, 0.9, 1],
        };
      default:
        return {};
    }
  };

  const resultAnimation = getResultAnimation();

  return (
    <div className="relative">
      <BlackjackTable 
        gameMode={gameMode === "all-in" ? "all-in" : "cash"} 
        playMode={gameMode === "all-in" ? "classic" : gameMode} 
      />
      {/* Full screen result animation */}
      <AnimatePresence>
        {showResult && resultAnimation.text && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAnimation}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
          >
            <div className="relative">
              
              <motion.div
                initial={{ scale: 0, rotate: -5 }}
                animate={{ 
                  scale: 1,
                  rotate: 0,
                  transition: { 
                    duration: 0.4,
                    type: "spring",
                    bounce: 0.3
                  }
                }}
                className={`${resultAnimation.bgColor} ${resultAnimation.borderColor} px-8 py-6 rounded-2xl border shadow-xl max-w-sm mx-4`}
              >
                <motion.h1
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ 
                    y: 0, 
                    opacity: 1,
                    transition: { delay: 0.1 }
                  }}
                  className={`text-4xl font-bold ${resultAnimation.color} text-center mb-4`}
                >
                  {resultAnimation.text}
                </motion.h1>
                
                {/* Dealer and player scores */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ 
                    y: 0, 
                    opacity: 1,
                    transition: { delay: 0.2 }
                  }}
                  className="grid grid-cols-2 gap-4 mb-4"
                >
                  <div className="bg-red-500/20 rounded-xl p-3 text-center">
                    <p className="text-white/60 text-sm">Dealer</p>
                    <p className="text-white font-bold text-2xl">{dealerTotal}</p>
                  </div>
                  <div className="bg-green-500/20 rounded-xl p-3 text-center">
                    <p className="text-white/60 text-sm">You</p>
                    <p className="font-bold text-2xl text-[#ffffff]">{playerTotal}</p>
                  </div>
                </motion.div>
                
                {/* Display winnings or losses */}
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ 
                    y: 0, 
                    opacity: 1,
                    transition: { delay: 0.3 }
                  }}
                  className="text-white text-lg text-center mb-3"
                >
                  {resultType === "win" || resultType === "blackjack" ? 
                    `+${finalWinnings.toLocaleString()}` :
                   resultType === "tie" ?
                    `+${currentBet.toLocaleString()}` :
                   `-${currentBet.toLocaleString()}`} chips
                </motion.p>
                
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}