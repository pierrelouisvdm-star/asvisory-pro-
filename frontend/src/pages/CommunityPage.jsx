import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Globe2, Users, Crown, Linkedin, Building2, Loader2, Lock, Sparkles, Save,
} from 'lucide-react';
import { useSubscription } from '@/context/SubscriptionContext';
import { communityApi } from '@/services/api';
import { toast } from 'sonner';

const JURISDICTION_FLAG = { US: '🇺🇸', ZA: '🇿🇦' };

const MemberCard = ({ member }) => (
  <Card className={`bg-navy-900/60 border-navy-700 ${member.is_me ? 'ring-1 ring-amber-500/50' : ''}`}>
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15 text-lg flex-shrink-0">
            {JURISDICTION_FLAG[member.jurisdiction] || '🌍'}
          </div>
          <div>
            <p className="font-medium text-white flex items-center gap-2">
              {member.full_name}
              {member.is_me && (
                <Badge variant="outline" className="border-amber-500/50 text-amber-400 text-xs">You</Badge>
              )}
            </p>
            {member.company && (
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {member.company}
              </p>
            )}
          </div>
        </div>
        {member.linkedin_url && (
          <a
            href={member.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-blue-400 transition-colors flex-shrink-0"
            aria-label={`${member.full_name} on LinkedIn`}
          >
            <Linkedin className="h-4 w-4" />
          </a>
        )}
      </div>
      {member.specialty && (
        <Badge variant="outline" className="mt-3 border-navy-600 text-slate-300 text-xs">
          {member.specialty}
        </Badge>
      )}
      {member.bio && (
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">{member.bio}</p>
      )}
    </CardContent>
  </Card>
);

const CommunityPage = () => {
  const { subscription } = useSubscription();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ specialty: '', bio: '', linkedin_url: '' });
  const [saving, setSaving] = useState(false);

  const isFoundingMember = !!subscription.foundingMember;

  useEffect(() => {
    if (subscription.loading || !isFoundingMember) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const [membersRes, profileRes] = await Promise.all([
          communityApi.getMembers(),
          communityApi.getMyProfile(),
        ]);
        setMembers(membersRes.members || []);
        setForm({
          specialty: profileRes.specialty || '',
          bio: profileRes.bio || '',
          linkedin_url: profileRes.linkedin_url || '',
        });
      } catch (err) {
        console.error('Failed to load community directory:', err);
        setError('Could not load the member directory. Please try again shortly.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [subscription.loading, isFoundingMember]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await communityApi.updateMyProfile(form);
      setMembers((prev) =>
        prev.map((m) => (m.is_me ? { ...m, ...form } : m))
      );
      toast.success('Your directory profile has been updated');
    } catch (err) {
      console.error('Failed to save community profile:', err);
      toast.error('Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (subscription.loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!isFoundingMember) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6" data-testid="community-locked">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 mx-auto">
          <Lock className="h-7 w-7 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Founding Member Community</h1>
        <p className="text-slate-400">
          This global network of top financial advisors is exclusive to our first 150 founding
          members across South Africa and the USA. Lock in founding pricing to join.
        </p>
        <Link to="/pricing">
          <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
            <Crown className="h-4 w-4 mr-2" />
            View Founding Member Pricing
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="community-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Globe2 className="h-7 w-7 text-amber-400" />
            Founding Member Community
          </h1>
          <p className="text-slate-400 mt-1">
            A global network of the first 150 financial advisors from South Africa and the USA
          </p>
        </div>
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
          <Users className="h-3 w-3 mr-1" />
          {members.length} member{members.length === 1 ? '' : 's'}
        </Badge>
      </div>

      {/* My Profile */}
      <Card className="bg-navy-900/60 border-navy-700">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            Your Directory Profile
          </CardTitle>
          <CardDescription>
            Tell other founding members what you specialize in — this is shown in the directory below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="specialty">Specialty</Label>
              <Input
                id="specialty"
                placeholder="e.g. Retirement planning for small business owners"
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                placeholder="https://linkedin.com/in/yourname"
                value={form.linkedin_url}
                onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                maxLength={300}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="A few sentences about your practice and what you'd like to connect on"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              maxLength={500}
              rows={3}
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Directory */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Member Directory
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 text-amber-400 animate-spin" />
          </div>
        ) : error ? (
          <Card className="bg-navy-900/60 border-navy-700">
            <CardContent className="p-6 text-center text-slate-400">{error}</CardContent>
          </Card>
        ) : members.length === 0 ? (
          <Card className="bg-navy-900/60 border-navy-700">
            <CardContent className="p-8 text-center text-slate-400">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>You're one of the first founding members — the directory will grow as more join.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <MemberCard key={member.user_id} member={member} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
