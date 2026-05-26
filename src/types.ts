/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'user' | 'host' | 'admin';

export type HostApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  banner: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  walletCoins: number;
  level: number;
  role: UserRole;
  pixKey?: string;
  hostStatus?: HostApplicationStatus;
  password?: string;
}

export interface LiveRoom {
  id: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  title: string;
  category: string;
  viewersCount: number;
  isVipOnly: boolean;
  vipMinLevel?: 'bronze' | 'gold' | 'diamond';
  isPrivate: boolean;
  entryCoinsPrice: number;
  isLive: boolean;
  thumbnail: string;
  startedAt: string;
}

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  isVip: boolean;
  vipType?: 'bronze' | 'gold' | 'diamond';
  isGift?: boolean;
  giftEmoji?: string;
  giftName?: string;
  giftValue?: number;
  color?: string; // VIP colors e.g. Fuchsia / Emerald / Gold
}

export interface HostApplication {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  documentNumber: string;
  selfieUrl: string;
  pixKey: string;
  bio: string;
  socialMedia: string;
  status: HostApplicationStatus;
  date: string;
}

export interface CoinPackage {
  id: string;
  coins: number;
  priceBRL: number;
  label?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  username: string;
  amountBRL: number;
  coins: number;
  type: 'deposit' | 'gift_send' | 'gift_receive' | 'vip_subscribe' | 'private_entry';
  status: 'pending' | 'completed' | 'cancelled';
  pixQrCode?: string;
  pixCode?: string;
  date: string;
}

export interface Gift {
  id: string;
  name: string;
  emoji: string;
  coinsValue: number;
  animationType: 'floating' | 'bounce' | 'sparkle' | 'explosion' | 'rocket';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Withdrawal {
  id: string;
  userId: string;
  username: string;
  pixKey: string;
  amountCoins: number;
  amountBRL: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  hostId: string;
  hostName: string;
  type: 'bronze' | 'gold' | 'diamond';
  priceCoins: number;
  expiresAt: string;
  active: boolean;
}
