import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "@/store/user-store";
import { useGemsStore } from "@/store/gems-store";
import { CardBack } from "@/lib/card-backs";
import { CardBack as DbCardBack } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { apiFetch } from "@/lib/api";
import { Lock } from "lucide-react";
import OffsuitCard from "@/components/PlayingCard";

// API response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface UserCardBack {
  id: string;
  userId: string;
  cardBackId: string;
  source: string;
  acquiredAt: string;
  cardBack: DbCardBack;
}

interface CardBackSelectorProps {
  currentCardBackId: string;
  onCardBackSelect?: () => void;
}

export default function CardBackSelector({ currentCardBackId, onCardBackSelect }: CardBackSelectorProps) {
  const [selectedCardId, setSelectedCardId] = useState(currentCardBackId);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateUser = useUserStore((state) => state.updateUser);
  const { gems: gemBalance } = useGemsStore();

  // Query pour récupérer les cartes possédées par l'utilisateur avec les détails complets
  const { data: ownedCardBacksResponse = { data: [] } } = useQuery<ApiResponse<UserCardBack[]>>({
    queryKey: ["/api/user/card-backs"],
  });

  // Extract the actual card back data from API response
  const ownedCardBacksData = ownedCardBacksResponse.data || [];

  // Query pour récupérer toutes les cartes disponibles
  const { data: allCardBacksResponse = { data: [] } } = useQuery<ApiResponse<DbCardBack[]>>({
    queryKey: ["/api/card-backs"],
  });

  // Extract all available card backs from API response
  const allCardBacks = allCardBacksResponse.data || [];

  // Create the classic card back that should always be available
  const classicCardBack: DbCardBack = {
    id: "classic",
    name: "Classic", 
    rarity: "COMMON",
    priceGems: 0, // Free
    imageUrl: "", // Uses default design
    isActive: true,
    createdAt: new Date()
  };

  const handleCardClick = async (cardBack: DbCardBack) => {
    const isOwned = isCardOwned(cardBack.id);
    
    if (!isOwned) {
      // Si la carte n'est pas possédée, essayer de l'acheter
      if (cardBack.priceGems && gemBalance >= cardBack.priceGems) {
        handleBuyCard(cardBack);
      } else {
        toast({
          title: "Insufficient funds",
          description: `You need ${cardBack.priceGems?.toLocaleString()} gems to buy this card.`,
          variant: "destructive",
        });
      }
      return;
    }
    
    // Si la carte est possédée, la sélectionner directement
    setSelectedCardId(cardBack.id);
    
    if (cardBack.id !== currentCardBackId) {
      // Use the mutation to persist the selection to the server
      selectCardBackMutation.mutate(cardBack.id);
    }
  };

  // Mutation pour sélectionner une carte
  const selectCardBackMutation = useMutation({
    mutationFn: async (cardBackId: string) => {
      const response = await apiRequest('PATCH', '/api/user/selected-card-back', {
        cardBackId
      });
      return response.json();
    },
    onSuccess: (data, cardBackId) => {
      // Update local state and store
      updateUser({ selectedCardBackId: cardBackId });
      
      // Invalidate queries to refresh user data across the app
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/selected-card-back'] });
      
      toast({
        title: "Card back selected!",
        description: data.data.message || "Your card back has been updated successfully.",
      });
      
      // Close the dialog
      if (onCardBackSelect) {
        onCardBackSelect();
      }
    },
    onError: (error: any) => {
      // Reset the selected card ID on error
      setSelectedCardId(currentCardBackId);
      
      toast({
        title: "Selection failed",
        description: error.message || "Failed to update card back selection. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation pour acheter une carte
  const buyCardBackMutation = useMutation({
    mutationFn: async (cardBack: DbCardBack) => {
      const response = await apiFetch("/api/shop/buy-card-back", {
        method: "POST",
        body: JSON.stringify({
          cardBackId: cardBack.id,
          price: cardBack.priceGems,
          currency: "gems"
        }),
      });
      if (!response.ok) throw new Error("Failed to buy card back");
      return response.json();
    },
    onSuccess: (_, cardBack) => {
      // Invalidate queries to refresh both inventory and user balance
      queryClient.invalidateQueries({ queryKey: ["/api/user/card-backs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/card-backs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Automatically select the newly purchased card using the mutation
      selectCardBackMutation.mutate(cardBack.id);
      
      toast({
        title: "Card purchased!",
        description: `You've successfully purchased ${cardBack.name}.`,
      });
    },
    onError: () => {
      toast({
        title: "Purchase failed",
        description: "Failed to purchase card back. Please try again.",
        variant: "destructive",
      });
    },
  });


  const handleBuyCard = (cardBack: DbCardBack) => {
    if (!cardBack.priceGems || gemBalance >= cardBack.priceGems) {
      buyCardBackMutation.mutate(cardBack);
    }
  };

  const isCardOwned = (cardId: string) => {
    return cardId === "classic" || (Array.isArray(ownedCardBacksData) && ownedCardBacksData.some((item: any) => item.cardBack?.id === cardId));
  };

  const canAffordCard = (price?: number) => {
    return !price || gemBalance >= price;
  };

  return (
    <div className="space-y-6 w-full px-4">
      <div className="text-left mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Select Card Back</h2>
        <p className="text-white/60">Choose your preferred card design</p>
      </div>

      {/* Grille des cartes - style similaire aux avatars */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 justify-items-center">
        {[classicCardBack, ...allCardBacks.filter(cardBack => isCardOwned(cardBack.id))].map((cardBack: DbCardBack) => {
          const isSelected = selectedCardId === cardBack.id;
          const isCurrent = currentCardBackId === cardBack.id;

          return (
            <motion.div
              key={cardBack.id}
              className={`cursor-pointer rounded-xl p-2 border-2 transition-all flex items-center justify-center ${
                isSelected || isCurrent
                  ? 'border-[#60A5FA] shadow-lg shadow-[#60A5FA]/20' 
                  : 'border-white/20 hover:border-white/40'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCardClick(cardBack)}
              data-testid={`card-back-${cardBack.id}`}
            >
              {/* Card preview */}
              <div className="w-24 sm:w-28 md:w-32 aspect-[3/4] relative grid place-items-center">
                <OffsuitCard
                  rank="A"
                  suit="spades"
                  faceDown={true}
                  size="xs"
                  className="block w-full h-auto"
                  cardBackUrl={cardBack.imageUrl}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {(selectCardBackMutation.isPending || buyCardBackMutation.isPending) && (
        <div className="flex justify-center pt-4">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 text-accent-green">
              <div className="w-4 h-4 border-2 border-accent-green/30 border-t-accent-green rounded-full animate-spin" />
              <span className="text-sm">{
                selectCardBackMutation.isPending ? "Saving selection..." : "Processing purchase..."
              }</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}