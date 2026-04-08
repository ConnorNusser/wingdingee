'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/components/UserProvider';
import Login from '@/components/Login';
import type { EventWithRsvps, Rsvp, RsvpStatus } from '@/lib/supabase';

const INITIAL_COLORS = ['#f5d400','#00c853','#ff6d00','#4fc3f7','#ce93d8','#ef9a9a','#80cbc4','#ffcc02','#aed581','#ff8a65'];
function initialColor(name: string): string {
  return INITIAL_COLORS[(name.charCodeAt(0) ?? 0) % INITIAL_COLORS.length];
}

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

function getRoast(rsvps: Rsvp[]): string {
  const firstName = rsvps[0].display_name.split(' ')[0];
  const overflow = rsvps.length - 1;
  const subject = overflow > 0 ? `${firstName} & ${overflow} other${overflow > 1 ? 's' : ''}` : firstName;
  const idx = (firstName.length + rsvps.length) % ROASTS.length;
  return ROASTS[idx](subject);
}

export default function EventPage() {
  const { id: slug } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loaded } = useUser();
  const [event, setEvent] = useState<EventWithRsvps | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvping, setRsvping] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/events/${slug}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: EventWithRsvps) => { setEvent(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug, user]);

  const handleRsvp = async (status: RsvpStatus) => {
    if (!user) return;
    setRsvping(true);
    const res = await fetch(`/api/events/${slug}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        display_name: user.display_name,
        status,
        avatar: (user.data?.avatar as string) ?? '',
      }),
    });
    if (res.ok) setEvent(await res.json() as EventWithRsvps);
    setRsvping(false);
  };

  const handleDelete = async () => {
    if (!confirm('delete this event?')) return;
    await fetch(`/api/events/${slug}`, { method: 'DELETE' });
    router.push('/');
  };

  if (!loaded) return null;
  if (!user) return <Login />;

  if (loading) return <main className="container"><p className="text-muted">loading...</p></main>;
  if (!event) return <main className="container"><p>event not found. <Link href="/">← back</Link></p></main>;

  const rsvps: Rsvp[] = event.rsvps ?? [];
  const myRsvp    = rsvps.find((r) => r.user_id === user.id)?.status;
  const going     = rsvps.filter((r) => r.status === 'yes');
  const maybe     = rsvps.filter((r) => r.status === 'maybe');
  const notGoing  = rsvps.filter((r) => r.status === 'no');

  return (
    <main className="container">
      <Link href="/" className="back-link">← all events</Link>

      <div className="event-header">
        <h1>{event.title}</h1>
        <div className="event-meta">{formatDate(event.date, event.start_time, event.end_time)}</div>
        {event.location && <div className="event-meta">{event.location}</div>}
        <div className="event-meta" style={{ marginTop: '6px' }}>posted by {event.host_name}</div>
      </div>

      {event.description && (
        <div className="section">
          <h2>about</h2>
          <p>{event.description}</p>
        </div>
      )}

      <div className="section">
        <h2>rsvp</h2>
        <div className="rsvp-group">
          <button
            className={`btn btn-rsvp ${myRsvp === 'yes' ? 'active-yes' : 'btn-outline'}`}
            onClick={() => handleRsvp('yes')}
            disabled={rsvping}
          >
            going ✓
          </button>
          <button
            className={`btn btn-rsvp ${myRsvp === 'maybe' ? 'active-maybe' : 'btn-outline'}`}
            onClick={() => handleRsvp('maybe')}
            disabled={rsvping}
          >
            maybe
          </button>
          <button
            className={`btn btn-rsvp ${myRsvp === 'no' ? 'active-no' : 'btn-outline'}`}
            onClick={() => handleRsvp('no')}
            disabled={rsvping}
          >
            can&apos;t make it
          </button>
        </div>
      </div>

      {going.length > 0 && (
        <div className="section">
          <h2>✓ going — {going.length}</h2>
          <AttendeeList rsvps={going} currentUserId={user.id} accentColor="var(--green)" />
        </div>
      )}

      {maybe.length > 0 && (
        <div className="section">
          <h2>? maybe — {maybe.length}</h2>
          <AttendeeList rsvps={maybe} currentUserId={user.id} accentColor="var(--orange)" />
        </div>
      )}

      {notGoing.length > 0 && (
        <div className="section">
          <h2>✗ out — {notGoing.length}</h2>
          <AttendeeList rsvps={notGoing} currentUserId={user.id} accentColor="var(--slate)" muted />
          <p className="rsvp-roast" style={{ marginTop: '10px' }}>{getRoast(notGoing)}</p>
        </div>
      )}

      {event.user_id === user.id && (
        <>
          <hr className="divider" />
          <button
            onClick={handleDelete}
            className="btn btn-outline btn-sm"
            style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
          >
            delete event
          </button>
        </>
      )}
    </main>
  );
}

function AttendeeList({ rsvps, currentUserId, accentColor, muted }: {
  rsvps: Rsvp[];
  currentUserId: string;
  accentColor: string;
  muted?: boolean;
}) {
  return (
    <ul className="attendee-list">
      {rsvps.map((r) => {
        const isYou = r.user_id === currentUserId;
        const avatar = (r.data?.avatar as string) || undefined;
        const bg = initialColor(r.display_name);
        return (
          <li key={r.id} className="attendee-item" style={muted ? { opacity: 0.6 } : {}}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                className="avatar avatar-sm"
                title={r.display_name}
                style={{
                  background: avatar ? undefined : bg,
                  borderColor: isYou ? 'var(--green)' : accentColor,
                  boxShadow: `2px 2px 0 ${isYou ? 'var(--green)' : accentColor}`,
                  textDecoration: muted ? 'line-through' : 'none',
                }}
              >
                {avatar ? <img src={avatar} alt={r.display_name} /> : r.display_name[0]?.toUpperCase()}
              </div>
              <span style={{
                fontWeight: 600,
                textDecoration: muted ? 'line-through' : 'none',
                textDecorationColor: 'var(--slate)',
                color: muted ? 'var(--muted)' : 'var(--text)',
              }}>
                {r.display_name}
              </span>
            </div>
            {isYou && <span className="you-tag">you</span>}
          </li>
        );
      })}
    </ul>
  );
}

function formatDate(date: string, startTime: string, endTime: string): string {
  if (!date) return '';
  const d = new Date(`${date}T${startTime || '00:00'}`);
  let str = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  if (startTime) {
    str += ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (endTime) {
      const end = new Date(`${date}T${endTime}`);
      str += ' – ' + end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  }
  return str;
}
