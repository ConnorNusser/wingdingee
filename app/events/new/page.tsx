'use client';
import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/components/UserProvider';
import Login from '@/components/Login';

interface FormState {
  title: string;
  description: string;
  location: string;
  date: string;
  start_time: string;
  end_time: string;
}

// All 15-minute time slots
const TIME_SLOTS: { value: string; label: string }[] = (() => {
  const slots: { value: string; label: string }[] = [{ value: '', label: '—' }];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? 'AM' : 'PM';
      const label = `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
      slots.push({ value, label });
    }
  }
  return slots;
})();

function TimeSelect({
  id,
  value,
  onChange,
  minValue,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  minValue?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const slots = minValue
    ? TIME_SLOTS.filter((s) => s.value === '' || s.value > minValue)
    : TIME_SLOTS;

  const selectedLabel = slots.find((s) => s.value === value)?.label ?? '—';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && listRef.current) {
      const selected = listRef.current.querySelector<HTMLElement>('[data-selected="true"]');
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className={`time-select-trigger${open ? ' time-select-trigger-open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selectedLabel}</span>
        <span className="time-select-arrow">▾</span>
      </button>
      {open && (
        <ul ref={listRef} className="time-select-dropdown" role="listbox">
          {slots.map((slot) => (
            <li
              key={slot.value}
              role="option"
              aria-selected={slot.value === value}
              data-selected={slot.value === value}
              className={`time-select-option${slot.value === value ? ' time-select-option-selected' : ''}`}
              onMouseDown={() => { onChange(slot.value); setOpen(false); }}
            >
              {slot.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface NominatimResult {
  place_id: number;
  display_name: string;
}

function LocationInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.length < 3) { setSuggestions([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json() as NominatimResult[];
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch {
        // ignore network errors
      }
    }, 400);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (item: NominatimResult) => {
    // Trim to first 2 comma-parts for a clean short address
    const clean = item.display_name.split(',').slice(0, 2).join(',').trim();
    setQuery(clean);
    onChange(clean);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        id="location"
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
        }}
        placeholder="search for a place..."
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 10,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          marginTop: '4px',
          padding: 0,
          listStyle: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
          maxHeight: '220px',
          overflowY: 'auto',
        }}>
          {suggestions.map((s, i) => (
            <li
              key={s.place_id}
              onMouseDown={() => select(s)}
              onMouseEnter={() => setHoveredId(s.place_id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: '13px',
                lineHeight: '1.4',
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                background: hoveredId === s.place_id ? 'var(--border-light)' : 'transparent',
              }}
            >
              {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function NewEventPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    location: '',
    date: '',
    start_time: '',
    end_time: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!loaded) return null;
  if (!user) return <Login />;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) { setError('title and date are required'); return; }
    setSubmitting(true);
    setError('');

    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        title: form.title.trim(),
        user_id: user.id,
        host_name: user.display_name,
      }),
    });

    if (res.ok) {
      const event = await res.json() as { slug: string };
      router.push(`/events/${event.slug}`);
    } else {
      const data = await res.json().catch(() => ({})) as { error?: string };
      setError(data.error ?? 'something went wrong');
      setSubmitting(false);
    }
  };

  const slugPreview = form.title.trim()
    ? form.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-').slice(0, 40).replace(/-$/, '')
    : '';

  return (
    <main className="container">
      <Link href="/" className="back-link">← back</Link>
      <div className="page-header">
        <h1>new event</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">event name *</label>
          <input
            id="title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            placeholder="what's the occasion?"
            required
            autoFocus
          />
          {slugPreview && (
            <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '5px' }}>
              link: /events/{slugPreview}-xxxx
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="date">date *</label>
          <input id="date" name="date" type="date" value={form.date} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>time</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <TimeSelect
              id="start_time"
              value={form.start_time}
              onChange={(v) => setForm((f) => ({ ...f, start_time: v, end_time: v && f.end_time <= v ? '' : f.end_time }))}
            />
            <span style={{ color: 'var(--muted)', flexShrink: 0, fontSize: '14px' }}>to</span>
            <TimeSelect
              id="end_time"
              value={form.end_time}
              onChange={(v) => setForm((f) => ({ ...f, end_time: v }))}
              minValue={form.start_time || undefined}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="location">location</label>
          <LocationInput
            value={form.location}
            onChange={(v) => setForm((f) => ({ ...f, location: v }))}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">details</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="what should people know?"
          />
        </div>

        {error && (
          <p style={{ color: 'var(--red)', fontSize: '14px', marginBottom: '14px' }}>{error}</p>
        )}

        <button
          type="submit"
          className="btn btn-full"
          disabled={submitting || !form.title.trim() || !form.date}
        >
          {submitting ? 'posting...' : 'post event →'}
        </button>
      </form>
    </main>
  );
}
