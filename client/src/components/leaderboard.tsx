import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

interface LeaderboardUser {
  id: string;
  username: string;
  weeklyXp: number;
  position: number;
  avatar: string;
  medal: string;
}

export default function Leaderboard() {
  const { data: leaderboard = [], isLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ["/api/leaderboard/weekly"],
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glassmorphism rounded-2xl p-4 flex items-center space-x-4">
            <div className="w-16 h-6 bg-muted animate-pulse rounded" />
            <div className="flex-1">
              <div className="w-20 h-4 bg-muted animate-pulse rounded mb-2" />
              <div className="w-16 h-3 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Weekly leaderboard</h2>
        <button className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
          <i className="fas fa-question text-xs text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-3">
        {leaderboard.map((user: LeaderboardUser, index: number) => (
          <motion.div
            key={user.id}
            className="glassmorphism rounded-2xl p-4 flex items-center space-x-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            data-testid={`leaderboard-user-${index}`}
          >
            <div className="flex items-center space-x-3">
              <div className="text-xl">{user.medal}</div>
              <div className="text-3xl">{user.avatar}</div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white" data-testid={`username-${index}`}>
                {user.username}
              </h3>
              <p className="text-sm text-muted-foreground" data-testid={`xp-${index}`}>
                {user.weeklyXp.toLocaleString()} XP
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
