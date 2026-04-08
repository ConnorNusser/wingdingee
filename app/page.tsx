'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/components/UserProvider';
import Login from '@/components/Login';
import type { EventWithCounts, RsvpPreview } from '@/lib/supabase';

const MAX_VISIBLE = 4;

type RsvpColor = 'green' | 'orange' | 'slate';

const ROASTS = [
  (n: string) => `we hate ${n} 😤`,
  (n: string) => `${n} is a party pooper 🙄`,
  (n: string) => `boo ${n} 👎`,
  (n: string) => `${n} is officially uninvited from future events`,
  (n: string) => `rip ${n}'s social life 💀`,
  (n: string) => `${n} is not our friend anymore`,
  (n: string) => `${n} can't handle a good time apparently`,
  (n: string) => `someone drag ${n} out of bed`,
  (n: string) => `${n} is scared 😂`,
  (n: string) => `${n} has betrayed us`,
];

function getRoast(rsvps: RsvpPreview[], total: number): string {
  const firstName = rsvps[0].display_name.split(' ')[0];
  const overflow = total - 1;
  const subject = overflow > 0 ? `${firstName} & ${overflow} other${overflow > 1 ? 's' : ''}` : firstName;
  const idx = (firstName.length + total) % ROASTS.length;
  return ROASTS[idx](subject);
}

function nameList(rsvps: RsvpPreview[], total: number): string {
  const names = rsvps.slice(0, MAX_VISIBLE).map((r) => r.display_name.split(' ')[0]);
  const overflow = total - names.length;
  if (overflow > 0) return names.join(', ') + ` +${overflow}`;
  return names.join(', ');
}

// Deterministic color from first char of display name
const INITIAL_COLORS = ['#f5d400','#00c853','#ff6d00','#4fc3f7','#ce93d8','#ef9a9a','#80cbc4','#ffcc02','#aed581','#ff8a65'];
function initialColor(name: string): string {
  const idx = (name.charCodeAt(0) ?? 0) % INITIAL_COLORS.length;
  return INITIAL_COLORS[idx];
}

function UserAvatarSmall({ r, ringColor }: { r: RsvpPreview; ringColor: string }) {
  const bg = initialColor(r.display_name);
  return (
    <div
      className="avatar avatar-sm avatar-row-item"
      title={r.display_name}
      style={{
        background: r.avatar ? undefined : bg,
        borderColor: ringColor,
        boxShadow: `2px 2px 0 ${ringColor}`,
      }}
    >
      {r.avatar ? <img src={r.avatar} alt={r.display_name} /> : r.display_name[0]?.toUpperCase()}
    </div>
  );
}

function RsvpGroup({
  rsvps,
  total,
  ringColor,
  label,
  icon,
  roast,
}: {
  rsvps: RsvpPreview[];
  total: number;
  ringColor: string;
  label: string;
  icon?: string;
  roast?: string;
}) {
  return (
    <div className="rsvp-block">
      <div className="rsvp-block-header">
        <span className="rsvp-block-label" style={{ color: ringColor }}>
          {icon && <span className="rsvp-icon">{icon}</span>}
          {label}
        </span>
      </div>
      <div className="rsvp-block-people">
        <div className="avatar-row">
          {rsvps.slice(0, MAX_VISIBLE).map((r) => (
            <UserAvatarSmall key={r.user_id} r={r} ringColor={ringColor} />
          ))}
          {total > MAX_VISIBLE && (
            <div className="avatar avatar-sm avatar-row-overflow">+{total - MAX_VISIBLE}</div>
          )}
        </div>
        <span className="rsvp-names" style={{ color: ringColor === 'var(--slate)' ? 'var(--muted)' : 'var(--text)', textDecoration: roast ? 'line-through' : 'none', textDecorationColor: ringColor }}>
          {nameList(rsvps, total)}
        </span>
      </div>
      {roast && <p className="rsvp-roast">{roast}</p>}
    </div>
  );
}

export default function HomePage() {
  const { user, loaded } = useUser();
  const [events, setEvents] = useState<EventWithCounts[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch('/api/events')
      .then((r) => r.json())
      .then((data) => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  if (!loaded) return null;
  if (!user) return <Login />;

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => e.date >= today);
  const past = [...events.filter((e) => e.date < today)].reverse();

  return (
    <main className="container">
      <div className="page-header">
        <h1>upcoming</h1>
        <Link href="/events/new" className="btn btn-sm">+ post event</Link>
      </div>

      {loading && <p className="text-muted">loading...</p>}

      {!loading && upcoming.length === 0 && (
        <p className="text-muted">
          no upcoming events.{' '}
          <Link href="/events/new">post one →</Link>
        </p>
      )}

      <div className="event-list">
        {upcoming.map((e) => <EventItem key={e.id} event={e} />)}
      </div>

      {!loading && past.length > 0 && (
        <>
          <div className="page-header" style={{ marginTop: '32px' }}>
            <h1>past</h1>
          </div>
          <div className="event-list">
            {past.map((e) => <EventItem key={e.id} event={e} muted />)}
          </div>
        </>
      )}
    </main>
  );
}

function EventItem({ event, muted }: { event: EventWithCounts; muted?: boolean }) {
  const going = event.going_rsvps ?? [];
  const maybe = event.maybe_rsvps ?? [];
  const no = event.no_rsvps ?? [];
  const hasRsvps = going.length > 0 || maybe.length > 0 || no.length > 0;

  return (
    <Link href={`/events/${event.slug}`} style={{ textDecoration: 'none' }}>
      <div className="event-item" style={muted ? { opacity: 0.45 } : {}}>
        <div className="event-title-link">{event.title}</div>
        <div className="event-meta">
          {formatDate(event.date, event.start_time, event.end_time)}
          {event.location ? ` · ${event.location}` : ''}
          {' · '}by {event.host_name}
        </div>

        {hasRsvps ? (
          <div className="rsvp-blocks">
            {going.length > 0 && (
              <RsvpGroup rsvps={going} total={event.yes_count} ringColor="var(--green)" label="going" icon="✓" />
            )}
            {maybe.length > 0 && (
              <RsvpGroup rsvps={maybe} total={event.maybe_count} ringColor="var(--orange)" label="maybe" icon="?" />
            )}
            {no.length > 0 && (
              <RsvpGroup rsvps={no} total={event.no_count} ringColor="var(--slate)" label="out" icon="✗" roast={getRoast(no, event.no_count)} />
            )}
          </div>
        ) : (
          <p className="text-muted" style={{ fontSize: '12px', marginTop: '10px' }}>no rsvps yet</p>
        )}
      </div>
    </Link>
  );
}

function formatDate(date: string, startTime: string, endTime: string): string {
  if (!date) return '';
  const d = new Date(`${date}T${startTime || '00:00'}`);
  let str = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  if (startTime) {
    str += ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (endTime) {
      const end = new Date(`${date}T${endTime}`);
      str += '–' + end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  }
  return str;
}
