// Server-side BlackjackEngine for secure game validation
export interface Card {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  value: string;
  numericValue: number;
}

export interface GameResult {
  playerTotal: number;
  dealerTotal: number;
  playerHand: Card[];
  dealerHand: Card[];
  result: "win" | "lose" | "push";
  isPlayerBlackjack: boolean;
  isDealerBlackjack: boolean;
  playerBusted: boolean;
  dealerBusted: boolean;
}

export class ServerBlackjackEngine {
  /**
   * Validates that the cards are legitimate playing cards
   */
  static validateCard(card: Card): boolean {
    const validSuits = ["hearts", "diamonds", "clubs", "spades"];
    const validValues = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    
    if (!validSuits.includes(card.suit)) return false;
    if (!validValues.includes(card.value)) return false;
    
    // Validate numeric value matches the card value
    const expectedNumeric = card.value === "A" ? 11 : 
                           ["J", "Q", "K"].includes(card.value) ? 10 : 
                           parseInt(card.value);
    
    return card.numericValue === expectedNumeric;
  }

  /**
   * Validates a hand contains only valid cards and has reasonable count
   */
  static validateHand(hand: Card[]): boolean {
    if (!Array.isArray(hand) || hand.length < 2 || hand.length > 10) {
      return false;
    }
    
    return hand.every(card => this.validateCard(card));
  }

  /**
   * Calculates the total value of a hand, properly handling Aces
   */
  static calculateTotal(hand: Card[]): number {
    let total = 0;
    let aces = 0;

    for (const card of hand) {
      if (card.value === "A") {
        aces++;
        total += 11;
      } else {
        total += card.numericValue;
      }
    }

    // Adjust for aces (count as 1 instead of 11 if needed)
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }

    return total;
  }

  /**
   * Determines if a hand is a blackjack (21 with exactly 2 cards)
   */
  static isBlackjack(hand: Card[]): boolean {
    return hand.length === 2 && this.calculateTotal(hand) === 21;
  }

  /**
   * Determines the winner of a blackjack game based on validated hands
   */
  static determineWinner(
    playerHand: Card[],
    dealerHand: Card[]
  ): GameResult {
    // Validate inputs
    if (!this.validateHand(playerHand) || !this.validateHand(dealerHand)) {
      throw new Error("Invalid card hands provided");
    }

    const playerTotal = this.calculateTotal(playerHand);
    const dealerTotal = this.calculateTotal(dealerHand);
    
    const playerBusted = playerTotal > 21;
    const dealerBusted = dealerTotal > 21;
    
    const isPlayerBlackjack = this.isBlackjack(playerHand);
    const isDealerBlackjack = this.isBlackjack(dealerHand);

    let result: "win" | "lose" | "push";

    // Determine result using standard blackjack rules
    // CRITICAL: Player bust is an immediate loss, regardless of dealer's hand
    if (playerBusted) {
      result = "lose";
    } 
    // If player didn't bust but dealer did, player wins
    else if (dealerBusted) {
      result = "win";
    } 
    // Both players have valid hands (no busts), check for blackjacks
    else if (isPlayerBlackjack && isDealerBlackjack) {
      result = "push";
    } else if (isPlayerBlackjack) {
      result = "win";
    } else if (isDealerBlackjack) {
      result = "lose";
    } 
    // Compare totals for normal hands
    else if (playerTotal > dealerTotal) {
      result = "win";
    } else if (playerTotal < dealerTotal) {
      result = "lose";
    } else {
      // Only push when both have same total AND neither busted
      result = "push";
    }

    return {
      playerTotal,
      dealerTotal,
      playerHand,
      dealerHand,
      result,
      isPlayerBlackjack,
      isDealerBlackjack,
      playerBusted,
      dealerBusted
    };
  }

  /**
   * Validates that a dealer hand follows proper blackjack dealer rules
   * Dealer must hit on 16 and below, stand on 17 and above
   */
  static validateDealerPlay(dealerHand: Card[]): boolean {
    const total = this.calculateTotal(dealerHand);
    
    // If dealer has 2 cards and total >= 17, they should have stopped
    if (dealerHand.length === 2 && total >= 17) {
      return true;
    }
    
    // If dealer has more than 2 cards, verify they followed hitting rules
    if (dealerHand.length > 2) {
      // Check that dealer kept hitting while total was <= 16
      // This is a simplified check - in reality we'd need the full game history
      return total >= 17 || total > 21;
    }
    
    return true;
  }

  /**
   * Applies a win bias to favor the player in All-in mode
   * This improves the player's chances by converting some losses to wins or pushes
   */
  static applyAllInBias(result: GameResult, biasAmount: number = 0.0): GameResult {
    // No bias applied if biasAmount is 0 or result is already a win/push
    if (biasAmount <= 0 || result.result !== "lose") {
      return result;
    }
    
    // Apply bias - chance to convert loss to win or push
    const random = Math.random();
    
    if (random < biasAmount) {
      // 70% of biased outcomes become wins, 30% become pushes
      const outcomeRandom = Math.random();
      const newResult = outcomeRandom < 0.7 ? "win" : "push";
      
      return {
        ...result,
        result: newResult as "win" | "lose" | "push"
      };
    }
    
    // No bias applied this time
    return result;
  }

  /**
   * Comprehensive validation of an all-in game result with optional win bias
   */
  static validateAllInGame(playerHand: Card[], dealerHand: Card[], winBias: number = 0.0): GameResult {
    // Validate hand structures
    if (!this.validateHand(playerHand)) {
      throw new Error("Invalid player hand");
    }
    
    if (!this.validateHand(dealerHand)) {
      throw new Error("Invalid dealer hand");
    }

    // Validate dealer followed proper rules
    if (!this.validateDealerPlay(dealerHand)) {
      throw new Error("Dealer hand does not follow blackjack rules");
    }

    // Calculate the standard result
    const standardResult = this.determineWinner(playerHand, dealerHand);
    
    // Apply All-in bias to improve player's chances
    return this.applyAllInBias(standardResult, winBias);
  }
}