import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Home, Wallet, ShieldCheck, Mail,
  Users, FileText, Palette,
} from 'lucide-react';

// Bottom tab bar shown only on mobile (< md) for authenticated users.
// Item set is role-aware:
//   individual  → Home · My Money · IRP5 · Digest
//   advisor     → Home · Clients · Reports · Branding
export const MobileBottomNav = () => {
  const { isAuthenticated, isAdvisor, isIndividual, user } = useAuth();
  const { pathname } = useLocation();

  if (!isAuthenticated) return null;
  // Don't show while the role picker modal is up (user has no role yet).
  if (user && !user.role && !user.is_admin) return null;

  const items = isAdvisor
    ? [
        { to: '/', label: 'Home', icon: Home },
        { to: '/clients', label: 'Clients', icon: Users },
        { to: '/report-builder', label: 'Reports', icon: FileText },
        { to: '/branding-settings', label: 'Brand', icon: Palette },
      ]
    : isIndividual
    ? [
        { to: '/', label: 'Home', icon: Home },
        { to: '/my-money', label: 'My Money', icon: Wallet },
        { to: '/irp5-vault', label: 'IRP5', icon: ShieldCheck },
        { to: '/my-money?digest=1', label: 'Digest', icon: Mail, match: '/my-money' },
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
                className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 min-h-[56px] touch-manipulation transition-colors ${
                  active ? 'text-emerald-400' : 'text-slate-400 hover:text-white active:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-emerald-400' : ''}`} />
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
