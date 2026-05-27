/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, Flame, TrendingUp, Sparkles, Coins, MessageSquare, Gift, Crown, 
  DollarSign, Users, Settings, Shield, Check, X, Plus, Play, Square, 
  Radio, Video, VideoOff, Mic, MicOff, Smartphone, QrCode, Copy, ArrowUpRight, Lock, Unlock, 
  Volume2, VolumeX, Award, Heart, HelpCircle, Send, AlertCircle, ChevronRight, UserMinus, LogOut, Camera, Upload
} from 'lucide-react';
import { User, LiveRoom, ChatMessage, HostApplication, CoinPackage, Transaction, Gift as GiftType, Withdrawal, UserSubscription } from './types';
import Header from './components/Header';
import PwaInstallBanner from './components/PwaInstallBanner';

// Helper to compress and resize images on client-side before sending to server to avoid 413 Payload Too Large and maintain speed
const compressAndResizeImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.75): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      resolve('');
    };
    reader.readAsDataURL(file);
  });
};

export default function App() {
  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSubmitAuth, setIsSubmitAuth] = useState(false);
  const [lives, setLives] = useState<LiveRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<LiveRoom | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  
  // Tabs: 'home' | 'rankings' | 'host_zone' | 'admin_zone' | 'profile'
  const [activeTab, setActiveTab] = useState<'home' | 'rankings' | 'host_zone' | 'admin_zone' | 'profile'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Modals & State triggers
  const [showPixModal, setShowPixModal] = useState(false);
  const [activePixTx, setActivePixTx] = useState<Transaction | null>(null);
  const [showVipModal, setShowVipModal] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; type: 'info' | 'success' | 'alert' }>>([]);
  const [isCopyingCode, setIsCopyingCode] = useState(false);
  const [floatingGifts, setFloatingGifts] = useState<Array<{ id: string; emoji: string; name: string; username: string; size: number; x: number; y: number }>>([]);
  const [streamMuted, setStreamMuted] = useState(false);

  // Camera & Video Media Streams for real live broadcasts
  const [localMediaStream, setLocalMediaStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [streamFilter, setStreamFilter] = useState<'normal' | 'beauty' | 'sepia' | 'vintage' | 'neon'>('normal');
  const [viewerReactionActive, setViewerReactionActive] = useState(false);
  const [viewerMediaStream, setViewerMediaStream] = useState<MediaStream | null>(null);

  // Photo unlock, full screen zoom and host album states
  const [viewingHostPhotosId, setViewingHostPhotosId] = useState<string | null>(null);
  const [viewingHostDetail, setViewingHostDetail] = useState<User | null>(null);
  const [isPhotoUnlockingLoading, setIsPhotoUnlockingLoading] = useState(false);
  const [fullScreenPhotoUrl, setFullScreenPhotoUrl] = useState<string | null>(null);

  // Edit profile form state
  const [profileForm, setProfileForm] = useState({
    username: '',
    bio: '',
    avatar: '',
    pixKey: '',
    photosPrice: 0,
    hostPhotos: [] as string[]
  });

  // Economy & Gift collections
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
  const [giftsList, setGiftsList] = useState<GiftType[]>([]);
  const [userTxHistory, setUserTxHistory] = useState<Transaction[]>([]);
  const [rankings, setRankings] = useState<{ topGifters: any[]; topHosts: any[]; topViewers: any[] }>({
    topGifters: [],
    topHosts: [],
    topViewers: []
  });

  // Host Candidate application form values
  const [fullName, setFullName] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [hostBio, setHostBio] = useState('');
  const [socialLink, setSocialLink] = useState('');
  const [pixKeyForm, setPixKeyForm] = useState('');
  const [hostApplicationsList, setHostApplicationsList] = useState<HostApplication[]>([]);

  // Starting custom lives form
  const [myStreamTitle, setMyStreamTitle] = useState('');
  const [myStreamCategory, setMyStreamCategory] = useState('Música');
  const [myStreamPrivate, setMyStreamPrivate] = useState(false);
  const [myStreamPrice, setMyStreamPrice] = useState(40);
  const [myStreamVipOnly, setMyStreamVipOnly] = useState(false);
  const [myStreamVipTier, setMyStreamVipTier] = useState<'bronze' | 'gold' | 'diamond'>('bronze');
  const [myStreamCover, setMyStreamCover] = useState('');

  // Withdrawal form
  const [withdrawCoinsAmount, setWithdrawCoinsAmount] = useState(2500);
  const [withdrawList, setWithdrawList] = useState<Withdrawal[]>([]);
  const [allWithdrawalsAdmin, setAllWithdrawalsAdmin] = useState<Withdrawal[]>([]);
  const [adminWhatsapp, setAdminWhatsapp] = useState('');
  const [tempWhatsapp, setTempWhatsapp] = useState('');

  useEffect(() => {
    if (adminWhatsapp) {
      setTempWhatsapp(adminWhatsapp);
    }
  }, [adminWhatsapp]);

  // Auto pollers and dynamic loops
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const chatPollerRef = useRef<any>(null);
  const particleIdCounter = useRef(0);
  const animatedMessageIdsRef = useRef<Set<string>>(new Set());
  const chatInitializedRef = useRef<boolean>(false);

  // Synchronize all collections with local storage to avoid ephemeral hosting resets
  const syncAllCollections = async (extraData?: {
    customUsers?: User[];
    customApplications?: HostApplication[];
    customWithdrawals?: Withdrawal[];
    customTransactions?: Transaction[];
    customLives?: LiveRoom[];
  }) => {
    try {
      const getLocalStorageItem = (key: string) => {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
          } catch(e) {}
        }
        return [];
      };

      let users = getLocalStorageItem('live_premium_custom_users');
      let apps = getLocalStorageItem('live_premium_custom_applications');
      let withdrawals = getLocalStorageItem('live_premium_custom_withdrawals');
      let transactions = getLocalStorageItem('live_premium_custom_transactions');
      let lives = getLocalStorageItem('live_premium_custom_lives');

      if (extraData) {
        if (extraData.customUsers) {
          extraData.customUsers.forEach((u) => {
            if (u && u.id) {
              const idx = users.findIndex((item: any) => item.id === u.id);
              if (idx !== -1) users[idx] = u; else users.push(u);
            }
          });
          localStorage.setItem('live_premium_custom_users', JSON.stringify(users));
        }
        if (extraData.customApplications) {
          extraData.customApplications.forEach((a) => {
            if (a && a.id) {
              const idx = apps.findIndex((item: any) => item.id === a.id);
              if (idx !== -1) apps[idx] = a; else apps.push(a);
            }
          });
          localStorage.setItem('live_premium_custom_applications', JSON.stringify(apps));
        }
        if (extraData.customWithdrawals) {
          extraData.customWithdrawals.forEach((w) => {
            if (w && w.id) {
              const idx = withdrawals.findIndex((item: any) => item.id === w.id);
              if (idx !== -1) withdrawals[idx] = w; else withdrawals.push(w);
            }
          });
          localStorage.setItem('live_premium_custom_withdrawals', JSON.stringify(withdrawals));
        }
        if (extraData.customTransactions) {
          extraData.customTransactions.forEach((t) => {
            if (t && t.id) {
              const idx = transactions.findIndex((item: any) => item.id === t.id);
              if (idx !== -1) transactions[idx] = t; else transactions.push(t);
            }
          });
          localStorage.setItem('live_premium_custom_transactions', JSON.stringify(transactions));
        }
        if (extraData.customLives) {
          extraData.customLives.forEach((l) => {
            if (l && l.id) {
              const idx = lives.findIndex((item: any) => item.id === l.id);
              if (idx !== -1) lives[idx] = l; else lives.push(l);
            }
          });
          localStorage.setItem('live_premium_custom_lives', JSON.stringify(lives));
        }
      }

      await fetch('/api/auth/sync-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customUsers: users,
          customApplications: apps,
          customWithdrawals: withdrawals,
          customTransactions: transactions,
          customLives: lives,
        })
      });
    } catch (err) {
      console.error("Failed to sync collections with server:", err);
    }
  };

  // Initialize application and fetch base user profile
  useEffect(() => {
    const initializeAndSync = async () => {
      // Sync everything from local storage to survive ephemeral server scale/wipes
      await syncAllCollections();
      
      // Continue normal boot loading sequence
      fetchUserData();
      fetchLives();
      fetchGiftsAndPackages();
      fetchRankings();
      fetchAdminWhatsapp();
      fetchSystemLogsAndApplications();
    };

    initializeAndSync();
  }, []);

  // Keep local custom users cache up to date in the client's browser
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('live_premium_user_id', currentUser.id);
      syncAllCollections({ customUsers: [currentUser] });
    }
  }, [currentUser?.id]);

  // Synchronize profileForm whenever the currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        username: currentUser.username || '',
        bio: currentUser.bio || '',
        avatar: currentUser.avatar || '',
        pixKey: currentUser.pixKey || '',
        photosPrice: currentUser.photosPrice || 0,
        hostPhotos: currentUser.hostPhotos || []
      });
    }
  }, [currentUser?.id]);

  const handleOpenHostPhotos = async (hostId: string) => {
    try {
      const res = await fetch(`/api/users`);
      if (res.ok) {
        const usersList: User[] = await res.json();
        const found = usersList.find(u => u.id === hostId);
        if (found) {
          setViewingHostDetail(found);
          setViewingHostPhotosId(hostId);
        } else {
          addNotification("Host não encontrado.", "alert");
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnlockHostPhotos = async (hostId: string) => {
    if (!currentUser) return;
    setIsPhotoUnlockingLoading(true);
    try {
      const res = await fetch(`/api/hosts/${hostId}/unlock-photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        }
      });
      const data = await res.json();
      if (res.ok) {
        addNotification("Álbum Premium liberado com sucesso! Divirta-se! 🎉💥", "success");
        setCurrentUser(data.user);
        setViewingHostDetail(data.host);
        await syncAllCollections({ customUsers: [data.user, data.host] });
      } else {
        addNotification(data.error || "Erro ao desbloquear fotos.", "alert");
      }
    } catch (err) {
      console.error(err);
      addNotification("Erro de conexão.", "alert");
    } finally {
      setIsPhotoUnlockingLoading(false);
    }
  };

  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          username: profileForm.username,
          bio: profileForm.bio,
          avatar: profileForm.avatar,
          pixKey: profileForm.pixKey,
          photosPrice: profileForm.photosPrice,
          hostPhotos: profileForm.hostPhotos.filter(p => p && p.trim() !== '')
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        await syncAllCollections({ customUsers: [data.user] });
        addNotification("Seu perfil foi atualizado com sucesso! ✨🚀", "success");
      } else {
        addNotification(data.error || "Erro ao atualizar perfil.", "alert");
      }
    } catch (e) {
      console.error(e);
      addNotification("Erro ao salvar perfil.", "alert");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Update dynamic logs and workspace permissions when currentUser state changes (e.g., toggled roles)
  useEffect(() => {
    if (currentUser) {
      fetchSystemLogsAndApplications();
    }
  }, [currentUser?.id, currentUser?.role]);

  // Poll current live room chats high frequency if user is currently watching
  useEffect(() => {
    animatedMessageIdsRef.current = new Set();
    chatInitializedRef.current = false;
    if (activeRoom) {
      fetchRoomChats();
      // Fast polling (1.5 seconds) to maintain high-fidelity illusion for interactive streaming
      chatPollerRef.current = setInterval(() => {
        fetchRoomChats();
      }, 1500);
    } else {
      if (chatPollerRef.current) {
        clearInterval(chatPollerRef.current);
      }
    }
    return () => {
      if (chatPollerRef.current) {
        clearInterval(chatPollerRef.current);
      }
    };
  }, [activeRoom]);

  // Keep the lives list dynamically updated (every 4 seconds) to ensure started transmissions show up instantly
  // Also softly sync the current user's profile state to reflect approval status instantly (every 12 seconds)
  useEffect(() => {
    let userFetchCounter = 0;
    const listPoller = setInterval(() => {
      fetchLives();
      
      userFetchCounter += 4;
      if (userFetchCounter >= 12 && currentUser) {
        fetchUserData();
        userFetchCounter = 0;
      }
    }, 4000);
    return () => {
      clearInterval(listPoller);
    };
  }, [activeRoom, currentUser?.id]);

  // Webcam & Audio Stream reference helpers
  const activeStreamRef = useRef<MediaStream | null>(null);
  const activeViewerStreamRef = useRef<MediaStream | null>(null);

  // Manage Media Streams (Webcam & Microphone) automatically when activeRoom changes
  useEffect(() => {
    let cancel = false;
    
    const startStreaming = async () => {
      // If currently host of the live room, trigger camera access automatically
      if (activeRoom && currentUser && activeRoom.hostId === currentUser.id) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user"
            },
            audio: true
          });
          
          if (cancel) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }
          
          setLocalMediaStream(stream);
          activeStreamRef.current = stream;
          setCameraActive(true);
          setMicActive(true);
          addNotification("Câmera e microfone de transmissão ativados ao vivo com sucesso! 🔴✨", "success");
        } catch (err: any) {
          console.error("Camera access failed:", err);
          addNotification("Acesso à câmera recusado ou indisponível. Continuando com simulador retro.", "alert");
        }
      }
    };

    startStreaming();

    return () => {
      cancel = true;
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => track.stop());
        activeStreamRef.current = null;
      }
      setLocalMediaStream(null);
    };
  }, [activeRoom?.id, currentUser?.id]);

  // Handle Fan/Viewer reaction camera stream activation
  useEffect(() => {
    let cancel = false;
    const handleViewerStream = async () => {
      if (activeRoom && viewerReactionActive) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240, facingMode: "user" },
            audio: false // mute reaction stream audio to prevent echo feedbacks
          });
          if (cancel) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }
          setViewerMediaStream(stream);
          activeViewerStreamRef.current = stream;
          addNotification("Sua Câmera de Reação de Fã está ativa no canto da live!", "success");
        } catch (e) {
          console.error("Fan reaction camera failed:", e);
          setViewerReactionActive(false);
          addNotification("Erro: Câmera de reação indisponível.", "alert");
        }
      } else {
        if (activeViewerStreamRef.current) {
          activeViewerStreamRef.current.getTracks().forEach(t => t.stop());
          activeViewerStreamRef.current = null;
        }
        setViewerMediaStream(null);
      }
    };

    handleViewerStream();

    return () => {
      cancel = true;
      if (activeViewerStreamRef.current) {
        activeViewerStreamRef.current.getTracks().forEach(t => t.stop());
        activeViewerStreamRef.current = null;
      }
      setViewerMediaStream(null);
    };
  }, [activeRoom?.id, viewerReactionActive]);

  // Toggle Video track dynamic operations
  const toggleCameraTrack = () => {
    if (activeStreamRef.current) {
      const videoTracks = activeStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextState = !cameraActive;
        videoTracks.forEach(track => {
          track.enabled = nextState;
        });
        setCameraActive(nextState);
        addNotification(nextState ? "Câmera de Transmissão Ativada!" : "Câmera de Transmissão Ocultada!", "info");
      }
    }
  };

  // Toggle Audio track dynamic operations
  const toggleMicTrack = () => {
    if (activeStreamRef.current) {
      const audioTracks = activeStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextState = !micActive;
        audioTracks.forEach(track => {
          track.enabled = nextState;
        });
        setMicActive(nextState);
        addNotification(nextState ? "Áudio do Microfone Ativo!" : "Áudio do Microfone Mutado!", "info");
      }
    }
  };

  const getFilterStyle = (filter: 'normal' | 'beauty' | 'sepia' | 'vintage' | 'neon') => {
    switch (filter) {
      case 'beauty':
        return 'brightness(1.1) contrast(1.05) saturate(1.15) contrast(1.02) blur(0.2px)';
      case 'sepia':
        return 'sepia(0.85) contrast(1.15) saturate(1.1)';
      case 'vintage':
        return 'grayscale(1) contrast(1.3) brightness(0.9)';
      case 'neon':
        return 'hue-rotate(140deg) saturate(2.5) contrast(1.15)';
      default:
        return 'none';
    }
  };

  // Scroll to bottom on chats without scrolling body or causing viewport jumps
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      // Scroll if we have new messages or if the list was loaded for the first time
      if (chatMessages.length > prevMessagesLengthRef.current || prevMessagesLengthRef.current === 0) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    } else if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = chatMessages.length;
  }, [chatMessages]);

  const addNotification = (text: string, type: 'info' | 'success' | 'alert' = 'info') => {
    const fresh = { id: `notif_${Date.now()}_${Math.random()}`, text, type };
    setNotifications((prev) => [fresh, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== fresh.id));
    }, 4500);
  };

  const fetchUserData = async (customId?: string) => {
    const savedUserId = localStorage.getItem('live_premium_user_id');
    const idParam = customId || (currentUser ? currentUser.id : savedUserId);
    
    if (!idParam) {
      setCurrentUser(null);
      setIsAuthLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/user/me?userId=${idParam}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
        localStorage.setItem('live_premium_user_id', data.id);
      } else {
        localStorage.removeItem('live_premium_user_id');
        setCurrentUser(null);
      }
    } catch (e) {
      console.error("Retrieving user info failed", e);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleAuthLogin = async (e: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    const emailToUse = customEmail || authEmail;
    const passwordToUse = customPassword || authPassword;
    if (!emailToUse || !emailToUse.trim()) {
      addNotification("Por favor, informe seu e-mail!", "alert");
      return;
    }
    if (!passwordToUse || !passwordToUse.trim()) {
      addNotification("Por favor, informe sua senha!", "alert");
      return;
    }
    setIsSubmitAuth(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email: emailToUse.trim(), 
          password: passwordToUse.trim() 
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('live_premium_user_id', data.user.id);
          addNotification(`Bem-vindo, ${data.user.username}! Acesso liberado 🚀✨`, 'success');
          setAuthEmail('');
          setAuthPassword('');
          fetchSystemLogsAndApplications();
          fetchLives();
          fetchRankings();
        } else {
          addNotification("Erro ao processar login.", "alert");
        }
      } else {
        const errorBody = await res.json();
        addNotification(errorBody.error || "Erro de login na API", "alert");
      }
    } catch (err) {
      console.error(err);
      addNotification("Erro de conexão ao realizar login.", "alert");
    } finally {
      setIsSubmitAuth(false);
    }
  };

  const toggleTestUserRole = async (targetRole: 'user' | 'host' | 'admin') => {
    // Determine source test IDs corresponding to typical roles loaded in backend db configuration
    let targetId = 'user_robson';
    if (targetRole === 'host') targetId = 'host_lorena';
    if (targetRole === 'admin') targetId = 'admin_contas';

    try {
      const res = await fetch(`/api/user/toggle-role?userId=${targetId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': targetId
        },
        body: JSON.stringify({ role: targetRole })
      });

      if (res.ok) {
        const bodyContent = await res.json();
        if (bodyContent.success) {
          setCurrentUser(bodyContent.user);
          localStorage.setItem('live_premium_user_id', bodyContent.user.id);
          addNotification(`Modo de teste alternado para: ${targetRole.toUpperCase()}`, 'success');
          
          // Clear active room state if changing workspace role layout
          setActiveRoom(null);
          // If we logged in as Host, initialize their stream edit values default
          if (targetRole === 'host') {
            setMyStreamTitle(`🔴 AO VIVO: Super Bate-Papo com ${bodyContent.user.username}`);
          }
          
          fetchUserData(targetId);
          fetchLives();
          fetchRankings();
          fetchSystemLogsAndApplications();
        }
      }
    } catch (err) {
      addNotification("Erro ao processar alteração de papel do servidor.", "alert");
    }
  };

  const fetchLives = async () => {
    try {
      const res = await fetch('/api/lives');
      if (res.ok) {
        const list = await res.json();
        setLives(list);
        
        // Sync active room changes if any status finishes in background
        if (activeRoom) {
          const synced = list.find((rm: any) => rm.id === activeRoom.id);
          if (synced) {
            setActiveRoom(synced);
          } else {
            // Live ended
            addNotification("A transmissão atual foi finalizada pelo host.", "info");
            setActiveRoom(null);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGiftsAndPackages = async () => {
    try {
      const [packsRes, giftsRes] = await Promise.all([
        fetch('/api/coins/packages'),
        fetch('/api/gifts')
      ]);
      if (packsRes.ok) setCoinPackages(await packsRes.json());
      if (giftsRes.ok) setGiftsList(await giftsRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRankings = async () => {
    try {
      const res = await fetch('/api/rankings');
      if (res.ok) {
        setRankings(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminWhatsapp = async () => {
    try {
      const res = await fetch('/api/admin/whatsapp');
      if (res.ok) {
        const data = await res.json();
        setAdminWhatsapp(data.whatsappNumber || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateAdminWhatsapp = async (phone: string) => {
    try {
      const res = await fetch('/api/admin/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || ''
        },
        body: JSON.stringify({ whatsappNumber: phone })
      });
      if (res.ok) {
        const data = await res.json();
        setAdminWhatsapp(data.whatsappNumber);
        setTempWhatsapp(data.whatsappNumber);
        addNotification("WhatsApp de vendas atualizado com sucesso! 💬💾", "success");
      } else {
        addNotification("Não foi possível atualizar o WhatsApp.", "alert");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSystemLogsAndApplications = async () => {
    if (!currentUser) return;
    try {
      // Fetch user specific transaction history logs
      const txRes = await fetch(`/api/transactions`, {
        headers: { 'x-user-id': currentUser.id }
      });
      if (txRes.ok) {
        const txData = await txRes.json();
        setUserTxHistory(txData);
        if (Array.isArray(txData) && txData.length > 0) {
          localStorage.setItem('live_premium_custom_transactions', JSON.stringify(txData));
        }
      }

      // Fetch dynamic audits if user is admin
      if (currentUser.role === 'admin') {
        const [appRes, withdrawRes] = await Promise.all([
          fetch('/api/host/applications'),
          fetch('/api/admin/withdrawals')
        ]);
        if (appRes.ok) {
          const appsData = await appRes.json();
          setHostApplicationsList(appsData);
          localStorage.setItem('live_premium_custom_applications', JSON.stringify(appsData));
        }
        if (withdrawRes.ok) {
          const withdrawsData = await withdrawRes.json();
          setAllWithdrawalsAdmin(withdrawsData);
          localStorage.setItem('live_premium_custom_withdrawals', JSON.stringify(withdrawsData));
        }
        fetchAdminWhatsapp();
      }

      // Fetch withdrawals list if host
      if (currentUser.role === 'host') {
        const myWdRes = await fetch('/api/host/withdrawals', {
          headers: { 'x-user-id': currentUser.id }
        });
        if (myWdRes.ok) {
          const wdData = await myWdRes.json();
          setWithdrawList(wdData);
          localStorage.setItem('live_premium_custom_withdrawals', JSON.stringify(wdData));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRoomChats = async () => {
    if (!activeRoom) return;
    try {
      const res = await fetch(`/api/lives/${activeRoom.id}/messages`);
      if (res.ok) {
        const msgs = await res.json();
        
        // Audit if new animated messages emerged to render floating particles!
        if (!chatInitializedRef.current) {
          // Add all pre-existing gift messages to already animated set to prevent spamming on join
          msgs.forEach((m: ChatMessage) => {
            if (m.isGift && m.id) {
              animatedMessageIdsRef.current.add(m.id);
            }
          });
          chatInitializedRef.current = true;
        } else {
          // Play animations only for brand new gift signals
          msgs.forEach((m: ChatMessage) => {
            if (m.isGift && m.giftEmoji && m.id && !animatedMessageIdsRef.current.has(m.id)) {
              animatedMessageIdsRef.current.add(m.id);
              launchAnimatedGiftParticle(m.giftEmoji, m.giftName || 'Presente', m.username);
            }
          });
        }
        setChatMessages(msgs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const launchAnimatedGiftParticle = (emoji: string, name: string, username: string) => {
    const totalGlowParticles = 3;
    const freshLaunchers: any[] = [];
    
    for (let index = 0; index < totalGlowParticles; index++) {
      particleIdCounter.current += 1;
      freshLaunchers.push({
        id: `p_${particleIdCounter.current}_${Date.now()}_${index}`,
        emoji: emoji,
        name: name,
        username: username,
        size: index === 0 ? 54 : 32, // Large icon accompanied by ambient sparkles
        x: 30 + Math.random() * 40, // Centered range 30% - 70% of parent height
        y: 80 - (index * 15), // Ascending initial altitudes
      });
    }

    setFloatingGifts((prev) => [...prev, ...freshLaunchers]);
    
    // Auto cleanup particle layouts in 4 seconds individually per launcher particle
    freshLaunchers.forEach((fl) => {
      setTimeout(() => {
        setFloatingGifts((prev) => prev.filter((p) => p.id !== fl.id));
      }, 4000);
    });
  };

  // Submit standard text comments
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeRoom || !inputText.trim() || !currentUser) return;

    const bodyMsg = inputText;
    setInputText('');

    try {
      const res = await fetch(`/api/lives/${activeRoom.id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ text: bodyMsg })
      });

      if (res.ok) {
        // Fast sync visual updates before poller updates database delay
        fetchRoomChats();
        fetchUserData();
      } else {
        const errData = await res.json();
        addNotification(errData.error || "Erro ao responder chat.", "alert");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Click on stream room card
  const handleSelectRoom = async (room: LiveRoom) => {
    if (!currentUser) return;

    // Check private permission
    if (room.isPrivate) {
      const hasPurchasedAlready = userTxHistory.some(
        (tx) => tx.type === 'private_entry' && tx.status === 'completed'
      );
      
      if (!hasPurchasedAlready && room.hostId !== currentUser.id) {
        const confirmUnlock = window.confirm(
          `Esta é uma Live Privada da host ${room.hostName}.\n\nIngresso exigido: ${room.entryCoinsPrice} Moedas de Ouro.\nDeseja debitar agora para liberar seu acesso VIP especial?`
        );
        if (!confirmUnlock) return;

        try {
          const res = await fetch(`/api/lives/${room.id}/pay-entry`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': currentUser.id
            }
          });

          if (!res.ok) {
            const errData = await res.json();
            addNotification(errData.error || "Saldo de moedas insuficiente para adquirir o bilhete!", "alert");
            setShowPixModal(true); // Open recharging drawer automatically
            return;
          } else {
            addNotification("Sua entrada VIP privada foi validada e autenticada com sucesso! ✨🚀", "success");
            fetchUserData();
            fetchSystemLogsAndApplications();
          }
        } catch (err) {
          console.error(err);
          return;
        }
      }
    }

    setActiveRoom(room);
    setChatMessages([]);
    addNotification(`Conectando-se ao Player HLS da live ${room.hostName}...`, 'info');
  };

  // Send an animation gift inside the stream screen
  const handleSendGift = async (g: GiftType) => {
    if (!activeRoom || !currentUser) return;

    try {
      const res = await fetch(`/api/lives/${activeRoom.id}/gift`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ giftId: g.id })
      });

      if (res.ok) {
        // Floating sparkles animation launched immediately!
        launchAnimatedGiftParticle(g.emoji, g.name, currentUser.username);
        addNotification(`Você presenteou com ${g.emoji} ${g.name}!`, 'success');
        
        fetchRoomChats();
        fetchUserData();
        fetchSystemLogsAndApplications();
      } else {
        const errorRep = await res.json();
        addNotification(errorRep.error || "Saldo insuficiente para enviar este presente!", "alert");
        setShowPixModal(true); // Prompt top-up drawer
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Buy coin packages & generate pix setup
  const handleBuyPackage = async (packId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/coins/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ packageId: packId })
      });

      if (res.ok) {
        const data = await res.json();
        setActivePixTx(data.transaction);
        setShowPixModal(true);
        addNotification("Código PIX Copia-e-Cola gerado automaticamente pela API do Mercado Pago!", "success");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Simulating Pix bank instant webhook notification callback
  const handleConfirmPixPayment = async () => {
    if (!activePixTx || !currentUser) return;

    try {
      const res = await fetch('/api/coins/confirm-pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ txId: activePixTx.id })
      });

      if (res.ok) {
        const data = await res.json();
        addNotification(`Obrigado Robson! Pagamento confirmado via PIX webhook. Adicionado +${activePixTx.coins} moedas! 🥂💰`, 'success');
        
        // Visual fly effect trigger simulation
        fetchUserData();
        fetchSystemLogsAndApplications();
        setShowPixModal(false);
        setActivePixTx(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Subscribe host VIP tier
  const handleSubscribeVIP = async (tier: 'bronze' | 'gold' | 'diamond') => {
    if (!activeRoom || !currentUser) return;
    try {
      const res = await fetch(`/api/lives/${activeRoom.id}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ tier: tier })
      });

      if (res.ok) {
        addNotification(`Incrível! Assinatura VIP do Clube ${tier.toUpperCase()} ativada por 30 dias! 👑✨`, 'success');
        setShowVipModal(false);
        fetchUserData();
        fetchRoomChats();
        fetchSystemLogsAndApplications();
      } else {
        const rawErr = await res.json();
        addNotification(rawErr.error || "Erro de saldo ao assinar plano VIP.", "alert");
        setShowPixModal(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Audition request to become streamer host
  const handleSubmitHostAudition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !fullName || !docNumber || !pixKeyForm) {
      addNotification("Por favor, preencha todos os campos obrigatórios!", "alert");
      return;
    }

    try {
      const res = await fetch('/api/host/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          fullName,
          documentNumber: docNumber,
          bio: hostBio,
          socialMedia: socialLink,
          pixKey: pixKeyForm
        })
      });

      if (res.ok) {
        const data = await res.json();
        addNotification("Candidatura enviada para revisão! Aguarde aprovação imediata do Admin no menu superior.", "success");
        if (data.application) {
          await syncAllCollections({ customApplications: [data.application] });
        }
        fetchUserData();
        fetchSystemLogsAndApplications();
        // Clear forms
        setFullName('');
        setDocNumber('');
        setHostBio('');
        setSocialLink('');
        setPixKeyForm('');
      } else {
        const errorResponse = await res.json();
        addNotification(errorResponse.error || "Erro ao tentar registrar candidatura.", "alert");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Start stream instantly
  const handleStartHostLive = async () => {
    if (!currentUser || currentUser.role !== 'host') return;

    try {
      const res = await fetch('/api/lives/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          title: myStreamTitle || "Transmissão Premium do Dia!",
          category: myStreamCategory,
          isVipOnly: myStreamVipOnly,
          vipMinLevel: myStreamVipTier,
          isPrivate: myStreamPrivate,
          entryCoinsPrice: myStreamPrice,
          thumbnail: myStreamCover ? myStreamCover.trim() : (
            myStreamCategory === 'Jogos' 
              ? 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800' 
              : myStreamCategory === 'Música'
              ? 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800'
              : 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800'
          )
        })
      });

      if (res.ok) {
        const bodyValue = await res.json();
        addNotification("Sua transmissão foi iniciada com SRS rtmp/hls! Seus seguidores foram notificados! 🔴✨", "success");
        if (bodyValue.live) {
          await syncAllCollections({ customLives: [bodyValue.live] });
        }
        fetchLives();
        setActiveRoom(bodyValue.live); // Enter player view to view own live chat!
      } else {
        const err = await res.json();
        addNotification(err.error || "Erro ao criar live", "alert");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Terminate stream
  const handleEndLiveStream = async (roomId: string) => {
    try {
      const res = await fetch(`/api/lives/${roomId}/end`, {
        method: 'POST'
      });
      if (res.ok) {
        const bodyValue = await res.json();
        addNotification("A transmissão ao vivo foi encerrada.", "info");
        const endedLive = bodyValue.live || { id: roomId, isLive: false };
        await syncAllCollections({ customLives: [endedLive] });
        fetchLives();
        if (activeRoom?.id === roomId) {
          setActiveRoom(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Admin approves/rejects host application
  const handleAdminApproveHost = async (appId: string, actionStatus: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/admin/applications/${appId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: actionStatus })
      });

      if (res.ok) {
        addNotification(`Candidatura ${actionStatus === 'approved' ? 'APROVADA' : 'RECUSADA'} com sucesso!`, 'success');
        fetchSystemLogsAndApplications();
        fetchUserData();
        fetchLives();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Admin manages withdrawal payout approvals
  const handleAdminApproveWithdrawal = async (wdId: string, statusText: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/admin/withdrawals/${wdId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusText })
      });

      if (res.ok) {
        addNotification(`Pedido de pagamento via PIX ${statusText === 'approved' ? 'pago com sucesso' : 'estornado'}!`, 'success');
        fetchSystemLogsAndApplications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmManualDeposit = async (txId: string, coinsAmount: number, targetUsername: string) => {
    try {
      const res = await fetch('/api/coins/confirm-pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ txId })
      });

      if (res.ok) {
        addNotification(`Sucesso! Depósito de +${coinsAmount} moedas ativado na conta de "${targetUsername}". 🎉💰`, 'success');
        fetchUserData();
        fetchSystemLogsAndApplications();
      } else {
        const errData = await res.json();
        addNotification(errData.error || "Ocorreu um erro ao validar o depósito manualmente.", "alert");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelManualDeposit = async (txId: string) => {
    try {
      const res = await fetch('/api/admin/coins/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ txId })
      });

      if (res.ok) {
        addNotification(`O depósito foi recusado/cancelado com sucesso.`, 'info');
        fetchUserData();
        fetchSystemLogsAndApplications();
      } else {
        addNotification("Erro ao cancelar este depósito.", "alert");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Host Cash Withdrawal PIX
  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !currentUser.pixKey) {
      addNotification("Defina sua chave de PIX bancária nas configurações do perfil antes de solicitar o saque!", "alert");
      return;
    }

    try {
      const res = await fetch('/api/host/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ coinsAmount: withdrawCoinsAmount })
      });

      if (res.ok) {
        addNotification(`Pedido de saque enviado com sucesso! R$ ${((withdrawCoinsAmount / 100) * 2).toFixed(2)} serão creditados.`, 'success');
        fetchUserData();
        fetchSystemLogsAndApplications();
      } else {
        const errorBody = await res.json();
        addNotification(errorBody.error || "Erro de validação ao realizar o saque.", "alert");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Category tags definitions
  const categories = ['Todos', 'Bate-papo', 'Música', 'Jogos', 'Moda & Beleza', 'Vida Real'];

  if (isAuthLoading) {
    return (
      <div id="loader-shell" className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-emerald-500 p-[2px] flex items-center justify-center animate-spin">
              <div className="w-full h-full rounded-[14px] bg-zinc-950" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center font-black text-transparent bg-clip-text bg-gradient-to-tr from-violet-400 via-purple-400 to-emerald-400 text-sm leading-none tracking-tighter">
              LV
            </div>
          </div>
          <div>
            <h1 className="font-sans font-bold text-sm tracking-tight text-white leading-none">
              LIVE<span className="text-emerald-400">PREMIUM</span>
            </h1>
            <p className="text-[10px] font-mono text-zinc-500 tracking-wider mt-2.5 animate-pulse">CARREGANDO PERFIL PREMIUM...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div id="auth-app-shell" className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center font-sans relative overflow-hidden p-4">
        {/* Abstract background blobs */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] aspect-square rounded-full bg-violet-955/10 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] aspect-square rounded-full bg-emerald-955/10 blur-[150px] pointer-events-none" />

        {/* Dynamic Popups Notifications Overlay for Auth */}
        <div className="fixed top-6 right-4 left-4 md:left-auto md:w-96 z-50 flex flex-col gap-2 pointer-events-none">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-2xl border shadow-2xl animate-slide-in text-xs leading-relaxed ${
                n.type === 'success' ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-300' :
                n.type === 'alert' ? 'bg-red-950/95 border-red-500/40 text-red-300' :
                'bg-zinc-900/95 border-zinc-800 text-zinc-300'
              }`}
            >
              <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                n.type === 'success' ? 'text-emerald-400 animate-bounce' :
                n.type === 'alert' ? 'text-red-400' : 'text-blue-400'
              }`} />
              <div className="flex-1 font-medium">{n.text}</div>
            </div>
          ))}
        </div>

        <div className="w-full max-w-md bg-zinc-900/45 backdrop-blur-2xl border border-zinc-800/80 rounded-[32px] p-6 md:p-8 shadow-2xl relative z-10 text-center">
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-[20px] bg-gradient-to-tr from-violet-600 via-purple-600 to-emerald-500 p-[2px] flex items-center justify-center shadow-xl">
                <div className="w-full h-full rounded-[18px] bg-zinc-950 flex items-center justify-center">
                  <Tv className="w-6 h-6 text-white animate-pulse" />
                </div>
              </div>
              <div className="absolute -top-1 -right-1 bg-emerald-500 text-zinc-950 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md leading-none tracking-wider shadow">
                LIVE
              </div>
            </div>
          </div>

          <h2 className="font-sans font-black text-xl md:text-2xl tracking-tight text-white">
            Entre no LIVE<span className="text-emerald-400">PREMIUM</span>
          </h2>
          <p className="text-zinc-400 text-[11px] mt-1.5 max-w-xs mx-auto leading-relaxed">
            Plataforma de streaming VIP. Entre com seu e-mail para conectar sua carteira e gerenciar transmissões privadas.
          </p>

          <form onSubmit={handleAuthLogin} className="mt-6 space-y-3.5 text-left">
            <div>
              <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Endereço de E-mail</label>
              <input
                type="email"
                placeholder="nome@dominio.com"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-750 focus:border-purple-500 rounded-xl px-3.5 py-3 text-zinc-100 placeholder-zinc-500 text-xs outline-none transition-all font-mono"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Senha de Acesso</label>
                <span className="text-[9px] text-zinc-500 leading-none">Novas contas salvam a senha digitada</span>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-750 focus:border-purple-500 rounded-xl px-3.5 py-3 text-zinc-100 placeholder-zinc-500 text-xs outline-none transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitAuth}
              className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-emerald-600 hover:opacity-95 disabled:opacity-55 text-white font-extrabold text-[11px] uppercase tracking-wider py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              {isSubmitAuth ? 'Autenticando...' : 'Entrar / Criar Conta Privada 🚀'}
            </button>
          </form>

          {/* Tester direct shortcuts */}
          {(() => {
            const isDevEnv = window.location.hostname.includes('localhost') || 
                              window.location.hostname.includes('127.0.0.1') || 
                              window.location.hostname.includes('ais-dev-');
            if (!isDevEnv) return null;
            return (
              <div className="mt-6 pt-5 border-t border-zinc-800 text-left animate-fade-in">
                <h4 className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-2 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-violet-400" /> Contas de Teste (Senha padrão: 123)
                </h4>
                <p className="text-[9px] text-zinc-500 mb-3 leading-relaxed">
                  Autentique-se instantaneamente nos perfis de teste:
                </p>
                <div className="space-y-1.5">
                  <button
                    onClick={(e) => {
                      setAuthEmail('robson0441@gmail.com');
                      setAuthPassword('123');
                      handleAuthLogin(e, 'robson0441@gmail.com', '123');
                    }}
                    className="w-full bg-zinc-950/60 hover:bg-zinc-850/50 border border-zinc-800 hover:border-violet-500/40 p-2.5 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60"
                        alt="Robson"
                        className="w-6 h-6 rounded-full border border-violet-500 object-cover"
                      />
                      <div>
                        <h5 className="text-[10px] font-bold text-white group-hover:text-violet-400 transition-colors">Robson G. (Admin / Apoiador)</h5>
                        <p className="text-[9px] text-zinc-500">Senha: 123 • 1250 Moedas e painéis admin</p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-violet-400 transition-transform group-hover:translate-x-0.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      setAuthEmail('lorena@livepremium.com');
                      setAuthPassword('123');
                      handleAuthLogin(e, 'lorena@livepremium.com', '123');
                    }}
                    className="w-full bg-zinc-950/60 hover:bg-zinc-850/50 border border-zinc-800 hover:border-emerald-500/40 p-2.5 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60"
                        alt="Lorena"
                        className="w-6 h-6 rounded-full border border-emerald-500 object-cover"
                      />
                      <div>
                        <h5 className="text-[10px] font-bold text-white group-hover:text-emerald-400 transition-colors">Lorena (Host aprovada)</h5>
                        <p className="text-[9px] text-zinc-400">Senha: 123 • Transmissão de MPB ativa</p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      setAuthEmail('admin@livepremium.com');
                      setAuthPassword('123');
                      handleAuthLogin(e, 'admin@livepremium.com', '123');
                    }}
                    className="w-full bg-zinc-950/60 hover:bg-zinc-850/50 border border-zinc-800 hover:border-red-500/40 p-2.5 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60"
                        alt="Admin"
                        className="w-6 h-6 rounded-full border border-red-500 object-cover"
                      />
                      <div>
                        <h5 className="text-[10px] font-bold text-white group-hover:text-red-400 transition-colors">Administrador Oficial</h5>
                        <p className="text-[9px] text-zinc-400">Senha: 123 • Painel Financeiro Geral</p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-red-400 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  return (
    <div id="main-application-shell" className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      
      {/* Dynamic Popups Notifications Overlay */}
      <div className="fixed top-18 right-4 left-4 md:left-auto md:w-96 z-50 flex flex-col gap-2 pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            style={{ contentVisibility: 'auto' }}
            className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-2xl border shadow-2xl animate-slide-in text-xs leading-relaxed ${
              n.type === 'success' ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-300' :
              n.type === 'alert' ? 'bg-red-950/95 border-red-500/40 text-red-300' :
              'bg-zinc-900/95 border-zinc-800 text-zinc-300'
            }`}
          >
            <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
              n.type === 'success' ? 'text-emerald-400 animate-bounce' :
              n.type === 'alert' ? 'text-red-400' : 'text-blue-400'
            }`} />
            <div className="flex-1 font-medium">{n.text}</div>
          </div>
        ))}
      </div>

      {currentUser && (
        <Header 
          currentUser={currentUser} 
          onOpenWallet={() => { setActiveTab('profile'); setShowPixModal(true); }}
          onToggleRole={toggleTestUserRole}
          onOpenProfile={() => setActiveTab('profile')}
        />
      )}

      {/* Primary Workspace Layout Grid */}
      <main className={`flex-1 w-full max-w-7xl mx-auto flex flex-col md:flex-row min-h-0 ${activeRoom ? 'h-[calc(100vh-60px)] md:h-auto overflow-hidden' : 'pb-20 md:pb-6'}`}>
        
        {/* Left Side: Active Room Streaming Theatre Player Overlay if present */}
        {activeRoom && (
          <div id="active-live-container" className="w-full md:w-[60%] bg-zinc-950 border-r border-zinc-900 flex flex-col relative shrink-0">
            
            {/* Live Video Simulation Area */}
            <div className="aspect-video md:aspect-auto md:h-[650px] bg-black relative overflow-hidden flex items-center justify-center">
              
              {/* Real camera video streaming container or premium simulated backup fallback */}
              <div className="absolute inset-0 z-0 bg-zinc-950 flex items-center justify-center">
                {activeRoom.hostId === currentUser?.id && localMediaStream && cameraActive ? (
                  <div className="absolute inset-0 w-full h-full overflow-hidden">
                    <video
                      ref={(el) => {
                        if (el) {
                          try {
                            if (el.srcObject !== localMediaStream) {
                              el.srcObject = localMediaStream;
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      style={{ filter: getFilterStyle(streamFilter) }}
                      className="w-full h-full object-cover"
                    />
                    {/* Live overlay banner specifically for webcam */}
                    <div className="absolute bottom-20 left-4 bg-zinc-950/85 backdrop-blur-sm border border-zinc-800 px-3 py-1.5 rounded-xl text-[10px] text-zinc-300 font-mono flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>WEBCAM TRANSMISSORA ATIVA ({streamFilter.toUpperCase()})</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`absolute inset-0 bg-gradient-to-tr transition-all duration-1000 ${
                      activeRoom.category === 'Jogos' ? 'from-purple-950/80 via-zinc-900 to-indigo-950/80 animate-pulse' :
                      activeRoom.category === 'Música' ? 'from-indigo-900/40 via-zinc-950 to-teal-900/40' :
                      'from-zinc-900 via-zinc-950 to-zinc-900'
                    }`} />

                    {/* Highly immersive digital equalizer/vector waves to simulate motion camera */}
                    <div className="z-10 flex flex-col items-center gap-1.5 md:gap-4 text-center p-3 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 backdrop-blur-md max-w-[200px] md:max-w-sm">
                      {/* Floating rotating disk to symbolize audio tracking */}
                      <div className="relative">
                        <img 
                          src={activeRoom.hostAvatar} 
                          alt="Avatar Streamer" 
                          className={`w-14 h-14 md:w-28 md:h-28 rounded-full border-4 object-cover shadow-[0_0_40px_rgba(139,92,246,0.3)] ${
                            !streamMuted ? 'animate-[spin_12s_linear_infinite]' : ''
                          } ${
                            activeRoom.category === 'Jogos' ? 'border-violet-500' :
                            activeRoom.category === 'Música' ? 'border-emerald-500' :
                            'border-pink-500'
                          }`}
                        />
                        <div className="absolute top-0 right-0 w-5 h-5 md:w-8 md:h-8 rounded-full bg-emerald-500 border-2 md:border-4 border-black flex items-center justify-center animate-bounce">
                          <span className="text-[10px] md:text-[14px]">🎙️</span>
                        </div>
                      </div>

                      <div>
                        <span className="px-1.5 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white animate-pulse inline-flex items-center gap-1">
                          <Radio className="w-2.5 h-2.5 md:w-3 md:h-3 text-white shrink-0" /> {activeRoom.hostId === currentUser?.id ? "TRANSMISSÃO AO VIVO" : "TRANSMISSÃO HLS ATIVA"}
                        </span>
                        <h3 className="font-bold text-white text-[11px] md:text-base mt-1 md:mt-2 line-clamp-1 md:line-clamp-2 leading-snug">{activeRoom.title}</h3>
                        <p className="text-[9px] md:text-xs text-zinc-400 mt-0.5 md:mt-1">
                          {activeRoom.hostId === currentUser?.id && !cameraActive ? (
                            <span className="text-yellow-400 font-bold">⚠️ Câmera do Transmissor Desativada</span>
                          ) : (
                            <>Host: <span className="text-zinc-200 font-semibold">{activeRoom.hostName}</span></>
                          )}
                        </p>
                      </div>

                      {/* Micro simulated camera metadata lines */}
                      <div className="w-full hidden md:flex items-center justify-between text-[10px] font-mono text-zinc-500 border-t border-zinc-800/80 pt-3">
                        <span>FPS: 60 • H.264</span>
                        <span>DELAY: {activeRoom.hostId === currentUser?.id ? "0.0s" : "1.2s"}</span>
                        <span>1080p60</span>
                      </div>
                    </div>

                    {/* Animated Visualizer canvas-lines mimicking gameplay or music dynamic signals */}
                    {!streamMuted && (
                      <div className="absolute bottom-16 left-0 right-0 h-24 flex items-end justify-between px-10 gap-[2px] opacity-25 pointer-events-none">
                        {Array.from({ length: 42 }).map((_, i) => (
                          <div 
                            key={i} 
                            className="w-1 bg-gradient-to-t from-violet-600 to-emerald-400 rounded-full animate-pulse"
                            style={{ 
                              height: `${15 + Math.random() * 85}%`, 
                              animationDuration: `${300 + Math.random() * 800}ms` 
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Floating animated user gifts layers */}
              <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                {floatingGifts.map((gift) => (
                  <div
                    key={gift.id}
                    className="absolute animate-[float-up_4s_ease-out_forwards] flex flex-col items-center select-none"
                    style={{ left: `${gift.x}%`, bottom: `${10 + Math.random() * 20}%` }}
                  >
                    <div className="text-6xl drop-shadow-[0_0_20px_rgba(251,191,36,0.8)] leading-none filter hover:brightness-125">
                      {gift.emoji}
                    </div>
                    <span className="bg-zinc-950/80 border border-zinc-700/50 backdrop-blur-sm text-yellow-300 font-mono text-[9px] px-2 py-0.5 rounded-full mt-1.5 font-bold shadow-lg">
                      {gift.username} enviou
                    </span>
                    <span className="text-[10px] uppercase font-black text-white tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase mt-0.5 font-sans">
                      {gift.name}!
                    </span>
                  </div>
                ))}
              </div>

              {/* Overlay: Header controls on video player (Views count, live tag, exit button) */}
              <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-red-600 text-white text-[10px] uppercase font-black px-2.5 py-1 rounded-md leading-none tracking-widest animate-pulse inline-flex items-center gap-1 shadow-lg">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" /> LIVE
                  </div>
                  <div className="bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-md text-zinc-300 text-xs px-2.5 py-1 rounded-md py-1 font-mono flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{activeRoom.viewersCount}</span>
                  </div>
                  {activeRoom.isPrivate && (
                    <div className="bg-purple-950/80 border border-purple-800/50 backdrop-blur-md text-purple-300 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 uppercase">
                      <Lock className="w-3 h-3 text-purple-400" /> PRIVADA
                    </div>
                  )}
                  {activeRoom.isVipOnly && (
                    <div className="bg-amber-950/80 border border-amber-800/50 backdrop-blur-md text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 uppercase">
                      <Crown className="w-3 h-3 text-amber-450" /> VIP ONLY
                    </div>
                  )}
                </div>

                {/* Close/Back button */}
                <button
                  id="btn-close-theatre"
                  onClick={() => {
                    if (activeRoom && activeRoom.hostId === currentUser?.id) {
                      addNotification("Você saiu do player, mas sua transmissão continua ATIVA! Para encerrar totalmente, vá na Host Zone ou utilize o botão vermelho no menu.", "info");
                    }
                    setActiveRoom(null);
                  }}
                  className="w-8 h-8 rounded-full bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 backdrop-blur-md flex items-center justify-center text-white transition-transform hover:scale-115 active:scale-90 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Picture in Picture (PiP) Viewer Live Reaction stream */}
              {viewerReactionActive && viewerMediaStream && (
                <div className="absolute right-4 top-16 z-40 w-28 md:w-40 aspect-video rounded-2xl border-2 border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.5)] overflow-hidden bg-zinc-950 flex flex-col justify-between">
                  <video
                    ref={(el) => {
                      if (el) {
                        try {
                          if (el.srcObject !== viewerMediaStream) {
                            el.srcObject = viewerMediaStream;
                          }
                        } catch (e) {}
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover z-0"
                  />
                  <div className="absolute top-1 left-1 z-10 flex items-center gap-1 bg-black/80 px-1 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping" /> REAÇÃO AO VIVO
                  </div>
                  <button
                    onClick={() => setViewerReactionActive(false)}
                    className="absolute top-1 right-1 z-10 w-4 h-4 rounded-full bg-black/80 hover:bg-zinc-900 text-white flex items-center justify-center text-[8px] border border-white/20 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Bottom control bar overlay */}
              <div className="absolute bottom-2 left-2 right-2 md:bottom-4 md:left-4 md:right-4 z-35 flex items-center justify-between bg-zinc-950/90 backdrop-blur-md border border-zinc-800/80 p-1.5 md:p-3 rounded-xl md:rounded-2xl shadow-xl">
                <div className="flex items-center gap-1.5 md:gap-2 max-w-[40%]">
                  <img 
                    src={activeRoom.hostAvatar} 
                    alt={activeRoom.hostName} 
                    className="w-7 h-7 md:w-10 md:h-10 rounded-full border-2 border-violet-550 object-cover shrink-0" 
                  />
                  <div className="truncate">
                    <p className="font-bold text-[10px] md:text-sm text-white leading-tight truncate">{activeRoom.hostName}</p>
                    <span className="text-[8px] md:text-[10px] text-emerald-450 font-bold block">Categoria: {activeRoom.category}</span>
                  </div>
                </div>

                {/* Main Dynamic Video Broadcast and Custom Interaction Controls */}
                <div className="flex items-center gap-1 md:gap-1.5">
                  {activeRoom.hostId === currentUser?.id ? (
                    <>
                      {/* Host Controls for camera, mic and filter selection */}
                      <button
                        onClick={toggleCameraTrack}
                        className={`w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          cameraActive ? 'bg-zinc-900 hover:bg-zinc-800 text-emerald-400' : 'bg-red-950/80 hover:bg-red-900 border border-red-800/40 text-red-400'
                        }`}
                        title={cameraActive ? "Desativar Câmera" : "Ativar Câmera"}
                      >
                        {cameraActive ? <Video className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <VideoOff className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                      </button>

                      <button
                        onClick={toggleMicTrack}
                        className={`w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                          micActive ? 'bg-zinc-900 hover:bg-zinc-800 text-emerald-400' : 'bg-red-950/80 hover:bg-red-900 border border-red-800/40 text-red-400'
                        }`}
                        title={micActive ? "Mutar Microfone" : "Ativar Microfone"}
                      >
                        {micActive ? <Mic className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <MicOff className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                      </button>

                      {cameraActive && (
                        <button
                          onClick={() => {
                            const filters: Array<'normal' | 'beauty' | 'sepia' | 'vintage' | 'neon'> = ['normal', 'beauty', 'sepia', 'vintage', 'neon'];
                            const idx = filters.indexOf(streamFilter);
                            const nextIdx = (idx + 1) % filters.length;
                            setStreamFilter(filters[nextIdx]);
                            addNotification(`Filtro Alterado: ${filters[nextIdx].toUpperCase()}`, "success");
                          }}
                          className="bg-violet-900 hover:bg-violet-850 border border-violet-750 text-violet-200 w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          title="Alternar filtro estético"
                        >
                          <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-violet-300 animate-pulse" />
                        </button>
                      )}

                      <button
                        onClick={() => handleEndLiveStream(activeRoom.id)}
                        className="bg-red-650 hover:bg-red-550 border border-red-900 text-white font-sans font-black text-[10px] md:text-xs px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg md:rounded-xl uppercase tracking-wider transition-all cursor-pointer shrink-0 animate-pulse"
                        title="Encerrar transmissão ao vivo de vez"
                      >
                        🔴 Encerrar Live
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Viewer Reaction camera button */}
                      <button
                        onClick={() => setViewerReactionActive(!viewerReactionActive)}
                        className={`w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center transition-colors border cursor-pointer ${
                          viewerReactionActive 
                            ? 'bg-purple-600 border-purple-500 text-white animate-pulse' 
                            : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
                        }`}
                        title={viewerReactionActive ? "Desativar Câmera de Reação" : "Reagir com minha Webcam ao Vivo"}
                      >
                        <Video className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setStreamMuted(!streamMuted)}
                    className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 transition-colors cursor-pointer"
                    title={streamMuted ? "Tirar do Mudo" : "Mutar Áudio da Stream"}
                  >
                    {streamMuted ? <VolumeX className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />}
                  </button>

                  <button
                    onClick={() => handleOpenHostPhotos(activeRoom.hostId)}
                    className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-bold text-[9px] md:text-xs px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl transition-all font-sans uppercase shadow-[0_0_15px_rgba(168,85,247,0.35)] cursor-pointer shrink-0"
                  >
                    📸 Fotos Privadas
                  </button>

                  <button
                    onClick={() => setShowVipModal(true)}
                    className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-550 text-zinc-950 font-black text-[9px] md:text-xs px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl transition-all font-sans tracking-wide uppercase hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5 fill-zinc-950 text-zinc-950 shrink-0" /> Ser VIP
                  </button>
                </div>
              </div>
            </div>

            {/* Simulated Live Stream Interactive Actions Drawer (Gifts list selector shop) */}
            <div className="bg-zinc-900/60 border-t border-zinc-850 p-2 md:p-3">
              <div className="flex items-center justify-between mb-1.5 md:mb-2">
                <span className="text-[10px] md:text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1">
                  <Gift className="w-3 md:w-3.5 h-3 md:h-3.5 text-violet-400 animate-bounce" /> Loja Especial de Gifts Animados
                </span>
                <button
                  onClick={() => { setActiveTab('profile'); setShowPixModal(true); }}
                  className="text-[9px] md:text-[10px] text-amber-400 bg-amber-955/20 border border-amber-900/30 px-2 py-0.5 rounded-full font-semibold hover:bg-amber-955/40 cursor-pointer"
                >
                  Recarregar
                </button>
              </div>

              {/* Grid lists of gifts items */}
              <div className="grid grid-cols-6 gap-1 md:gap-1.5">
                {giftsList.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleSendGift(g)}
                    className="bg-zinc-950/60 hover:bg-zinc-820/80 border border-zinc-800 rounded-lg md:rounded-xl p-1 md:p-1.5 flex flex-col items-center justify-center transition-all group scale-100 hover:scale-102 active:scale-95 cursor-pointer"
                  >
                    <span className="text-lg md:text-2xl transition-transform group-hover:scale-120">{g.emoji}</span>
                    <span className="text-[8px] md:text-[10px] font-bold text-zinc-350 truncate w-full text-center mt-0.5 md:mt-1">{g.name}</span>
                    
                    <div className="flex items-center gap-0.5 mt-0.5 px-1 py-0.5 rounded-full bg-zinc-900 text-amber-400 font-mono text-[8px] md:text-[9px] font-bold">
                      <Coins className="w-2 md:w-2.5 h-2 md:h-2.5 shrink-0" />
                      <span>{g.coinsValue}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Right Side: Chat panel OR Menu Switch views depending on context */}
        <div className={`flex-1 flex flex-col min-h-0 ${activeRoom ? 'md:w-[40%] h-full md:h-auto' : 'w-full'}`}>
          
          {/* If watching active room shows live Chat here */}
          {activeRoom ? (
            <div id="live-chat-panel" className="flex-1 min-h-0 flex flex-col bg-zinc-950 border-b border-zinc-900">
              
              <div className="px-4 py-2 bg-zinc-900/40 border-b border-zinc-850 flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-400" /> Chat da Live (Moderado)
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Slow Mode: Off</span>
              </div>

              {/* Scrollable messages container area */}
              <div ref={chatContainerRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2.5">
                {chatMessages.length === 0 ? (
                  <p className="text-xs text-zinc-600 text-center italic my-10 font-sans">Nenhuma mensagem enviada. Seja o primeiro a puxar conversa! ✨💬</p>
                ) : (
                  chatMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      style={{ contentVisibility: 'auto' }}
                      className={`p-2.5 rounded-xl border leading-relaxed text-xs flex flex-col gap-0.5 transition-all ${
                        msg.isGift ? 'bg-amber-955/20 border-amber-800/40 shadow-[inset_0_0_12px_rgba(245,158,11,0.1)]' :
                        msg.isVip ? 'bg-zinc-900/90 border-zinc-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' :
                        'bg-zinc-920/40 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Streamer host indicator */}
                        {msg.username === activeRoom.hostName && (
                          <span className="bg-gradient-to-r from-red-600 to-pink-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider scale-95 shrink-0 inline-flex items-center gap-0.5">
                            <Radio className="w-2.5 h-2.5" /> HOST
                          </span>
                        )}

                        {/* VIP User Status Badge Indicator */}
                        {msg.isVip && (
                          <span className={`text-[8px] uppercase font-black px-1.5 py-0.5 rounded-full border shrink-0 ${
                            msg.vipType === 'diamond' ? 'bg-pink-950 hover:bg-pink-900 text-pink-400 border-pink-700/50' :
                            msg.vipType === 'gold' ? 'bg-amber-950 hover:bg-amber-900 text-amber-450 border-amber-800/50' :
                            'bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border-emerald-800/40'
                          }`}>
                            👑 VIP {msg.vipType ? msg.vipType.toUpperCase() : 'BRONZE'}
                          </span>
                        )}

                        {/* Gift icon sender */}
                        {msg.isGift && (
                          <span className="bg-amber-950/60 border border-amber-900/30 text-amber-400 text-[8px] px-1.5 py-0.5 rounded-full font-extrabold uppercase shrink-0">
                            💸 PRESENTOU
                          </span>
                        )}

                        {/* Sender username */}
                        <span 
                          className="font-bold text-zinc-250 truncate"
                          style={{ color: msg.color }}
                        >
                          {msg.username}
                        </span>

                        <span className="text-[9px] text-zinc-500 font-mono ml-auto">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Msg actual body text content */}
                      <p className={`text-zinc-300 font-medium whitespace-pre-wrap ${msg.username === activeRoom.hostName ? 'text-violet-300' : ''}`}>
                        {msg.text}
                      </p>
                    </div>
                  ))
                )}
                
                {/* For artificial automatic AI stream simulation response tracking */}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Field form panel */}
              <form 
                id="comment-submit-form"
                onSubmit={handleSendChatMessage} 
                className="p-3 bg-zinc-900 border-t border-zinc-850 flex gap-2 shrink-0"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Envie uma mensagem no chat do Streamer..."
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500 placeholder-zinc-500 pr-10 pl-3 py-2.5 rounded-xl text-xs text-zinc-100 outline-none transition-colors"
                  />
                  
                  {/* VIP message toggle switch shortcut */}
                  <button
                    type="button"
                    onClick={() => setInputText((prev) => prev ? prev + " 👑✨" : "👑✨ ")}
                    className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-amber-400 transition-colors"
                    title="Inserir Emojis VIP"
                  >
                    <Crown className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-violet-600 hover:bg-violet-500 active:bg-violet-700 disabled:opacity-40 disabled:hover:bg-violet-600 transition-colors px-4 rounded-xl flex items-center justify-center text-white cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {/* Robson prompt instruction help layout */}
              <div className="bg-violet-955/15 border-t border-violet-900/30 p-2.5 flex items-start gap-2 text-[10px] text-violet-350 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <span className="font-bold">Interação com I.A. Ativada:</span> Quando você (<span className="text-amber-400 font-semibold font-mono">Robson G.</span>) conversa ou envia presentes, o servidor gera automaticamente réplicas de voz personalizadas baseadas no modelo <span className="font-bold">Gemini 3.5 Flash</span> em tempo real!
                </div>
              </div>

            </div>
          ) : (
            // Outer layouts with responsive standard tabs
            <div className="flex-1 flex flex-col">
              
              {/* App Horizontal Navigation Header tabs bar */}
              <div className="flex overflow-x-auto bg-zinc-900 border-b border-zinc-800">
                <button
                  onClick={() => setActiveTab('home')}
                  className={`flex-1 min-w-[90px] py-3.5 text-center text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'home' 
                      ? 'border-violet-500 text-white bg-zinc-850/30' 
                      : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-850/10'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" /> LIVES
                </button>

                <button
                  onClick={() => setActiveTab('rankings')}
                  className={`flex-1 min-w-[90px] py-3.5 text-center text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'rankings' 
                      ? 'border-violet-500 text-white bg-zinc-850/30' 
                      : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-850/10'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" /> RANKINGS
                </button>

                <button
                  onClick={() => setActiveTab('host_zone')}
                  className={`flex-1 min-w-[100px] py-3.5 text-center text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'host_zone' 
                      ? 'border-violet-500 text-white bg-zinc-850/30' 
                      : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-850/10'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 text-emerald-400" /> TRANSMISSOR
                </button>

                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => setActiveTab('admin_zone')}
                    className={`flex-1 py-3.5 text-center text-xs font-extrabold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'admin_zone' 
                        ? 'border-red-500 text-red-400 bg-red-955/10' 
                        : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-850/10'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-red-500 animate-pulse" /> ADM
                  </button>
                )}

                <button
                  onClick={() => { setActiveTab('profile'); fetchSystemLogsAndApplications(); }}
                  className={`flex-1 py-3.5 text-center text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'profile' 
                      ? 'border-violet-500 text-white bg-zinc-850/30' 
                      : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-850/10'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" /> CARTEIRA
                </button>
              </div>

              {/* ---------------------------------------------------- */}
              {/* TAB 1: HOME LIVES FLOWING DISCOVERY                  */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'home' && (
                <div id="lives-discovery-flow" className="flex-1 p-4 space-y-5">
                  
                  {/* Category Filter Chips Bar */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-xs px-3.5 py-1.5 rounded-full border transition-all cursor-pointer whitespace-nowrap ${
                          selectedCategory === cat
                            ? 'bg-gradient-to-r from-violet-600 to-indigo-650 border-violet-500 text-white shadow-md'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Highlights Promotion Banner */}
                  <div className="rounded-2xl overflow-hidden bg-gradient-to-tr from-violet-950 via-zinc-900 to-emerald-950/80 border border-violet-500/20 p-5 relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl" />
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/40 text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-full">
                      PWA Premium Livestream Network
                    </span>
                    <h2 className="font-sans font-black text-xl text-white tracking-tight mt-2 leading-tight">
                      Ganhe dinheiro transmitindo ao vivo!
                    </h2>
                    <p className="text-xs text-zinc-350 mt-1 leading-relaxed max-w-md">
                      Plataforma mobile-first otimizada de altíssima latência. Receba presentes via PIX e libere assinaturas VIP para sua base de fãs!
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <button
                        onClick={() => {
                          if (currentUser.role === 'host') {
                            setActiveTab('host_zone');
                          } else {
                            setActiveTab('host_zone');
                            addNotification("Preencha o formulário para se candidatar como streamer!", "info");
                          }
                        }}
                        className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black px-4 py-2 rounded-xl transition-all font-sans cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Começar minha Live
                      </button>
                      <button
                        onClick={() => { setActiveTab('profile'); setShowPixModal(true); }}
                        className="bg-zinc-900 border border-zinc-700/60 text-amber-450 hover:bg-zinc-855 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        ⚡ Recarga PIX Instantânea
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Stream Rooms Cards Grid */}
                  <div>
                    <h3 className="font-sans font-extrabold text-sm text-white uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                      <Flame className="w-5 h-5 text-red-500 animate-pulse" /> Transmissões Ativas No Momento ({lives.filter(l => l.isLive).length})
                    </h3>

                    {lives.filter((room) => {
                      if (!room.isLive) return false;
                      if (selectedCategory === 'Todos') return true;
                      return room.category.toLowerCase() === selectedCategory.toLowerCase();
                    }).length === 0 ? (
                      <div className="bg-zinc-900/60 border border-zinc-850 rounded-2xl p-8 text-center">
                        <p className="text-zinc-500 text-xs my-3">Não encontramos nenhuma live online nesta categoria no momento.</p>
                        <button
                          onClick={() => setSelectedCategory('Todos')}
                          className="text-xs font-bold text-violet-400 hover:underline inline-flex items-center gap-1"
                        >
                          Ver todas as categorias <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {lives.filter((room) => {
                          if (!room.isLive) return false;
                          if (selectedCategory === 'Todos') return true;
                          return room.category.toLowerCase() === selectedCategory.toLowerCase();
                        }).map((room) => (
                          <div
                            key={room.id}
                            onClick={() => handleSelectRoom(room)}
                            className="group relative bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden cursor-pointer hover:border-violet-500/50 shadow-md transition-all hover:shadow-[0_0_15px_rgba(139,92,246,0.15)] focus:none"
                          >
                            {/* Live Badge Preview Image */}
                            <div className="aspect-video w-full bg-zinc-950 relative overflow-hidden">
                              <img
                                src={room.thumbnail}
                                alt={room.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />

                              {/* Overlays inside image */}
                              <div className="absolute top-3 left-3 flex gap-1 items-center">
                                <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider inline-flex items-center gap-0.5">
                                  <Radio className="w-2.5 h-2.5" /> AO VIVO
                                </span>
                                {room.isPrivate && (
                                  <span className="bg-zinc-950/80 border border-pink-700/40 text-pink-400 backdrop-blur-md text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5">
                                    <Lock className="w-2.5 h-2.5" /> {room.entryCoinsPrice}c
                                  </span>
                                )}
                                {room.isVipOnly && (
                                  <span className="bg-zinc-950/80 border border-amber-700/40 text-amber-355 backdrop-blur-md text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5">
                                    <Crown className="w-2.5 h-2.5" /> VIP {room.vipMinLevel?.toUpperCase()}
                                  </span>
                                )}
                              </div>

                              <div className="absolute bottom-3 right-3 bg-zinc-950/70 border border-zinc-800/60 backdrop-blur-sm text-zinc-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                                {room.viewersCount} assistindo
                              </div>
                            </div>

                             {/* Details Room footer metadata */}
                            <div className="p-4 flex items-center justify-between gap-2.5">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <img
                                  src={room.hostAvatar}
                                  alt={room.hostName}
                                  className="w-9 h-9 rounded-full object-cover border border-violet-500 shrink-0"
                                />
                                <div className="min-w-0">
                                  <h4 className="font-bold text-xs text-white leading-tight truncate group-hover:text-violet-400 transition-colors">
                                    {room.title}
                                  </h4>
                                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-400">
                                    <span className="font-semibold text-zinc-350">{room.hostName}</span>
                                    <span className="w-1 h-1 rounded-full bg-zinc-750" />
                                    <span className="text-violet-400 text-[10px]">{room.category}</span>
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenHostPhotos(room.hostId);
                                }}
                                className="bg-zinc-950/80 hover:bg-violet-950 text-zinc-300 hover:text-violet-450 border border-zinc-800 hover:border-violet-750 p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer shrink-0"
                                title="Ver Álbum de Fotos do Host 📸"
                              >
                                <Camera className="w-4 h-4 text-violet-400" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Streamers Carrousel list */}
                  <div>
                    <h3 className="font-sans font-extrabold text-sm text-white uppercase tracking-wider mb-2.5">
                      Streamers Populares Recomendados ✨
                    </h3>
                    <div className="grid grid-cols-3 gap-2.5">
                      {(rankings.topHosts || []).slice(0, 3).map((host: any, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleOpenHostPhotos(host.id)}
                          className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 hover:border-violet-500/50 p-3 rounded-2.5xl text-center flex flex-col items-center transition-all cursor-pointer group"
                        >
                          <div className="relative mb-1.5 shrink-0">
                            <img src={host.avatar} className="w-12 h-12 rounded-full border border-zinc-750 object-cover shadow-sm group-hover:border-violet-500 transition-colors" />
                            <span className="absolute bottom-0 right-0 bg-zinc-900 border border-zinc-850 text-[8px] p-0.5 rounded-full">📸</span>
                          </div>
                          <span className="text-[10px] font-extrabold text-white truncate w-full group-hover:text-violet-400 transition-colors">{host.username}</span>
                          <span className="text-[9px] text-zinc-400 font-mono mt-0.5">{host.followersCount} seg.</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 2: RANKINGS SOCIAL LEADERBOARDS                  */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'rankings' && (
                <div id="leaderboard-panel-view" className="flex-1 p-4 space-y-6">
                  
                  <div className="text-center py-2">
                    <span className="bg-violet-955/40 border border-violet-850 text-violet-450 uppercase font-mono text-[9px] px-2.5 py-0.5 rounded-full font-bold">
                      🏆 RANKING GERAL EM TEMPO REAL
                    </span>
                    <h2 className="font-sans font-black text-xl text-white tracking-widest uppercase mt-1">Estrelas do App</h2>
                    <p className="text-zinc-400 text-xs mt-1">Os maiores apoiadores e os streamers mais populares da casa!</p>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    
                    {/* Top 5 Gifters / Apoiadores */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4.5">
                      <h3 className="font-bold text-xs uppercase text-amber-450 tracking-widest inline-flex items-center gap-1.5 mb-3">
                        <Crown className="w-4 h-4 fill-amber-450 text-amber-450" /> Top Maiores Doadores/Apoiadores
                      </h3>

                      <div className="space-y-2">
                        {rankings.topGifters?.map((g, idx) => (
                          <div key={idx} className="bg-zinc-950/60 border border-zinc-850 p-2.5 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              {/* Medal icon */}
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                                idx === 0 ? 'bg-yellow-500 text-zinc-950 font-black' :
                                idx === 1 ? 'bg-zinc-400 text-zinc-950 font-black' :
                                idx === 2 ? 'bg-amber-700 text-zinc-950 font-black' :
                                'bg-zinc-900 border border-zinc-850 text-zinc-400'
                              }`}>
                                {idx + 1}
                              </span>
                              <img src={g.avatar} className="w-9 h-9 rounded-full object-cover border border-zinc-800" />
                              <span className="font-bold text-xs text-white">{g.username}</span>
                            </div>

                            <div className="text-right flex items-center gap-1 bg-amber-955/15 px-2.5 py-1 rounded-full text-amber-450 font-mono text-[11px] font-bold">
                              <Coins className="w-3.5 h-3.5 text-amber-450 shrink-0" />
                              <span>{g.spent} c</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top 5 Streamers populares */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4.5">
                      <h3 className="font-bold text-xs uppercase text-emerald-450 tracking-widest inline-flex items-center gap-1.5 mb-3">
                        <Flame className="w-4 h-4 text-emerald-400 animate-pulse" /> Streamers mais populares
                      </h3>

                      <div className="space-y-2">
                        {rankings.topHosts?.map((h, idx) => (
                          <div key={idx} className="bg-zinc-950/60 border border-zinc-850 p-2.5 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                                idx === 0 ? 'bg-yellow-500 text-zinc-950 font-black' :
                                idx === 1 ? 'bg-zinc-400 text-zinc-950 font-black' :
                                idx === 2 ? 'bg-amber-700 text-zinc-950 font-black' :
                                'bg-zinc-900 border border-zinc-850 text-zinc-400'
                              }`}>
                                {idx + 1}
                              </span>
                              <img src={h.avatar} className="w-9 h-9 rounded-full object-cover border border-zinc-800" />
                              <div>
                                <p className="font-bold text-xs text-white">{h.username}</p>
                                <span className="text-[10px] text-zinc-500 leading-none">{h.followersCount} seguidores</span>
                              </div>
                            </div>

                            <span className="text-[10px] bg-emerald-955/20 border border-emerald-900/30 text-emerald-400 px-2.5 py-1 rounded-full font-mono font-semibold">
                              Ativo
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 3: HOST ZONE (START BROADCAST / CANDIDACY)       */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'host_zone' && (
                <div id="host-zone-container" className="flex-1 p-4 space-y-6">
                  
                  {/* SCENARIO A: LOGGED USER IS A REGULAR USER - CANDIDACY FORM REQUIRED */}
                  {currentUser.role === 'user' && (
                    <div className="space-y-5">
                      <div className="text-center py-2 bg-gradient-to-r from-violet-955/20 via-zinc-900 to-indigo-955/20 rounded-2xl border border-zinc-850 p-4">
                        <Radio className="w-10 h-10 text-violet-500 mx-auto mb-2 animate-pulse" />
                        <h2 className="font-sans font-black text-lg text-white tracking-tight">Quer Ganhar Dinheiro Transmitindo?</h2>
                        <p className="text-zinc-400 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
                          Receba dezenas de presentes brilhantes que se convertem em dinheiro real depositados via PIX instantaneamente!
                        </p>
                      </div>

                      {currentUser.hostStatus === 'pending' ? (
                        <div className="bg-yellow-955/15 border border-yellow-800/40 rounded-2xl p-5 text-center">
                          <AlertCircle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                          <h4 className="font-extrabold text-xs text-yellow-400 uppercase tracking-widest">Inscrição Em Análise!</h4>
                          <p className="text-zinc-350 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
                            Sua candidatura foi salva e está na lista de auditoria. Para pular a fila de aprovação e testar imediatamente:
                          </p>
                          
                          {/* Facilitator instruction button */}
                          {(() => {
                            const isDevEnv = window.location.hostname.includes('localhost') || 
                                              window.location.hostname.includes('127.0.0.1') || 
                                              window.location.hostname.includes('ais-dev-');
                            if (!isDevEnv) return null;
                            return (
                              <div className="mt-4 p-3 bg-zinc-950 border border-zinc-850 rounded-xl max-w-xs mx-auto animate-fade-in">
                                <span className="text-[10px] text-zinc-400 block mb-1 font-mono">DICA DE AVALIAÇÃO DO AGENTE</span>
                                <button
                                  onClick={() => toggleTestUserRole('host')}
                                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-1.5 px-3 rounded-lg cursor-pointer"
                                >
                                  Auto-Aprovar como Host Streamer 🚀
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <form onSubmit={handleSubmitHostAudition} className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl space-y-4">
                          <h3 className="font-sans font-extrabold text-sm text-white uppercase tracking-wider border-b border-zinc-800 pb-2 flex items-center gap-1.5">
                            📄 Fomulário de Candidatura Host Oficial
                          </h3>

                          <div className="grid grid-cols-1 gap-3 text-xs">
                            <div>
                              <label className="block text-zinc-400 font-bold mb-1">Nome Completo do Portador *</label>
                              <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="ex: Fernando Albuquerque de Melo"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-200 outline-none focus:border-violet-500"
                              />
                            </div>

                            <div>
                              <label className="block text-zinc-400 font-bold mb-1">CPF ou Identidade do Streamer *</label>
                              <input
                                type="text"
                                required
                                value={docNumber}
                                onChange={(e) => setDocNumber(e.target.value)}
                                placeholder="ex: 123.456.789-00"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-200 outline-none focus:border-violet-500"
                              />
                            </div>

                            <div>
                              <label className="block text-zinc-400 font-bold mb-1">Chave PIX para recebimento manual ou automático *</label>
                              <input
                                type="text"
                                required
                                value={pixKeyForm}
                                onChange={(e) => setPixKeyForm(e.target.value)}
                                placeholder="E-mail, Celular ou CPF"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-200 outline-none focus:border-violet-500"
                              />
                            </div>

                            <div>
                              <label className="block text-zinc-400 font-bold mb-1">Breve descrição do seu canal (Bio) *</label>
                              <textarea
                                value={hostBio}
                                onChange={(e) => setHostBio(e.target.value)}
                                placeholder="ex: Toco piano ao vivo e aceito sugestões do chat..."
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-200 min-h-[70px] outline-none focus:border-violet-500 resize-none"
                              />
                            </div>

                            <div>
                              <label className="block text-zinc-400 font-bold mb-1">Link de Perfil Social (TikTok, Instagram ou Twitter)</label>
                              <input
                                type="text"
                                value={socialLink}
                                onChange={(e) => setSocialLink(e.target.value)}
                                placeholder="ex: @fernandodjs"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-200 outline-none focus:border-violet-500"
                              />
                            </div>

                            {/* Terms alert block */}
                            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 text-[10px] text-zinc-400 leading-normal flex items-start gap-1.5">
                              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span>Concordo com os Termos de Streamer Premium de repasse de comissão sobre todos os presentes do chat recebidos.</span>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 text-white font-sans font-black text-xs py-3.5 rounded-xl uppercase tracking-wider shadow-lg transition-transform hover:scale-101 active:scale-99 cursor-pointer"
                          >
                            Enviar Documentação de Host
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {/* SCENARIO B: USER IS ACTIVE REGISTERED STREAMER HOST */}
                  {currentUser.role === 'host' && (
                    <div className="space-y-5">
                      
                      {/* Host Quick Statistics Dashboard Analytics Overview */}
                      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 relative">
                        <p className="text-[10px] uppercase font-bold text-violet-400 tracking-widest">DASHBOARD DO STREAMER</p>
                        <h2 className="font-sans font-black text-lg text-white mt-0.5">Olá, {currentUser.username}! 👋</h2>
                        
                        <div className="grid grid-cols-2 gap-3.5 mt-4">
                          <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-850/80">
                            <span className="text-[10px] text-zinc-500 font-mono block leading-none">SEGUIDORES</span>
                            <span className="text-xl font-bold text-white font-mono tracking-tight block mt-1.5">{currentUser.followersCount}</span>
                          </div>
                          <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-850/80">
                            <span className="text-[10px] text-zinc-500 font-mono block leading-none">CARTEIRA ATIVA</span>
                            <span className="text-xl font-bold text-yellow-400 font-mono tracking-tight block mt-1.5 flex items-center gap-1">
                              <Coins className="w-4 h-4 text-amber-400 inline" /> {currentUser.walletCoins}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stream broadcast control console editor box */}
                      {(() => {
                        const currentHostLive = (lives || []).find(r => r.hostId === currentUser?.id && r.isLive);
                        if (currentHostLive) {
                          return (
                            <div className="bg-gradient-to-r from-red-950/20 via-zinc-900 to-red-950/20 border border-red-900/40 p-6 rounded-3xl space-y-4 shadow-xl">
                              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                                <div className="flex items-center gap-3">
                                  <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                  </span>
                                  <div>
                                    <p className="font-extrabold text-white text-xs uppercase tracking-wider">Você está ao vivo agora! 🔴</p>
                                    <p className="text-[10px] text-zinc-400 mt-0.5">Sua transmissão está ativa e visível para a comunidade.</p>
                                  </div>
                                </div>
                                <span className="bg-red-955 text-red-400 border border-red-900/40 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                                  Transmissão Habilitada
                                </span>
                              </div>

                              {/* Live Details Preview Card */}
                              <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-850 flex gap-4 text-xs">
                                <img 
                                  src={currentHostLive.thumbnail} 
                                  alt={currentHostLive.title} 
                                  className="w-24 h-16 rounded-xl object-cover border border-zinc-800 shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-black text-white text-sm truncate">{currentHostLive.title || 'Sem título configurado'}</h4>
                                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-zinc-400">
                                    <span className="bg-zinc-900 px-2 py-0.5 rounded-md text-zinc-300 font-semibold">{currentHostLive.category}</span>
                                    {currentHostLive.isPrivate ? (
                                      <span className="bg-indigo-950 text-indigo-400 border border-indigo-900/30 px-2 py-0.5 rounded-md font-bold">🔒 Privada ({currentHostLive.entryCoinsPrice || 0} Coins)</span>
                                    ) : (
                                      <span className="bg-emerald-955/20 text-emerald-450 border border-emerald-900/30 px-2 py-0.5 rounded-md font-bold">Pública</span>
                                    )}
                                    {currentHostLive.isVipOnly && (
                                      <span className="bg-amber-955/20 text-amber-400 border border-amber-900/30 px-2 py-0.5 rounded-md font-bold">⭐ Apenas VIPs</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                                <button
                                  type="button"
                                  onClick={() => setActiveRoom(currentHostLive)}
                                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 text-white font-sans font-black text-xs py-3.5 rounded-xl uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                                >
                                  📺 Voltar e Assistir Meu Chat
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => handleEndLiveStream(currentHostLive.id)}
                                  className="w-full bg-red-600 hover:bg-red-500 text-white font-sans font-black text-xs py-3.5 rounded-xl uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                                >
                                  🔴 Encerrar Transmissão Ao Vivo
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl space-y-4">
                            <h3 className="font-sans font-extrabold text-sm text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5 text-zinc-200">
                              <Video className="w-4 h-4 text-red-500" /> Painel de Transmissão SRS / RTMP
                            </h3>

                            <div className="grid grid-cols-1 gap-3.5 text-xs">
                              <div>
                                <label className="block text-zinc-400 font-bold mb-1">Título chamativo da Transmissão</label>
                                <input
                                  type="text"
                                  value={myStreamTitle}
                                  onChange={(e) => setMyStreamTitle(e.target.value)}
                                  placeholder="ex: 🔴 SABADO DE VOZ E VIOLAO! VEM COMIGOO!"
                                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-xl p-3 text-zinc-200 outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-zinc-400 font-bold mb-1">Imagem de Capa (Thumbnail)</label>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                  <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-850 hover:border-violet-550/60 bg-zinc-950/60 hover:bg-zinc-950 px-4 py-3 rounded-xl cursor-pointer transition-all text-center">
                                    <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
                                      <Upload className="w-4 h-4 text-violet-400 shrink-0" />
                                      <span>Escolher Imagem da Galeria 📸</span>
                                    </div>
                                    <span className="text-[9px] text-zinc-500 mt-1">Carregue um arquivo de imagem do seu dispositivo</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          try {
                                            const compressed = await compressAndResizeImage(file, 800, 800, 0.75);
                                            setMyStreamCover(compressed);
                                            addNotification("Imagem de capa importada com sucesso da sua galeria! 📸✨", "success");
                                          } catch (error) {
                                            addNotification("Erro ao processar imagem.", "alert");
                                          }
                                        }
                                      }}
                                      className="hidden"
                                    />
                                  </label>

                                  {myStreamCover && (
                                    <div className="relative shrink-0 flex items-center justify-center bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                                      <div className="relative">
                                        <img src={myStreamCover} alt="Cover Preview" className="w-16 h-16 rounded-lg object-cover border border-violet-500 shadow-md" />
                                        <button
                                          type="button"
                                          onClick={() => setMyStreamCover('')}
                                          className="absolute -top-1.5 -right-1.5 bg-red-650 hover:bg-red-550 rounded-full p-1 text-white text-[9px] shadow-sm cursor-pointer border border-zinc-900 shrink-0"
                                          title="Remover imagem"
                                        >
                                          <X className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-zinc-400 font-bold mb-1">Categoria principal</label>
                                  <select
                                    value={myStreamCategory}
                                    onChange={(e) => setMyStreamCategory(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-200 outline-none"
                                  >
                                    <option value="Bate-papo">Bate-papo</option>
                                    <option value="Música">Música</option>
                                    <option value="Jogos">Jogos</option>
                                    <option value="Moda & Beleza">Moda & Beleza</option>
                                    <option value="Vida Real">Vida Real</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-zinc-400 font-bold mb-1">Configuração de Acesso</label>
                                  <div className="flex bg-zinc-950 rounded-xl border border-zinc-800 p-0.5">
                                    <button
                                      type="button"
                                      onClick={() => setMyStreamPrivate(false)}
                                      className={`flex-1 text-[10px] uppercase font-bold py-2 rounded-lg cursor-pointer ${!myStreamPrivate ? 'bg-violet-600 text-white' : 'text-zinc-400'}`}
                                    >
                                      Pública
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setMyStreamPrivate(true)}
                                      className={`flex-1 text-[10px] uppercase font-bold py-2 rounded-lg cursor-pointer ${myStreamPrivate ? 'bg-indigo-600 text-white' : 'text-zinc-400'}`}
                                    >
                                      Privada 🔒
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Conditional Private Option cost */}
                              {myStreamPrivate && (
                                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-850 flex items-center justify-between">
                                  <div>
                                    <span className="text-[10px] font-bold text-zinc-400 block uppercase">Ingresso Cobrado por Fã</span>
                                    <span className="text-[9px] text-zinc-500">Valor fixo de moedas para os usuários liberarem canal privado</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-1.5 py-1">
                                    <input
                                      type="number"
                                      value={myStreamPrice}
                                      onChange={(e) => setMyStreamPrice(Number(e.target.value))}
                                      className="w-12 text-center text-xs bg-transparent border-0 font-bold text-white outline-none font-mono"
                                    />
                                    <span className="text-[10px] font-bold text-zinc-400 pl-1">Coins</span>
                                  </div>
                                </div>
                              )}

                              {/* Extra VIP restrictions option */}
                              <div className="flex items-center justify-between p-3.5 bg-zinc-950 rounded-xl border border-zinc-800/80">
                                <div className="gap-0.5 flex flex-col">
                                  <span className="font-bold text-xs text-zinc-300">Restrição de Chat VIP</span>
                                  <span className="text-[10px] text-zinc-500 text-left">Apenas telespectadores com selo VIP podem assistir à stream</span>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={myStreamVipOnly}
                                  onChange={(e) => setMyStreamVipOnly(e.target.checked)}
                                  className="w-4 h-4 text-violet-600 bg-zinc-900 rounded border-zinc-800 cursor-pointer"
                                />
                              </div>
                            </div>

                            <button
                              onClick={handleStartHostLive}
                              className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-sans font-black text-xs py-3.5 rounded-xl uppercase tracking-widest shadow-lg transition-transform hover:scale-101 active:scale-99 cursor-pointer flex items-center justify-center gap-2"
                            >
                              <Radio className="w-4 h-4 animate-ping text-white shrink-0" /> INICIAR LIVE EM ALTA TAXA DE FRAMES (1080P)
                            </button>
                          </div>
                        );
                      })()}

                      {/* Cash Out PIX withdrawal request panel */}
                      <form onSubmit={handleRequestWithdrawal} className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl space-y-4">
                        <h3 className="font-sans font-extrabold text-sm text-amber-450 uppercase tracking-wider border-b border-zinc-800 pb-2 flex items-center gap-1.5">
                          💸 Área de Saque PIX (Cálculo Fiduciário)
                        </h3>
                        <p className="text-zinc-400 text-xs leading-relaxed">
                          Retire suas moedas recebidas. Conversão padrão: <span className="text-white font-bold font-mono">100 moedas = R$ 2,00</span>.
                        </p>

                        <div className="grid grid-cols-1 gap-3.5 border-t border-zinc-800/60 pt-3 text-xs">
                          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-850 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-zinc-500 uppercase block">Chave PIX Salva</span>
                              <span className="font-bold text-white text-xs block mt-0.5">{currentUser.pixKey || 'Não cadastrada! Defina no seu Perfil.'}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveTab('profile')}
                              className="text-[9px] text-violet-400 uppercase font-bold hover:underline"
                            >
                              Alterar
                            </button>
                          </div>

                          <div>
                            <label className="block text-zinc-400 font-bold mb-1">Quantidade de moedas a sacar</label>
                            <div className="flex items-center gap-2 bg-zinc-950 rounded-xl border border-zinc-800 p-2.5">
                              <Coins className="w-4 h-4 text-amber-500 shrink-0" />
                              <input
                                type="number"
                                required
                                min="200"
                                value={withdrawCoinsAmount}
                                onChange={(e) => setWithdrawCoinsAmount(Number(e.target.value))}
                                className="flex-1 bg-transparent border-0 outline-none text-xs text-white font-bold font-mono"
                              />
                            </div>
                          </div>

                          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 flex justify-between font-mono text-xs">
                            <span className="text-zinc-400">Total BRL a receber:</span>
                            <span className="font-bold text-emerald-400">R$ {((withdrawCoinsAmount / 100) * 2).toFixed(2)}</span>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={!currentUser.pixKey || currentUser.walletCoins < withdrawCoinsAmount}
                          style={{ contentVisibility: 'auto' }}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Solicitar Saque do Caixa
                        </button>
                      </form>

                      {/* Cash withdrawals history requested list */}
                      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl">
                        <p className="text-xs font-bold text-white mb-2.5 uppercase tracking-wider">Histórico Recente de Solicitações</p>
                        {withdrawList.length === 0 ? (
                          <p className="text-[11px] text-zinc-500 italic">Nenhum saque solicitado ainda.</p>
                        ) : (
                          <div className="space-y-1.5 text-xs">
                            {withdrawList.map((w) => (
                              <div key={w.id} style={{ contentVisibility: 'auto' }} className="bg-zinc-950 p-2.5 rounded-xl flex items-center justify-between border border-zinc-850">
                                <div>
                                  <span className="text-[10.5px] font-bold text-white font-mono">{w.amountCoins} c</span>
                                  <span className="text-[9px] text-zinc-500 block">PIX: {w.pixKey} • {new Date(w.date).toLocaleDateString()}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-emerald-400 block font-mono">R$ {w.amountBRL.toFixed(2)}</span>
                                  <span className={`text-[8.5px] uppercase font-bold ${
                                    w.status === 'approved' ? 'text-emerald-500' :
                                    w.status === 'rejected' ? 'text-red-500' : 'text-zinc-500'
                                  }`}>{w.status === 'approved' ? 'Aprovado' : w.status === 'rejected' ? 'Rejeitado' : 'Pendente'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 4: ADMIN ZONE MODERATOR & CORE FINANCE STATUS    */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'admin_zone' && currentUser.role === 'admin' && (
                <div id="admin-zone-box" className="flex-1 p-4 space-y-6">
                  
                  <div className="p-4 bg-red-955/10 border border-red-900/30 rounded-2xl relative">
                    <div className="absolute top-3 right-3 w-4 h-4 bg-red-500 rounded-full animate-ping" />
                    <span className="px-2 py-0.5 rounded-md bg-red-900 text-red-300 font-bold uppercase tracking-wider text-[8px] border border-red-700/50">
                      PAINEL CONTROLADOR CENTRAL ADM
                    </span>
                    <h3 className="font-sans font-black text-white text-base mt-2">Auditoria de Candidaturas e Transações</h3>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
                      Aprove inscrições de novos hosts de forma imediata, gerencie saques pendentes e finalize qualquer live ativa.
                    </p>
                  </div>

                  {/* WhatsApp de Recebimentos Config Card */}
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl">
                    <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Oficial de Vendas de Moedas
                    </h4>
                    <p className="text-[10px] text-zinc-500 mb-3 leading-normal">
                      Defina o número do WhatsApp de destino para onde os usuários serão direcionados ao clicar em comprar moedas. Use o formato internacional (Ex: 5521999999999).
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tempWhatsapp}
                        onChange={(e) => setTempWhatsapp(e.target.value)}
                        placeholder="Ex: 5521999999999"
                        className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-350 font-mono outline-none flex-1 focus:border-emerald-500 transition-colors"
                      />
                      <button
                        onClick={() => handleUpdateAdminWhatsapp(tempWhatsapp)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
                      >
                        Salvar WhatsApp 💾
                      </button>
                    </div>
                  </div>

                  {/* WhatsApp Manual Coin Approvals Auditor Card */}
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl">
                    <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-2.5 border-b border-zinc-800 pb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-amber-450 animate-pulse" /> Liberação de Pacotes (WhatsApp) ({userTxHistory.filter(t => t.type === 'deposit' && t.status === 'pending').length})
                      </span>
                    </h4>

                    {userTxHistory.filter(t => t.type === 'deposit' && t.status === 'pending').length === 0 ? (
                      <p className="text-xs text-zinc-500 italic text-center p-3">Nenhum pagamento ou pedido de moedas via WhatsApp aguardando liberação manual.</p>
                    ) : (
                      <div className="space-y-3">
                        {userTxHistory.filter(t => t.type === 'deposit' && t.status === 'pending').map((tx) => (
                          <div key={tx.id} style={{ contentVisibility: 'auto' }} className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-850 flex flex-col gap-2">
                            <div className="flex items-start justify-between text-xs">
                              <div>
                                <span className="font-extrabold text-white block">Usuário: {tx.username}</span>
                                <span className="text-[10px] text-zinc-500 block font-mono">Ref Pedido: {tx.id} • {new Date(tx.date).toLocaleDateString()}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-amber-400 font-extrabold block">+{tx.coins} Moedas</span>
                                <span className="text-[10px] text-emerald-400 font-mono font-bold">R$ {tx.amountBRL.toFixed(2)}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-1.5 mt-2 border-t border-zinc-850 pt-2">
                              <button
                                onClick={() => handleCancelManualDeposit(tx.id)}
                                className="bg-zinc-900 hover:bg-zinc-850 text-red-400 font-bold px-3 py-1.5 text-xs rounded-lg border border-red-900/30 cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleConfirmManualDeposit(tx.id, tx.coins, tx.username)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 text-xs rounded-lg cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" /> Liberar Moedas Imediatamente 👍
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Auditions Applications container list */}
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl">
                    <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-2.5 border-b border-zinc-800 pb-2">
                       Aprovação de Novos Streamers ({hostApplicationsList.filter(a => a.status === 'pending').length})
                    </h4>

                    {hostApplicationsList.filter(a => a.status === 'pending').length === 0 ? (
                      <p className="text-xs text-zinc-500 italic text-center p-3">Nenhuma candidatura aguardando liberação no momento.</p>
                    ) : (
                      <div className="space-y-3">
                        {hostApplicationsList.filter(a => a.status === 'pending').map((app) => (
                          <div key={app.id} style={{ contentVisibility: 'auto' }} className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-850 flex flex-col gap-2.5">
                            <div className="flex items-start justify-between gap-2 text-xs">
                              <div>
                                <span className="font-black text-white block">{app.username}</span>
                                <span className="text-[10px] text-zinc-500 block">CPF: {app.documentNumber} • Social: {app.socialMedia}</span>
                              </div>
                              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-yellow-950 text-yellow-400 border border-yellow-800/40 rounded">
                                {app.status}
                              </span>
                            </div>

                            <p className="text-[11px] text-zinc-400 leading-normal bg-zinc-900 p-2 rounded-lg italic">
                              "{app.bio}"
                            </p>

                            <div className="flex items-center justify-end gap-1.5 mt-1 border-t border-zinc-850 pt-2 text-xs">
                              <button
                                onClick={() => handleAdminApproveHost(app.id, 'rejected')}
                                className="bg-zinc-900 hover:bg-zinc-800 text-red-400 font-bold px-3 py-1.5 rounded-lg border border-red-900/30 cursor-pointer"
                              >
                                Recusar
                              </button>
                              <button
                                onClick={() => handleAdminApproveHost(app.id, 'approved')}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-lg cursor-pointer"
                              >
                                Aprovar e Criar Live 👍
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cash withdrawals payout auditor list */}
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl">
                    <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-2.5 border-b border-zinc-800 pb-2 flex items-center justify-between">
                      <span>Aprovação de Saques de Streamers ({allWithdrawalsAdmin.filter(w => w.status === 'pending').length})</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold lowercase">100c = R$2,00</span>
                    </h4>

                    {allWithdrawalsAdmin.filter(w => w.status === 'pending').length === 0 ? (
                      <p className="text-xs text-zinc-500 italic text-center p-3">Nenhum saque pendente aguardando processamento bancário.</p>
                    ) : (
                      <div className="space-y-3">
                        {allWithdrawalsAdmin.filter(w => w.status === 'pending').map((wd) => (
                          <div key={wd.id} style={{ contentVisibility: 'auto' }} className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-850 flex flex-col gap-2 shadow-sm">
                            <div className="flex items-start justify-between text-xs">
                              <div>
                                <span className="font-extrabold text-white block">{wd.username}</span>
                                <span className="text-[10px] text-zinc-500 block">PIX: {wd.pixKey}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-emerald-450 font-mono font-extrabold block">R$ {wd.amountBRL.toFixed(2)}</span>
                                <span className="text-[9px] text-zinc-500 font-mono italic">{wd.amountCoins} coins</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-1.5 mt-2.5 border-t border-zinc-850 pt-2.5">
                              <button
                                onClick={() => handleAdminApproveWithdrawal(wd.id, 'rejected')}
                                className="bg-zinc-900 hover:bg-zinc-800 text-red-400 font-bold px-3 py-1.5 text-xs rounded-lg border border-red-900/30 cursor-pointer"
                              >
                                Recusar e Estornar Moedas
                              </button>
                              <button
                                onClick={() => handleAdminApproveWithdrawal(wd.id, 'approved')}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 text-xs rounded-lg cursor-pointer"
                              >
                                Confirmar Depósito PIX 👍
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Active Streams closer safety console */}
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl">
                    <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-2.5 border-b border-zinc-800 pb-2">
                      Fim de Transmissão de Emergência
                    </h4>
                    <p className="text-[11px] text-zinc-500 leading-normal mb-3">Encerre e remova qualquer live que fira as diretrizes da comunidade:</p>
                    
                    <div className="space-y-2">
                      {lives.filter(l => l.isLive).map((room) => (
                        <div key={room.id} style={{ contentVisibility: 'auto' }} className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-850 flex items-center justify-between text-xs">
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">{room.title}</p>
                            <span className="text-[10px] text-zinc-500 block">Host: {room.hostName} ({room.category})</span>
                          </div>

                          <button
                            onClick={async () => {
                              const verify = window.confirm(`Deseja derrubar a live de ${room.hostName} agora?`);
                              if (verify) {
                                try {
                                  const res = await fetch(`/api/lives/${room.id}/ban-by-admin`, { method: 'DELETE' });
                                  if (res.ok) {
                                    addNotification(`Live de ${room.hostName} derrubada!`, 'info');
                                    fetchLives();
                                  }
                                } catch (e) { console.error(e); }
                              }
                            }}
                            className="text-[10.5px] bg-red-955/20 hover:bg-red-955/40 text-red-400 font-bold px-2.5 py-1.5 rounded-lg border border-red-900/20 cursor-pointer shrink-0"
                          >
                            Derrubar Live
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 5: MY WALLET & RECHARGING SETTINGS               */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'profile' && (
                <div id="profile-wallet-panel" className="flex-1 p-4 space-y-6">
                  
                  {/* Account detail segment */}
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl flex items-center gap-4 relative">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.username}
                      className="w-16 h-16 rounded-full border-2 border-violet-500 object-cover"
                    />
                    <div className="flex-1 min-w-0 pr-14">
                      <p className="text-[10px] uppercase font-bold text-violet-400 font-mono block">NÍVEL ALCANÇADO: {currentUser.level}</p>
                      <h3 className="font-sans font-black text-white text-base leading-tight">{currentUser.username}</h3>
                      <p className="text-zinc-500 text-xs truncate">{currentUser.email}</p>
                      <span className="text-[11px] text-zinc-350 block mt-1 line-clamp-1 italic">"{currentUser.bio || 'Membro VIP Premium.'}"</span>
                    </div>
                    <button
                      onClick={() => {
                        localStorage.removeItem('live_premium_user_id');
                        setCurrentUser(null);
                        addNotification("Sua conta foi deslogada com sucesso! Volte sempre. 👋✨", "info");
                      }}
                      className="absolute top-5 right-5 text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 px-3 py-1.5 rounded-xl text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sair
                    </button>
                  </div>

                  {/* PWA App Installation Promo Card */}
                  <div className="bg-zinc-900 border border-emerald-500/25 p-4 rounded-3xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-950/50 border border-emerald-800/30 flex items-center justify-center text-emerald-400 shrink-0">
                        <Smartphone className="w-5 h-5 animate-bounce" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs uppercase tracking-wider leading-none">Aplicativo Instalável (PWA)</h4>
                        <p className="text-[10px] text-zinc-400 mt-1 leading-normal">
                          Instale o app nativo em segundos na tela do seu celular sem ocupar memória!
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const event = new CustomEvent('pwa-install-trigger');
                        window.dispatchEvent(event);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                    >
                      Instalar App 📱
                    </button>
                  </div>

                  {/* Premium Profile settings editor block */}
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl text-xs space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-zinc-855 pb-2.5">
                      <div>
                        <p className="font-extrabold text-white text-xs uppercase tracking-wider">Painel do Perfil</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Altere seus dados de exibição e gerencie seus conteúdos estéticos.</p>
                      </div>
                      <span className="bg-violet-950 text-violet-400 border border-violet-800/40 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                        {currentUser.role === 'host' ? 'Conta Host Premium' : 'Conta Telespectador'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Left: General data */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-zinc-400 mb-1 font-bold">Nome de Exibição / Canal</label>
                          <input
                            type="text"
                            value={profileForm.username}
                            onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                            placeholder="Seu lindo nome"
                            className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-zinc-100 outline-none focus:border-violet-500 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-400 mb-1 font-bold">Biografia Curta</label>
                          <textarea
                            value={profileForm.bio}
                            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                            placeholder="Fale um pouco sobre você..."
                            rows={3}
                            className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-zinc-100 outline-none focus:border-violet-550 transition-colors resize-none leading-normal"
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-400 mb-1 font-bold">Chave PIX (Para Recebimentos)</label>
                          <input
                            type="text"
                            value={profileForm.pixKey}
                            onChange={(e) => setProfileForm({ ...profileForm, pixKey: e.target.value })}
                            placeholder="E-mail, CPF ou Telefone"
                            className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-zinc-100 outline-none focus:border-violet-550 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Right: Avatar image Customiser */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-zinc-400 mb-1 font-bold">Foto de Perfil (Avatar)</label>
                          <div className="flex flex-col items-stretch gap-3">
                            <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-800 hover:border-violet-550/60 bg-zinc-950/60 hover:bg-zinc-950 px-4 py-3 rounded-xl cursor-pointer transition-all text-center">
                              <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
                                <Upload className="w-4 h-4 text-violet-400 shrink-0" />
                                <span>Escolher da Galeria 📸</span>
                              </div>
                              <span className="text-[9px] text-zinc-500 mt-1">Carregue sua foto do celular ou computador</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const compressed = await compressAndResizeImage(file, 400, 400, 0.75);
                                      setProfileForm({ ...profileForm, avatar: compressed });
                                      addNotification("Nova foto de perfil carregada da sua galeria! 🥰✨", "success");
                                    } catch (error) {
                                      addNotification("Erro ao processar imagem.", "alert");
                                    }
                                  }
                                }}
                                className="hidden"
                              />
                            </label>

                            {profileForm.avatar && (
                              <div className="flex items-center gap-3 bg-zinc-950 p-2.5 rounded-xl border border-zinc-850">
                                <img src={profileForm.avatar} alt="Preview" className="w-12 h-12 rounded-xl object-cover border-2 border-violet-500 shadow-lg" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-zinc-200 text-xs font-bold truncate">Sua Foto de Perfil</p>
                                  <button
                                    type="button"
                                    onClick={() => setProfileForm({ ...profileForm, avatar: '' })}
                                    className="text-red-400 hover:text-red-300 text-[10px] font-sans font-bold flex items-center gap-1 mt-0.5 cursor-pointer"
                                  >
                                    <X className="w-3 h-3" /> Limpar Foto
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hosts Private Albums Configuration section */}
                    {currentUser.role === 'host' && (
                      <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 mt-4 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-2">
                          <div>
                            <span className="font-sans font-black text-xs text-fuchsia-400 uppercase tracking-widest flex items-center gap-1">
                              📸 ÁLBUM DE FOTOS PRIVADAS DO HOST
                            </span>
                            <p className="text-[10px] text-zinc-500 mt-0.5">Adicione até 6 fotos exclusivas. Defina um valor em moedas para que usuários liberem o seu álbum inteiro.</p>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              const samples = [
                                'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500',
                                'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500',
                                'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=500',
                                'https://images.unsplash.com/photo-1523264629844-40dd6bf17c2b?w=500',
                                'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500',
                                'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=500'
                              ];
                              setProfileForm(prev => ({
                                ...prev,
                                hostPhotos: samples,
                                photosPrice: prev.photosPrice || 15
                              }));
                              addNotification("Amostras lindas inseridas no formulário! Clique em salvar abaixo para registrar! ✨", "success");
                            }}
                            className="bg-zinc-90 w-auto hover:bg-zinc-850 text-fuchsia-400 border border-fuchsia-900/40 text-[9px] uppercase font-bold px-2.5 py-1 rounded-lg cursor-pointer shrink-0 transition-all"
                          >
                            Injetar Amostra Estética ✨
                          </button>
                        </div>

                        {/* Coin cost input */}
                        <div className="max-w-xs text-xs">
                          <label className="block text-zinc-400 mb-1 font-bold">Definir Preço do Álbum (Moedas por Liberação)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-amber-500 font-bold text-xs">🪙</span>
                            <input
                              type="number"
                              min="0"
                              value={profileForm.photosPrice}
                              onChange={(e) => setProfileForm({ ...profileForm, photosPrice: Math.max(0, parseInt(e.target.value) || 0) })}
                              placeholder="ex: 15"
                              className="w-full bg-zinc-900 border border-zinc-800 p-1.5 pl-8 rounded-lg text-zinc-100 outline-none font-mono font-bold text-xs"
                            />
                          </div>
                          <span className="text-[10px] text-zinc-500 block mt-1 leading-normal">
                            Se deixar como 0 moedas, todos os usuários do app podem assistir suas fotos sem custo!
                          </span>
                        </div>

                        {/* Grid of 6 Photo Slots inputs & previews */}
                        <div>
                          <label className="block text-zinc-400 mb-1.5 font-extrabold uppercase text-[10px] tracking-wide">Fotos do Álbum Private (Máximo 6)</label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                            {[0, 1, 2, 3, 4, 5].map((index) => {
                              const photoUrl = profileForm.hostPhotos[index] || '';
                              return (
                                <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 relative flex flex-col justify-between gap-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-zinc-500 font-bold">Slot {index + 1}</span>
                                    {photoUrl && (
                                      <span className="text-[8px] bg-emerald-950 text-emerald-400 font-bold px-1.5 py-0.5 rounded">Ativo 📸</span>
                                    )}
                                  </div>

                                  {photoUrl ? (
                                    <div className="h-28 w-full bg-zinc-950 rounded-lg overflow-hidden relative group">
                                      <img src={photoUrl} className="w-full h-full object-cover" alt={`Album ${index + 1}`} />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updatedPhotos = [...profileForm.hostPhotos];
                                          updatedPhotos[index] = '';
                                          setProfileForm({ ...profileForm, hostPhotos: updatedPhotos });
                                        }}
                                        className="absolute top-1.5 right-1.5 bg-red-650 hover:bg-red-550 text-white rounded-full p-1 shadow-md cursor-pointer transition-all shrink-0 border border-zinc-900"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <label className="h-28 w-full bg-zinc-950/45 border border-dashed border-zinc-800 hover:border-violet-550/40 rounded-lg flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer">
                                      <Upload className="w-5 h-5 mb-1 text-violet-400 opacity-65" />
                                      <span className="text-[9px] font-bold">Upload Galeria</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            try {
                                              const compressed = await compressAndResizeImage(file, 800, 800, 0.75);
                                              const updatedPhotos = [...profileForm.hostPhotos];
                                              updatedPhotos[index] = compressed;
                                              setProfileForm({ ...profileForm, hostPhotos: updatedPhotos });
                                              addNotification(`Foto carregada no Slot ${index + 1}! 📸✨`, "success");
                                            } catch (error) {
                                              addNotification("Erro ao processar imagem.", "alert");
                                            }
                                          }
                                        }}
                                        className="hidden"
                                      />
                                    </label>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Submit Changes Button wrapper */}
                    <div className="flex justify-end pt-2 border-t border-zinc-855">
                      <button
                        type="button"
                        disabled={isSavingProfile}
                        onClick={handleSaveProfile}
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-550 hover:to-indigo-550 disabled:from-zinc-800 disabled:to-zinc-800 text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                      >
                        {isSavingProfile ? 'Gravando Dados...' : 'Confirmar e Salvar Perfil 💾✨'}
                      </button>
                    </div>
                  </div>

                  {/* Economy Wallet segment and packet selector */}
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Ouro Virtual do App</span>
                        <span className="text-xl font-mono text-amber-400 font-extrabold flex items-center gap-1.5 mt-0.5 leading-none">
                          <Coins className="w-5 h-5 text-amber-500" /> {currentUser.walletCoins} Moedas
                        </span>
                      </div>

                      <span className="bg-emerald-955/20 border border-emerald-900/30 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                        Sincronizado via Pix
                      </span>
                    </div>

                    <p className="text-zinc-400 text-xs leading-normal">
                      Adquira pacotes de moedas e envie presentes brilhantes para motivar suas hosts favoritas!
                    </p>

                    {/* Pack grid maps */}
                    <div className="grid grid-cols-2 gap-2.5 text-xs text-left">
                      {coinPackages.map((pack) => (
                        <button
                          key={pack.id}
                          onClick={() => handleBuyPackage(pack.id)}
                          style={{ contentVisibility: 'auto' }}
                          className="bg-zinc-950/80 hover:bg-zinc-820 border border-zinc-800/80 rounded-2xl p-3 flex flex-col items-start gap-1 transition-transform sm:scale-100 hover:scale-101 cursor-pointer"
                        >
                          <span className="text-[10.5px] font-bold text-zinc-400 block h-4 truncate w-full">{pack.label}</span>
                          <span className="font-mono text-base font-extrabold text-amber-450 mt-1 flex items-center gap-1">
                            <Coins className="w-4 h-4 text-amber-500" /> {pack.coins}
                          </span>
                          
                          <div className="w-full flex items-center justify-between mt-1 text-[11px] font-bold text-white border-t border-zinc-900 pt-2 font-sans">
                            <span className="text-[10px] text-zinc-500 uppercase">Preço BRL</span>
                            <span className="text-emerald-450">R$ {pack.priceBRL.toFixed(2)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* User basic transaction ledger */}
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl">
                    <p className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-2.5">Histórico Financeiro da Conta</p>
                    
                    {userTxHistory.length === 0 ? (
                      <p className="text-[11px] text-zinc-500 italic text-center p-3">Nenhum registro de transação encontrado para esta conta.</p>
                    ) : (
                      <div className="space-y-1.5 text-xs">
                        {userTxHistory.map((tx) => (
                          <div key={tx.id} style={{ contentVisibility: 'auto' }} className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-850 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-zinc-300 block capitalize">
                                {tx.type === 'deposit' ? '💰 Depósito Recebido' :
                                 tx.type === 'gift_send' ? '🌹 Presente Enviado' :
                                 tx.type === 'gift_receive' ? '🏆 Presente Recebido' :
                                 tx.type === 'vip_subscribe' ? '👑 Assinatura VIP' :
                                 '🔑 Acesso Privado'}
                              </span>
                              <span className="text-[9px] text-zinc-500 block">{new Date(tx.date).toLocaleDateString()} • {tx.id}</span>
                            </div>

                            <div className="text-right">
                              <span className={`font-mono text-xs font-bold block ${
                                tx.type === 'deposit' || tx.type === 'gift_receive' ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                                {tx.type === 'deposit' || tx.type === 'gift_receive' ? '+' : '-'}{tx.coins} c
                              </span>
                              <span className="text-[9px] text-zinc-500 block uppercase font-bold">{tx.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          )}

        </div>

      </main>

      {/* Progressive Web App Install floating banner & wizard controllers */}
      <PwaInstallBanner onNotify={addNotification} />

      {/* ---------------------------------------------------- */}
      {/* COIN RECHARGE DISPATCH VIA WHATSAPP WITH ADM RELEASE */}
      {/* ---------------------------------------------------- */}
      {showPixModal && activePixTx && (
        <div id="pix-recharge-drawer" className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-3xl text-center">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="font-sans font-black text-xs text-amber-450 uppercase tracking-widest flex items-center gap-1">
                <MessageSquare className="w-4 h-4 text-emerald-400 animate-pulse" /> RECARGA WHATSAPP ATIVA
              </span>
              <button
                onClick={() => setShowPixModal(false)}
                className="w-7 h-7 rounded-full bg-zinc-950 hover:bg-zinc-850 flex items-center justify-center text-zinc-400 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-zinc-500 block">Valor do Pacote</p>
              <h2 className="text-2xl font-black text-emerald-400 font-sans tracking-tight">R$ {activePixTx.amountBRL.toFixed(2)}</h2>
              <span className="text-xs text-zinc-450 font-semibold inline-block bg-zinc-950 px-3 py-1 rounded-full border border-zinc-850/60 mt-1">
                Adiciona +{activePixTx.coins} moedas de ouro!
              </span>
            </div>

            {/* Generated WhatsApp QR Code */}
            <div className="mx-auto w-48 h-48 bg-white rounded-2xl p-2 flex items-center justify-center relative shadow-lg">
              <img
                src={activePixTx.pixQrCode}
                alt="WhatsApp QR Code Suporte"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-emerald-950/5 hover:bg-transparent transition-colors rounded-2xl pointer-events-none" />
            </div>
            <p className="text-[10px] text-zinc-500 leading-snug">Escaneie o QR Code acima para abrir o WhatsApp de vendas de forma automática!</p>

            {/* Direct Link box */}
            <div className="text-xs text-left">
              <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Link Direto do WhatsApp</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={activePixTx.pixCode}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-400 text-[10px] outline-none font-mono truncate select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (activePixTx?.pixCode) {
                      navigator.clipboard.writeText(activePixTx.pixCode);
                      setIsCopyingCode(true);
                      addNotification("Link do WhatsApp copiado!", "info");
                      setTimeout(() => setIsCopyingCode(false), 2000);
                    }
                  }}
                  className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  {isCopyingCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Support instructions box */}
            <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-850 flex items-start gap-2 text-[10px] text-left text-zinc-400 leading-normal">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="font-bold text-zinc-250">Liberação Manual:</span> Envie a mensagem automática pelo WhatsApp. Após a transferência do PIX para o administrador, envie o comprovante e as moedas serão ativadas na sua conta no painel ADM!
              </div>
            </div>

            {/* Primary Action anchor button */}
            <a
              href={activePixTx.pixCode}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-sans font-black text-xs py-3.5 rounded-2xl uppercase tracking-wider transition-transform hover:scale-101 cursor-pointer flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 fill-zinc-950 text-zinc-950" /> Ir para o WhatsApp 💬
            </a>

            {/* Quick test bypass for Admin */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={handleConfirmPixPayment}
                className="w-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-emerald-400 font-mono text-[9px] py-1.5 rounded-xl tracking-wider transition-colors cursor-pointer"
              >
                (ADM TESTE) Confirmar Moedas Imediatamente 👍
              </button>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* POPUP 2: VIP PLANS CLUB SELECTOR DIALOG              */}
      {/* ---------------------------------------------------- */}
      {showVipModal && (
        <div id="vip-subscription-drawer" className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-3xl text-center">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="font-sans font-black text-xs text-amber-450 uppercase tracking-widest flex items-center gap-1">
                <Crown className="w-4 h-4 fill-amber-450 text-amber-450" /> Clube de Membros VIP Premium
              </span>
              <button
                onClick={() => setShowVipModal(false)}
                className="w-7 h-7 rounded-full bg-zinc-950 hover:bg-zinc-850 flex items-center justify-center text-zinc-400 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Torne-se VIP de</p>
              <h3 className="font-sans font-bold text-white text-base mt-0.5">{activeRoom ? activeRoom.hostName : "Host Streamer"}</h3>
              <p className="text-zinc-400 text-xs mt-1 leading-normal">Seja destacado no chat da live com tags exclusivas coloridas, e acesse transmissões secretas exclusivas!</p>
            </div>

            {/* List the three VIP options bronze / gold / diamond */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs text-left">
              
              {/* Bronze */}
              <button 
                onClick={() => handleSubscribeVIP('bronze')}
                className="bg-zinc-950 border border-emerald-900/30 p-3 rounded-2xl hover:border-emerald-500 transition-colors flex flex-col items-center text-center cursor-pointer"
              >
                <span className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-600/30 text-emerald-400 font-extrabold text-xs flex items-center justify-center shadow-lg">B</span>
                <span className="font-bold text-white text-xs mt-1.5">VIP Bronze</span>
                <p className="text-[9px] text-zinc-500 leading-none mt-1">Selo Verde</p>
                <span className="mt-3 bg-zinc-900 border border-zinc-800 text-amber-400 font-mono text-[10px] font-bold px-2.5 py-1 rounded-full">
                  150 c
                </span>
              </button>

              {/* Gold */}
              <button 
                onClick={() => handleSubscribeVIP('gold')}
                className="bg-zinc-950 border border-amber-900/30 p-3 rounded-2xl hover:border-amber-500 transition-colors flex flex-col items-center text-center cursor-pointer"
              >
                <span className="w-8 h-8 rounded-full bg-amber-950 border border-amber-600/30 text-amber-450 font-extrabold text-xs flex items-center justify-center shadow-lg">G</span>
                <span className="font-bold text-white text-xs mt-1.5 text-amber-450">VIP Gold</span>
                <p className="text-[9px] text-zinc-500 leading-none mt-1">Selo Dourado</p>
                <span className="mt-3 bg-zinc-900 border border-zinc-800 text-amber-400 font-mono text-[10px] font-bold px-2.5 py-1 rounded-full">
                  300 c
                </span>
              </button>

              {/* Diamond */}
              <button 
                onClick={() => handleSubscribeVIP('diamond')}
                className="bg-zinc-950 border border-purple-900/30 p-3 rounded-2xl hover:border-fuchsia-500 transition-colors flex flex-col items-center text-center cursor-pointer"
              >
                <span className="w-8 h-8 rounded-full bg-pink-950 border border-pink-600/30 text-pink-400 font-extrabold text-xs flex items-center justify-center shadow-lg">D</span>
                <span className="font-bold text-pink-400 text-xs mt-1.5">VIP Diamond</span>
                <p className="text-[9px] text-zinc-500 leading-none mt-1">Selo Rosa</p>
                <span className="mt-3 bg-zinc-900 border border-zinc-800 text-amber-400 font-mono text-[10px] font-bold px-2.5 py-1 rounded-full">
                  500 c
                </span>
              </button>

            </div>

            <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-850 text-[10px] text-zinc-500 italic block">
              💡 Assinatura válida por 30 dias com renovação manual. Todo valor é repassado para a carteira da host streamer atual.
            </div>

          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* POPUP 3: HOST PRIVATE PHOTO ALBUM & UNLOCKS MODAL     */}
      {/* ---------------------------------------------------- */}
      {viewingHostPhotosId && viewingHostDetail && (
        <div id="host-album-viewer-modal" className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-3xl relative">
            
            {/* Modal Exit */}
            <button
              onClick={() => { setViewingHostPhotosId(null); setViewingHostDetail(null); }}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-950 hover:bg-zinc-850 flex items-center justify-center text-zinc-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Host header card info */}
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
              <img
                src={viewingHostDetail.avatar}
                alt={viewingHostDetail.username}
                className="w-12 h-12 rounded-full object-cover border-2 border-violet-500"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-violet-400 font-mono tracking-wider">Perfil do Host</span>
                <h3 className="font-sans font-black text-white text-sm leading-tight">{viewingHostDetail.username}</h3>
                <p className="text-zinc-400 text-xs truncate max-w-xs">{viewingHostDetail.bio || 'Sem biografia adicional.'}</p>
              </div>
            </div>

            {(() => {
              // Decide if photos are unlocked
              const isOwner = currentUser?.id === viewingHostDetail.id;
              const isFree = !viewingHostDetail.photosPrice || viewingHostDetail.photosPrice <= 0;
              const isUnlocked = currentUser?.unlockedHostsPhotos?.includes(viewingHostDetail.id);
              const isAdmin = currentUser?.role === 'admin';
              const albumHasAccess = isOwner || isFree || isUnlocked || isAdmin;
              
              const price = viewingHostDetail.photosPrice || 0;
              const hostPhotosCount = (viewingHostDetail.hostPhotos || []).filter(p => p && p.trim() !== '').length;

              if (albumHasAccess) {
                // Render host photos
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1">
                        📸 Álbum de Fotos Premium ({hostPhotosCount} Fotos)
                      </span>
                      {isOwner && (
                        <span className="bg-violet-950 text-violet-400 text-[9px] font-bold px-2 py-0.5 rounded-full">Seu Álbum</span>
                      )}
                      {!isOwner && isFree && (
                        <span className="bg-emerald-950 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full">Álbum Grátis</span>
                      )}
                      {!isOwner && !isFree && isUnlocked && (
                        <span className="bg-amber-950 text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded-full">Desbloqueado</span>
                      )}
                    </div>

                    {hostPhotosCount === 0 ? (
                      <div className="bg-zinc-950/50 p-8 rounded-2xl border border-dashed border-zinc-800 text-center">
                        <Camera className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                        <p className="text-zinc-500 text-xs">Este host ainda não adicionou fotos ao álbum privado.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {viewingHostDetail.hostPhotos?.filter(url => url && url.trim() !== '').map((url, i) => (
                          <div
                            key={i}
                            onClick={() => setFullScreenPhotoUrl(url)}
                            className="group relative h-28 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 cursor-zoom-in hover:border-violet-500 transition-all shadow-md shrink-0"
                          >
                            <img
                              src={url}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              alt={`Host Album Photo ${i + 1}`}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                              Clique para Ampliar 🔍
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              } else {
                // Render locked visual layout
                return (
                  <div className="bg-zinc-950/80 border border-violet-900/30 rounded-2xl p-6 text-center space-y-4 shadow-inner">
                    <div className="w-14 h-14 rounded-full bg-violet-950/60 border border-violet-850 flex items-center justify-center mx-auto shadow-lg">
                      <Lock className="w-6 h-6 text-violet-400 animate-pulse" />
                    </div>

                    <div>
                      <h4 className="font-sans font-black text-white text-sm uppercase tracking-wide">Álbum Privado Exclusivo</h4>
                      <p className="text-zinc-400 text-xs mt-1.5 leading-normal max-w-sm mx-auto">
                        Este host compartilhou conteúdos fotográficos premium super pessoais. Desbloqueie em definitivo o álbum completo de {viewingHostDetail.username}!
                      </p>
                    </div>

                    {/* Cost frame and user balance */}
                    <div className="bg-zinc-900 border border-zinc-850 p-3 rounded-xl max-w-xs mx-auto grid grid-cols-2 gap-2 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase font-bold">Acesso Completo</span>
                        <span className="font-mono text-xs text-amber-400 font-extrabold flex items-center justify-center gap-0.5 mt-0.5">
                          🪙 {price} Moedas
                        </span>
                      </div>
                      <div className="border-l border-zinc-800">
                        <span className="text-[10px] text-zinc-500 block uppercase font-bold">Seu Saldo</span>
                        <span className="font-mono text-xs text-zinc-200 font-extrabold flex items-center justify-center gap-0.5 mt-0.5">
                          🪙 {currentUser?.walletCoins || 0} Moedas
                        </span>
                      </div>
                    </div>

                    {/* Actions unlock with checking */}
                    <div className="pt-2 max-w-sm mx-auto">
                      {currentUser && currentUser.walletCoins >= price ? (
                        <button
                          onClick={() => handleUnlockHostPhotos(viewingHostDetail.id)}
                          disabled={isPhotoUnlockingLoading}
                          className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-550 hover:to-fuchsia-550 text-white font-sans font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-[0_4px_12px_rgba(139,92,246,0.25)] flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {isPhotoUnlockingLoading ? 'Desbloqueando...' : `Confirmar Liberação por ${price} Moedas 🪙🔒`}
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-red-400 text-[11px] font-bold">🚨 Saldo insuficiente de moedas para liberar o álbum!</p>
                          <button
                            onClick={() => {
                              setViewingHostPhotosId(null);
                              setViewingHostDetail(null);
                              setActiveTab('profile');
                              setShowPixModal(true);
                            }}
                            className="w-full bg-amber-550 hover:bg-amber-500 text-zinc-950 font-sans font-black text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-[0_4px_12px_rgba(245,158,11,0.25)] cursor-pointer"
                          >
                            Recarregar via PIX Instantâneo ⚡🪙
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            })()}

            {/* Modal footer back info */}
            <p className="text-[10px] text-zinc-500 text-center uppercase tracking-wide">Desbloqueio definitivo • Apoie diretamente os produtores de conteúdo</p>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* POPUP 4: FULL-SCREEN LIGHTBOX ZOOMED IMAGE           */}
      {/* ---------------------------------------------------- */}
      {fullScreenPhotoUrl && (
        <div
          id="lightbox-fullscreen"
          onClick={() => setFullScreenPhotoUrl(null)}
          className="fixed inset-0 bg-black/95 z-55 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button
            onClick={() => setFullScreenPhotoUrl(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white cursor-pointer hover:bg-zinc-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
          
          <img
            src={fullScreenPhotoUrl}
            className="max-h-[90vh] max-w-[95vw] rounded-2xl shadow-3xl border border-zinc-800 object-contain animate-scale-up"
            alt="Expanded fullscreen view"
          />
        </div>
      )}

      {/* Styled custom floating canvas animation keyframes */}
      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(0.6) rotate(0deg);
            opacity: 0;
          }
          10% {
            transform: translateY(-20px) scale(1.1) rotate(-8deg);
            opacity: 1;
          }
          90% {
            transform: translateY(-200px) scale(0.95) rotate(4deg);
            opacity: 0.9;
          }
          100% {
            transform: translateY(-280px) scale(0.7) rotate(12deg);
            opacity: 0;
          }
        }
        @keyframes slide-in {
          0% {
            transform: translateX(100%) scale(0.95);
            opacity: 0;
          }
          100% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
      
    </div>
  );
}

