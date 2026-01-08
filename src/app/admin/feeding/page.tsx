'use client';

import { useEffect, useState } from 'react';
import { feedingScheduleService, feedingActivityService, livestockService } from '@/services/firestore.service';
import type { FeedingSchedule, FeedingActivity, Livestock } from '@/types/livestock.types';

export default function FeedingManagement() {
  const [schedules, setSchedules] = useState<FeedingSchedule[]>([]);
  const [activities, setActivities] = useState<FeedingActivity[]>([]);
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedules' | 'activities'>('schedules');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      const [schedulesData, activitiesData, livestockData] = await Promise.all([
        feedingScheduleService.getAll(),
        feedingActivityService.getTodayActivities(),
        livestockService.getAll(),
      ]);
      setSchedules(schedulesData);
      setActivities(activitiesData);
      setLivestock(livestockData);
    } catch (error) {
      console.error('Error loading feeding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const todayStats = {
    totalFeedings: activities.length,
    completedSchedules: activities.filter(a => a.scheduleId).length,
    totalFeedGiven: activities.reduce((sum, a) => sum + a.quantity, 0),
    activeSchedules: schedules.filter(s => s.isActive).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading feeding data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feeding Management</h1>
          <p className="text-gray-500 mt-1">Manage feeding schedules and track feeding activities</p>
        </div>
        <button
          onClick={() => setShowScheduleModal(true)}
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Schedule
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Today's Feedings"
          value={todayStats.totalFeedings}
          icon={<FeedingIcon />}
          color="blue"
        />
        <StatCard
          title="Completed Schedules"
          value={todayStats.completedSchedules}
          icon={<CheckIcon />}
          color="green"
        />
        <StatCard
          title="Total Feed (kg)"
          value={todayStats.totalFeedGiven.toFixed(1)}
          icon={<WeightIcon />}
          color="amber"
        />
        <StatCard
          title="Active Schedules"
          value={todayStats.activeSchedules}
          icon={<ScheduleIcon />}
          color="purple"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="border-b border-gray-100">
          <div className="flex gap-1 p-2">
            <button
              onClick={() => setActiveTab('schedules')}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'schedules'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Feeding Schedules
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'activities'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Feeding Activities
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'schedules' ? (
            <SchedulesView schedules={schedules} onUpdate={loadData} />
          ) : (
            <ActivitiesView activities={activities} livestock={livestock} />
          )}
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showScheduleModal && (
        <AddScheduleModal
          onClose={() => setShowScheduleModal(false)}
          onSuccess={() => {
            setShowScheduleModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colors: Record<string, string> = {
    blue: 'from-blue-50 to-indigo-50 text-blue-600',
    green: 'from-emerald-50 to-teal-50 text-emerald-600',
    amber: 'from-amber-50 to-orange-50 text-amber-600',
    purple: 'from-purple-50 to-pink-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 bg-gradient-to-br ${colors[color]} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{title}</p>
        </div>
      </div>
    </div>
  );
}

function SchedulesView({ schedules, onUpdate }: { schedules: FeedingSchedule[]; onUpdate: () => void }) {
  const [editingSchedule, setEditingSchedule] = useState<FeedingSchedule | null>(null);

  const handleToggleActive = async (schedule: FeedingSchedule) => {
    try {
      await feedingScheduleService.update(schedule.id, { isActive: !schedule.isActive });
      onUpdate();
    } catch (error) {
      console.error('Error toggling schedule:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      await feedingScheduleService.delete(id);
      onUpdate();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  if (schedules.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No feeding schedules</h3>
        <p className="text-gray-500">Create your first feeding schedule to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {schedules.map((schedule) => (
        <div
          key={schedule.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-emerald-700">{schedule.time}</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{schedule.name}</h4>
              <p className="text-sm text-gray-500">
                {schedule.feedType} • {schedule.quantity} {schedule.unit}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {schedule.livestockTypes.map((type) => (
                  <span key={type} className="px-2 py-0.5 bg-white rounded-md text-xs text-gray-600 capitalize">
                    {type}
                  </span>
                ))}
                {schedule.notificationEnabled && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-medium flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {schedule.notifyBefore}min before
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleToggleActive(schedule)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                schedule.isActive
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {schedule.isActive ? 'Active' : 'Inactive'}
            </button>
            <button
              onClick={() => handleDelete(schedule.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivitiesView({ activities, livestock }: { activities: FeedingActivity[]; livestock: Livestock[] }) {
  const getLivestockName = (id: string) => {
    const animal = livestock.find(l => l.id === id);
    return animal ? animal.tagId : 'Unknown';
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No feeding activities today</h3>
        <p className="text-gray-500">Feeding activities from farmers will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900">{activity.livestockTagId || getLivestockName(activity.livestockId)}</h4>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm font-medium text-emerald-600">{formatTime(activity.fedAt)}</span>
              </div>
              <p className="text-sm text-gray-500">
                {activity.feedType} • {activity.quantity} {activity.unit} • By {activity.farmerName}
              </p>
              {activity.notes && (
                <p className="text-xs text-gray-400 mt-1">{activity.notes}</p>
              )}
            </div>
          </div>
          {activity.scheduleName && (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
              {activity.scheduleName}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function AddScheduleModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    time: '07:00',
    feedType: '',
    quantity: '',
    unit: 'kg' as 'kg' | 'lbs',
    livestockTypes: [] as string[],
    isActive: true,
    notificationEnabled: true,
    notifyBefore: 30,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await feedingScheduleService.create({
        ...formData,
        quantity: parseFloat(formData.quantity),
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Failed to create schedule');
    } finally {
      setSaving(false);
    }
  };

  const toggleLivestockType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      livestockTypes: prev.livestockTypes.includes(type)
        ? prev.livestockTypes.filter(t => t !== type)
        : [...prev.livestockTypes, type],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Create Feeding Schedule</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Schedule Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Morning Feed"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Time *</label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Feed Type *</label>
              <input
                type="text"
                required
                value={formData.feedType}
                onChange={(e) => setFormData({ ...formData, feedType: e.target.value })}
                placeholder="e.g., Hay, Grain"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity *</label>
              <input
                type="number"
                required
                step="0.1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit *</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value as 'kg' | 'lbs' })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="lbs">Pounds (lbs)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Livestock Types *</label>
            <div className="flex gap-3">
              {['cows', 'goat', 'sheep'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleLivestockType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    formData.livestockTypes.includes(type)
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Notification Settings */}
          <div className="border-t border-gray-200 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-900">Auto Notification</label>
                <p className="text-xs text-gray-500 mt-0.5">Send reminder to farmers before feeding time</p>
              </div>
              <input
                type="checkbox"
                id="notificationEnabled"
                checked={formData.notificationEnabled}
                onChange={(e) => setFormData({ ...formData, notificationEnabled: e.target.checked })}
                className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
            </div>

            {formData.notificationEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Notify Before (minutes)
                </label>
                <select
                  value={formData.notifyBefore}
                  onChange={(e) => setFormData({ ...formData, notifyBefore: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value={15}>15 minutes before</option>
                  <option value={30}>30 minutes before</option>
                  <option value={60}>1 hour before</option>
                  <option value={120}>2 hours before</option>
                </select>
                <p className="text-xs text-gray-500 mt-1.5">
                  Farmers will receive notification at {calculateNotificationTime(formData.time, formData.notifyBefore)}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Activate this schedule immediately
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || formData.livestockTypes.length === 0}
              className="flex-1 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Creating...' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Icons
function FeedingIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function WeightIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  );
}

function ScheduleIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// Helper function to calculate notification time
function calculateNotificationTime(feedingTime: string, minutesBefore: number): string {
  const [hours, minutes] = feedingTime.split(':').map(Number);
  const feedingDate = new Date();
  feedingDate.setHours(hours, minutes, 0, 0);
  
  const notificationDate = new Date(feedingDate.getTime() - minutesBefore * 60000);
  
  return notificationDate.toLocaleTimeString('en-MY', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}
