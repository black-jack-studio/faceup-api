import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useChipsStore } from '@/store/chips-store';

export default function CoinsHero() {
  const { balance, loadBalance, isLoading } = useChipsStore();

  const [displayedBalance, setDisplayedBalance] = useState(balance);
  const [animationColor, setAnimationColor] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const previousBalanceRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const loadBalanceRef = useRef(loadBalance);

  useEffect(() => {
    loadBalanceRef.current = loadBalance;
  }, [loadBalance]);

  useEffect(() => {
    void loadBalanceRef.current();
  }, []);

  // Animate coins when balance changes
  useEffect(() => {
    if (isLoading || balance === 0) return;
    
    // Get the previously stored amount
    const storedBalance = localStorage.getItem('previousCoinsBalance');
    // If no old balance stored, this is the first visit
    if (!storedBalance) {
      setDisplayedBalance(balance);
      localStorage.setItem('previousCoinsBalance', balance.toString());
      previousBalanceRef.current = balance;
      return;
    }
    
    const previousBalance = parseInt(storedBalance);
    
    // If no change, no animation
    if (previousBalance === balance) {
      setDisplayedBalance(balance);
      return;
    }
    
    // There is a change, start animation
    const difference = balance - previousBalance;
    
    if (difference !== 0) {
      setIsAnimating(true);
      
      // Set color based on gain/loss
      if (difference > 0) {
        setAnimationColor('text-green-400');
      } else {
        setAnimationColor('text-red-400');
      }
      
      // Counter animation
      const duration = 2000; // 2 seconds
      const startTime = Date.now();
      const startValue = previousBalance;
      const endValue = balance;
      
      const animateCounter = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth interpolation
        const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const easedProgress = easeInOutQuad(progress);
        
        const currentValue = Math.round(startValue + (endValue - startValue) * easedProgress);
        setDisplayedBalance(currentValue);
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animateCounter);
        } else {
          // Animation finished
          setDisplayedBalance(endValue);
          setAnimationColor('');
          setIsAnimating(false);
          localStorage.setItem('previousCoinsBalance', endValue.toString());
          previousBalanceRef.current = endValue;
        }
      };
      
      animationRef.current = requestAnimationFrame(animateCounter);
    }
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [balance, isLoading]);
  
  // Store initial balance
  useEffect(() => {
    if (!isLoading && balance > 0) {
      setDisplayedBalance(balance);
    }
  }, [balance, isLoading]);

  return (
    <section
      aria-label="Coins summary"
      className="text-center px-6 mb-16 pt-4"
      data-testid="coins-hero"
    >
      <motion.div 
        className={`text-[72px] leading-none font-light tracking-tight transition-colors duration-500 ${
          animationColor || 'text-white'
        }`}
        data-testid="coins-amount"
        animate={isAnimating ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.3, repeat: isAnimating ? 3 : 0 }}
      >
        {isLoading ? "..." : displayedBalance.toLocaleString()}
      </motion.div>
    </section>
  );
}