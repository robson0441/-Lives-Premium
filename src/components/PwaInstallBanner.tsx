import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Share, X, CheckCircle, HelpCircle, ArrowRight, Sparkles } from 'lucide-react';

interface PwaInstallBannerProps {
  onNotify: (text: string, type: 'success' | 'alert' | 'info') => void;
}

export default function PwaInstallBanner({ onNotify }: PwaInstallBannerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('android');
  const [showStepModal, setShowStepModal] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check if already in standalone install mode
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      const alreadyInstalled = isStandaloneMedia || isIOSStandalone;
      setIsStandalone(alreadyInstalled);
      
      // If already installed, don't show prompt
      if (alreadyInstalled) {
        setShowBanner(false);
      }
    };

    checkStandalone();

    // 2. Identify client device type
    const detectDevice = () => {
      const ua = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        setDeviceType('ios');
      } else if (/android/.test(ua)) {
        setDeviceType('android');
      } else {
        setDeviceType('desktop');
      }
    };
    detectDevice();

    // 3. Listen for standard PWA prompt event
    const handleBeforeInstall = (e: Event) => {
      // Prevent standard browser bar prompt behavior
      e.preventDefault();
      // Save event so we can trigger it later
      setDeferredPrompt(e);
      
      // Only show banner if not already running in standalone and has not been closed this session
      const isDismissed = sessionStorage.getItem('pwa-prompt-dismissed') === 'true';
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      if (!isDismissed && !isInstalled) {
        // Show banner immediately with nice delay animation
        setTimeout(() => setShowBanner(true), 1500);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // iOS specific detection: iOS does not trigger beforeinstallprompt.
    // We show a custom prompt for iOS after a slight delay if not dismissed.
    const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isDismissed = sessionStorage.getItem('pwa-prompt-dismissed') === 'true';
    if (isIOS && !isIOSStandalone && !isDismissed) {
      setTimeout(() => setShowBanner(true), 2500);
    }

    // Listen for custom trigger event (e.g. from Profile page buttons)
    const handleTrigger = () => {
      setShowStepModal(true);
    };
    window.addEventListener('pwa-install-trigger', handleTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('pwa-install-trigger', handleTrigger);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deviceType === 'ios') {
      // iOS doesn't support automatic prompt, show visual wizard
      setShowStepModal(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback if event is gone, show the direct info modal
      setShowStepModal(true);
      return;
    }

    // Trigger standard native installation dialog
    deferredPrompt.prompt();

    // Await user approval
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install request: ${outcome}`);

    if (outcome === 'accepted') {
      onNotify('Instalação iniciada! Seja bem-vindo à experiência de App Nativo. 🚀👑', 'success');
      setIsStandalone(true);
      setShowBanner(false);
    } else {
      onNotify('Instalação cancelada. Você pode instalar mais tarde pelo perfil!', 'info');
    }

    setDeferredPrompt(null);
  };

  const dismissBanner = () => {
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
    setShowBanner(false);
  };

  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Dynamic Floating PWA Install Bottom Bar Banner */}
      {showBanner && (
        <div 
          id="pwa-floating-bar" 
          className="fixed bottom-18 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-zinc-900/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(16,185,129,0.15)] animate-fade-in flex items-center justify-between gap-3"
          style={{ contentVisibility: 'auto' }}
        >
          {/* Visual Logo Container with micro neon glow */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-emerald-500 p-[1.5px] shrink-0 flex items-center justify-center">
            <div className="w-full h-full rounded-[9px] bg-zinc-950 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider leading-none flex items-center gap-1">
              Live Premium Web App <span className="bg-emerald-500/20 text-emerald-400 text-[8px] font-mono px-1 rounded">PRO</span>
            </h4>
            <p className="text-[11px] text-zinc-350 mt-1 leading-snug truncate">
              {deviceType === 'ios' 
                ? 'Instale sem ocupar memória no seu iPhone!' 
                : 'Instalar em segundos na tela do seu celular!'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-md shadow-emerald-950"
            >
              <Download className="w-3 h-3" /> Instalar
            </button>
            <button
              onClick={dismissBanner}
              className="p-1.5 text-zinc-500 hover:text-zinc-350 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="Fechar lembrete"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Manual Guided Wizard Modal for Native Installation (Essential for iOS Safari) */}
      {showStepModal && (
        <div id="pwa-guide-modal" className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-sm w-full p-6 relative space-y-5 text-center shadow-3xl">
            
            <button
              onClick={() => setShowStepModal(false)}
              className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-820 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title with dynamic phone preview */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-emerald-500 p-[2px] flex items-center justify-center shadow-lg">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-sans font-black text-white uppercase tracking-wider">Como Instalar no seu Aparelho</h3>
                <p className="text-[10px] text-zinc-400 mt-1">Siga o passo a passo simples abaixo para habilitar o aplicativo nativo premium</p>
              </div>
            </div>

            {/* iOS specific visual wizard steps */}
            {deviceType === 'ios' ? (
              <div className="space-y-3.5 text-left text-xs bg-zinc-950 p-4 rounded-2xl border border-zinc-850">
                <p className="text-[10px] uppercase text-emerald-400 font-extrabold tracking-widest text-center mb-1">📱 Guia para iPhone / iPad OS</p>
                
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">1</div>
                  <p className="text-zinc-300">Abra o navegador oficial da <span className="font-bold text-white">Safari</span> para visitar este site.</p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">2</div>
                  <p className="text-zinc-300 flex items-center gap-1.5 flex-wrap">
                    Clique no botão de <span className="font-extrabold text-white">Compartilhar</span> 
                    <span className="p-1 bg-zinc-900 rounded border border-zinc-800 inline-block"><Share className="w-3.5 h-3.5 text-blue-400" /></span> na barra de navegação do Safari (embaixo ou em cima).
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">3</div>
                  <p className="text-zinc-300">
                    Role as opções e clique em <span className="font-extrabold text-white">"Adicionar à Tela de Início"</span> ou <span className="font-extrabold text-white">"Add to Home Screen"</span>.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">4</div>
                  <p className="text-zinc-300">
                    Clique em <span className="font-bold text-emerald-400">Adicionar</span> no canto superior direito. Um ícone elegante será fixado na sua tela inicial!
                  </p>
                </div>
              </div>
            ) : (
              // Android, Chrome, or Windows guide steps
              <div className="space-y-3.5 text-left text-xs bg-zinc-950 p-4 rounded-2xl border border-zinc-850">
                <p className="text-[10px] uppercase text-emerald-400 font-extrabold tracking-widest text-center mb-1">🤖 Guia para Android / Chrome / Computador</p>
                
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">1</div>
                  <p className="text-zinc-300">Clique nas <span className="font-bold text-white">Configurações (três pontinhos)</span> do navegador no canto superior direito.</p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">2</div>
                  <p className="text-zinc-300">Selecione <span className="font-extrabold text-white">"Instalar Aplicativo"</span> ou <span className="font-extrabold text-white">"Adicionar à tela inicial"</span>.</p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">3</div>
                  <p className="text-zinc-300">Confirme o diálogo na tela e o aplicativo será instalado instantaneamente sem consumir dados de armazenamento ou memória ram!</p>
                </div>
              </div>
            )}

            {/* Premium feature highlight list */}
            <div className="flex justify-around text-center text-[10px] font-bold text-zinc-500 py-1 uppercase tracking-widest leading-none border-t border-zinc-800 pt-4">
              <span className="flex flex-col gap-1 items-center"><CheckCircle className="w-4 h-4 text-emerald-500" /> Sem Downloads</span>
              <span className="flex flex-col gap-1 items-center"><CheckCircle className="w-4 h-4 text-emerald-500" /> Carregamento 5x Rápido</span>
              <span className="flex flex-col gap-1 items-center"><CheckCircle className="w-4 h-4 text-emerald-500" /> Seguro</span>
            </div>

            <button
              onClick={() => setShowStepModal(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-950 uppercase tracking-wider"
            >
              Entendi, Obrigado! 👍
            </button>
          </div>
        </div>
      )}
    </>
  );
}
