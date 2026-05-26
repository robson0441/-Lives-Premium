/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { loadDatabase, saveDatabase } from './server-db';
import { User, LiveRoom, ChatMessage, HostApplication, Transaction, Gift, Withdrawal, UserSubscription } from './src/types';

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY') {
      try {
        aiClient = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
        console.log("Gemini AI Client initialized successfully for live chats responding.");
      } catch (err) {
        console.error("Failed to initialize GoogleGenAI with key:", err);
      }
    }
  }
  return aiClient;
}

// Generate an ultra-realistic stream comments/host replies using Gemini 3.5 Flash
async function callGeminiStreamResponse(
  hostName: string,
  hostBio: string,
  liveTitle: string,
  userName: string,
  userMessage?: string,
  giftName?: string
): Promise<string> {
  const ai = getGeminiClient();
  if (!ai) {
    // Elegant system fake streamer response as fallback
    if (giftName) {
      return `Nossa!! Robson, muito obrigado pelo(a) ${giftName}! Você me deixou sem palavras hoje! 😍❤️`;
    }
    return `Oi Robson, que bom te ver por aqui de novo! Como está seu dia? 🥰`;
  }

  try {
    const prompt = `Você é a host de live stream brasileira "${hostName}". Sua personalidade/bio: "${hostBio}". O título da live atual é "${liveTitle}".
O usuário que interage com você se chama "${userName}".
${giftName ? `ESTÍMULO: Ele te enviou um presente pago maravilhoso: um(a) "${giftName}"!` : `ESTÍMULO: Ele enviou a mensagem de texto: "${userMessage}"`}

Gere uma resposta curtíssima de stream (limite absoluto de 1 linha, no máximo 15 palavras!), alegre, natural, super informal e cativante em português. Agradeça diretamente ao ${userName}. Use gírias brasileiras comuns de Reels/TikTok e stickers/emojis para dar dinâmica ao chat!`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return response.text?.trim().replace(/^"|"$/g, '') || `Valeu, Robson! Você é demais! 😘`;
  } catch (error) {
    console.error("Gemini live reply generation error:", error);
    return `Sensacional, Robson! Muito obrigada pelo suporte! ❤️`;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Load standard database
  const db = loadDatabase();

  // Helper: Get user from DB safely, fallback to user_robson
  const getActiveUser = (req: express.Request): User => {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string) || 'user_robson';
    if (!db.users[userId]) {
      // Auto register if it was missing to avoid crash
      db.users[userId] = {
        id: userId,
        username: userId.replace('user_', ''),
        email: `${userId}@generic.com`,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
        bio: 'Membro Premium!',
        followersCount: 0,
        followingCount: 0,
        walletCoins: 500,
        level: 1,
        role: 'user',
      };
      saveDatabase(db);
    }
    return db.users[userId];
  };

  // ----------------------------------------------------
  // AUTHENTICATION & USER API ENDPOINTS
  // ----------------------------------------------------
  
  app.get('/api/user/me', (req, res) => {
    const user = getActiveUser(req);
    res.json(user);
  });

  app.get('/api/users', (req, res) => {
    res.json(Object.values(db.users));
  });

  // Toggle user role instantly for live-reviewer evaluation purposes
  app.post('/api/user/toggle-role', (req, res) => {
    const user = getActiveUser(req);
    const { role } = req.body;

    // Security check: Only allow admin role if email is robson0441@gmail.com or admin@livepremium.com
    const emailLower = user.email ? user.email.toLowerCase() : '';
    const isSpecialAdmin = emailLower === 'robson0441@gmail.com' || emailLower === 'admin@livepremium.com';
    const isSpecialHost = emailLower === 'lorena@livepremium.com' || emailLower === 'thiago@livepremium.com' || emailLower === 'babi@livepremium.com';

    if (role === 'admin' && !isSpecialAdmin) {
      return res.status(403).json({ error: 'Apenas Robson ou Administrador Oficial podem ter acesso de Administrador!' });
    }
    
    if (role === 'host' && !isSpecialAdmin && !isSpecialHost) {
      return res.status(403).json({ error: 'Usuários comuns devem se candidatar e ser aprovados pela administração!' });
    }

    if (role === 'user' || role === 'host' || role === 'admin') {
      user.role = role;
      if (role === 'host') {
        user.hostStatus = 'approved';
        // Ensure host has a live stream room initialized
        const hostLiveId = `live_${user.id}`;
        if (!db.lives[hostLiveId]) {
          db.lives[hostLiveId] = {
            id: hostLiveId,
            hostId: user.id,
            hostName: user.username,
            hostAvatar: user.avatar,
            title: `🔴 AO VIVO: Começando os trabalhos por aqui! Copa das Moedas`,
            category: 'Bate-papo',
            viewersCount: 42,
            isVipOnly: false,
            isPrivate: false,
            entryCoinsPrice: 0,
            isLive: true,
            thumbnail: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400',
            startedAt: new Date().toISOString(),
          };
        }
      }
      saveDatabase(db);
      res.json({ success: true, user });
    } else {
      res.status(400).json({ error: 'Role inválida' });
    }
  });

  // Login handler
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'E-mail obrigatório' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Senha obrigatória para acessar ou criar conta.' });
    }
    const found = Object.values(db.users).find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      if (found.password && found.password !== password) {
        return res.status(401).json({ error: 'Senha incorreta para este endereço de e-mail!' });
      }
      if (!found.password) {
        // Fallback or legacy account registration of password
        found.password = password;
        saveDatabase(db);
      }
      return res.json({ success: true, user: found });
    }
    // Auto register simple user
    const username = email.split('@')[0];
    const generatedId = `user_${Date.now()}`;
    const emailLower = email.toLowerCase();
    const isSpecialAdmin = emailLower === 'robson0441@gmail.com' || emailLower === 'admin@livepremium.com';
    const newUser: User = {
      id: generatedId,
      username: username.charAt(0).toUpperCase() + username.slice(1),
      email: emailLower,
      avatar: `https://images.unsplash.com/photo-${1535713875000 + Math.floor(Math.random() * 999)}?w=150`,
      banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
      bio: 'Novo na plataforma de lives mais premium do Brasil! 👋☀️',
      followersCount: 0,
      followingCount: 6,
      walletCoins: 100, // free starter coins package
      level: 1,
      role: isSpecialAdmin ? 'admin' : 'user',
      password: password,
    };
    db.users[generatedId] = newUser;
    saveDatabase(db);
    res.json({ success: true, user: newUser });
  });

  app.post('/api/user/update', (req, res) => {
    const user = getActiveUser(req);
    const { username, bio, avatar, banner, pixKey } = req.body;
    if (username) user.username = username;
    if (bio !== undefined) user.bio = bio;
    if (avatar) user.avatar = avatar;
    if (banner) user.banner = banner;
    if (pixKey) user.pixKey = pixKey;

    // Sync user information with live rooms
    Object.keys(db.lives).forEach((liveId) => {
      if (db.lives[liveId].hostId === user.id) {
        db.lives[liveId].hostName = user.username;
        db.lives[liveId].hostAvatar = user.avatar;
      }
    });

    saveDatabase(db);
    res.json({ success: true, user });
  });

  // ----------------------------------------------------
  // HOST PLATFORM & RECRUITMENT FUNCTIONS
  // ----------------------------------------------------

  app.get('/api/host/applications', (req, res) => {
    res.json(Object.values(db.hostApplications));
  });

  app.post('/api/host/apply', (req, res) => {
    const user = getActiveUser(req);
    const { fullName, documentNumber, bio, socialMedia, pixKey } = req.body;

    if (!fullName || !documentNumber || !pixKey) {
      return res.status(400).json({ error: 'Campos principais obrigatórios!' });
    }

    const newApp: HostApplication = {
      id: `app_${Date.now()}`,
      userId: user.id,
      username: user.username,
      fullName,
      documentNumber,
      selfieUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', // mock validation face image
      pixKey,
      bio: bio || '',
      socialMedia: socialMedia || '',
      status: 'pending',
      date: new Date().toISOString(),
    };

    user.hostStatus = 'pending';
    db.hostApplications[newApp.id] = newApp;
    saveDatabase(db);

    res.json({ success: true, status: 'pending', application: newApp });
  });

  app.post('/api/admin/applications/:id/action', (req, res) => {
    const user = getActiveUser(req);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado: Administrador apenas.' });
    }
    const { id } = req.params;
    const { status } = req.body; // approved / rejected

    const application = db.hostApplications[id];
    if (!application) {
      return res.status(404).json({ error: 'Ficha de candidatura não encontrada' });
    }

    application.status = status;
    const applicant = db.users[application.userId];

    if (applicant) {
      applicant.hostStatus = status;
      if (status === 'approved') {
        applicant.role = 'host';
        applicant.pixKey = application.pixKey;
        
        // Setup live stream room automatically
        const roomKey = `live_${applicant.id}`;
        db.lives[roomKey] = {
          id: roomKey,
          hostId: applicant.id,
          hostName: applicant.username,
          hostAvatar: applicant.avatar,
          title: `🔴 AO VIVO: Começando meus streamings premium! Sejam bem-vindos! ✨`,
          category: 'Bate-papo',
          viewersCount: 1,
          isVipOnly: false,
          isPrivate: false,
          entryCoinsPrice: 0,
          isLive: true,
          thumbnail: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400',
          startedAt: new Date().toISOString(),
        };
      }
    }

    saveDatabase(db);
    res.json({ success: true, application });
  });

  // ----------------------------------------------------
  // LIVE STREAMING & CHAT MODULES
  // ----------------------------------------------------

  app.get('/api/lives', (req, res) => {
    const activeRooms = Object.values(db.lives).filter((room) => room.isLive);
    res.json(activeRooms);
  });

  app.get('/api/lives/:id', (req, res) => {
    const { id } = req.params;
    const room = db.lives[id];
    if (!room) {
      return res.status(404).json({ error: 'Live não encontrada!' });
    }
    res.json(room);
  });

  app.post('/api/lives/start', (req, res) => {
    const user = getActiveUser(req);
    if (user.role !== 'host') {
      return res.status(403).json({ error: 'Apenas hosts aprovados podem iniciar transmissões.' });
    }

    const { title, category, thumbnail, isVipOnly, vipMinLevel, isPrivate, entryCoinsPrice } = req.body;
    const roomId = `live_${user.id}`;

    const newLive: LiveRoom = {
      id: roomId,
      hostId: user.id,
      hostName: user.username,
      hostAvatar: user.avatar,
      title: title || 'Transmissão incrível do canal Premium!',
      category: category || 'Social',
      viewersCount: Math.floor(Math.random() * 20) + 1,
      isVipOnly: !!isVipOnly,
      vipMinLevel: isVipOnly ? (vipMinLevel || 'bronze') : undefined,
      isPrivate: !!isPrivate,
      entryCoinsPrice: isPrivate ? (Number(entryCoinsPrice) || 30) : 0,
      isLive: true,
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400',
      startedAt: new Date().toISOString(),
    };

    db.lives[roomId] = newLive;
    db.messages[roomId] = [
      {
        id: `sys_${Date.now()}`,
        username: 'Sistema',
        text: 'A live começou! Lembre-se de seguir as diretrizes da comunidade. Divirta-se! 🎉💥',
        timestamp: new Date().toISOString(),
        isVip: false,
      }
    ];

    saveDatabase(db);
    res.json({ success: true, live: newLive });
  });

  app.post('/api/lives/:id/end', (req, res) => {
    const { id } = req.params;
    const room = db.lives[id];
    if (!room) {
      return res.status(404).json({ error: 'Live não encontrada!' });
    }

    room.isLive = false;
    room.viewersCount = 0;
    saveDatabase(db);

    res.json({ success: true, live: room });
  });

  app.delete('/api/lives/:id/ban-by-admin', (req, res) => {
    const { id } = req.params;
    if (db.lives[id]) {
      db.lives[id].isLive = false;
      db.lives[id].viewersCount = 0;
    }
    res.json({ success: true, message: 'Fim de transmissão decretado pelo Admin.' });
  });

  // ----------------------------------------------------
  // REAL-TIME SYNCHRONIZED CHAT SYSTEM (REST + HIGH FIDELITY POLLING)
  // ----------------------------------------------------

  app.get('/api/lives/:id/messages', (req, res) => {
    const { id } = req.params;
    const msgs = db.messages[id] || [];
    res.json(msgs);
  });

  app.post('/api/lives/:id/message', async (req, res) => {
    const { id } = req.params;
    const { text, isVipOption } = req.body;
    const user = getActiveUser(req);
    const room = db.lives[id];

    if (!room) {
      return res.status(404).json({ error: 'Live não encontrada!' });
    }

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Mensagem vazia!' });
    }

    // Determine if sender has active VIP badge on this host
    const sub = db.subscriptions.find((s) => s.userId === user.id && s.hostId === room.hostId && s.active);
    const hasVip = !!sub || isVipOption;
    const vipLevel = sub ? sub.type : (isVipOption ? 'bronze' : undefined);

    let msgColor = undefined;
    if (vipLevel === 'bronze') msgColor = '#10b981'; // Emerald
    if (vipLevel === 'gold') msgColor = '#f59e0b'; // Gold
    if (vipLevel === 'diamond') msgColor = '#ec4899'; // Pink fuchsia

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      username: user.username,
      text: text,
      timestamp: new Date().toISOString(),
      isVip: hasVip,
      vipType: vipLevel,
      color: msgColor,
    };

    if (!db.messages[id]) {
      db.messages[id] = [];
    }
    db.messages[id].push(newMsg);

    // AI Streamer simulation response! If the active User chats, generate the streamer reply instantly
    if (user.id === 'user_robson') {
      res.json({ success: true, message: newMsg });

      // Retrieve host bio
      const host = db.users[room.hostId];
      const hostBio = host ? host.bio : 'Famosa Streamer Premium!';

      // Keep response simulation flowing in background
      setTimeout(async () => {
        try {
          const aiResponseText = await callGeminiStreamResponse(
            room.hostName,
            hostBio,
            room.title,
            user.username,
            text,
            undefined
          );

          const aiMsg: ChatMessage = {
            id: `msg_host_${Date.now()}`,
            username: room.hostName,
            text: aiResponseText,
            timestamp: new Date().toISOString(),
            isVip: true,
            vipType: 'diamond',
            color: '#ef4444', // Special deep streamer red
          };

          db.messages[id].push(aiMsg);
          saveDatabase(db);
        } catch (e) {
          console.error("AI automated reply fail:", e);
        }
      }, 1800); // 1.8 seconds delay mimicking stream latency!
    } else {
      saveDatabase(db);
      res.json({ success: true, message: newMsg });
    }
  });

  // ----------------------------------------------------
  // ECONOMY, DEPOSIT PLANS, GIFTS & TRANSACTIONS
  // ----------------------------------------------------

  app.get('/api/coins/packages', (req, res) => {
    res.json(db.packages);
  });

  app.get('/api/gifts', (req, res) => {
    res.json(db.gifts);
  });

  app.get('/api/transactions', (req, res) => {
    const user = getActiveUser(req);
    // Find all user financial history
    let list = db.transactions.filter((tx) => tx.userId === user.id);
    if (user.role === 'admin') {
      list = db.transactions; // Admins view all logs
    }
    res.json(list);
  });

  // Buy coins creating WhatsApp redirection link and official WA package payment QR code
  app.post('/api/coins/buy', (req, res) => {
    const user = getActiveUser(req);
    const { packageId } = req.body;

    const coinPack = db.packages.find((p) => p.id === packageId);
    if (!coinPack) {
      return res.status(404).json({ error: 'Pacote de moedas inválido' });
    }

    const txId = `tx_${Date.now()}`;
    const targetPhone = db.whatsappNumber || '5521999999999';
    const waText = `Olá! Gostaria de comprar o ${coinPack.label || 'Pacote de Moedas'} de ${coinPack.coins} moedas por R$ ${coinPack.priceBRL.toFixed(2)}. Meu usuário no site é "${user.username}". (ID Referência do pedido: ${txId})`;
    const encodedWaText = encodeURIComponent(waText);
    const whatsappLink = `https://wa.me/${targetPhone}?text=${encodedWaText}`;
    
    // QR Code pointing directly to WhatsApp link
    const waQrCodeImg = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(whatsappLink)}`;

    const newTx: Transaction = {
      id: txId,
      userId: user.id,
      username: user.username,
      amountBRL: coinPack.priceBRL,
      coins: coinPack.coins,
      type: 'deposit',
      status: 'pending',
      pixQrCode: waQrCodeImg,
      pixCode: whatsappLink, // Store WA URL in pixCode so user can click to go instantly
      date: new Date().toISOString(),
    };

    db.transactions.unshift(newTx);
    saveDatabase(db);

    res.json({ success: true, transaction: newTx });
  });

  // Get and serve current destination WhatsApp for coin recharge
  app.get('/api/admin/whatsapp', (req, res) => {
    res.json({ whatsappNumber: db.whatsappNumber || '5521999999999' });
  });

  // Update destination WhatsApp (Admin only)
  app.post('/api/admin/whatsapp', (req, res) => {
    const user = getActiveUser(req);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    const { whatsappNumber } = req.body;
    if (!whatsappNumber) {
      return res.status(400).json({ error: 'Número de WhatsApp inválido.' });
    }
    // Remove formatting characters to keep only digits
    db.whatsappNumber = whatsappNumber.replace(/\D/g, '');
    saveDatabase(db);
    res.json({ success: true, whatsappNumber: db.whatsappNumber });
  });

  // Confirm Pix Purchase immediately adding the coins to user wallet
  app.post('/api/coins/confirm-pix', (req, res) => {
    const { txId } = req.body;
    const tx = db.transactions.find((t) => t.id === txId);

    if (!tx) {
      return res.status(404).json({ error: 'Depósito não encontrado.' });
    }

    if (tx.status === 'completed') {
      return res.status(400).json({ error: 'Esse pagamento já foi confirmado!' });
    }

    tx.status = 'completed';

    // Credit coins to user wallet
    const user = db.users[tx.userId];
    if (user) {
      user.walletCoins += tx.coins;
    }

    saveDatabase(db);
    res.json({ success: true, transaction: tx, walletCoins: user ? user.walletCoins : 0 });
  });

  // Cancel/reject a pending deposit request
  app.post('/api/admin/coins/cancel', (req, res) => {
    const user = getActiveUser(req);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado: Administrador apenas.' });
    }
    const { txId } = req.body;
    const tx = db.transactions.find((t) => t.id === txId);
    if (!tx) {
      return res.status(404).json({ error: 'Depósito não encontrado.' });
    }
    tx.status = 'cancelled';
    saveDatabase(db);
    res.json({ success: true, transaction: tx });
  });

  // Send an animated gift in real-time
  app.post('/api/lives/:id/gift', (req, res) => {
    const { id } = req.params;
    const { giftId } = req.body;
    const user = getActiveUser(req);
    const room = db.lives[id];

    if (!room) {
      return res.status(404).json({ error: 'Live não encontrada!' });
    }

    const gift = db.gifts.find((g) => g.id === giftId);
    if (!gift) {
      return res.status(404).json({ error: 'Presente inválido!' });
    }

    if (user.walletCoins < gift.coinsValue) {
      return res.status(400).json({ error: 'Saldo insuficiente de moedas! Por favor, recarregue via PIX.' });
    }

    // Deduct coins from user
    user.walletCoins -= gift.coinsValue;

    // Credit to Host user wallet
    const hostUser = db.users[room.hostId];
    if (hostUser) {
      hostUser.walletCoins += gift.coinsValue;
    }

    // System Message log showing animation
    const giftMsg: ChatMessage = {
      id: `msg_gift_${Date.now()}`,
      username: user.username,
      text: `Enviou um(a) ${gift.name} ${gift.emoji}! 💥⚡`,
      timestamp: new Date().toISOString(),
      isVip: true,
      vipType: gift.coinsValue >= 100 ? 'diamond' : 'bronze',
      isGift: true,
      giftEmoji: gift.emoji,
      giftName: gift.name,
      giftValue: gift.coinsValue,
      color: gift.coinsValue >= 500 ? '#f59e0b' : '#3d82f6',
    };

    if (!db.messages[id]) {
      db.messages[id] = [];
    }
    db.messages[id].push(giftMsg);

    // Save transaction
    db.transactions.unshift({
      id: `tx_gift_${Date.now()}`,
      userId: user.id,
      username: user.username,
      amountBRL: 0,
      coins: gift.coinsValue,
      type: 'gift_send',
      status: 'completed',
      date: new Date().toISOString(),
    });

    // Save host receiving
    if (hostUser) {
      db.transactions.unshift({
        id: `tx_gift_receive_${Date.now()}`,
        userId: hostUser.id,
        username: hostUser.username,
        amountBRL: 0,
        coins: gift.coinsValue,
        type: 'gift_receive',
        status: 'completed',
        date: new Date().toISOString(),
      });
    }

    res.json({ success: true, balance: user.walletCoins, giftSent: gift });

    // AI streamer reacts to gift in real-time if the user is Robson!
    if (user.id === 'user_robson') {
      const hostBio = hostUser ? hostUser.bio : 'Top Estrela Streamer!';
      setTimeout(async () => {
        try {
          const aiResponseText = await callGeminiStreamResponse(
            room.hostName,
            hostBio,
            room.title,
            user.username,
            undefined,
            gift.name
          );

          const aiMsg: ChatMessage = {
            id: `msg_host_gift_${Date.now()}`,
            username: room.hostName,
            text: aiResponseText,
            timestamp: new Date().toISOString(),
            isVip: true,
            vipType: 'diamond',
            color: '#dc2626',
          };
          db.messages[id].push(aiMsg);
          saveDatabase(db);
        } catch (e) {
          console.error("AI reaction failed:", e);
        }
      }, 1500);
    } else {
      saveDatabase(db);
    }
  });

  // ----------------------------------------------------
  // ADVANCED SUBSCRIPTION & PRIVATE LIVES ROOM PERMISSION
  // ----------------------------------------------------

  app.get('/api/user/subscriptions', (req, res) => {
    const user = getActiveUser(req);
    const subs = db.subscriptions.filter((s) => s.userId === user.id && s.active);
    res.json(subs);
  });

  // Subscribe VIP for specific host
  app.post('/api/lives/:id/subscribe', (req, res) => {
    const { id } = req.params; // Live room ID
    const { tier } = req.body; // bronze, gold, diamond
    const user = getActiveUser(req);
    const room = db.lives[id];

    if (!room) {
      return res.status(404).json({ error: 'Estúdio de live inválido!' });
    }

    let coinCost = 150; // bronze default
    if (tier === 'gold') coinCost = 300;
    if (tier === 'diamond') coinCost = 500;

    if (user.walletCoins < coinCost) {
      return res.status(400).json({ error: `Saldo de moedas insuficiente para assinar plano ${tier.toUpperCase()}!` });
    }

    user.walletCoins -= coinCost;

    // Credit host wallet
    const hostUser = db.users[room.hostId];
    if (hostUser) {
      hostUser.walletCoins += coinCost;
    }

    // Register active subscription
    const newSub: UserSubscription = {
      id: `sub_${Date.now()}`,
      userId: user.id,
      hostId: room.hostId,
      hostName: room.hostName,
      type: tier,
      priceCoins: coinCost,
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(), // 30 days active
      active: true,
    };

    db.subscriptions.unshift(newSub);

    // Save transactions
    db.transactions.unshift({
      id: `tx_sub_send_${Date.now()}`,
      userId: user.id,
      username: user.username,
      amountBRL: 0,
      coins: coinCost,
      type: 'vip_subscribe',
      status: 'completed',
      date: new Date().toISOString(),
    });

    db.messages[id]?.push({
      id: `sys_sub_${Date.now()}`,
      username: 'Sistema VIP 👑',
      text: `O usuário ${user.username} acabou de se associar ao Clube VIP ${tier.toUpperCase()} da host! Parabéns! 🎉💫`,
      timestamp: new Date().toISOString(),
      isVip: true,
      vipType: tier,
    });

    saveDatabase(db);
    res.json({ success: true, subscription: newSub, walletCoins: user.walletCoins });
  });

  // Pay flat entry fees to unlock Private Session Live Stream room
  app.post('/api/lives/:id/pay-entry', (req, res) => {
    const { id } = req.params;
    const user = getActiveUser(req);
    const room = db.lives[id];

    if (!room) {
      return res.status(404).json({ error: 'Live privada não encontrada.' });
    }

    if (!room.isPrivate) {
      return res.json({ success: true, message: 'Essa transmissão é gratuita!' });
    }

    if (user.walletCoins < room.entryCoinsPrice) {
      return res.status(400).json({ error: `Você não tem ${room.entryCoinsPrice} moedas para comprar seu ingresso VIP!` });
    }

    user.walletCoins -= room.entryCoinsPrice;

    // Credit Host
    const host = db.users[room.hostId];
    if (host) {
      host.walletCoins += room.entryCoinsPrice;
    }

    // Save transaction
    db.transactions.unshift({
      id: `tx_entry_${Date.now()}`,
      userId: user.id,
      username: user.username,
      amountBRL: 0,
      coins: room.entryCoinsPrice,
      type: 'private_entry',
      status: 'completed',
      date: new Date().toISOString(),
    });

    saveDatabase(db);
    res.json({ success: true, walletCoins: user.walletCoins });
  });

  // ----------------------------------------------------
  // HOST ANALYTICS & WITHDRAW (CASH OUT COINS RATE: 100c = R$2)
  // ----------------------------------------------------

  app.get('/api/admin/withdrawals', (req, res) => {
    res.json(db.withdrawals);
  });

  app.get('/api/host/withdrawals', (req, res) => {
    const user = getActiveUser(req);
    const list = db.withdrawals.filter((w) => w.userId === user.id);
    res.json(list);
  });

  app.post('/api/host/withdraw', (req, res) => {
    const user = getActiveUser(req);
    const { coinsAmount } = req.body;

    if (user.role !== 'host') {
      return res.status(403).json({ error: 'Permissão negada. Apenas hosts cadastrados sacam fundos.' });
    }

    const coins = Number(coinsAmount);
    if (isNaN(coins) || coins <= 0) {
      return res.status(400).json({ error: 'Quantidade de moedas inválida' });
    }

    if (user.walletCoins < coins) {
      return res.status(400).json({ error: 'Você não possui essa quantidade total de moedas na carteira!' });
    }

    // Exchange conversion factor: 100 coins = R$ 2.00
    const brlVal = (coins / 100) * 2;

    if (!user.pixKey) {
      return res.status(400).json({ error: 'Você precisa registrar sua chave PIX no seu perfil antes de solicitar!' });
    }

    user.walletCoins -= coins;

    const newWithdrawal: Withdrawal = {
      id: `wd_${Date.now()}`,
      userId: user.id,
      username: user.username,
      pixKey: user.pixKey,
      amountCoins: coins,
      amountBRL: brlVal,
      status: 'pending',
      date: new Date().toISOString(),
    };

    db.withdrawals.unshift(newWithdrawal);
    saveDatabase(db);

    res.json({ success: true, withdrawal: newWithdrawal, walletCoins: user.walletCoins });
  });

  app.post('/api/admin/withdrawals/:id/action', (req, res) => {
    const user = getActiveUser(req);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado: Administrador apenas.' });
    }
    const { id } = req.params;
    const { status } = req.body; // approved / rejected

    const wd = db.withdrawals.find((w) => w.id === id);
    if (!wd) {
      return res.status(404).json({ error: 'Pedido de saque não encontrado' });
    }

    wd.status = status;

    if (status === 'rejected') {
      // Revert user coins
      const host = db.users[wd.userId];
      if (host) {
        host.walletCoins += wd.amountCoins;
      }
    }

    saveDatabase(db);
    res.json({ success: true, withdrawal: wd });
  });

  // ----------------------------------------------------
  // LEADERBOARDS & GLOBAL RANKINGS
  // ----------------------------------------------------

  app.get('/api/rankings', (req, res) => {
    // 1. Top Supporters/Gifters (calculated by parsing send_gift transactions)
    const supportersMap: Record<string, { username: string; avatar: string; spent: number }> = {};
    db.transactions.forEach((tx) => {
      if (tx.type === 'gift_send' && tx.status === 'completed') {
        const userObj = db.users[tx.userId];
        if (userObj) {
          if (!supportersMap[tx.userId]) {
            supportersMap[tx.userId] = {
              username: userObj.username,
              avatar: userObj.avatar,
              spent: 0,
            };
          }
          supportersMap[tx.userId].spent += tx.coins;
        }
      }
    });

    const topGifters = Object.values(supportersMap)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);

    // Complement with standard data mock if list is short
    if (topGifters.length === 0) {
      topGifters.push(
        { username: 'Robson G. ⭐', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', spent: 1050 },
        { username: 'Mari_Princesa', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', spent: 340 },
        { username: 'GigaGifter', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150', spent: 150 },
      );
    }

    // 2. Top Hosts/Streamers (sorted by follower count and active rewards walletCoins)
    const topHosts = Object.values(db.users)
      .filter((u) => u.role === 'host')
      .map((h) => ({
        id: h.id,
        username: h.username,
        avatar: h.avatar,
        followersCount: h.followersCount,
        coinsReceived: h.walletCoins,
      }))
      .sort((a, b) => b.followersCount - a.followersCount)
      .slice(0, 5);

    // 3. Top active audience viewers (by level)
    const topViewers = Object.values(db.users)
      .map((u) => ({
        username: u.username,
        avatar: u.avatar,
        level: u.level,
        coinsLeft: u.walletCoins,
      }))
      .sort((a, b) => b.level - a.level)
      .slice(0, 5);

    res.json({
      topGifters,
      topHosts,
      topViewers,
    });
  });

  // ----------------------------------------------------
  // SYSTEM INTEGRITY HEALTH CHECK
  // ----------------------------------------------------
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', online: true });
  });

  // ----------------------------------------------------
  // VITE DEV SERVER OR STATIC COMBINED PRODUCTION FLOW
  // ----------------------------------------------------

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log("Joined Vite middlewares successfully in Dev environment.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving static bundle index in Production environment.");
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express custom server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((e) => {
  console.error("Express startup has aborted!", e);
});
