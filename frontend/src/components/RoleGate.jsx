import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

/**
 * Restricts a route to a specific role.
 * <RoleGate role="advisor"> ...advisor-only content... </RoleGate>
 *
 * - Admins bypass the gate.
 * - Users with no role yet see a soft fallback (the RoleSelectionModal will be open anyway).
 */
export const RoleGate = ({ role, children }) => {
  const { user, isAdvisor, isIndividual } = useAuth();

  if (user?.is_admin) return children;
  if (role === 'advisor' && isAdvisor) return children;
  if (role === 'individual' && isIndividual) return children;

  const otherRole = role === 'advisor' ? 'Financial Advisor' : 'Individual';

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4" data-testid="role-gate-blocker">
      <Card className="max-w-md w-full bg-navy-900 border-navy-700">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
            <Lock className="h-8 w-8 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">{otherRole}s only</h2>
          <p className="text-slate-400 mb-6">
            This area is built for {otherRole.toLowerCase()}s. Your workspace is set to{' '}
            <strong>{isAdvisor ? 'Advisor' : isIndividual ? 'Individual' : 'unset'}</strong>.
          </p>
          <Link to="/">
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-navy-950">
              Back to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleGate;
