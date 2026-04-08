'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/components/UserProvider';
import Login from '@/components/Login';
import type { EventWithCounts, RsvpPreview } from '@/lib/supabase';

const MAX_VISIBLE = 6;

function AvatarRow({ rsvps, total }: { rsvps: RsvpPreview[]; total: number }) {
  const visible = rsvps.slice(0, MAX_VISIBLE);
  const overflow = total - visible.length;
  return (
    <div className="avatar-row">
      {visible.map((r) => (
        <div
          key={r.user_id}
          className="avatar avatar-sm avatar-row-item"
          title={r.display_name}
        >
          {r.avatar ? <img src={r.avatar} alt={r.display_name} /> : r.display_name[0]?.toUpperCase()}
        </div>
      ))}
      {overflow > 0 && (
        <div className="avatar avatar-sm avatar-row-overflow">+{overflow}</div>
      )}
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
  const hasRsvps = going.length > 0 || maybe.length > 0;

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
          <div className="event-rsvp-row">
            {going.length > 0 && (
              <div className="event-rsvp-group">
                <AvatarRow rsvps={going} total={event.yes_count} />
                <span className="event-rsvp-label going-label">{event.yes_count} going</span>
              </div>
            )}
            {maybe.length > 0 && (
              <div className="event-rsvp-group">
                <AvatarRow rsvps={maybe} total={event.maybe_count} />
                <span className="event-rsvp-label maybe-label">{event.maybe_count} maybe</span>
              </div>
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
