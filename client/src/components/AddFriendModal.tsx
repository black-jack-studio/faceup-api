import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Users, Check, X, Inbox } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getAvatarById, getDefaultAvatar } from "@/data/avatars";
import { PremiumCrown } from "@/components/ui/PremiumCrown";
import magnifyingGlassImage from "@assets/magnifying_glass_tilted_left_3d_1758380308472.png";
import mailboxImage from "@assets/open_mailbox_with_raised_flag_3d_1758380421569.png";
import searchIcon3D from "@assets/magnifying_glass_tilted_left_3d_1758380517118.png";
import openMailboxImage from "@assets/open_mailbox_with_raised_flag_3d_1758384714878.png";
import { apiFetch } from "@/lib/api";

interface AddFriendModalProps {
  onClose: () => void;
}

export default function AddFriendModal({ onClose }: AddFriendModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"search" | "requests">("search");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search users query
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ["/api/friends/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim() || searchQuery.trim().length < 2) {
        return [];
      }
      const response = await apiFetch(`/api/friends/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (!response.ok) {
        throw new Error("Failed to search users");
      }
      const data = await response.json();
      return data.users || [];
    },
    enabled: searchQuery.trim().length >= 2,
  });

  // Fetch friend requests received
  const { data: friendRequestsData, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["/api/friends/requests"],
    enabled: activeTab === "requests",
  });

  const friendRequests = (friendRequestsData as any)?.requests || [];

  // Send friend request mutation
  const sendFriendRequestMutation = useMutation({
    mutationFn: async (recipientId: string) => {
      return await apiRequest("POST", "/api/friends/request", { recipientId });
    },
    onSuccess: () => {
      toast({
        title: "Friend request sent!",
        description: "Your friend request has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      onClose();
    },
    onError: (error: any) => {
      // Handle CSRF errors specifically
      if (error.message?.includes("CSRF token validation failed") || error.message?.includes("403")) {
        toast({
          title: "Session expired",
          description: "Please refresh the page and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to send friend request",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Accept friend request mutation
  const acceptFriendRequestMutation = useMutation({
    mutationFn: async (requesterId: string) => {
      return await apiRequest("POST", "/api/friends/accept", { requesterId });
    },
    onSuccess: () => {
      toast({
        title: "Friend request accepted!",
        description: "You are now friends!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
    },
    onError: (error: any) => {
      // Handle CSRF errors specifically
      if (error.message?.includes("CSRF token validation failed") || error.message?.includes("403")) {
        toast({
          title: "Session expired",
          description: "Please refresh the page and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to accept friend request",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Reject friend request mutation
  const rejectFriendRequestMutation = useMutation({
    mutationFn: async (requesterId: string) => {
      return await apiRequest("POST", "/api/friends/reject", { requesterId });
    },
    onSuccess: () => {
      toast({
        title: "Friend request rejected",
        description: "The friend request has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
    },
    onError: (error: any) => {
      // Handle CSRF errors specifically
      if (error.message?.includes("CSRF token validation failed") || error.message?.includes("403")) {
        toast({
          title: "Session expired",
          description: "Please refresh the page and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to reject friend request",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handleSendRequest = (recipientId: string) => {
    sendFriendRequestMutation.mutate(recipientId);
  };

  const handleAcceptRequest = (requesterId: string) => {
    acceptFriendRequestMutation.mutate(requesterId);
  };

  const handleRejectRequest = (requesterId: string) => {
    rejectFriendRequestMutation.mutate(requesterId);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex bg-white/5 rounded-2xl p-1">
        <button
          onClick={() => setActiveTab("search")}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
            activeTab === "search" 
              ? "bg-[#60A5FA] text-white" 
              : "text-white/70 hover:text-white"
          }`}
          data-testid="tab-search"
        >
          <img src={magnifyingGlassImage} alt="Search" className="w-5 h-5" />
          <span>Search Friends</span>
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
            activeTab === "requests" 
              ? "bg-[#60A5FA] text-white" 
              : "text-white/70 hover:text-white"
          }`}
          data-testid="tab-requests"
        >
          <img src={mailboxImage} alt="Requests" className="w-5 h-5" />
          <span>Requests</span>
          {friendRequests.length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
              {friendRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "search" ? (
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
            <Input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#60A5FA] rounded-2xl"
              data-testid="input-search-friends"
            />
          </div>

          {/* Search Results */}
          <div className="max-h-80 overflow-y-auto">
            {searchQuery.trim().length < 2 ? (
              <div className="text-center py-8">
                <img src={searchIcon3D} alt="Search" className="w-12 h-12 mx-auto mb-3" />
                <p className="text-white/70">Enter at least 2 characters to search</p>
              </div>
            ) : isSearching ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/10 rounded-full animate-pulse" />
                      <div className="flex-1">
                        <div className="w-20 h-4 bg-white/10 rounded mb-2 animate-pulse" />
                        <div className="w-16 h-3 bg-white/10 rounded animate-pulse" />
                      </div>
                      <div className="w-16 h-8 bg-white/10 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-white/50" />
                </div>
                <p className="text-white/70">No users found</p>
                <p className="text-white/50 text-sm">Try a different username</p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((user: any, index: number) => {
                  const avatar = user.selectedAvatarId ? 
                    getAvatarById(user.selectedAvatarId) : 
                    getDefaultAvatar();

                  return (
                    <motion.div
                      key={user.id}
                      className="bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      data-testid={`search-result-${user.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                          {avatar?.image ? (
                            <img 
                              src={avatar.image} 
                              alt={`${user.username} avatar`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#60A5FA] flex items-center justify-center">
                              <span className="text-white text-sm font-bold">
                                {user.username[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-white font-semibold truncate" data-testid={`user-username-${user.id}`}>
                              {user.username}
                            </p>
                            {user.membershipType === 'premium' && (
                              <PremiumCrown size={14} />
                            )}
                          </div>
                          <p className="text-white/50 text-xs">Level {user.level || 1}</p>
                        </div>

                        {/* Friendship Status & Actions */}
                        <div className="flex-shrink-0">
                          {user.friendshipStatus === 'friends' ? (
                            <div className="flex items-center space-x-2 text-green-400">
                              <Check className="w-4 h-4" />
                              <span className="text-sm">Friends</span>
                            </div>
                          ) : user.friendshipStatus === 'pending_sent' ? (
                            <div className="flex items-center space-x-2 text-yellow-400">
                              <X className="w-4 h-4" />
                              <span className="text-sm">Pending</span>
                            </div>
                          ) : user.friendshipStatus === 'pending_received' ? (
                            <div className="flex items-center space-x-2 text-blue-400">
                              <Check className="w-4 h-4" />
                              <span className="text-sm">Accept</span>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleSendRequest(user.id)}
                              disabled={sendFriendRequestMutation.isPending}
                              className="bg-[#60A5FA] hover:bg-[#60A5FA]/90 text-white"
                              data-testid={`button-add-friend-${user.id}`}
                            >
                              <UserPlus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Friend Requests */}
          <div className="max-h-80 overflow-y-auto">
            {isLoadingRequests ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/10 rounded-full animate-pulse" />
                      <div className="flex-1">
                        <div className="w-20 h-4 bg-white/10 rounded mb-2 animate-pulse" />
                        <div className="w-16 h-3 bg-white/10 rounded animate-pulse" />
                      </div>
                      <div className="w-20 h-8 bg-white/10 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : friendRequests.length === 0 ? (
              <div className="text-center py-8">
                <img 
                  src={openMailboxImage} 
                  alt="No friend requests" 
                  className="w-12 h-12 mx-auto mb-3" 
                />
                <p className="text-white/70">No friend requests</p>
                <p className="text-white/50 text-sm">You'll see new friend requests here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {friendRequests.map((request: any, index: number) => {
                  const avatar = request.requester?.selectedAvatarId ? 
                    getAvatarById(request.requester.selectedAvatarId) : 
                    getDefaultAvatar();

                  return (
                    <motion.div
                      key={request.id}
                      className="bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      data-testid={`friend-request-${request.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                          {avatar?.image ? (
                            <img 
                              src={avatar.image} 
                              alt={`${request.requester?.username} avatar`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#60A5FA] flex items-center justify-center">
                              <span className="text-white text-sm font-bold">
                                {(request.requester?.username || 'U')[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-white font-semibold truncate" data-testid={`request-username-${request.id}`}>
                              {request.requester?.username || 'Unknown'}
                            </p>
                            {request.requester?.membershipType === 'premium' && (
                              <PremiumCrown size={14} />
                            )}
                          </div>
                          <p className="text-white/50 text-xs">Wants to be your friend</p>
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRequest(request.requesterId)}
                            disabled={acceptFriendRequestMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-full"
                            data-testid={`button-accept-${request.id}`}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectRequest(request.requesterId)}
                            disabled={rejectFriendRequestMutation.isPending}
                            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white rounded-full"
                            data-testid={`button-reject-${request.id}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}