'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';

export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating?: number;
  reviews?: number;
  category: string;
  badge?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Coupon {
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  minAmount?: number;
  maxDiscount?: number;
}

interface CartState {
  items: CartItem[];
  appliedCoupon: Coupon | null;
  activePromotion: any | null;
  deliveryFee: number;
  deliveryLocation: string;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'APPLY_COUPON'; payload: Coupon }
  | { type: 'REMOVE_COUPON' }
  | { type: 'SET_PROMOTION'; payload: any }
  | { type: 'REMOVE_PROMOTION' }
  | { type: 'SET_DELIVERY'; payload: { location: string; fee: number } }
  | { type: 'LOAD_CART'; payload: CartState };

const initialState: CartState = {
  items: [],
  appliedCoupon: null,
  activePromotion: null,
  deliveryFee: 0,
  deliveryLocation: '',
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
      };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      };
    case 'UPDATE_QUANTITY':
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== action.payload.id),
        };
      }
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        appliedCoupon: null,
      };
    case 'APPLY_COUPON':
      return {
        ...state,
        appliedCoupon: action.payload,
      };
    case 'REMOVE_COUPON':
      return {
        ...state,
        appliedCoupon: null,
      };
    case 'SET_PROMOTION':
      return {
        ...state,
        activePromotion: action.payload,
      };
    case 'REMOVE_PROMOTION':
      return {
        ...state,
        activePromotion: null,
      };
    case 'SET_DELIVERY':
      return {
        ...state,
        deliveryLocation: action.payload.location,
        deliveryFee: action.payload.fee,
      };
    case 'LOAD_CART':
      return action.payload;
    default:
      return state;
  }
}

interface CartContextType {
  state: CartState;
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (coupon: Coupon) => void;
  removeCoupon: () => void;
  setPromotion: (promotion: any) => void;
  removePromotion: () => void;
  getPromotionPrice: (productId: string) => number | null;
  setDelivery: (location: string, fee: number) => void;
  getSubtotal: () => number;
  getDiscount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('ifresh-cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: parsedCart });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('ifresh-cart', JSON.stringify(state));
  }, [state]);

  const addItem = (product: Product) => {
    dispatch({ type: 'ADD_ITEM', payload: product });
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const applyCoupon = (coupon: Coupon) => {
    dispatch({ type: 'APPLY_COUPON', payload: coupon });
  };

  const removeCoupon = () => {
    dispatch({ type: 'REMOVE_COUPON' });
  };

  const setPromotion = (promotion: any) => {
    dispatch({ type: 'SET_PROMOTION', payload: promotion });
  };

  const removePromotion = () => {
    dispatch({ type: 'REMOVE_PROMOTION' });
  };

  const setDelivery = (location: string, fee: number) => {
    dispatch({ type: 'SET_DELIVERY', payload: { location, fee } });
  };

  const getSubtotal = () => {
    return state.items.reduce((total, item) => {
      // Check if item has promotion price
      const promotionPrice = getPromotionPrice(item.id);
      const price = promotionPrice || item.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const getPromotionPrice = (productId: string) => {
    if (!state.activePromotion || !state.activePromotion.items) return null;
    
    const promotionItem = state.activePromotion.items.find((item: any) => 
      item.productId === productId || item.product?.id === productId
    );
    
    return promotionItem ? promotionItem.overridePrice : null;
  };

  const getDiscount = () => {
    if (!state.appliedCoupon) return 0;
    
    const subtotal = getSubtotal();
    const { discount, type, minAmount, maxDiscount } = state.appliedCoupon;
    
    if (minAmount && subtotal < minAmount) return 0;
    
    let discountAmount = 0;
    if (type === 'percentage') {
      discountAmount = (subtotal * discount) / 100;
      if (maxDiscount) {
        discountAmount = Math.min(discountAmount, maxDiscount);
      }
    } else {
      discountAmount = discount;
    }
    
    return Math.min(discountAmount, subtotal);
  };

  const getTotal = () => {
    const subtotal = getSubtotal();
    const discount = getDiscount();
    return subtotal - discount + state.deliveryFee;
  };

  const getItemCount = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const value: CartContextType = {
    state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    setPromotion,
    removePromotion,
    getPromotionPrice,
    setDelivery,
    getSubtotal,
    getDiscount,
    getTotal,
    getItemCount,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
