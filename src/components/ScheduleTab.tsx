import React, { useEffect, useState } from 'react';
import { Check, Clock, Plus, Sunrise, Sunset, Timer, Trash2 } from 'lucide-react';
import { ScheduleItem } from '../types/led';

interface ScheduleTabProps {
  schedules: ScheduleItem[];
  onToggleSchedule: (id: string) => void;
  onAddSchedule: (schedule: Omit<ScheduleItem, 'id'>) => void;
  onDeleteSchedule: (id: string) => void;
  onSleepTimerSet: (minutes: number) => void;
  sleepRemainingSeconds: number | null;
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({
  schedules,
  onToggleSchedule,
  onAddSchedule,
  onDeleteSchedule,
  onSleepTimerSet,
  sleepRemainingSeconds,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTime, setNewTime] = useState('08:00');
  const [newAction, setNewAction] = useState<'on' | 'off'>('on');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [isSunrise, setIsSunrise] = useState(false);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const toggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort());
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onAddSchedule({
      time: newTime,
      action: newAction,
      repeatDays: selectedDays,
      enabled: true,
      sunriseEffect: isSunrise,
      targetBrightness: 80,
    });
    setShowAddForm(false);
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Quick Sleep Timer Section */}
      <div className="p-6 bg-[#10141f] rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-semibold text-white">Quick Sleep Countdown Timer</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Gradually fades out and shuts down the LED strips so you can fall asleep peacefully
            </p>
          </div>

          {sleepRemainingSeconds !== null && (
            <div className="px-4 py-2 bg-amber-950/30 border border-amber-600/40 rounded-xl flex items-center gap-3">
              <span className="text-xs text-amber-200">Shutoff in:</span>
              <span className="font-mono text-base font-bold text-amber-400">
                {formatCountdown(sleepRemainingSeconds)}
              </span>
              <button
                onClick={() => onSleepTimerSet(0)}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {[15, 30, 45, 60, 90].map((mins) => (
            <button
              key={mins}
              onClick={() => onSleepTimerSet(mins)}
              className="px-4 py-2 text-xs font-medium bg-[#141926] hover:bg-amber-950/20 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 border border-slate-800 rounded-xl transition-all cursor-pointer"
            >
              {mins} Minutes
            </button>
          ))}
          {sleepRemainingSeconds !== null && (
            <button
              onClick={() => onSleepTimerSet(0)}
              className="px-4 py-2 text-xs font-medium bg-red-950/30 hover:bg-red-900/40 text-red-300 border border-red-800/50 rounded-xl transition-all cursor-pointer"
            >
              Stop Timer
            </button>
          )}
        </div>
      </div>

      {/* Automation Schedules Header */}
      <div className="p-6 bg-[#10141f] rounded-2xl border border-slate-800/80 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-semibold text-white">Daily Hardware Schedules</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Configured automated wake-up and turn-off routines
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Routine</span>
          </button>
        </div>

        {/* Add Schedule Form Drawer */}
        {showAddForm && (
          <form
            onSubmit={handleCreate}
            className="p-4 bg-[#141926] rounded-xl border border-slate-700/80 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Trigger Time</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-xs font-mono bg-[#0d1017] border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Hardware Action</label>
                <select
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value as 'on' | 'off')}
                  className="w-full px-3 py-1.5 text-xs bg-[#0d1017] border border-slate-700 rounded-lg text-white"
                >
                  <option value="on">Turn ON Lights</option>
                  <option value="off">Turn OFF Lights</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Sunrise Simulation</label>
                <label className="flex items-center gap-2 mt-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSunrise}
                    onChange={(e) => setIsSunrise(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-600"
                  />
                  <span>Gradual 15m warm ramp</span>
                </label>
              </div>
            </div>

            {/* Repeat Days Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Repeat Days</label>
              <div className="flex gap-1.5 flex-wrap">
                {dayLabels.map((lbl, idx) => {
                  const active = selectedDays.includes(idx);
                  return (
                    <button
                      type="button"
                      key={lbl}
                      onClick={() => toggleDay(idx)}
                      className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                        active
                          ? 'bg-indigo-600 text-white'
                          : 'bg-[#0d1017] text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {lbl}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
              >
                Save Schedule
              </button>
            </div>
          </form>
        )}

        {/* List of Schedules */}
        <div className="space-y-3">
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No automated schedules configured. Add one to turn on/off lights automatically.
            </div>
          ) : (
            schedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  schedule.enabled
                    ? 'bg-[#141926] border-slate-700/80 shadow-sm'
                    : 'bg-[#0d1017] border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      schedule.action === 'on'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}
                  >
                    {schedule.sunriseEffect ? (
                      <Sunrise className="w-5 h-5" />
                    ) : schedule.action === 'on' ? (
                      <Sunrise className="w-5 h-5" />
                    ) : (
                      <Sunset className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-white tracking-wider">
                        {schedule.time}
                      </span>
                      <span className="text-xs uppercase font-medium text-slate-400">
                        Turn {schedule.action.toUpperCase()}
                      </span>
                      {schedule.sunriseEffect && (
                        <span className="text-[10px] text-amber-400">
                          (15m Sunrise Ramp)
                        </span>
                      )}
                    </div>

                    <div className="flex gap-1.5 mt-1 text-[11px] text-slate-400">
                      {schedule.repeatDays.map((d) => (
                        <span key={d}>{dayLabels[d]}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <button
                    onClick={() => onToggleSchedule(schedule.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                      schedule.enabled
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {schedule.enabled ? 'Enabled' : 'Disabled'}
                  </button>

                  <button
                    onClick={() => onDeleteSchedule(schedule.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete schedule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
