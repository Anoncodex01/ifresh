'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Types
export interface LoyaltyTier {
  name: string;
  minPoints: number;
  multiplier: number;
  benefits: string[];
  color: string;
}

export interface LoyaltyState {
  points: number;
  totalEarned: number;
  currentTier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  pointsToNextTier: number;
  redeemableRewards: Reward[];
  pointsHistory: PointTransaction[];
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'product' | 'shipping';
  value: number;
  isActive: boolean;
}

export interface PointTransaction {
  id: string;
  type: 'earned' | 'redeemed';
  points: number;
  description: string;
  date: string;
  orderId?: string;
}

// Loyalty Tiers
export const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    name: 'Bronze',
    minPoints: 0,
    multiplier: 1,
    benefits: ['Earn 1 point per TSh 100 spent', 'Birthday discount'],
    color: '#CD7F32'
  },
  {
    name: 'Silver',
    minPoints: 500,
    multiplier: 1.5,
    benefits: ['Earn 1.5 points per TSh 100 spent', 'Free shipping on orders over TSh 30,000', 'Early access to sales'],
    color: '#C0C0C0'
  },
  {
    name: 'Gold',
    minPoints: 1500,
    multiplier: 2,
    benefits: ['Earn 2 points per TSh 100 spent', 'Free shipping on all orders', 'Exclusive products', 'Priority support'],
    color: '#FFD700'
  }
];

// Available Rewards
export const AVAILABLE_REWARDS: Reward[] = [
  {
    id: 'discount-5',
    name: '5% Discount',
    description: 'Get 5% off your next order',
    pointsCost: 100,
    type: 'discount',
    value: 5,
    isActive: true
  },
  {
    id: 'discount-10',
    name: '10% Discount',
    description: 'Get 10% off your next order',
    pointsCost: 200,
    type: 'discount',
    value: 10,
    isActive: true
  },
  {
    id: 'discount-15',
    name: '15% Discount',
    description: 'Get 15% off your next order',
    pointsCost: 350,
    type: 'discount',
    value: 15,
    isActive: true
  },
  {
    id: 'free-shipping',
    name: 'Free Shipping',
    description: 'Free delivery on your next order',
    pointsCost: 150,
    type: 'shipping',
    value: 100,
    isActive: true
  },
  {
    id: 'free-honey',
    name: 'Free Organic Honey',
    description: 'Get a free 250g organic honey jar',
    pointsCost: 500,
    type: 'product',
    value: 2500,
    isActive: true
  }
];

type LoyaltyAction =
  | { type: 'EARN_POINTS'; payload: { points: number; description: string; orderId?: string } }
  | { type: 'REDEEM_POINTS'; payload: { points: number; reward: Reward } }
  | { type: 'SET_POINTS'; payload: number }
  | { type: 'LOAD_STATE'; payload: LoyaltyState };

const getCurrentTier = (points: number): LoyaltyTier => {
  return LOYALTY_TIERS.reduce((current, tier) => 
    points >= tier.minPoints ? tier : current
  );
};

const getNextTier = (currentTier: LoyaltyTier): LoyaltyTier | null => {
  const currentIndex = LOYALTY_TIERS.findIndex(tier => tier.name === currentTier.name);
  return currentIndex < LOYALTY_TIERS.length - 1 ? LOYALTY_TIERS[currentIndex + 1] : null;
};

const loyaltyReducer = (state: LoyaltyState, action: LoyaltyAction): LoyaltyState => {
  switch (action.type) {
    case 'EARN_POINTS': {
      const newPoints = state.points + action.payload.points;
      const newTotalEarned = state.totalEarned + action.payload.points;
      const newTier = getCurrentTier(newTotalEarned);
      const nextTier = getNextTier(newTier);
      
      const transaction: PointTransaction = {
        id: Date.now().toString(),
        type: 'earned',
        points: action.payload.points,
        description: action.payload.description,
        date: new Date().toISOString(),
        orderId: action.payload.orderId
      };

      return {
        ...state,
        points: newPoints,
        totalEarned: newTotalEarned,
        currentTier: newTier,
        nextTier,
        pointsToNextTier: nextTier ? nextTier.minPoints - newTotalEarned : 0,
        pointsHistory: [transaction, ...state.pointsHistory]
      };
    }

    case 'REDEEM_POINTS': {
      if (state.points < action.payload.points) {
        return state; // Not enough points
      }

      const newPoints = state.points - action.payload.points;
      
      const transaction: PointTransaction = {
        id: Date.now().toString(),
        type: 'redeemed',
        points: action.payload.points,
        description: `Redeemed: ${action.payload.reward.name}`,
        date: new Date().toISOString()
      };

      return {
        ...state,
        points: newPoints,
        pointsHistory: [transaction, ...state.pointsHistory]
      };
    }

    case 'SET_POINTS': {
      const newTier = getCurrentTier(action.payload);
      const nextTier = getNextTier(newTier);
      
      return {
        ...state,
        points: action.payload,
        totalEarned: Math.max(state.totalEarned, action.payload),
        currentTier: newTier,
        nextTier,
        pointsToNextTier: nextTier ? nextTier.minPoints - action.payload : 0
      };
    }

    case 'LOAD_STATE':
      return action.payload;

    default:
      return state;
  }
};

const initialState: LoyaltyState = {
  points: 0,
  totalEarned: 0,
  currentTier: LOYALTY_TIERS[0],
  nextTier: LOYALTY_TIERS[1],
  pointsToNextTier: LOYALTY_TIERS[1].minPoints,
  redeemableRewards: AVAILABLE_REWARDS,
  pointsHistory: []
};

interface LoyaltyContextType {
  state: LoyaltyState;
  earnPoints: (points: number, description: string, orderId?: string) => void;
  redeemReward: (reward: Reward) => boolean;
  calculatePointsForPurchase: (amount: number) => number;
  getAvailableRewards: () => Reward[];
}

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

export function LoyaltyProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(loyaltyReducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('loyalty-state');
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        dispatch({ type: 'LOAD_STATE', payload: parsedState });
      } catch (error) {
        console.error('Failed to load loyalty state:', error);
      }
    }
  }, []);

  // Save to localStorage on state change
  useEffect(() => {
    localStorage.setItem('loyalty-state', JSON.stringify(state));
  }, [state]);

  const earnPoints = (points: number, description: string, orderId?: string) => {
    dispatch({ 
      type: 'EARN_POINTS', 
      payload: { points, description, orderId } 
    });
  };

  const redeemReward = (reward: Reward): boolean => {
    if (state.points >= reward.pointsCost) {
      dispatch({ 
        type: 'REDEEM_POINTS', 
        payload: { points: reward.pointsCost, reward } 
      });
      return true;
    }
    return false;
  };

  const calculatePointsForPurchase = (amount: number): number => {
    // 1 point per TSh 100 spent, multiplied by tier multiplier
    const basePoints = Math.floor(amount / 100);
    return Math.floor(basePoints * state.currentTier.multiplier);
  };

  const getAvailableRewards = (): Reward[] => {
    return AVAILABLE_REWARDS.filter(reward => reward.isActive);
  };

  return (
    <LoyaltyContext.Provider value={{
      state,
      earnPoints,
      redeemReward,
      calculatePointsForPurchase,
      getAvailableRewards
    }}>
      {children}
    </LoyaltyContext.Provider>
  );
}

export function useLoyalty() {
  const context = useContext(LoyaltyContext);
  if (context === undefined) {
    throw new Error('useLoyalty must be used within a LoyaltyProvider');
  }
  return context;
}
