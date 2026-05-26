/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Coins, User, ArrowLeftRight, Settings, LogOut, Sparkles, LogIn } from 'lucide-react';
import { User as UserType } from '../types';

interface HeaderProps {
  currentUser: UserType;
  onOpenWallet: () => void;
  onToggleRole: (role: 'user' | 'host' | 'admin') => void;
  onOpenProfile: () => void;
}

export default function Header({ currentUser, onOpenWallet, onToggleRole, onOpenProfile }: HeaderProps) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  return (
    <header id="header-platform" className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/60 px-4 py-3 flex items-center justify-between">
      {/* Platform Title */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-emerald-500 p-[2px] flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)]">
          <div className="w-full h-full rounded-[10px] bg-zinc-950 flex items-center justify-center">
            <span className="font-sans font-black text-transparent bg-clip-text bg-gradient-to-tr from-violet-400 via-purple-400 to-emerald-400 text-lg leading-none tracking-tighter">LV</span>
          </div>
        </div>
        <div>
          <h1 className="font-sans font-bold text-sm tracking-tight text-white leading-none">
            LIVE<span className="text-emerald-400">PREMIUM</span>
          </h1>
          <p className="text-[9px] font-mono text-zinc-400 tracking-wider">MOBILE-FIRST LIVESTREAMS</p>
        </div>
      </div>

      {/* Stats and User Controls */}
      <div className="flex items-center gap-2.5">
        {/* Wallet Coins Summary Button */}
        <button
          id="btn-quick-wallet"
          onClick={onOpenWallet}
          className="flex items-center gap-1.5 bg-zinc-900/90 hover:bg-zinc-850/90 border border-zinc-800 rounded-full px-2.5 py-1 text-xs text-amber-400 transition-all font-mono hover:scale-105 select-none active:scale-95 cursor-pointer"
        >
          <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="font-bold">{currentUser.walletCoins}</span>
          <span className="text-[10px] text-zinc-400 font-sans border-l border-zinc-800 pl-1.5 pt-[1px] hover:text-amber-300">Recarregar</span>
        </button>

        {/* User Profile Trigger & Quick Swapping Option */}
        <div className="relative">
          <button
            id="btn-header-profile"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            style={{ contentVisibility: 'auto' }}
            className="flex items-center gap-1.5 focus:outline-none cursor-pointer"
          >
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.username}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border-2 border-violet-500 object-cover shadow-[0_0_10px_rgba(139,92,246,0.2)]"
              />
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-zinc-950 flex items-center justify-center text-[7px] font-bold text-white ${
                currentUser.role === 'admin' ? 'bg-red-500' : currentUser.role === 'host' ? 'bg-emerald-500' : 'bg-blue-500'
              }`}>
                {currentUser.role.charAt(0).toUpperCase()}
              </span>
            </div>
          </button>

          {/* Quick Swapping Dropdown */}
          {showRoleMenu && (
            <div className="absolute right-0 mt-2.5 w-64 rounded-2xl bg-zinc-900 border border-zinc-800 p-3 shadow-2xl z-50 animate-fade-in divide-y divide-zinc-855">
              <div className="pb-2.5 mb-2">
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Acessado como</p>
                <p className="font-semibold text-white text-sm mt-0.5 leading-tight">{currentUser.username}</p>
                <p className="text-zinc-400 text-xs mt-0.5">{currentUser.email}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    currentUser.role === 'admin' ? 'bg-red-950 text-red-400 border border-red-800/40' :
                    currentUser.role === 'host' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' :
                    'bg-zinc-820 text-zinc-300 border border-zinc-700/50'
                  }`}>
                    {currentUser.role === 'admin' ? '👑 Administrador' :
                     currentUser.role === 'host' ? '🎙️ Streamer Host' :
                     '👤 Membro / Fan'}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 font-bold">Nível {currentUser.level}</span>
                </div>
              </div>

              {/* Developer Testing Control - Fast Change User Mode */}
              {(() => {
                const isDevEnv = window.location.hostname.includes('localhost') || 
                                  window.location.hostname.includes('127.0.0.1') || 
                                  window.location.hostname.includes('ais-dev-');
                if (!isDevEnv) return null;
                return (
                  <div className="py-2 mb-2">
                    <p className="text-[10px] uppercase font-bold text-violet-400 tracking-wider mb-2 flex items-center gap-1">
                      <ArrowLeftRight className="w-3 h-3" /> ALTERNAR MODO DE TESTE
                    </p>
                    <p className="text-[10px] text-zinc-400 leading-normal mb-2.5">
                      Mude seu perfil instantaneamente no servidor para navegar em todos os painéis e recursos:
                    </p>
                    <div id="role-switches-container" className="grid grid-cols-1 gap-1.5">
                      <button
                        onClick={() => {
                          onToggleRole('user');
                          setShowRoleMenu(false);
                        }}
                        className={`flex items-center justify-between text-left px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                          currentUser.role === 'user' ? 'bg-blue-600 text-white font-bold' : 'bg-zinc-950 hover:bg-zinc-850 text-zinc-300'
                        }`}
                      >
                        <span>Fã Co-Produtor (Robson)</span>
                        {currentUser.role === 'user' && <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />}
                      </button>
                      <button
                        onClick={() => {
                          onToggleRole('host');
                          setShowRoleMenu(false);
                        }}
                        className={`flex items-center justify-between text-left px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                          currentUser.role === 'host' ? 'bg-emerald-600 text-white font-bold' : 'bg-zinc-950 hover:bg-zinc-850 text-zinc-300'
                        }`}
                      >
                        <span>Streamer Host (Lorena)</span>
                        {currentUser.role === 'host' && <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />}
                      </button>
                      <button
                        onClick={() => {
                          onToggleRole('admin');
                          setShowRoleMenu(false);
                        }}
                        className={`flex items-center justify-between text-left px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                          currentUser.role === 'admin' ? 'bg-red-600 text-white font-bold' : 'bg-zinc-950 hover:bg-zinc-850 text-zinc-300'
                        }`}
                      >
                        <span>Administrador Geral</span>
                        {currentUser.role === 'admin' && <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Action shortcuts */}
              <div className="pt-2 flex flex-col gap-1">
                <button
                  onClick={() => {
                    onOpenProfile();
                    setShowRoleMenu(false);
                  }}
                  className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" /> Meu Perfil Premium
                </button>
                <button
                  onClick={() => {
                    onOpenWallet();
                    setShowRoleMenu(false);
                  }}
                  className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5" /> Comprar Moedas PIX
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
