import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { meetingsApi, clientsApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Calendar, Plus, ArrowLeft, Clock, Users, FileText,
  CheckCircle2, Circle, AlertCircle, Video, Phone, Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const meetingTypeIcons = {
  initial: Building2,
  review: FileText,
  planning: Calendar,
  followup: Clock,
  phone: Phone,
  other: Video,
};

const meetingTypeColors = {
  initial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  review: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  planning: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  followup: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  phone: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400',
  other: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
};

const actionStatusColors = {
  pending: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

export const MeetingSchedulerPage = () => {
  const { clientId } = useParams();
  const { isAuthenticated } = useAuth();
  const [client, setClient] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newMeeting, setNewMeeting] = useState({
    meeting_type: 'review',
    meeting_date: new Date().toISOString().split('T')[0],
    duration_minutes: 60,
    attendees: '',
    summary: '',
    discussion_points: '',
    action_items: [],
    next_meeting_date: '',
  });

  const [newActionItem, setNewActionItem] = useState({
    description: '',
    due_date: '',
    assigned_to: 'advisor',
  });

  useEffect(() => {
    if (isAuthenticated && clientId) {
      fetchData();
    }
  }, [isAuthenticated, clientId]);

  const fetchData = async () => {
    try {
      const [clientData, meetingsData] = await Promise.all([
        clientsApi.getById(clientId),
        meetingsApi.getByClient(clientId),
      ]);
      setClient(clientData);
      setMeetings(meetingsData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addActionItem = () => {
    if (!newActionItem.description.trim()) return;
    setNewMeeting({
      ...newMeeting,
      action_items: [...newMeeting.action_items, { ...newActionItem, status: 'pending' }],
    });
    setNewActionItem({ description: '', due_date: '', assigned_to: 'advisor' });
  };

  const removeActionItem = (index) => {
    setNewMeeting({
      ...newMeeting,
      action_items: newMeeting.action_items.filter((_, i) => i !== index),
    });
  };

  const handleAddMeeting = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const meetingData = {
        client_id: clientId,
        meeting_type: newMeeting.meeting_type,
        meeting_date: newMeeting.meeting_date,
        duration_minutes: parseInt(newMeeting.duration_minutes) || 60,
        attendees: newMeeting.attendees.split(',').map(a => a.trim()).filter(Boolean),
        summary: newMeeting.summary,
        discussion_points: newMeeting.discussion_points.split('\n').filter(Boolean),
        action_items: newMeeting.action_items,
        next_meeting_date: newMeeting.next_meeting_date || null,
      };
      
      const created = await meetingsApi.create(meetingData);
      setMeetings([created, ...meetings]);
      setNewMeeting({
        meeting_type: 'review',
        meeting_date: new Date().toISOString().split('T')[0],
        duration_minutes: 60,
        attendees: '',
        summary: '',
        discussion_points: '',
        action_items: [],
        next_meeting_date: '',
      });
      setIsAddOpen(false);
      toast.success('Meeting note created!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950" data-testid="meeting-scheduler-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to={`/clients/${clientId}`} className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to {client?.first_name}'s Profile
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Meeting Notes
              </h1>
              <p className="text-slate-500 mt-1">
                Track meetings and action items for {client?.first_name}
              </p>
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="btn-premium" data-testid="add-meeting-btn">
                  <Plus className="h-4 w-4 mr-2" />
                  New Meeting
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Record Meeting Notes</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddMeeting}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Meeting Type</Label>
                        <Select 
                          value={newMeeting.meeting_type} 
                          onValueChange={(v) => setNewMeeting({...newMeeting, meeting_type: v})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="initial">Initial Consultation</SelectItem>
                            <SelectItem value="review">Annual Review</SelectItem>
                            <SelectItem value="planning">Planning Session</SelectItem>
                            <SelectItem value="followup">Follow-up</SelectItem>
                            <SelectItem value="phone">Phone Call</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={newMeeting.meeting_date}
                          onChange={(e) => setNewMeeting({...newMeeting, meeting_date: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Duration (mins)</Label>
                        <Input
                          type="number"
                          value={newMeeting.duration_minutes}
                          onChange={(e) => setNewMeeting({...newMeeting, duration_minutes: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Next Meeting Date</Label>
                        <Input
                          type="date"
                          value={newMeeting.next_meeting_date}
                          onChange={(e) => setNewMeeting({...newMeeting, next_meeting_date: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Attendees (comma-separated)</Label>
                      <Input
                        value={newMeeting.attendees}
                        onChange={(e) => setNewMeeting({...newMeeting, attendees: e.target.value})}
                        placeholder="John, Sarah, Mike"
                      />
                    </div>

                    <div>
                      <Label>Meeting Summary *</Label>
                      <Textarea
                        value={newMeeting.summary}
                        onChange={(e) => setNewMeeting({...newMeeting, summary: e.target.value})}
                        placeholder="Brief summary of the meeting..."
                        required
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Discussion Points (one per line)</Label>
                      <Textarea
                        value={newMeeting.discussion_points}
                        onChange={(e) => setNewMeeting({...newMeeting, discussion_points: e.target.value})}
                        placeholder="Topics discussed..."
                        rows={3}
                      />
                    </div>

                    {/* Action Items */}
                    <div>
                      <Label>Action Items</Label>
                      <div className="space-y-2 mt-2">
                        {newMeeting.action_items.map((item, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded">
                            <Circle className="h-4 w-4 text-amber-500" />
                            <span className="flex-1 text-sm">{item.description}</span>
                            <Badge variant="outline" className="text-xs">{item.assigned_to}</Badge>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeActionItem(index)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                        
                        <div className="flex gap-2 mt-2">
                          <Input
                            placeholder="Action item..."
                            value={newActionItem.description}
                            onChange={(e) => setNewActionItem({...newActionItem, description: e.target.value})}
                            className="flex-1"
                          />
                          <Select 
                            value={newActionItem.assigned_to}
                            onValueChange={(v) => setNewActionItem({...newActionItem, assigned_to: v})}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="advisor">Advisor</SelectItem>
                              <SelectItem value="client">Client</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button type="button" variant="outline" onClick={addActionItem}>
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Saving...' : 'Save Meeting'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{meetings.length}</p>
                  <p className="text-sm text-slate-500">Total Meetings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/20">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {meetings.reduce((count, m) => 
                      count + (m.action_items?.filter(a => a.status === 'pending' || a.status === 'in_progress').length || 0), 0)}
                  </p>
                  <p className="text-sm text-slate-500">Pending Actions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {meetings.length > 0 ? new Date(meetings[0].meeting_date).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="text-sm text-slate-500">Last Meeting</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meetings List */}
        {meetings.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <h3 className="font-semibold text-lg mb-2">No meetings yet</h3>
              <p className="text-slate-500 mb-4">Record your first meeting to get started</p>
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Meeting
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => {
              const Icon = meetingTypeIcons[meeting.meeting_type] || Calendar;
              return (
                <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl shrink-0",
                        meetingTypeColors[meeting.meeting_type]
                      )}>
                        <Icon className="h-6 w-6" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-display font-semibold text-lg">
                            {meeting.meeting_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Meeting
                          </h3>
                          <Badge variant="outline">
                            {new Date(meeting.meeting_date).toLocaleDateString()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {meeting.duration_minutes} min
                          </Badge>
                        </div>
                        
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                          {meeting.summary}
                        </p>

                        {meeting.discussion_points?.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Discussion Points
                            </h4>
                            <ul className="list-disc list-inside text-sm text-slate-500 space-y-1">
                              {meeting.discussion_points.map((point, idx) => (
                                <li key={idx}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {meeting.action_items?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Action Items
                            </h4>
                            <div className="space-y-2">
                              {meeting.action_items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  {item.status === 'completed' ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-amber-500" />
                                  )}
                                  <span className={item.status === 'completed' ? 'line-through text-slate-400' : ''}>
                                    {item.description}
                                  </span>
                                  <Badge className={cn("text-xs ml-auto", actionStatusColors[item.status])}>
                                    {item.status?.replace('_', ' ')}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {meeting.next_meeting_date && (
                          <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-slate-500">
                            <Calendar className="h-4 w-4" />
                            Next meeting: {new Date(meeting.next_meeting_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
