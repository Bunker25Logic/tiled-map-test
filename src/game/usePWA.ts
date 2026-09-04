import { useState, useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: ReadonlyArray<string>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

// Valores derivados do ambiente — calculados uma única vez, fora do ciclo React,
// pois navigator.userAgent e window.matchMedia não mudam durante a sessão.
function detectEnv() {
  const ua = navigator.userAgent;
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    window.innerWidth <= 768;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) &&
    !(window as unknown as { MSStream: unknown }).MSStream;
  const isInstalled =
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  return { isMobile, isIOS, isInstalled };
}

export function usePWA() {
  // Inicialização lazy: detectEnv() roda apenas na primeira renderização,
  // sem useEffect — elimina o setState síncrono dentro de effect.
  const [isMobile] = useState(() => detectEnv().isMobile);
  const [isIOS] = useState(() => detectEnv().isIOS);
  const [isInstalled, setIsInstalled] = useState(() => detectEnv().isInstalled);
  const [canInstall, setCanInstall] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('[PWA] Service Worker registrado:', r);
    },
    onRegisterError(error: unknown) {
      console.error('[PWA] Erro ao registrar SW:', error);
    },
    onNeedRefresh() {
      console.log('[PWA] Nova versão disponível!');
    },
  });

  useEffect(() => {
    // Captura o prompt de instalação (Android/Chrome)
    const handleInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setCanInstall(true);
    };

    // Detecta quando o app foi instalado com sucesso
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      deferredPrompt.current = null;
      console.log('[PWA] App instalado com sucesso!');
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt.current) return false;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setCanInstall(false);
      return true;
    }
    return false;
  };

  const applyUpdate = () => {
    updateServiceWorker(true);
  };

  // Mostra modal de instalação quando: mobile E não instalado
  const showInstallModal = isMobile && !isInstalled;

  return {
    isInstalled,
    isMobile,
    isIOS,
    canInstall,
    needRefresh,
    showInstallModal,
    promptInstall,
    applyUpdate,
  };
}
