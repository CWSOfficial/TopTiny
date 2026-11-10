import React, { useState } from 'react';
import { EmptyState, PageTitle, StatCard, StatusPill, VenueThumb } from './components.jsx';
import { supabase } from './supabase.js';

const number = value => Number(value || 0);
const dateText = value => value ? new Date(value).toLocaleDateString() : '—';

export function OverviewPage({ user, venues, cities, submissions, reviews, reports, onNavigate, onAddVenue }) {
  const pending = submissions.filter(item => item.status === 'pending');
  const openReports = reports.filter(item => item.status === 'open');
  const recent = reviews.slice(0, 6);
  return (
    <>
      <PageTitle title={`Good evening, ${(user?.email || 'admin').split('@')[0]}.`} subtitle="Your TopTini community is in good hands.">
        <button className="button" onClick={() => onNavigate('users')}>Manage users</button>
        <button className="button" onClick={() => onNavigate('venues')}>Manage venues</button>
        <button className="button primary" onClick={onAddVenue}>＋ Add venue</button>
      </PageTitle>
      <div className="stats-grid">
        <StatCard label="VENUES" value={venues.length} note={`${venues.filter(item => item.is_demo).length} demo placeholders`} icon="⌖" />
        <StatCard label="PUBLISHED REVIEWS" value={reviews.filter(item => item.status === 'published').length} note="Across all city guides" icon="☆" />
        <StatCard label="PENDING SUBMISSIONS" value={pending.length} note="Awaiting venue verification" icon="＋" />
        <StatCard label="OPEN REPORTS" value={openReports.length} note="Needs a moderation decision" icon="⚑" />
      </div>
      <div className="overview-grid">
        <section className="panel-card">
          <div className="panel-head"><div><h3>Recent community ratings</h3><p>The latest ratings and written reviews</p></div><button className="text-link" onClick={() => onNavigate('reviews')}>View all →</button></div>
          {recent.length ? recent.map(review => (
            <div className="mini-row" key={review.id}>
              <div className="mini-avatar" style={{ display: 'grid', placeItems: 'center', color: '#704735' }}>☆</div>
              <div className="mini-info"><strong>{review.venue?.name || 'Venue review'}</strong><span>{review.author_name} · {number(review.rating).toFixed(1)} · {dateText(review.created_at)}</span></div>
              <StatusPill value={review.status} />
            </div>
          )) : <EmptyState title="No reviews yet" message="New community ratings will appear here." />}
        </section>
        <section className="panel-card">
          <div className="panel-head"><div><h3>Needs your attention</h3><p>Keep the city guides accurate and welcoming</p></div></div>
          <AttentionRow icon="＋" title={`${pending.length} venue suggestions`} subtitle="Confirm location and menu evidence before approval" action="Review" onClick={() => onNavigate('submissions')} />
          <AttentionRow icon="⚑" title={`${openReports.length} open content reports`} subtitle="Review photos and community content" action="Review" onClick={() => onNavigate('reports')} />
          <AttentionRow icon="◎" title={`${cities.filter(city => city.is_active).length} active cities`} subtitle="Manage coverage and map centers" action="Manage" onClick={() => onNavigate('cities')} />
        </section>
      </div>
    </>
  );
}

function AttentionRow({ icon, title, subtitle, action, onClick }) {
  return <div className="mini-row"><div className="stat-icon">{icon}</div><div className="mini-info"><strong>{title}</strong><span>{subtitle}</span></div><button className="text-link" onClick={onClick}>{action}</button></div>;
}

export function VenuesPage({ venues, cities, onAdd, onEdit, onDelete, onImport }) {
  const [term, setTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const filtered = venues.filter(venue => (!cityFilter || venue.city === cityFilter) && `${venue.name} ${venue.city} ${venue.address}`.toLowerCase().includes(term.toLowerCase()));
  return (
    <>
      <PageTitle title="Every great pour starts here." subtitle="Add and maintain accurate venue details across the city guide.">
        <button className="button" onClick={onImport}>Import CSV</button><button className="button primary" onClick={onAdd}>＋ Add venue</button>
      </PageTitle>
      <div className="table-card">
        <div className="table-toolbar">
          <input aria-label="Search venues" value={term} onChange={event => setTerm(event.target.value)} placeholder="Search venue, city or address" />
          <select aria-label="Filter by city" value={cityFilter} onChange={event => setCityFilter(event.target.value)}>
            <option value="">All cities</option>{cities.map(city => <option key={city.name}>{city.name}</option>)}
          </select>
          <span className="muted-cell">{filtered.length} venues</span>
        </div>
        <div className="table-scroll"><table><thead><tr><th>VENUE</th><th>CITY</th><th>COMMUNITY SCORE</th><th>MENU VERIFIED</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
          <tbody>{filtered.length ? filtered.map(venue => (
            <tr key={venue.id}>
              <td><div className="venue-cell"><VenueThumb venue={venue} /><span><strong>{venue.name}</strong><br /><span className="muted-cell">{venue.address}</span></span></div></td>
              <td>{venue.city}, {venue.state}</td>
              <td><strong>{venue.review_count ? number(venue.average_score).toFixed(1) : '—'}</strong><span className="muted-cell"> · {venue.review_count || 0}</span></td>
              <td><StatusPill value={venue.espresso_martini_verified ? 'verified' : 'needs proof'} /></td>
              <td><StatusPill value={venue.is_demo ? 'demo' : 'live'} /></td>
              <td><div className="table-actions"><button className="table-action" onClick={() => onEdit(venue)}>Edit</button><button className="table-action danger" onClick={() => onDelete(venue)}>Remove</button></div></td>
            </tr>
          )) : <tr><td className="empty-cell" colSpan="6">No venues match your search.</td></tr>}</tbody>
        </table></div>
      </div>
    </>
  );
}

export function CitiesPage({ cities, venues, submissions, onAdd, onEdit, onToggle, onDelete }) {
  return (
    <>
      <PageTitle title="Build city by city." subtitle="City centers drive discovery maps, user preferences and venue suggestions.">
        <button className="button primary" onClick={onAdd}>＋ Add city</button>
      </PageTitle>
      <div className="city-grid">{cities.length ? cities.map(city => {
        const venueCount = venues.filter(venue => venue.city === city.name).length;
        const hasReferences = venueCount > 0 || submissions.some(item => item.city === city.name);
        return (
          <article className="city-card" key={city.name}>
            <div className="city-card-top"><div><div className="city-name">{city.name}</div><div className="city-state">{city.state} · CITY GUIDE</div></div><StatusPill value={city.is_active ? 'active' : 'hidden'} /></div>
            <div className="city-details">{venueCount} venues · map center <span className="map-coords">{number(city.latitude).toFixed(4)}, {number(city.longitude).toFixed(4)}</span></div>
            <div className="city-actions"><button className="button" onClick={() => onEdit(city)}>Edit city</button><button className="button quiet" onClick={() => onToggle(city)}>{city.is_active ? 'Deactivate' : 'Activate'}</button><button className="button quiet" disabled={hasReferences} title={hasReferences ? 'Remove venues and submissions before deleting' : ''} onClick={() => onDelete(city)}>Delete</button></div>
          </article>
        );
      }) : <EmptyState title="No cities yet" message="Add a city to start a guide." />}</div>
    </>
  );
}

export function UsersPage({ users, page, hasMore, total, busy, error, onRefresh, onPage, onEdit }) {
  return (
    <>
      <PageTitle title="Know your community." subtitle="View member accounts and update their TopTini profile details.">
        <button className="button" onClick={onRefresh} disabled={busy}>{busy ? 'Loading…' : '↻ Refresh users'}</button>
      </PageTitle>
      {error ? <div className="users-error" role="alert"><strong>User directory unavailable</strong><span>{error}</span><small>Deploy the secure <code>admin-users</code> Supabase Edge Function to enable this page.</small></div> : null}
      {!error ? <div className="table-card">
        <div className="table-toolbar"><span className="muted-cell">{total === null ? `${users.length} accounts on this page` : `${total} registered accounts`}</span></div>
        <div className="table-scroll"><table className="users-table"><thead><tr><th>MEMBER</th><th>HOME CITY</th><th>JOINED</th><th>LAST SIGN IN</th><th>ACCESS</th><th>ACTIONS</th></tr></thead>
          <tbody>{users.length ? users.map(member => (
            <tr key={member.id}>
              <td><div className="user-cell"><span className="user-avatar">{(member.username || member.email || 'T').slice(0, 1).toUpperCase()}</span><span className="user-cell-copy"><strong>{member.username || 'TopTini member'}</strong><span className="muted-cell">{member.email || 'No email available'}</span></span></div></td>
              <td>{member.preferredCity || <span className="muted-cell">Not set</span>}</td>
              <td>{dateText(member.createdAt)}</td>
              <td>{dateText(member.lastSignInAt)}</td>
              <td><StatusPill value={member.isAdmin ? 'admin' : member.hasProfile ? 'member' : 'profile missing'} /></td>
              <td><button className="table-action" onClick={() => onEdit(member)} disabled={!member.hasProfile}>Edit profile</button></td>
            </tr>
          )) : <tr><td className="empty-cell" colSpan="6">{busy ? 'Loading accounts…' : 'No user accounts found.'}</td></tr>}</tbody>
        </table></div>
        <div className="users-pagination"><span>Page {page}</span><div><button className="table-action" onClick={() => onPage(page - 1)} disabled={busy || page <= 1}>Previous</button><button className="table-action" onClick={() => onPage(page + 1)} disabled={busy || !hasMore}>Next</button></div></div>
      </div> : null}
    </>
  );
}

export function SubmissionsPage({ submissions, cities, onApprove, onReject }) {
  const items = submissions.filter(item => item.status === 'pending');
  return (
    <>
      <PageTitle title="Good local intel." subtitle="Confirm the espresso martini is on the menu and verify the map pin before approving."><StatusPill value={`${items.length} pending`} /></PageTitle>
      <div className="submission-list">{items.length ? items.map(item => <SubmissionCard key={item.id} item={item} city={cities.find(city => city.name === item.city)} onApprove={onApprove} onReject={onReject} />) : <EmptyState title="You’re all caught up" message="New member suggestions will appear here." />}</div>
    </>
  );
}

function SubmissionCard({ item, city, onApprove, onReject }) {
  const [fields, setFields] = useState({ latitude: '', longitude: '', source: '' });
  const update = event => setFields(current => ({ ...current, [event.target.name]: event.target.value }));
  return (
    <article className="submission-card">
      <div className="submission-head"><div className="stat-icon">⌖</div><div className="submission-main"><h3>{item.name}</h3><p>{item.address} · {item.city}, {item.state}</p><p>Suggested {dateText(item.created_at)}{item.phone ? ` · ${item.phone}` : ''}{item.website ? <> · <a href={item.website} target="_blank" rel="noreferrer">website</a></> : null}</p>{item.note ? <div className="review-copy">{item.note}</div> : null}</div><StatusPill value={item.status} /></div>
      <div className="submission-fields">
        <label>Verified latitude<input name="latitude" type="number" step="any" min="-90" max="90" value={fields.latitude} placeholder={number(city?.latitude).toFixed(4)} onChange={update} /></label>
        <label>Verified longitude<input name="longitude" type="number" step="any" min="-180" max="180" value={fields.longitude} placeholder={number(city?.longitude).toFixed(4)} onChange={update} /></label>
        <label>Menu / proof URL<input name="source" type="url" value={fields.source} placeholder="https://venue.com/menu" onChange={update} /></label>
      </div>
      <div className="report-actions"><button className="button primary" onClick={() => onApprove(item, fields)}>Approve verified venue</button><button className="button quiet" onClick={() => onReject(item)}>Reject</button></div>
      <p className="form-help">Approval needs the exact map coordinates and a source URL confirming espresso martinis are served.</p>
    </article>
  );
}

export function ReviewsPage({ reviews, onModerate, onDelete }) {
  return (
    <>
      <PageTitle title="Community, with care." subtitle="Review written content and drink photos. Hidden reviews stop contributing to venue scores."><StatusPill value={`${reviews.length} reviews`} /></PageTitle>
      <div className="review-list">{reviews.length ? reviews.map(review => (
        <article className="review-card" key={review.id}>
          <div className="review-head"><div className="stat-icon">☆</div><div className="review-main"><h3>{review.venue?.name || 'Venue'} · {number(review.rating).toFixed(1)}</h3><p>{review.author_name} · {review.venue?.city || ''} · {dateText(review.created_at)}</p></div><StatusPill value={review.status} /></div>
          {review.body ? <div className="review-copy">{review.body}</div> : null}
          {review.photo_path ? <a href={reviewPhotoUrl(review.photo_path)} target="_blank" rel="noreferrer"><img className="venue-thumb review-photo-thumb" src={reviewPhotoUrl(review.photo_path)} alt="Review" /></a> : null}
          <div className="report-actions">{review.status === 'published' ? <button className="table-action danger" onClick={() => onModerate(review, 'hidden')}>Hide from guide</button> : <button className="table-action" onClick={() => onModerate(review, 'published')}>Restore review</button>}<button className="table-action danger" onClick={() => onDelete(review)}>Delete</button></div>
        </article>
      )) : <EmptyState title="No reviews yet" message="Published community reviews will appear here." />}</div>
    </>
  );
}

export function ReportsPage({ reports, onDismiss, onHideReview }) {
  const openCount = reports.filter(report => report.status === 'open').length;
  return (
    <>
      <PageTitle title="Look after the room." subtitle="Review reports from members and record a moderation decision."><StatusPill value={`${openCount} open`} /></PageTitle>
      <div className="review-list">{reports.length ? reports.map(report => {
        const review = report.review || {};
        return (
          <article className="review-card" key={report.id}>
            <div className="review-head"><div className="stat-icon">⚑</div><div className="review-main"><h3>{review.venue?.name || 'Reported review'}</h3><p>Reason: {(report.reason || '').replaceAll('_', ' ')} · Reported {dateText(report.created_at)}</p></div><StatusPill value={report.status} /></div>
            {review.body ? <div className="review-copy">{review.body}</div> : null}{report.details ? <div className="report-review">{report.details}</div> : null}
            <div className="report-actions">{review.id && review.status === 'published' ? <button className="table-action danger" onClick={() => onHideReview(report, review)}>Hide review & resolve</button> : null}{report.status === 'open' ? <button className="table-action" onClick={() => onDismiss(report)}>Dismiss report</button> : null}</div>
          </article>
        );
      }) : <EmptyState title="No reports yet" message="Member reports will appear here." />}</div>
    </>
  );
}

function reviewPhotoUrl(path) {
  return supabase.storage.from('review-photos').getPublicUrl(path).data.publicUrl;
}
