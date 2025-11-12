'use client';

import React, { useState } from 'react';
import { 
  Star, 
  Gift, 
  Trophy, 
  Crown, 
  Zap,
  History,
  ShoppingBag,
  Award,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLoyalty, LOYALTY_TIERS } from '@/contexts/LoyaltyContext';

const getTierIcon = (tierName: string) => {
  switch (tierName) {
    case 'Bronze':
      return Award;
    case 'Silver':
      return Trophy;
    case 'Gold':
      return Crown;
    default:
      return Star;
  }
};

const getTierGradient = (tierName: string) => {
  switch (tierName) {
    case 'Bronze':
      return 'from-amber-600 to-amber-800';
    case 'Silver':
      return 'from-gray-400 to-gray-600';
    case 'Gold':
      return 'from-yellow-400 to-yellow-600';
    default:
      return 'from-gray-400 to-gray-600';
  }
};

export default function RewardsPage() {
  const { state, redeemReward, getAvailableRewards } = useLoyalty();
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const availableRewards = getAvailableRewards();

  const handleRedeemReward = (reward: any) => {
    const success = redeemReward(reward);
    if (success) {
      alert(`Successfully redeemed ${reward.name}!`);
    } else {
      alert('Not enough points to redeem this reward.');
    }
  };

  const progressToNextTier = state.nextTier 
    ? ((state.totalEarned - state.currentTier.minPoints) / (state.nextTier.minPoints - state.currentTier.minPoints)) * 100
    : 100;

  const CurrentTierIcon = getTierIcon(state.currentTier.name);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-24">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-yellow-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#b47435] to-[#b77123] bg-clip-text text-transparent">
              Loyalty Rewards
            </h1>
            <Sparkles className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="text-gray-600 text-lg">Earn points with every purchase and unlock amazing rewards!</p>
        </div>

        {/* Current Status */}
        <Card className="mb-8 border-0 shadow-lg bg-gradient-to-r from-white to-gray-50">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Points Balance */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-[#b47435] to-[#b77123] rounded-full flex items-center justify-center">
                  <Star className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{state.points.toLocaleString()}</h3>
                <p className="text-gray-600">Available Points</p>
              </div>

              {/* Current Tier */}
              <div className="text-center">
                <div className={`w-20 h-20 mx-auto mb-4 bg-gradient-to-r ${getTierGradient(state.currentTier.name)} rounded-full flex items-center justify-center`}>
                  <CurrentTierIcon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{state.currentTier.name} Member</h3>
                <p className="text-gray-600">Current Tier</p>
              </div>

              {/* Progress to Next Tier */}
              <div className="text-center">
                {state.nextTier ? (
                  <>
                    <div className="w-20 h-20 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                      <Zap className="w-10 h-10 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{state.pointsToNextTier} points</h3>
                    <p className="text-gray-600">to {state.nextTier.name}</p>
                    <Progress value={progressToNextTier} className="mt-3" />
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                      <Crown className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Max Tier</h3>
                    <p className="text-gray-600">You've reached the highest tier!</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="rewards" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rewards">Available Rewards</TabsTrigger>
            <TabsTrigger value="tiers">Loyalty Tiers</TabsTrigger>
            <TabsTrigger value="history">Points History</TabsTrigger>
          </TabsList>

          {/* Available Rewards */}
          <TabsContent value="rewards">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableRewards.map((reward) => (
                <Card key={reward.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-[#b47435] to-[#b77123] rounded-lg flex items-center justify-center">
                          <Gift className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{reward.name}</h3>
                          <p className="text-sm text-gray-600">{reward.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold text-gray-900">{reward.pointsCost} points</span>
                      </div>
                      <Button
                        onClick={() => handleRedeemReward(reward)}
                        disabled={state.points < reward.pointsCost}
                        className="bg-gradient-to-r from-[#b47435] to-[#b77123] hover:from-[#a0662f] hover:to-[#9d5e1f] disabled:opacity-50"
                        size="sm"
                      >
                        {state.points >= reward.pointsCost ? 'Redeem' : 'Not Enough Points'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Loyalty Tiers */}
          <TabsContent value="tiers">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {LOYALTY_TIERS.map((tier, index) => {
                const TierIcon = getTierIcon(tier.name);
                const isCurrentTier = tier.name === state.currentTier.name;
                const isUnlocked = state.totalEarned >= tier.minPoints;
                
                return (
                  <Card key={tier.name} className={`border-0 shadow-sm ${isCurrentTier ? 'ring-2 ring-[#b47435]' : ''}`}>
                    <CardContent className="p-6">
                      <div className="text-center mb-6">
                        <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${getTierGradient(tier.name)} rounded-full flex items-center justify-center ${!isUnlocked ? 'opacity-50' : ''}`}>
                          <TierIcon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                        <p className="text-sm text-gray-600">
                          {tier.minPoints === 0 ? 'Starting tier' : `${tier.minPoints}+ points`}
                        </p>
                        {isCurrentTier && (
                          <Badge className="mt-2 bg-gradient-to-r from-[#b47435] to-[#b77123]">
                            Current Tier
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900 text-sm">Benefits:</h4>
                        <ul className="space-y-1">
                          {tier.benefits.map((benefit, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                              <Star className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Points History */}
          <TabsContent value="history">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Points History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {state.pointsHistory.length > 0 ? (
                  <div className="space-y-4">
                    {state.pointsHistory.slice(0, 10).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === 'earned' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {transaction.type === 'earned' ? (
                              <Star className="w-5 h-5" />
                            ) : (
                              <Gift className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(transaction.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'earned' ? '+' : '-'}{transaction.points} points
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No points history yet</h3>
                    <p className="text-gray-600 mb-4">Start shopping to earn your first points!</p>
                    <Button className="bg-gradient-to-r from-[#b47435] to-[#b77123] hover:from-[#a0662f] hover:to-[#9d5e1f]">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Shop Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
