import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import coinImage from "@assets/coins_1757366059535.png";
import { queryClient } from "@/lib/queryClient";
import { apiFetch } from "@/lib/api";

interface Challenge {
  id: string;
  challengeType: string;
  title: string;
  description: string;
  targetValue: number;
  reward: number;
  difficulty: string;
}

interface UserChallenge {
  id: string;
  currentProgress: number;
  isCompleted: boolean;
  rewardClaimed: boolean;
  challenge: Challenge;
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return 'text-green-400 bg-green-400/20';
    case 'medium':
      return 'text-yellow-400 bg-yellow-400/20';
    case 'hard':
      return 'text-red-400 bg-red-400/20';
    default:
      return 'text-gray-400 bg-gray-400/20';
  }
};

const getDifficultyIcon = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return '🌱';
    case 'medium':
      return '🔥';
    case 'hard':
      return '💎';
    default:
      return '⭐';
  }
};

export default function Challenges() {
  const { data: userChallenges = [], isLoading } = useQuery({
    queryKey: ["/api/challenges/user"],
  });

  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Fetch remaining time from API and update every second
  useEffect(() => {
    const fetchTimeLeft = async () => {
      try {
        const response = await apiFetch('/api/challenges/time-until-reset');
        const data = await response.json();
        setTimeLeft(data);
      } catch (error) {
        console.error('Error fetching remaining time:', error);
      }
    };

    // Fetch initial time
    fetchTimeLeft();

    // Update countdown every second
    const interval = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime.seconds > 0) {
          return { ...prevTime, seconds: prevTime.seconds - 1 };
        } else if (prevTime.minutes > 0) {
          return { hours: prevTime.hours, minutes: prevTime.minutes - 1, seconds: 59 };
        } else if (prevTime.hours > 0) {
          return { hours: prevTime.hours - 1, minutes: 59, seconds: 59 };
        } else {
          // Time elapsed, reload challenges
          fetchTimeLeft();
          // Invalidate challenge cache to reload them
          queryClient.invalidateQueries({ queryKey: ["/api/challenges/user"] });
          return { hours: 23, minutes: 59, seconds: 59 };
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glassmorphism rounded-2xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="w-32 h-4 bg-muted animate-pulse rounded mb-2" />
                <div className="w-24 h-3 bg-muted animate-pulse rounded" />
              </div>
              <div className="w-16 h-6 bg-muted animate-pulse rounded" />
            </div>
            <div className="w-full h-2 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }

  if ((userChallenges as UserChallenge[]).length === 0) {
    return (
      <div className="glassmorphism rounded-2xl p-6 text-center">
        <h3 className="text-lg font-semibold text-white mb-2">No challenges available</h3>
        
        <div className="rounded-lg px-4 py-3 inline-flex flex-col items-center">
          <div className="text-xs text-white mb-1">New challenge in:</div>
          <div className="text-white font-mono text-lg font-bold">
            {String(timeLeft.hours).padStart(2, '0')}:
            {String(timeLeft.minutes).padStart(2, '0')}:
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Daily Challenges</h2>
      </div>

      <div className="space-y-8">
        {(userChallenges as UserChallenge[])
          .filter((userChallenge: UserChallenge) => !userChallenge.rewardClaimed)
          .map((userChallenge: UserChallenge, index: number) => {
          const progress = Math.min((userChallenge.currentProgress / userChallenge.challenge.targetValue) * 100, 100);
          const isCompleted = userChallenge.isCompleted;
          
          return (
            <motion.div 
              key={userChallenge.id}
              initial={{ opacity: 1, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 pr-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-white text-sm" data-testid={`challenge-title-${index}`}>
                      {userChallenge.challenge.title}
                    </h3>
                  </div>
                  <p className="text-xs text-white mb-2">
                    {userChallenge.challenge.description}
                  </p>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-white font-medium">
                      {userChallenge.currentProgress}/{userChallenge.challenge.targetValue}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(userChallenge.challenge.difficulty)}`}>
                      {userChallenge.challenge.difficulty}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <div className="flex items-center space-x-1 text-yellow-400">
                    <img src={coinImage} alt="Coin" className="w-3 h-3" />
                    <span className="text-sm font-semibold text-white" data-testid={`challenge-reward-${index}`}>
                      {userChallenge.challenge.reward}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                <motion.div
                  className={`h-full ${isCompleted ? 'bg-green-400' : 'bg-blue-400'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  data-testid={`challenge-progress-${index}`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <div className="mt-8 mb-2 flex items-center justify-center space-x-2 text-xs text-white">
        <i className="fas fa-sync-alt" />
        <span>New challenges in: {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>
      </div>
    </div>
  );
}