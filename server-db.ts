/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { User, LiveRoom, ChatMessage, HostApplication, CoinPackage, Transaction, Gift, Withdrawal, UserSubscription } from './src/types';

const DB_FILE = path.join(process.cwd(), 'database.json');

export interface DatabaseSchema {
  users: Record<string, User>;
  lives: Record<string, LiveRoom>;
  messages: Record<string, ChatMessage[]>; // roomId -> messages
  hostApplications: Record<string, HostApplication>;
  transactions: Transaction[];
  withdrawals: Withdrawal[];
  subscriptions: UserSubscription[];
  packages: CoinPackage[];
  gifts: Gift[];
  whatsappNumber?: string;
}

const DEFAULT_PACKAGES: CoinPackage[] = [
  { id: 'coin_100', coins: 100, priceBRL: 4.90, label: 'Pacote Bronze - Iniciante' },
  { id: 'coin_500', coins: 500, priceBRL: 19.90, label: 'Pacote Prata - Estrela' },
  { id: 'coin_1000', coins: 1000, priceBRL: 34.90, label: 'Pacote Gold - Influenciador' },
  { id: 'coin_5000', coins: 5000, priceBRL: 149.90, label: 'Pacote VIP - Realeza' },
];

const DEFAULT_GIFTS: Gift[] = [
  { id: 'gift_rose', name: 'Rosa', emoji: '🌹', coinsValue: 1, animationType: 'floating', rarity: 'common' },
  { id: 'gift_heart', name: 'Coração', emoji: '❤️', coinsValue: 5, animationType: 'bounce', rarity: 'common' },
  { id: 'gift_fire', name: 'Fogo', emoji: '🔥', coinsValue: 25, animationType: 'sparkle', rarity: 'rare' },
  { id: 'gift_gem', name: 'Diamante', emoji: '💎', coinsValue: 100, animationType: 'explosion', rarity: 'epic' },
  { id: 'gift_crown', name: 'Coroa', emoji: '👑', coinsValue: 500, animationType: 'sparkle', rarity: 'legendary' },
  { id: 'gift_rocket', name: 'Foguete', emoji: '🚀', coinsValue: 1000, animationType: 'rocket', rarity: 'legendary' },
];

// Initial default user accounts
const INITIAL_USERS: Record<string, User> = {
  'user_robson': {
    id: 'user_robson',
    username: 'Robson G.',
    email: 'robson0441@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    bio: 'Fã de boas lives e apoiador de streamers em ascensão! 🚀',
    followersCount: 15,
    followingCount: 32,
    walletCoins: 1250, // Starts with some coins for great review preview!
    level: 5,
    role: 'user',
    password: '123',
  },
  'host_lorena': {
    id: 'host_lorena',
    username: 'Lorena Medeiros 🌸',
    email: 'lorena@livepremium.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    banner: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    bio: 'Cantora profissional, jogadora casual e amante de bate-papo real. Vem cantar comigo! VIP semanal aberto. ✨',
    followersCount: 8420,
    followingCount: 145,
    walletCoins: 58900,
    level: 42,
    role: 'host',
    pixKey: 'lorena.pix@lives.com',
    password: '123',
    hostPhotos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500', 
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500', 
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=500'
    ],
    photosPrice: 15
  },
  'host_thiago': {
    id: 'host_thiago',
    username: 'Ninja Gamer (Thiago)',
    email: 'thiago@livepremium.com',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
    banner: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800',
    bio: '[Desafio Rankeado] Subindo de elo hoje com vocês! Só entra quem for VIP Gold. Envie gifts para double xp! 🎮🔥',
    followersCount: 12900,
    followingCount: 340,
    walletCoins: 122000,
    level: 55,
    role: 'host',
    pixKey: 'thiago.games@lives.pix',
    password: '123',
    hostPhotos: [],
    photosPrice: 0
  },
  'host_babi': {
    id: 'host_babi',
    username: 'Babi Rezende 💄',
    email: 'babi@livepremium.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    banner: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800',
    bio: 'Novidades de make, bate-papo de garota e fofocas quentes! Live privada a partir das 20h por 50 coins por minuto. 💋✨',
    followersCount: 22400,
    followingCount: 98,
    walletCoins: 43000,
    level: 71,
    role: 'host',
    pixKey: 'babi.beauty@epix.com.br',
    password: '123',
    hostPhotos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500', 
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500', 
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500'
    ],
    photosPrice: 30
  },
  'admin_contas': {
    id: 'admin_contas',
    username: 'Administrador Live',
    email: 'admin@livepremium.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    banner: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
    bio: 'Painel Central de Moderação e Auditoria Financeira.',
    followersCount: 1,
    followingCount: 1,
    walletCoins: 999999,
    level: 99,
    role: 'admin',
    password: '123',
  }
};

const INITIAL_LIVES: Record<string, LiveRoom> = {
  'live_lorena': {
    id: 'live_lorena',
    hostId: 'host_lorena',
    hostName: 'Lorena Medeiros 🌸',
    hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    title: '💬 BATE-PAPO & VOZ E VIOLÃO! MPB, POP e Pedidos Especiais!',
    category: 'Música',
    viewersCount: 247,
    isVipOnly: false,
    isPrivate: false,
    entryCoinsPrice: 0,
    isLive: true,
    thumbnail: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400',
    startedAt: new Date(Date.now() - 3600000).toISOString(), // 1h ago
  },
  'live_thiago': {
    id: 'live_thiago',
    hostId: 'host_thiago',
    hostName: 'Ninja Gamer (Thiago)',
    hostAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
    title: '🏆 SÁBADO DE LIGA! SUBINDO ATÉ O TOPO DO RANKING MUNDIAL!',
    category: 'Jogos',
    viewersCount: 612,
    isVipOnly: true,
    vipMinLevel: 'gold',
    isPrivate: false,
    entryCoinsPrice: 0,
    isLive: true,
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
    startedAt: new Date(Date.now() - 7200000).toISOString(), // 2h ago
  },
  'live_babi': {
    id: 'live_babi',
    hostId: 'host_babi',
    hostName: 'Babi Rezende 💄',
    hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    title: '🔒 SALA VIP PRIVADA: Segredos de Make & Looks de Gala!',
    category: 'Moda & Beleza',
    viewersCount: 84,
    isVipOnly: false,
    isPrivate: true,
    entryCoinsPrice: 40, // 40 coins entry fee
    isLive: true,
    thumbnail: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
    startedAt: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
  }
};

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  'live_lorena': [
    { id: 'm1', username: 'Lucas Santos', text: 'Lorena, canta uma do Caetano Veloso por favor!', timestamp: new Date(Date.now() - 300000).toISOString(), isVip: false },
    { id: 'm2', username: 'Mariana_VIP', text: 'Sua voz é maravilhosa demais, Lorena! 🌹👑', timestamp: new Date(Date.now() - 250000).toISOString(), isVip: true, vipType: 'bronze', color: '#10b981' },
    { id: 'm3', username: 'Ana Julia', text: 'Boa tarde galera, que live aconchegante', timestamp: new Date(Date.now() - 200000).toISOString(), isVip: false },
    { id: 'm4', username: 'Pedro Henrique', text: 'Enviando rosas para empolgar a live!!', timestamp: new Date(Date.now() - 150000).toISOString(), isVip: false },
  ],
  'live_thiago': [
    { id: 'm5', username: 'GamerTop_99', text: 'Que jogada absurda!! Esse deck é muito forte', timestamp: new Date(Date.now() - 300000).toISOString(), isVip: false },
    { id: 'm6', username: 'Kadu Alencar', text: 'Double XP de gifts ativo? Vou mandar um foguete!', timestamp: new Date(Date.now() - 280000).toISOString(), isVip: true, vipType: 'gold', color: '#f59e0b' },
    { id: 'm7', username: 'Ninja Gamer (Thiago)', text: 'Bora subir galera! Valeu pelo apoio de todos!', timestamp: new Date(Date.now() - 240000).toISOString(), isVip: false },
  ],
  'live_babi': [
    { id: 'm8', username: 'Clara Sposito', text: 'Menina, ameii esse batom! Qual a marca?', timestamp: new Date(Date.now() - 120000).toISOString(), isVip: false },
    { id: 'm9', username: 'Gaby Fashion', text: 'Essa sala VIP tá muito top, só as novidades.', timestamp: new Date(Date.now() - 60000).toISOString(), isVip: true, vipType: 'diamond', color: '#3b82f6' },
  ]
};

const INITIAL_WITDRAWALS: Withdrawal[] = [
  { id: 'wd_1', userId: 'host_lorena', username: 'Lorena Medeiros 🌸', pixKey: 'lorena.pix@lives.com', amountCoins: 20000, amountBRL: 400.00, status: 'approved', date: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'wd_2', userId: 'host_thiago', username: 'Ninja Gamer (Thiago)', pixKey: 'thiago.games@lives.pix', amountCoins: 50000, amountBRL: 1000.00, status: 'pending', date: new Date(Date.now() - 3600000 * 3).toISOString() },
];

const INITIAL_APPLICATIONS: Record<string, HostApplication> = {
  'app_fernando': {
    id: 'app_fernando',
    userId: 'user_fernando',
    username: 'Fernando DJs',
    fullName: 'Fernando Albuquerque de Melo',
    documentNumber: '123.456.789-00',
    selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    pixKey: 'fernando.djs@gmail.pix',
    bio: 'Faço transmissões ao vivo de sets de House e Eletro na praia de Copacabana! Quero muito entrar pra plataforma!',
    socialMedia: '@fernandodjs_insta',
    status: 'pending',
    date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
  }
};

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 'tx_1', userId: 'user_robson', username: 'Robson G.', amountBRL: 34.90, coins: 1000, type: 'deposit', status: 'completed', date: new Date(Date.now() - 86400000).toISOString() },
  { id: 'tx_2', userId: 'user_robson', username: 'Robson G.', amountBRL: 0, coins: 5, type: 'gift_send', status: 'completed', date: new Date(Date.now() - 7200000).toISOString() },
];

const INITIAL_SUBSCRIPTIONS: UserSubscription[] = [
  { id: 'sub_1', userId: 'user_robson', hostId: 'host_thiago', hostName: 'Ninja Gamer (Thiago)', type: 'gold', priceCoins: 150, expiresAt: new Date(Date.now() + 86400000 * 20).toISOString(), active: true }
];

export function loadDatabase(): DatabaseSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      // Ensure missing structure properties are restored elegantly
      return {
        users: data.users || INITIAL_USERS,
        lives: data.lives || INITIAL_LIVES,
        messages: data.messages || INITIAL_MESSAGES,
        hostApplications: data.hostApplications || INITIAL_APPLICATIONS,
        transactions: data.transactions || INITIAL_TRANSACTIONS,
        withdrawals: data.withdrawals || INITIAL_WITDRAWALS,
        subscriptions: data.subscriptions || INITIAL_SUBSCRIPTIONS,
        packages: DEFAULT_PACKAGES,
        gifts: DEFAULT_GIFTS,
        whatsappNumber: data.whatsappNumber || '5521999999999',
      };
    } catch (e) {
      console.error("Error parsing Database Schema, regenerating from initial settings...", e);
    }
  }

  const initialDB: DatabaseSchema = {
    users: INITIAL_USERS,
    lives: INITIAL_LIVES,
    messages: INITIAL_MESSAGES,
    hostApplications: INITIAL_APPLICATIONS,
    transactions: INITIAL_TRANSACTIONS,
    withdrawals: INITIAL_WITDRAWALS,
    subscriptions: INITIAL_SUBSCRIPTIONS,
    packages: DEFAULT_PACKAGES,
    gifts: DEFAULT_GIFTS,
    whatsappNumber: '5521999999999',
  };
  saveDatabase(initialDB);
  return initialDB;
}

export function saveDatabase(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error("Failed saving local DB:", err);
  }
}
