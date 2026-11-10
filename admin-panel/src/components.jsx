import React from 'react';
import { supabase } from './supabase.js';

export const pageTitles = {
  overview: 'Overview',
  users: 'Members',
  venues: 'Venue directory',
  cities: 'City guides',
  submissions: 'Venue submissions',
  reviews: 'Reviews',
  reports: 'Reports & moderation',
};

export function StatusPill({ value }) {
  const tone = ['approved', 'published', 'reviewed', 'active'].includes(value)
    ? 'green'
    : ['rejected', 'hidden', 'removed', 'dismissed'].includes(value)
      ? 'red'
      : 'gold';
  return <span className={`pill ${tone}`}>{String(value || '').toUpperCase()}</span>;
}

export function EmptyState({ title, message }) {
  return <div className="empty-state"><strong>{title}</strong>{message}</div>;
}

export function StatCard({ label, value, note, icon }) {
  return (
    <article className="stat-card">
      <div className="stat-top"><span>{label}</span><span className="stat-icon">{icon}</span></div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">{note}</div>
    </article>
  );
}

export function PageTitle({ title, subtitle, children }) {
  return (
    <div className="page-title-row">
      <div><h3>{title}</h3><p>{subtitle}</p></div>
      {children ? <div className="actions">{children}</div> : null}
    </div>
  );
}

export function VenueThumb({ venue, className = 'venue-thumb' }) {
  if (!venue?.photo_url) return <div className={className} aria-hidden="true" />;
  const url = /^https?:\/\//i.test(venue.photo_url)
    ? venue.photo_url
    : supabase.storage.from('venue-photos').getPublicUrl(venue.photo_url).data.publicUrl;
  return <img className={className} src={url} alt="" />;
}

export function Modal({ title, eyebrow, onClose, children, wide = false }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className={`dialog ${wide ? 'dialog-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="dialog-head">
          <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>
          <button type="button" className="dialog-close" aria-label="Close dialog" onClick={onClose}>×</button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  return <div className={`toast visible ${toast.error ? 'error' : ''}`} role="status" aria-live="polite">{toast.message}</div>;
}
