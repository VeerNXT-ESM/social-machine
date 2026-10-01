'use client';

import React, { useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  addWeeks,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ContentItem, Platform, PlatformPost } from '@/types';
import { api } from '@/lib/api';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, Globe } from 'lucide-react';
import { Linkedin, Twitter, Instagram, Facebook } from './SocialIcons';
import { Button, Card, CardHeader, EmptyState, Input, Select, SegmentedControl, StatusLabel } from './ui';

interface CalendarViewProps {
  items: ContentItem[];
  onSelectItem: (item: ContentItem) => void;
  onItemsChanged: () => void;
}

type ViewMode = 'week' | 'month' | 'list';
interface Entry {
  item: ContentItem;
  post: PlatformPost;
  date: Date;
}

const PLATFORMS: { id: Platform; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'linkedin', label: 'LinkedIn', Icon: Linkedin },
  { id: 'x', label: 'X', Icon: Twitter },
  { id: 'instagram', label: 'Instagram', Icon: Instagram },
  { id: 'facebook', label: 'Facebook', Icon: Facebook },
];

const iconFor = (p: Platform) => PLATFORMS.find((x) => x.id === p)!.Icon;

function defaultSlot() {
  const d = addDays(new Date(), 1);
  d.setHours(10, 0, 0, 0);
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

export function CalendarView({ items, onSelectItem, onItemsChanged }: CalendarViewProps) {
  const [view, setView] = useState<ViewMode>('week');
  const [anchor, setAnchor] = useState(new Date());
  const [channels, setChannels] = useState<Platform[]>(['linkedin', 'x', 'instagram', 'facebook']);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SCHEDULED' | 'PUBLISHED'>('ALL');
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [when, setWhen] = useState(defaultSlot());
  const [saving, setSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const { entries, unscheduled, reviewCount } = useMemo(() => {
    const e: Entry[] = [];
    const u: { item: ContentItem; post: PlatformPost }[] = [];
    let review = 0;
    items.forEach((item) => {
      Object.values(item.posts || {}).forEach((post: PlatformPost) => {
        const stamp = post.scheduled_at || post.published_at;
        if (stamp) e.push({ item, post, date: new Date(stamp) });
        else if (post.status === 'APPROVED') u.push({ item, post });
        else if (post.status === 'REVIEW' || post.status === 'DRAFT') review += 1;
      });
    });
    e.sort((a, b) => a.date.getTime() - b.date.getTime());
    return { entries: e, unscheduled: u, reviewCount: review };
  }, [items]);

  const visible = entries.filter(
    (e) =>
      channels.includes(e.post.platform) &&
      (statusFilter === 'ALL' || e.post.status === statusFilter)
  );

  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const rangeStart = view === 'month' ? startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 }) : weekStart;
  const rangeEnd =
    view === 'month'
      ? endOfWeek(addDays(startOfMonth(addMonths(anchor, 1)), -1), { weekStartsOn: 1 })
      : endOfWeek(anchor, { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let d = rangeStart; d <= rangeEnd; d = addDays(d, 1)) days.push(d);

  const label =
    view === 'month'
      ? format(anchor, 'MMMM yyyy')
      : view === 'week'
        ? `${format(weekStart, 'd MMM')} - ${format(addDays(weekStart, 6), 'd MMM yyyy')}`
        : 'All scheduled and published posts';

  const step = (dir: 1 | -1) => setAnchor(view === 'month' ? addMonths(anchor, dir) : addWeeks(anchor, dir));
  const toggleChannel = (p: Platform) =>
    setChannels((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  const confirmSchedule = async (item: ContentItem, post: PlatformPost) => {
    setSaving(true);
    setScheduleError(null);
    try {
      await api.schedule(item.id, post.platform, new Date(when).toISOString());
      setSchedulingId(null);
      onItemsChanged();
    } catch (err) {
      setScheduleError(err instanceof Error ? err.message : 'Could not schedule the post.');
    } finally {
      setSaving(false);
    }
  };

  const Chip = ({ entry }: { entry: Entry }) => {
    const Icon = iconFor(entry.post.platform);
    const published = entry.post.status === 'PUBLISHED';
    const tall = view === 'week';
    return (
      <button
        onClick={() => onSelectItem(entry.item)}
        title={`${entry.item.title} (${entry.post.platform})`}
        className={`w-full text-left px-1.5 py-1 text-[11px] border hover:border-neutral-500 ${
          published
            ? 'bg-neutral-100 border-neutral-300 text-neutral-600'
            : 'bg-white border-neutral-300 border-l-2 border-l-neutral-800 text-neutral-800'
        }`}
      >
        <span className="flex items-center gap-1.5">
          <Icon className="w-3 h-3 shrink-0" />
          <span className="font-medium shrink-0">{format(entry.date, 'h:mm a')}</span>
          {!tall && <span className="truncate">{entry.item.title}</span>}
          {published ? (
            <CheckCircle2 className="w-3 h-3 shrink-0 ml-auto" />
          ) : (
            <Clock className="w-3 h-3 shrink-0 ml-auto" />
          )}
        </span>
        {tall && <span className="block truncate mt-0.5 text-neutral-700">{entry.item.title}</span>}
      </button>
    );
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Toolbar */}
      <Card className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {view !== 'list' && (
            <>
              <Button size="sm" onClick={() => step(-1)} aria-label="Previous" className="px-2">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={() => step(1)} aria-label="Next" className="px-2">
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={() => setAnchor(new Date())}>
                Today
              </Button>
            </>
          )}
          <h2 className="text-base font-semibold text-neutral-900 ml-2">{label}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center" role="group" aria-label="Channels">
            {PLATFORMS.map(({ id, label: name, Icon }) => {
              const on = channels.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleChannel(id)}
                  title={`${on ? 'Hide' : 'Show'} ${name}`}
                  aria-pressed={on}
                  className={`p-2 border -ml-px first:ml-0 ${
                    on
                      ? 'bg-neutral-800 border-neutral-800 text-white'
                      : 'bg-white border-neutral-300 text-neutral-500 hover:bg-neutral-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'SCHEDULED' | 'PUBLISHED')}
            className="w-auto py-1.5"
            aria-label="Status filter"
          >
            <option value="ALL">All statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PUBLISHED">Published</option>
          </Select>

          <SegmentedControl
            options={[
              { id: 'week', label: 'Week' },
              { id: 'month', label: 'Month' },
              { id: 'list', label: 'List' },
            ]}
            value={view}
            onChange={setView}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
        {/* Calendar */}
        <Card className="min-w-0">
          {view === 'list' ? (
            visible.length === 0 ? (
              <EmptyState title="No scheduled or published posts match these filters" />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 text-left text-xs text-neutral-600 border-b border-neutral-200">
                    <th className="px-4 py-2 font-medium">Date and time</th>
                    <th className="px-4 py-2 font-medium">Channel</th>
                    <th className="px-4 py-2 font-medium">Content</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(({ item, post, date }) => {
                    const Icon = iconFor(post.platform);
                    return (
                      <tr
                        key={post.id}
                        onClick={() => onSelectItem(item)}
                        className="border-b border-neutral-200 hover:bg-neutral-50 cursor-pointer"
                      >
                        <td className="px-4 py-2.5 whitespace-nowrap text-neutral-800">
                          {format(date, 'EEE d MMM yyyy, h:mm a')}
                        </td>
                        <td className="px-4 py-2.5">
                          <Icon className="w-4 h-4 text-neutral-700" />
                        </td>
                        <td className="px-4 py-2.5 text-neutral-900 font-medium">{item.title}</td>
                        <td className="px-4 py-2.5">
                          <StatusLabel status={post.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
              <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50">
                {days.slice(0, 7).map((d) => (
                  <div key={d.toISOString()} className="px-2 py-2 text-xs font-medium text-neutral-600 border-r border-neutral-200 last:border-r-0">
                    {format(d, 'EEE')}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {days.map((d) => {
                  const dayEntries = visible.filter((e) => isSameDay(e.date, d));
                  const outside = view === 'month' && !isSameMonth(d, anchor);
                  const cap = view === 'month' ? 3 : 99;
                  return (
                    <div
                      key={d.toISOString()}
                      className={`border-r border-b border-neutral-200 last:border-r-0 p-1.5 space-y-1 ${
                        view === 'week' ? 'min-h-[420px]' : 'min-h-[112px]'
                      } ${outside ? 'bg-neutral-50' : 'bg-white'}`}
                    >
                      <div className="flex justify-end">
                        <span
                          className={`text-xs px-1.5 py-0.5 ${
                            isToday(d)
                              ? 'bg-neutral-800 text-white font-semibold'
                              : outside
                                ? 'text-neutral-400'
                                : 'text-neutral-700'
                          }`}
                        >
                          {format(d, view === 'week' ? 'd MMM' : 'd')}
                        </span>
                      </div>
                      {dayEntries.slice(0, cap).map((e) => (
                        <Chip key={e.post.id} entry={e} />
                      ))}
                      {dayEntries.length > cap && (
                        <button
                          onClick={() => {
                            setAnchor(d);
                            setView('week');
                          }}
                          className="text-[11px] text-neutral-600 hover:text-neutral-900 underline"
                        >
                          +{dayEntries.length - cap} more
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              </div>
            </div>
          )}
        </Card>

        {/* Side panel */}
        <Card>
          <CardHeader
            title="Ready to schedule"
            description={`Approved posts without a date (${unscheduled.length}). ${reviewCount} more awaiting review.`}
          />

          {unscheduled.length === 0 ? (
            <EmptyState
              title="Nothing waiting"
              description="Approve posts in the content library to schedule them here."
            />
          ) : (
            <ul className="divide-y divide-neutral-200">
              {unscheduled.map(({ item, post }) => {
                const Icon = iconFor(post.platform);
                const open = schedulingId === post.id;
                return (
                  <li key={post.id} className="px-4 py-3 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <Icon className="w-4 h-4 text-neutral-700 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-neutral-900 truncate">{item.title}</div>
                        <div className="text-xs text-neutral-600 line-clamp-2">{post.text}</div>
                      </div>
                      {!open && (
                        <Button
                          size="sm"
                          className="shrink-0"
                          onClick={() => {
                            setSchedulingId(post.id);
                            setWhen(defaultSlot());
                          }}
                        >
                          Schedule
                        </Button>
                      )}
                    </div>
                    {open && scheduleError && (
                      <p className="text-xs text-neutral-900 border border-neutral-800 p-2" role="alert">
                        {scheduleError}
                      </p>
                    )}
                    {open && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="datetime-local"
                          value={when}
                          onChange={(e) => setWhen(e.target.value)}
                          className="flex-1 min-w-0 px-2 py-1 text-xs"
                        />
                        <Button variant="primary" size="sm" onClick={() => confirmSchedule(item, post)} disabled={!when || saving}>
                          Confirm
                        </Button>
                        <Button size="sm" onClick={() => setSchedulingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="px-4 py-3 border-t border-neutral-200 text-xs text-neutral-600 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" /> Times shown in your local timezone (India Standard Time for the team).
          </div>
        </Card>
      </div>
    </div>
  );
}
