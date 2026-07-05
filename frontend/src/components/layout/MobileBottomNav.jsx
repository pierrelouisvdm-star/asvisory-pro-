import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import {
  Home, Wallet, ShieldCheck, Mail,
  Users, FileText, Palette,
} from 'lucide-react';

const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? window.location.origin
  : process.env.REACT_APP_BACKEND_URL;

// Bottom tab bar shown only on mobile (< md) for authenticated users.
// Item set is role-aware:
//   individual  → Home · My Money · IRP5 · Digest (with "new" red dot)
//   advisor     → Home · Clients · Reports · Branding
export const MobileBottomNav = () => {
  const { isAuthenticated, isAdvisor, isIndividual, user, token } = useAuth();
  const { pathname } = useLocation();
  const [digestAvailable, setDigestAvailable] = useState(false);
  const [staleClientsCount, setStaleClientsCount] = useState(0);

  // Ping digest status for individuals so we can show the badge.
  useEffect(() => {
    let cancelled = false;
    if (!token || !isIndividual) {
      setDigestAvailable(false);
      return;
    }
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/api/me/digest/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) setDigestAvailable(!!res.data?.available);
      } catch {
        // Silent fail — badge is a nice-to-have.
      }
    })();
    return () => { cancelled = true; };
  }, [token, isIndividual, pathname]);

  // Ping stale-client count for advisors so we can show the Clients badge.
  useEffect(() => {
    let cancelled = false;
    if (!token || !isAdvisor) {
      setStaleClientsCount(0);
      return;
    }
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/api/smart-suggestions/stale-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) setStaleClientsCount(Number(res.data?.stale_count) || 0);
      } catch {
        // Silent fail — badge is a nice-to-have.
      }
    })();
    return () => { cancelled = true; };
  }, [token, isAdvisor, pathname]);

  if (!isAuthenticated) return null;
  // Don't show while the role picker modal is up (user has no role yet).
  if (user && !user.role && !user.is_admin) return null;

  const items = isAdvisor
    ? [
        { to: '/', label: 'Home', icon: Home },
        { to: '/clients', label: 'Clients', icon: Users, badge: staleClientsCount > 0, badgeCount: staleClientsCount },
        { to: '/report-builder', label: 'Reports', icon: FileText },
        { to: '/branding-settings', label: 'Brand', icon: Palette },
      ]
    : isIndividual
    ? [
        { to: '/', label: 'Home', icon: Home },
        { to: '/my-money', label: 'My Money', icon: Wallet },
        { to: '/irp5-vault', label: 'IRP5', icon: ShieldCheck },
        { to: '/my-money?digest=1', label: 'Digest', icon: Mail, match: '/my-money', badge: digestAvailable },
      ]
    : [
        // Admins or role-less users get the neutral set
        { to: '/', label: 'Home', icon: Home },
        { to: '/pricing', label: 'Pricing', icon: Wallet },
      ];

  const isActive = (item) => {
    const target = item.match || item.to.split('?')[0];
    if (target === '/') return pathname === '/';
    return pathname === target || pathname.startsWith(target + '/');
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-navy-950/95 backdrop-blur border-t border-navy-700 pb-[env(safe-area-inset-bottom)]"
      data-testid="mobile-bottom-nav"
      aria-label="Mobile navigation"
    >
      <ul className="flex justify-around items-stretch">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to}
                data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-2 px-1 min-h-[56px] touch-manipulation transition-colors ${
                  active ? 'text-emerald-400' : 'text-slate-400 hover:text-white active:text-white'
                }`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 ${active ? 'text-emerald-400' : ''}`} />
                  {item.badge && item.badgeCount > 0 && (
                    <span
                      className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold leading-none ring-2 ring-navy-950"
                      data-testid={`mobile-nav-${item.label.toLowerCase()}-badge`}
                      aria-label={`${item.badgeCount} needs attention`}
                    >
                      {item.badgeCount > 9 ? '9+' : item.badgeCount}
                    </span>
                  )}
                  {item.badge && !item.badgeCount && (
                    <span
                      className="absolute -top-1 -right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-navy-950 animate-pulse"
                      data-testid={`mobile-nav-${item.label.toLowerCase()}-badge`}
                      aria-label="New"
                    />
                  )}
                </div>
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
                {active && (
                  <span className="mt-0.5 h-0.5 w-6 rounded-full bg-emerald-400" aria-hidden="true" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
