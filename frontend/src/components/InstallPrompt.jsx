import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Share, SquarePlus } from 'lucide-react';

const DISMISS_KEY = 'advisorypro_install_prompt_dismissed_at';
const DISMISS_DAYS = 14;

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

const isIOS = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

const wasRecentlyDismissed = () => {
  const dismissedAt = localStorage.getItem(DISMISS_KEY);
  if (!dismissedAt) return false;
  const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
  return daysSince < DISMISS_DAYS;
};

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState(null); // 'android' | 'ios'

  useEffect(() => {
    if (isStandalone() || wasRecentlyDismissed()) return;
    if (window.innerWidth >= 768) return; // phones only

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform('android');
      setTimeout(() => setVisible(true), 3000);
    };

    const handleAppInstalled = () => {
      setVisible(false);
      localStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // iOS never fires beforeinstallprompt — show manual instructions instead.
    let iosTimer;
    if (isIOS()) {
      iosTimer = setTimeout(() => {
        setPlatform('ios');
        setVisible(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
    if (outcome !== 'accepted') {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
  };

  if (!visible || !platform) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl border border-navy-700 bg-navy-900 shadow-2xl sm:hidden"
      data-testid="install-prompt"
    >
      <div className="flex items-start gap-3 p-4">
        <img
          src="/icons/icon-192.png"
          alt="AdvisoryPro"
          className="h-11 w-11 flex-shrink-0 rounded-xl"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Install AdvisoryPro</p>
          {platform === 'android' ? (
            <p className="text-xs text-slate-400 mt-0.5">
              Add it to your home screen for quick, full-screen access.
            </p>
          ) : (
            <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-1">
              Tap <Share className="h-3.5 w-3.5 inline text-slate-300" /> then
              <span className="inline-flex items-center gap-1 text-slate-300">
                "Add to Home Screen" <SquarePlus className="h-3.5 w-3.5" />
              </span>
            </p>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="flex-shrink-0 text-slate-500 hover:text-slate-300 -mt-1 -mr-1 p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {platform === 'android' && (
        <div className="px-4 pb-4">
          <Button
            onClick={handleInstall}
            className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
            data-testid="install-prompt-btn"
          >
            <Download className="h-4 w-4 mr-2" />
            Add to Home Screen
          </Button>
        </div>
      )}
    </div>
  );
};

export default InstallPrompt;
