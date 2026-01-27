import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { reviewsApi, clientsApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CalendarCheck, Plus, ArrowLeft, Clock, Bell, 
  CheckCircle2, Calendar, AlertTriangle, ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const frequencyLabels = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semi_annual: 'Semi-Annual',
  annual: 'Annual',
};

const defaultChecklist = [
  "Review investment performance",
  "Update risk profile",
  "Check insurance coverage",
  "Review goals progress",
  "Update financial data",
  "Discuss life changes",
  "Review fees and costs",
  "Update beneficiaries"
];

export const ReviewTrackerPage = () => {
  const { clientId } = useParams();
  const { isAuthenticated } = useAuth();
  const [client, setClient] = useState(null);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [setupData, setSetupData] = useState({
    frequency: 'annual',
    next_review_date: '',
    checklist: [...defaultChecklist],
    reminder_days_before: 14,
    notes: '',
  });

  const [newChecklistItem, setNewChecklistItem] = useState('');

  useEffect(() => {
    if (isAuthenticated && clientId) {
      fetchData();
    }
  }, [isAuthenticated, clientId]);

  const fetchData = async () => {
    try {
      const clientData = await clientsApi.getById(clientId);
      setClient(clientData);
      
      try {
        const reviewData = await reviewsApi.getByClient(clientId);
        setReview(reviewData);
        setSetupData({
          frequency: reviewData.frequency || 'annual',
          next_review_date: reviewData.next_review_date || '',
          checklist: reviewData.checklist || [...defaultChecklist],
          reminder_days_before: reviewData.reminder_days_before || 14,
          notes: reviewData.notes || '',
        });
      } catch {
        // No review schedule exists yet
        setReview(null);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setSetupData({
      ...setupData,
      checklist: [...setupData.checklist, newChecklistItem.trim()],
    });
    setNewChecklistItem('');
  };

  const removeChecklistItem = (index) => {
    setSetupData({
      ...setupData,
      checklist: setupData.checklist.filter((_, i) => i !== index),
    });
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const reviewData = {
        client_id: clientId,
        frequency: setupData.frequency,
        next_review_date: setupData.next_review_date,
        checklist: setupData.checklist,
        reminder_days_before: parseInt(setupData.reminder_days_before) || 14,
        notes: setupData.notes,
      };
      
      const created = await reviewsApi.create(reviewData);
      setReview(created);
      setIsSetupOpen(false);
      toast.success('Review schedule saved!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getDaysUntilReview = () => {
    if (!review?.next_review_date) return null;
    const today = new Date();
    const nextReview = new Date(review.next_review_date);
    const diffTime = nextReview - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntil = getDaysUntilReview();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950" data-testid="review-tracker-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to={`/clients/${clientId}`} className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to {client?.first_name}&apos;s Profile
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Review Schedule
              </h1>
              <p className="text-slate-500 mt-1">
                Manage periodic reviews for {client?.first_name}
              </p>
            </div>

            <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
              <DialogTrigger asChild>
                <Button className="btn-premium" data-testid="setup-review-btn">
                  {review ? 'Edit Schedule' : 'Setup Schedule'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {review ? 'Edit Review Schedule' : 'Setup Review Schedule'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveReview}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Review Frequency</Label>
                        <Select 
                          value={setupData.frequency} 
                          onValueChange={(v) => setSetupData({...setupData, frequency: v})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                            <SelectItem value="annual">Annual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Next Review Date *</Label>
                        <Input
                          type="date"
                          value={setupData.next_review_date}
                          onChange={(e) => setSetupData({...setupData, next_review_date: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Reminder Days Before</Label>
                      <Input
                        type="number"
                        value={setupData.reminder_days_before}
                        onChange={(e) => setSetupData({...setupData, reminder_days_before: e.target.value})}
                        min={1}
                        max={60}
                      />
                    </div>

                    <div>
                      <Label>Review Checklist</Label>
                      <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                        {setupData.checklist.map((item, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded">
                            <ClipboardList className="h-4 w-4 text-emerald-500 shrink-0" />
                            <span className="flex-1 text-sm">{item}</span>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeChecklistItem(index)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Input
                          placeholder="Add checklist item..."
                          value={newChecklistItem}
                          onChange={(e) => setNewChecklistItem(e.target.value)}
                          className="flex-1"
                        />
                        <Button type="button" variant="outline" onClick={addChecklistItem}>
                          Add
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={setupData.notes}
                        onChange={(e) => setSetupData({...setupData, notes: e.target.value})}
                        placeholder="Any additional notes..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsSetupOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Saving...' : 'Save Schedule'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Content */}
        {!review ? (
          <Card className="text-center py-12">
            <CardContent>
              <CalendarCheck className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <h3 className="font-semibold text-lg mb-2">No review schedule set</h3>
              <p className="text-slate-500 mb-4">Set up a periodic review schedule to stay on top of client reviews</p>
              <Button onClick={() => setIsSetupOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Setup Schedule
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Next Review Card */}
            <Card className={cn(
              "border-l-4",
              daysUntil !== null && daysUntil <= 7 ? "border-l-red-500" :
              daysUntil !== null && daysUntil <= 14 ? "border-l-amber-500" :
              "border-l-emerald-500"
            )}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-xl",
                      daysUntil !== null && daysUntil <= 7 ? "bg-red-100 dark:bg-red-900/20" :
                      daysUntil !== null && daysUntil <= 14 ? "bg-amber-100 dark:bg-amber-900/20" :
                      "bg-emerald-100 dark:bg-emerald-900/20"
                    )}>
                      <Calendar className={cn(
                        "h-7 w-7",
                        daysUntil !== null && daysUntil <= 7 ? "text-red-600" :
                        daysUntil !== null && daysUntil <= 14 ? "text-amber-600" :
                        "text-emerald-600"
                      )} />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                        Next Review
                      </h3>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                        {new Date(review.next_review_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {daysUntil !== null && (
                      <Badge className={cn(
                        "text-lg px-4 py-2",
                        daysUntil <= 0 ? "bg-red-100 text-red-700" :
                        daysUntil <= 7 ? "bg-amber-100 text-amber-700" :
                        "bg-emerald-100 text-emerald-700"
                      )}>
                        {daysUntil <= 0 ? 'Overdue!' : `${daysUntil} days`}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-slate-500" />
                    Schedule Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Frequency</span>
                    <span className="font-semibold">
                      {frequencyLabels[review.frequency] || review.frequency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reminder</span>
                    <span className="font-semibold">
                      {review.reminder_days_before} days before
                    </span>
                  </div>
                  {review.last_review_date && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Last Review</span>
                      <span className="font-semibold">
                        {new Date(review.last_review_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {review.notes && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-slate-500 italic">{review.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Checklist */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-slate-500" />
                    Review Checklist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {review.checklist?.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex h-5 w-5 items-center justify-center rounded border border-slate-300">
                          <CheckCircle2 className="h-4 w-4 text-slate-300" />
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reminder Info */}
            {daysUntil !== null && daysUntil <= review.reminder_days_before && daysUntil > 0 && (
              <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-semibold text-amber-800 dark:text-amber-400">
                        Review Reminder
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-500">
                        The scheduled review for {client?.first_name} is coming up in {daysUntil} days. 
                        Consider reaching out to schedule the meeting.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
