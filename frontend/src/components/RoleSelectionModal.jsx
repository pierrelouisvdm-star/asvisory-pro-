import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { User, Briefcase, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

// Shown when an authenticated user has not yet picked a role.
// One-time, locked-in choice.
export const RoleSelectionModal = () => {
  const { needsRoleSelection, setRole } = useAuth();
  const [picked, setPicked] = useState(null);
  const [saving, setSaving] = useState(false);

  if (!needsRoleSelection) return null;

  const submit = async () => {
    if (!picked) return;
    setSaving(true);
    try {
      await setRole(picked);
      toast.success(`Welcome! Your workspace is set up for ${picked === 'advisor' ? 'financial advisors' : 'individuals'}.`);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not save your selection');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent
        data-testid="role-selection-modal"
        className="max-w-2xl bg-navy-900 border-navy-700 [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Welcome — who are you?</DialogTitle>
          <DialogDescription className="text-slate-400">
            Pick the workspace that fits you. This sets up the right tools and pricing.
            <span className="block mt-1 text-xs text-amber-400">
              Note: this choice is locked in afterwards.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <RoleCard
            testid="role-card-individual"
            active={picked === 'individual'}
            onClick={() => setPicked('individual')}
            icon={User}
            title="I'm an Individual"
            subtitle="Manage my own money"
            bullets={[
              'TFSA, RA & retirement planning',
              'Budget, debt & net worth tools',
              'AI document reader for personal statements',
              'Tax planning for 2026/27',
            ]}
            price="R299/mo  ·  R1,499/yr"
          />
          <RoleCard
            testid="role-card-advisor"
            active={picked === 'advisor'}
            onClick={() => setPicked('advisor')}
            icon={Briefcase}
            title="I'm a Financial Advisor"
            subtitle="AI copilot for my practice"
            bullets={[
              'Client CRM & meeting tracker',
              'AI Client Report Builder (branded PDFs)',
              'Multi-document portfolio review',
              'Compliance notes & advisor analytics',
            ]}
            price="R999/mo  ·  R6,999/yr"
          />
        </div>

        <div className="flex justify-end mt-6">
          <Button
            data-testid="role-confirm-btn"
            onClick={submit}
            disabled={!picked || saving}
            size="lg"
            className="bg-emerald-500 hover:bg-emerald-400 text-navy-950"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Continue {!saving && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const RoleCard = ({ testid, active, onClick, icon: Icon, title, subtitle, bullets, price }) => (
  <button
    type="button"
    data-testid={testid}
    onClick={onClick}
    className={`text-left p-5 rounded-xl border-2 transition-all ${
      active
        ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
        : 'border-navy-700 bg-navy-800/40 hover:border-emerald-500/50'
    }`}
  >
    <div className="flex items-center justify-between mb-3">
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${active ? 'bg-emerald-500 text-navy-950' : 'bg-navy-700 text-emerald-400'}`}>
        <Icon className="h-6 w-6" />
      </div>
      {active && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
    </div>
    <div className="text-lg font-semibold text-white">{title}</div>
    <div className="text-xs text-slate-400 mb-3">{subtitle}</div>
    <ul className="space-y-1 text-sm text-slate-300 mb-3">
      {bullets.map((b, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="text-emerald-400 mt-1">•</span>
          {b}
        </li>
      ))}
    </ul>
    <div className="text-xs font-medium text-emerald-400 pt-2 border-t border-navy-700">{price}</div>
  </button>
);

export default RoleSelectionModal;
