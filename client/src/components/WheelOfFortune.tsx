import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUserStore } from "@/store/user-store";
import { reloadCoinsBalance } from "@/lib/store-sync";
import { Gem, Coin } from "@/icons";
import Pointer3D from "@/components/Pointer3D";
import { Ticket } from "@/components/ui/Ticket";

interface WheelOfFortuneProps {
  children: React.ReactNode;
}

interface WheelReward {
  type: 'coins' | 'gems' | 'xp' | 'tickets';
  amount: number;
}

export default function WheelOfFortune({ children }: WheelOfFortuneProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reward, setReward] = useState<WheelReward | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const { user, updateUser } = useUserStore();

  // Wheel segments with balanced layout - 2 coins, 2 gems, 2 tickets (opposites), synchronized with backend
  const segments = [
    { angle: 0, type: "coins", amount: 150, icon: "🪙", color: "#1F2937" }, // Dark gray
    { angle: 60, type: "gems", amount: 10, icon: "💎", color: "#000000" }, // Black
    { angle: 120, type: "tickets", amount: 1, icon: "🎫", color: "#1F2937" }, // Dark gray
    { angle: 180, type: "coins", amount: 500, icon: "🪙", color: "#000000" }, // Black - opposite to first coins
    { angle: 240, type: "gems", amount: 5, icon: "💎", color: "#1F2937" }, // Dark gray - opposite to first gems
    { angle: 300, type: "tickets", amount: 3, icon: "🎫", color: "#000000" }, // Black - opposite to first tickets
  ];

  useEffect(() => {
    if (isOpen) {
      // Reset rotation when opening to prevent unwanted animation
      setRotation(0);
      setIsSpinning(false);
      setShowReward(false);
    }
  }, [isOpen]);

  // Ad countdown effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isWatchingAd && adCountdown > 0) {
      timer = setTimeout(() => {
        setAdCountdown(adCountdown - 1);
      }, 1000);
    } else if (isWatchingAd && adCountdown === 0) {
      // Ad finished, now do the actual spin
      setIsWatchingAd(false);
      setAdCountdown(5);
      performActualSpin();
    }
    return () => clearTimeout(timer);
  }, [isWatchingAd, adCountdown]);



  const handleSpin = () => {
    if (isSpinning || isWatchingAd) return;

    // Start the ad simulation
    setIsWatchingAd(true);
    setAdCountdown(5);
  };

  // Rotation-based winning calculation function
  const winningIndexByRotation = (theta: number) => {
    const sector = 360 / segments.length;
    const norm = (d: number) => ((d % 360) + 360) % 360;
    const t = norm(theta);
    const adjusted = (360 - t + sector / 2) % 360;
    return Math.floor(adjusted / sector);
  };

  const performActualSpin = async () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setShowReward(false);
    setShouldAnimate(true);
    
    try {
      // Determine where the wheel will land (for animation only)
      const spins = 5 + Math.random() * 3; // 5-8 full rotations
      const randomAngle = Math.random() * 360; // Random final position
      const currentRotation = ((rotation % 360) + 360) % 360;
      const finalRotation = rotation + (spins * 360) + randomAngle;
      
      setRotation(finalRotation);
      
      // Calculate winning segment after animation completes using rotation angle
      setTimeout(async () => {
        const winIndex = winningIndexByRotation(finalRotation);
        const winningSegment = segments[winIndex];

        const reward: WheelReward = {
          type: winningSegment.type as 'coins' | 'gems' | 'xp' | 'tickets',
          amount: winningSegment.amount,
        };

        setReward(reward);

        try {
          await apiRequest("POST", "/api/wheel-of-fortune/spin", {
            rewardType: reward.type,
            rewardAmount: reward.amount,
          });

          if (reward.type === 'coins') {
            await reloadCoinsBalance();
          } else if (reward.type === 'gems') {
            updateUser({ gems: (user?.gems || 0) + reward.amount });
          } else if (reward.type === 'tickets') {
            updateUser({ tickets: (user?.tickets || 0) + reward.amount });
          }

          queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
          queryClient.invalidateQueries({ queryKey: ["/api/spin/status"] });
        } catch (e) {
          console.error("API call failed:", e);
        }

        setIsSpinning(false);
        setShowReward(true);
        setShouldAnimate(false);
      }, 3000);
      
    } catch (error: any) {
      setIsSpinning(false);
      setShouldAnimate(false);
      console.error("Spin error:", error.message || "Unable to spin the wheel");
    }
  };

  const handlePremiumSpin = async () => {
    if (isSpinning || isWatchingAd) return;

    // Check if user has enough gems
    if ((user?.gems || 0) < 10) {
      console.log("Not enough gems for premium spin");
      return;
    }

    setIsSpinning(true);
    setShowReward(false);
    setShouldAnimate(true);
    
    try {
      // Generate rotation first (like normal spin)
      const spins = 5 + Math.random() * 3; // 5-8 full rotations
      const randomAngle = Math.random() * 360; // Random final position
      const currentRotation = ((rotation % 360) + 360) % 360;
      const finalRotation = rotation + (spins * 360) + randomAngle;
      
      setRotation(finalRotation);
      
      // Calculate winning segment after animation completes using rotation angle
      setTimeout(async () => {
        const winIndex = winningIndexByRotation(finalRotation);
        const winningSegment = segments[winIndex];

        const reward: WheelReward = {
          type: winningSegment.type as 'coins' | 'gems' | 'xp' | 'tickets',
          amount: winningSegment.amount,
        };

        setReward(reward);

        try {
          // Call API to deduct gems and give reward - server handles everything
          await apiRequest("POST", "/api/wheel-of-fortune/premium-spin", {
            rewardType: reward.type,
            rewardAmount: reward.amount,
          });

          // Immediately update local store to reflect changes
          const currentGems = user?.gems || 0;
          const currentTickets = user?.tickets || 0;

          // Deduct 10 gems
          updateUser({ gems: currentGems - 10 });

          // Add reward
          if (reward.type === 'coins') {
            await reloadCoinsBalance();
          } else if (reward.type === 'gems') {
            updateUser({ gems: (currentGems - 10) + reward.amount });
          } else if (reward.type === 'tickets') {
            updateUser({ tickets: currentTickets + reward.amount });
          }

          // Reload user data from server to ensure consistency
          await queryClient.refetchQueries({ queryKey: ["/api/user/profile"] });
          await queryClient.refetchQueries({ queryKey: ["/api/spin/status"] });
        } catch (e) {
          console.error("API call failed:", e);
        }

        setIsSpinning(false);
        setShowReward(true);
        setShouldAnimate(false);
      }, 3000);
      
    } catch (error: any) {
      setIsSpinning(false);
      setShouldAnimate(false);
      console.error("Spin error:", error.message || "Unable to spin the wheel");
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild onClick={() => setIsOpen(true)}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-sm bg-black border-none p-0 overflow-hidden">
        <DialogTitle className="sr-only">Fortune Wheel</DialogTitle>
        <DialogDescription className="sr-only">
          Spin the wheel to win rewards. Free spin available once per day or use gems for premium spins.
        </DialogDescription>
        
        <div className="bg-black text-white min-h-[600px] flex flex-col">
          {/* Wheel Container */}
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="relative w-80 h-80">
              {/* Arrow pointing at the wheel */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8 z-30">
                <div className="flex flex-col items-center">
                  {/* 3D Arrow pointer */}
                  <Pointer3D width={60} shadow={true} />
                </div>
              </div>

              {/* Wheel */}
              <motion.div
                className="wheel relative w-full h-full rounded-full overflow-hidden bg-transparent"
                animate={{ rotate: rotation }}
                transition={isSpinning ? { duration: 3, ease: "easeOut" } : { duration: 0 }}
                style={{
                  border: '12px solid #1F2937'
                }}
              >
                {/* Separator lines only */}
                {segments.map((segment, index) => (
                  <div
                    key={`separator-${index}`}
                    className="absolute w-full h-full"
                    style={{
                      transform: `rotate(${index * 60}deg)`,
                      transformOrigin: "center center"
                    }}
                  >
                    {/* Straight separator line */}
                    <div
                      className="absolute bg-white/10"
                      style={{
                        top: "50%",
                        left: "50%",
                        width: "50%",
                        height: "2px",
                        transformOrigin: "left center"
                      }}
                    />
                  </div>
                ))}

                {/* Content icons and amounts */}
                {segments.map((segment, index) => (
                  <div
                    key={`content-${index}`}
                    className="absolute w-full h-full flex items-center justify-center"
                    style={{
                      transform: `rotate(${index * 60}deg)`,
                      transformOrigin: "center center"
                    }}
                  >
                    <div
                      className="flex flex-col items-center justify-center text-white drop-shadow-lg"
                      style={{
                        transform: `translateY(-100px)`,
                      }}
                    >
                      <div className="icon text-3xl drop-shadow-md">
                        {segment.type === 'coins' && <Coin size={40} />}
                        {segment.type === 'gems' && <Gem className="w-10 h-10" />}
                        {segment.type === 'tickets' && <Ticket size={40} />}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>


              {/* Center circle with loading indicator */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-black rounded-full flex items-center justify-center z-10 border-[6px] border-gray-600">
                {isSpinning ? (
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-700"></div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom section */}
          <div className="p-6 space-y-4">
            {/* Progress text */}
            <div className="text-center text-gray-400 text-sm">
              {isWatchingAd ? (
                <div className="space-y-2">
                  <p className="text-yellow-400 font-semibold">Regardez la pub...</p>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-8 h-8 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
                    <span className="text-white font-bold text-lg">{adCountdown}s</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <p>Watch an ad to spin the wheel!</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={handleSpin}
                disabled={isSpinning || isWatchingAd}
                className={`flex-1 text-white rounded-xl py-3 disabled:opacity-50 ${
                  isWatchingAd 
                    ? 'bg-yellow-600 hover:bg-yellow-600' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                data-testid="button-free-spin"
              >
                {isWatchingAd ? (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <rect x="5" y="8" width="14" height="8" rx="1" fill="currentColor"/>
                      <circle cx="19" cy="7" r="1" fill="currentColor"/>
                      <circle cx="19" cy="17" r="1" fill="currentColor"/>
                      <path d="M8 21l2-2h4l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className="font-semibold">Pub en cours...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <rect x="5" y="8" width="14" height="8" rx="1" fill="currentColor"/>
                      <circle cx="19" cy="7" r="1" fill="currentColor"/>
                      <circle cx="19" cy="17" r="1" fill="currentColor"/>
                      <path d="M8 21l2-2h4l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className="font-semibold">Free</span>
                  </div>
                )}
              </Button>
              
              <Button
                onClick={handlePremiumSpin}
                className="flex-1 bg-[#60A5FA] hover:bg-[#3b82f6] text-white rounded-xl py-3 flex items-center justify-center"
                data-testid="button-premium-spin"
              >
                <span className="font-semibold">10</span>
                <Gem className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Reward Display */}
          <AnimatePresence>
            {showReward && reward && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowReward(false)}
              >
                <motion.div
                  className="flex items-center space-x-4"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                >
                  <motion.div
                    className="text-6xl font-black text-white"
                    animate={{
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity
                    }}
                  >
                    +{reward.amount}
                  </motion.div>
                  
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    {reward.type === 'coins' ? (
                      <Coin size={64} glow />
                    ) : reward.type === 'gems' ? (
                      <Gem className="w-16 h-16" />
                    ) : reward.type === 'tickets' ? (
                      <Ticket size={64} glow />
                    ) : null}
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}