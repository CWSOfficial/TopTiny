import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase.js';
import { Modal, Toast, pageTitles } from './components.jsx';
import MarketingSite from './MarketingSite.jsx';
import {
  CitiesPage,
  OverviewPage,
  ReportsPage,
  ReviewsPage,
  SubmissionsPage,
  UsersPage,
  VenuesPage,
} from './pages.jsx';

const emptyData = { venues: [], cities: [], submissions: [], reviews: [], reports: [] };
const emptyVenue = { name: '', address: '', city: '', state: '', latitude: '', longitude: '', phone: '', website: '', description: '', verification_source: '', is_demo: false };
const emptyCity = { name: '', state: '', latitude: '', longitude: '', is_active: true };
const isUrl = value => /^https?:\/\//i.test(value || '');
const asNumber = value => Number(value || 0);

const publicPages = {
  '/about': 'about',
  '/privacy': 'privacy',
  '/privacy-policy': 'privacy',
  '/terms': 'terms',
  '/terms-and-conditions': 'terms',
  '/faq': 'faq',
  '/contact': 'contact',
};

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/admin' || path.startsWith('/admin/')) return <AdminApp />;
  return <MarketingSite page={path === '/' ? 'home' : publicPages[path] || 'not-found'} />;
}

function AdminApp() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [adminReady, setAdminReady] = useState(false);
  const [page, setPage] = useState('overview');
  const [users, setUsers] = useState([]);
  const [usersBusy, setUsersBusy] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [usersHasMore, setUsersHasMore] = useState(false);
  const [usersTotal, setUsersTotal] = useState(null);
  const [userModal, setUserModal] = useState(null);
  const [userForm, setUserForm] = useState({ username: '', preferredCity: '' });
  const [userSaving, setUserSaving] = useState(false);
  const [data, setData] = useState(emptyData);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [venueModal, setVenueModal] = useState(null);
  const [cityModal, setCityModal] = useState(null);
  const [venueForm, setVenueForm] = useState(emptyVenue);
  const [cityForm, setCityForm] = useState(emptyCity);
  const [photoFile, setPhotoFile] = useState(null);
  const csvInput = useRef(null);
  const toastTimer = useRef(null);

  const notify = useCallback((message, error = false) => {
    setToast({ message, error });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  }, []);

  useEffect(() => {
    let active = true;
    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user || null);
      setAuthReady(true);
    });
    supabase.auth.getSession().then(({ data: sessionData }) => {
      if (!active) return;
      setUser(sessionData.session?.user || null);
      setAuthReady(true);
    }).catch(() => setAuthReady(true));
    return () => {
      active = false;
      authSubscription.subscription.unsubscribe();
      clearTimeout(toastTimer.current);
    };
  }, []);

  const loadData = useCallback(async () => {
    setBusy(true);
    const results = await Promise.all([
      supabase.from('venues').select('*').order('city').order('name'),
      supabase.from('cities').select('*').order('name'),
      supabase.from('venue_submissions').select('*').order('created_at', { ascending: false }).limit(250),
      supabase.from('reviews').select('*,venue:venues(name,city)').order('created_at', { ascending: false }).limit(250),
      supabase.from('review_reports').select('*,review:reviews(id,rating,body,author_name,photo_path,status,venue:venues(name,city))').order('created_at', { ascending: false }).limit(250),
      supabase.from('venue_score_summary').select('venue_id,review_count,average_score'),
    ]);
    const [venues, cities, submissions, reviews, reports, scores] = results;
    const requiredFailure = venues.error || cities.error;
    if (requiredFailure) {
      notify(requiredFailure.message || 'Venue and city data could not be loaded.', true);
      setBusy(false);
      return false;
    }
    // Community tables are installed by the Milestone 2 migration. Keep the
    // venue and city workspace usable while a project is still on the base schema.
    const scoreById = new Map((scores.error ? [] : scores.data || []).map(item => [item.venue_id, item]));
    setData({
      venues: (venues.data || []).map(item => ({ ...item, ...(scoreById.get(item.id) || {}) })),
      cities: cities.data || [],
      submissions: submissions.error ? [] : submissions.data || [],
      reviews: reviews.error ? [] : reviews.data || [],
      reports: reports.error ? [] : reports.data || [],
    });
    setBusy(false);
    return true;
  }, [notify]);

  const loadUsers = useCallback(async (requestedPage = 1) => {
    setUsersBusy(true);
    setUsersError('');
    const { data: result, error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'list', page: requestedPage, perPage: 50 },
    });
    if (error || result?.error) {
      setUsers([]);
      setUsersError(result?.error || error?.message || 'The user directory could not be loaded.');
      setUsersBusy(false);
      return false;
    }
    setUsers(result.users || []);
    setUsersPage(result.page || requestedPage);
    setUsersHasMore(result.hasMore === true);
    setUsersTotal(Number.isFinite(result.total) ? result.total : null);
    setUsersBusy(false);
    return true;
  }, []);

  useEffect(() => {
    if (!user) {
      setAdminReady(false);
      setData(emptyData);
      setUsers([]);
      return;
    }
    let active = true;
    setAdminReady(false);
    supabase.from('profiles').select('is_admin').eq('id', user.id).single().then(async result => {
      if (!active) return;
      if (result.error || result.data?.is_admin !== true) {
        setLoginError('This account does not have the TopTini admin role. Ask the project owner to grant access.');
        setAdminReady(false);
        return;
      }
      setLoginError('');
      setAdminReady(true);
      await loadData();
    }).catch(error => {
      if (active) setLoginError(error.message || 'Admin access could not be checked.');
    });
    return () => { active = false; };
  }, [user, loadData]);

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError('');
    setLoginBusy(true);
    const form = new FormData(event.currentTarget);
    const { data: result, error } = await supabase.auth.signInWithPassword({
      email: String(form.get('email') || '').trim(),
      password: String(form.get('password') || ''),
    });
    setLoginBusy(false);
    if (error) return setLoginError(error.message);
    setUser(result.user);
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) notify(error.message, true);
    else { setUser(null); setLoginError(''); }
  }

  function selectPage(nextPage) {
    setPage(nextPage);
    if (nextPage === 'users') loadUsers(1);
  }

  function openUser(member) {
    setUserForm({
      username: member.username || '',
      preferredCity: member.preferredCity || data.cities.find(city => city.is_active)?.name || '',
    });
    setUserModal(member);
  }

  async function saveUser(event) {
    event.preventDefault();
    if (!userModal) return;
    setUserSaving(true);
    const { data: result, error } = await supabase.functions.invoke('admin-users', {
      body: {
        action: 'update_profile',
        userId: userModal.id,
        username: userForm.username.trim(),
        preferredCity: userForm.preferredCity,
      },
    });
    setUserSaving(false);
    if (error || result?.error) return notify(result?.error || error?.message || 'User profile could not be updated.', true);
    setUsers(current => current.map(member => member.id === userModal.id
      ? { ...member, username: result.profile.username, preferredCity: result.profile.preferred_city }
      : member));
    setUserModal(null);
    notify('Member profile updated.');
  }

  function openVenue(venue = null) {
    const city = data.cities.find(item => item.is_active);
    setVenueForm(venue ? {
      name: venue.name || '', address: venue.address || '', city: venue.city || '', state: venue.state || '',
      latitude: String(venue.latitude ?? ''), longitude: String(venue.longitude ?? ''), phone: venue.phone || '',
      website: venue.website || '', description: venue.description || '', verification_source: venue.verification_source || '',
      is_demo: venue.is_demo === true,
    } : { ...emptyVenue, city: city?.name || '', state: city?.state || '' });
    setPhotoFile(null);
    setVenueModal(venue?.id || 'new');
  }

  function updateVenueField(event) {
    const { name, value, checked, type } = event.target;
    setVenueForm(current => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    if (name === 'city') {
      const city = data.cities.find(item => item.name === value);
      if (city) setVenueForm(current => ({ ...current, city: value, state: city.state }));
    }
  }

  async function saveVenue(event) {
    event.preventDefault();
    if (!venueForm.is_demo && !isUrl(venueForm.verification_source.trim())) {
      return notify('A live venue needs an HTTP or HTTPS menu/source URL.', true);
    }
    const latitude = Number(venueForm.latitude);
    const longitude = Number(venueForm.longitude);
    if (!venueForm.name.trim() || !venueForm.address.trim() || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return notify('Add a venue name, full address and valid map coordinates.', true);
    }
    const venueId = venueModal === 'new' ? null : venueModal;
    const existing = data.venues.find(item => item.id === venueId);
    const row = {
      name: venueForm.name.trim(), address: venueForm.address.trim(), city: venueForm.city,
      state: venueForm.state.trim().toUpperCase(), latitude, longitude,
      phone: venueForm.phone.trim() || null, website: venueForm.website.trim() || null,
      description: venueForm.description.trim() || null, is_demo: venueForm.is_demo,
      espresso_martini_verified: !venueForm.is_demo,
      verification_source: venueForm.is_demo ? null : venueForm.verification_source.trim(),
      verified_at: venueForm.is_demo ? null : new Date().toISOString(),
    };
    let uploadedPath = '';
    setBusy(true);
    try {
      if (photoFile) {
        if (photoFile.size > 10 * 1024 * 1024) throw new Error('Choose an image smaller than 10 MB.');
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(photoFile.type)) throw new Error('Choose a JPEG, PNG or WebP image.');
        const extension = photoFile.type.split('/')[1].replace('jpeg', 'jpg');
        uploadedPath = `venues/${crypto.randomUUID()}.${extension}`;
        const upload = await supabase.storage.from('venue-photos').upload(uploadedPath, photoFile, { contentType: photoFile.type, cacheControl: '3600' });
        if (upload.error) throw upload.error;
        row.photo_url = uploadedPath;
      }
      const result = venueId
        ? await supabase.from('venues').update(row).eq('id', venueId)
        : await supabase.from('venues').insert(row);
      if (result.error) throw result.error;
      if (uploadedPath && existing?.photo_url && !isUrl(existing.photo_url)) {
        const cleanup = await supabase.storage.from('venue-photos').remove([existing.photo_url]);
        if (cleanup.error) console.warn('Old venue photo cleanup issue', cleanup.error);
      }
      setVenueModal(null);
      notify('Venue saved to the city guide.');
      await loadData();
    } catch (error) {
      if (uploadedPath) await supabase.storage.from('venue-photos').remove([uploadedPath]);
      notify(error.message || 'Venue could not be saved.', true);
    } finally { setBusy(false); }
  }

  function openCity(city = null) {
    setCityForm(city ? {
      name: city.name, originalName: city.name, state: city.state,
      latitude: String(city.latitude), longitude: String(city.longitude), is_active: city.is_active,
    } : { ...emptyCity });
    setCityModal(true);
  }

  async function saveCity(event) {
    event.preventDefault();
    const latitude = Number(cityForm.latitude);
    const longitude = Number(cityForm.longitude);
    if (!cityForm.name.trim() || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return notify('Add a city name and valid map center coordinates.', true);
    }
    const row = { name: cityForm.name.trim(), state: cityForm.state.trim().toUpperCase(), latitude, longitude, is_active: cityForm.is_active, updated_at: new Date().toISOString() };
    setBusy(true);
    const result = cityForm.originalName
      ? await supabase.from('cities').update(row).eq('name', cityForm.originalName)
      : await supabase.from('cities').insert(row);
    setBusy(false);
    if (result.error) return notify(result.error.message, true);
    setCityModal(false);
    notify('City guide saved.');
    await loadData();
  }

  async function approveSubmission(item, fields) {
    const latitude = Number(fields.latitude);
    const longitude = Number(fields.longitude);
    const source = fields.source.trim();
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180 || !isUrl(source)) {
      return notify('Enter the verified map pin and HTTP/HTTPS menu source URL first.', true);
    }
    setBusy(true);
    const result = await supabase.rpc('approve_venue_submission', {
      submission_id: item.id, venue_latitude: latitude, venue_longitude: longitude,
      venue_description: null, espresso_martini_source: source,
    });
    setBusy(false);
    if (result.error) return notify(result.error.message, true);
    notify('Verified venue approved and added to the public guide.');
    await loadData();
  }

  async function rejectSubmission(item) {
    const note = window.prompt('Reason for rejecting this venue suggestion (optional):') || '';
    const result = await supabase.from('venue_submissions').update({ status: 'rejected', admin_note: note, updated_at: new Date().toISOString() }).eq('id', item.id);
    if (result.error) return notify(result.error.message, true);
    notify('Venue suggestion rejected.');
    await loadData();
  }

  async function importCsv(file) {
    if (!file) return;
    const rows = parseCsv(await file.text());
    let imported = 0;
    const failed = [];
    setBusy(true);
    for (const item of rows) {
      const demo = item.is_demo === 'true';
      const city = data.cities.find(entry => entry.name.toLowerCase() === (item.city || '').toLowerCase());
      const record = {
        id: item.id || undefined, name: item.name, address: item.address,
        city: city?.name || item.city, state: (item.state || city?.state || '').toUpperCase(),
        latitude: Number(item.latitude), longitude: Number(item.longitude),
        price_level: item.price_level ? Number(item.price_level) : null,
        photo_url: item.photo_url || null, description: item.description || null,
        phone: item.phone || null, website: item.website || null, is_demo: demo,
        espresso_martini_verified: !demo && item.espresso_martini_verified === 'true',
        verification_source: demo ? null : (item.verification_source || null),
        verified_at: demo ? null : (item.verified_at || new Date().toISOString()),
      };
      if (!record.name || !record.address || !record.state || !item.latitude || !item.longitude || !Number.isFinite(record.latitude) || record.latitude < -90 || record.latitude > 90 || !Number.isFinite(record.longitude) || record.longitude < -180 || record.longitude > 180) {
        failed.push(item.name || 'Unnamed row');
        continue;
      }
      if (!demo && (!record.espresso_martini_verified || !isUrl(record.verification_source))) {
        failed.push(`${item.name || 'Venue'}: missing verified menu source`);
        continue;
      }
      const result = await supabase.from('venues').upsert(record, { onConflict: 'id' });
      if (result.error) failed.push(`${item.name || 'Venue'}: ${result.error.message}`);
      else imported += 1;
    }
    setBusy(false);
    notify(`${imported} venues imported.${failed.length ? ` ${failed.length} rows need attention.` : ''}`, failed.length > 0);
    if (failed.length) console.warn('Venue import issues:', failed);
    await loadData();
  }

  async function deleteVenue(venue) {
    if (!window.confirm(`Remove ${venue.name} from the city guide? Reviews and favorites are removed with it.`)) return;
    setBusy(true);
    const reviewPhotos = await supabase.from('reviews').select('photo_path').eq('venue_id', venue.id).not('photo_path', 'is', null);
    if (reviewPhotos.error) { setBusy(false); return notify(reviewPhotos.error.message, true); }
    const result = await supabase.from('venues').delete().eq('id', venue.id);
    if (result.error) { setBusy(false); return notify(result.error.message, true); }
    const paths = (reviewPhotos.data || []).map(item => item.photo_path).filter(Boolean);
    for (let start = 0; start < paths.length; start += 100) {
      const cleanup = await supabase.storage.from('review-photos').remove(paths.slice(start, start + 100));
      if (cleanup.error) console.warn('Review photo cleanup issue', cleanup.error);
    }
    if (venue.photo_url && !isUrl(venue.photo_url)) {
      const cleanup = await supabase.storage.from('venue-photos').remove([venue.photo_url]);
      if (cleanup.error) console.warn('Venue photo cleanup issue', cleanup.error);
    }
    setBusy(false);
    notify('Venue removed.');
    await loadData();
  }

  async function deleteReview(review) {
    if (!window.confirm('Delete this review and its photo permanently?')) return;
    setBusy(true);
    const result = await supabase.from('reviews').delete().eq('id', review.id);
    if (!result.error && review.photo_path) {
      const cleanup = await supabase.storage.from('review-photos').remove([review.photo_path]);
      if (cleanup.error) console.warn('Review photo cleanup issue', cleanup.error);
    }
    setBusy(false);
    if (result.error) return notify(result.error.message, true);
    notify('Review removed.');
    await loadData();
  }

  async function moderateReview(review, status) {
    const result = await supabase.from('reviews').update({ status, updated_at: new Date().toISOString() }).eq('id', review.id);
    if (result.error) return notify(result.error.message, true);
    notify(status === 'hidden' ? 'Review hidden from the guide.' : 'Review restored.');
    await loadData();
  }

  async function deleteCity(city) {
    if (!window.confirm(`Permanently delete the ${city.name} city guide?`)) return;
    const result = await supabase.from('cities').delete().eq('name', city.name);
    if (result.error) return notify(result.error.message, true);
    notify('City guide deleted.');
    await loadData();
  }

  async function toggleCity(city) {
    const result = await supabase.from('cities').update({ is_active: !city.is_active, updated_at: new Date().toISOString() }).eq('name', city.name);
    if (result.error) return notify(result.error.message, true);
    notify(`${city.name}${city.is_active ? ' hidden from' : ' is live in'} the app.`);
    await loadData();
  }

  async function moderateReport(report, status) {
    const result = await supabase.from('review_reports').update({ status, updated_at: new Date().toISOString() }).eq('id', report.id);
    if (result.error) return notify(result.error.message, true);
    notify(`Report marked ${status}.`);
    await loadData();
  }

  async function hideReportedReview(report, review) {
    const reviewResult = await supabase.from('reviews').update({ status: 'hidden', updated_at: new Date().toISOString() }).eq('id', review.id);
    if (reviewResult.error) return notify(reviewResult.error.message, true);
    const reportResult = await supabase.from('review_reports').update({ status: 'reviewed', updated_at: new Date().toISOString() }).eq('id', report.id);
    if (reportResult.error) return notify(reportResult.error.message, true);
    notify('Review hidden and report resolved.');
    await loadData();
  }

  if (!authReady || (user && !adminReady && !loginError)) {
    return <div className="auth-view"><div className="auth-card loading"><div className="brand-mark">T.</div><p className="eyebrow">TOPTINI · PRIVATE ADMIN</p><h1>Preparing your workspace…</h1></div></div>;
  }

  if (!user || !adminReady) {
    return (
      <main className="auth-view">
        <section className="auth-card">
          <div className="brand-mark">T.</div><p className="eyebrow">TOPTINI · PRIVATE ADMIN</p>
          <h1>Welcome back.</h1>
          <p className="muted">Sign in with your TopTini administrator account to manage the guide and community.</p>
          {loginError ? <p className="login-error" role="alert">{loginError}</p> : null}
          <form onSubmit={handleLogin}>
            <label>Email address<input name="email" type="email" autoComplete="username" required placeholder="you@example.com" /></label>
            <label>Password<input name="password" type="password" autoComplete="current-password" required minLength="8" placeholder="Your password" /></label>
            <button className="button primary full" type="submit" disabled={loginBusy}>{loginBusy ? 'Signing in…' : 'Sign in securely'}</button>
          </form>
          <p className="auth-foot">Admin access is granted by the Supabase project owner.</p>
          <nav className="auth-legal-links" aria-label="Legal information">
            <a href="/privacy-policy">Privacy Policy</a>
            <span aria-hidden="true">·</span>
            <a href="/terms-and-conditions">Terms &amp; Conditions</a>
          </nav>
        </section>
        <Toast toast={toast} />
      </main>
    );
  }

  const pageContent = {
    overview: <OverviewPage user={user} {...data} onNavigate={selectPage} onAddVenue={() => openVenue()} />,
    users: <UsersPage users={users} page={usersPage} hasMore={usersHasMore} total={usersTotal} busy={usersBusy} error={usersError} onRefresh={() => loadUsers(usersPage)} onPage={loadUsers} onEdit={openUser} />,
    venues: <VenuesPage venues={data.venues} cities={data.cities} onAdd={() => openVenue()} onEdit={openVenue} onDelete={deleteVenue} onImport={() => csvInput.current?.click()} />,
    cities: <CitiesPage cities={data.cities} venues={data.venues} submissions={data.submissions} onAdd={() => openCity()} onEdit={openCity} onToggle={toggleCity} onDelete={deleteCity} />,
    submissions: <SubmissionsPage submissions={data.submissions} cities={data.cities} onApprove={approveSubmission} onReject={rejectSubmission} />,
    reviews: <ReviewsPage reviews={data.reviews} onModerate={moderateReview} onDelete={deleteReview} />,
    reports: <ReportsPage reports={data.reports} onDismiss={report => moderateReport(report, 'dismissed')} onHideReview={hideReportedReview} />,
  }[page];

  return (
    <>
      <div className="app-shell">
        <aside className="sidebar">
          <a className="brand-lockup" href="#overview" onClick={event => { event.preventDefault(); setPage('overview'); }}><span className="brand-mark small">T.</span><span>TopTini<small>ADMIN STUDIO</small></span></a>
          <div className="nav-label">WORKSPACE</div>
          <nav>
            <NavItem name="overview" current={page} onSelect={setPage} icon="◈" label="Overview" />
            <NavItem name="users" current={page} onSelect={selectPage} icon="♙" label="Users" />
            <NavItem name="venues" current={page} onSelect={setPage} icon="⌖" label="Venues" />
            <NavItem name="cities" current={page} onSelect={setPage} icon="◎" label="Cities" />
            <NavItem name="submissions" current={page} onSelect={setPage} icon="＋" label="Submissions" count={data.submissions.filter(item => item.status === 'pending').length} />
            <NavItem name="reviews" current={page} onSelect={setPage} icon="☆" label="Reviews" />
            <NavItem name="reports" current={page} onSelect={setPage} icon="⚑" label="Reports" count={data.reports.filter(item => item.status === 'open').length} />
          </nav>
          <div className="sidebar-bottom"><div className="secure-note"><span className="secure-dot" /><span>Protected by Supabase RLS</span></div><button className="signout" onClick={handleSignOut}>Sign out <span>↗</span></button></div>
        </aside>
        <main className="main-area">
          <header className="topbar"><div><p className="eyebrow">WORKSPACE / {page.toUpperCase()}</p><h2>{pageTitles[page]}</h2></div><div className="topbar-right"><button className="icon-button" aria-label="Refresh dashboard" onClick={page === 'users' ? () => loadUsers(usersPage) : loadData}>↻</button><div className="admin-avatar">{(user.email || 'A').slice(0, 1).toUpperCase()}</div><div className="admin-meta"><strong>{user.email || 'Administrator'}</strong><span>TOPTINI ADMIN</span></div></div></header>
          <div className="page-content">{pageContent}</div>
        </main>
      </div>
      {busy ? <div className="busy-indicator" role="status">Saving…</div> : null}
      <Toast toast={toast} />
      <input ref={csvInput} className="hidden-input" type="file" accept=".csv,text/csv" onChange={event => { importCsv(event.target.files?.[0]); event.target.value = ''; }} />
      {venueModal ? <VenueDialog form={venueForm} cities={data.cities} photoFile={photoFile} onChange={updateVenueField} onPhoto={event => setPhotoFile(event.target.files?.[0] || null)} onClose={() => setVenueModal(null)} onSubmit={saveVenue} /> : null}
      {cityModal ? <CityDialog form={cityForm} setForm={setCityForm} onClose={() => setCityModal(false)} onSubmit={saveCity} /> : null}
      {userModal ? <UserDialog member={userModal} form={userForm} setForm={setUserForm} cities={data.cities} onClose={() => setUserModal(null)} onSubmit={saveUser} busy={userSaving} /> : null}
    </>
  );
}

function NavItem({ name, current, onSelect, icon, label, count = 0 }) {
  return <button className={`nav-item ${current === name ? 'active' : ''}`} onClick={() => onSelect(name)}><span>{icon}</span>{label}{count > 0 ? <b className="nav-count">{count}</b> : null}</button>;
}

function VenueDialog({ form, cities, photoFile, onChange, onPhoto, onClose, onSubmit }) {
  return (
    <Modal title={form.name ? 'Edit venue' : 'Add venue'} eyebrow="VENUE DIRECTORY" onClose={onClose}>
      <form className="modal-form" onSubmit={onSubmit}>
        <div className="form-grid">
          <label className="span-2">Venue name<input name="name" value={form.name} onChange={onChange} required maxLength="120" /></label>
          <label className="span-2">Street address<input name="address" value={form.address} onChange={onChange} required maxLength="240" /></label>
          <label>City<select name="city" value={form.city} onChange={onChange} required>{cities.filter(city => city.is_active).map(city => <option key={city.name}>{city.name}</option>)}</select></label>
          <label>State<input name="state" value={form.state} onChange={onChange} required maxLength="3" /></label>
          <label>Latitude<input name="latitude" type="number" step="any" min="-90" max="90" value={form.latitude} onChange={onChange} required /></label>
          <label>Longitude<input name="longitude" type="number" step="any" min="-180" max="180" value={form.longitude} onChange={onChange} required /></label>
          <label>Phone<input name="phone" value={form.phone} onChange={onChange} maxLength="40" /></label>
          <label>Website<input name="website" type="url" value={form.website} onChange={onChange} maxLength="240" placeholder="https://" /></label>
          <label className="span-2">Venue photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto} /><small>{photoFile?.name || 'JPEG, PNG or WebP · max 10 MB'}</small></label>
          <label className="span-2">Description<textarea name="description" rows="3" maxLength="1000" value={form.description} onChange={onChange} /></label>
          <label className="span-2">Menu/source URL confirming espresso martinis are served<input name="verification_source" type="url" value={form.verification_source} onChange={onChange} placeholder="https://venue.com/menu" /></label>
          <label className="check-label span-2"><input name="is_demo" type="checkbox" checked={form.is_demo} onChange={onChange} /> Temporary demo listing</label>
        </div>
        <p className="form-help">Published venues need an accurate map pin and a source confirming they serve an espresso martini.</p>
        <div className="dialog-actions"><button type="button" className="button quiet" onClick={onClose}>Cancel</button><button className="button primary" type="submit">Save venue</button></div>
      </form>
    </Modal>
  );
}

function CityDialog({ form, setForm, onClose, onSubmit }) {
  function update(event) {
    const { name, value, checked, type } = event.target;
    setForm(current => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }
  return (
    <Modal title={form.originalName ? 'Edit city' : 'Add a city'} eyebrow="CITY GUIDE" onClose={onClose}>
      <form className="modal-form" onSubmit={onSubmit}>
        <div className="form-grid">
          <label className="span-2">City name<input name="name" value={form.name} onChange={update} required maxLength="80" /></label>
          <label>State / region<input name="state" value={form.state} onChange={update} required maxLength="3" /></label><span />
          <label>Map center latitude<input name="latitude" type="number" step="any" min="-90" max="90" value={form.latitude} onChange={update} required /></label>
          <label>Map center longitude<input name="longitude" type="number" step="any" min="-180" max="180" value={form.longitude} onChange={update} required /></label>
          <label className="check-label span-2"><input name="is_active" type="checkbox" checked={form.is_active} onChange={update} /> City is visible in the app</label>
        </div>
        <p className="form-help">A city with venues, profiles or submissions cannot be deleted. Deactivate it to hide it from new browsing.</p>
        <div className="dialog-actions"><button type="button" className="button quiet" onClick={onClose}>Cancel</button><button className="button primary" type="submit">Save city</button></div>
      </form>
    </Modal>
  );
}

function UserDialog({ member, form, setForm, cities, onClose, onSubmit, busy: saving }) {
  return (
    <Modal title="Edit member profile" eyebrow="COMMUNITY MEMBER" onClose={onClose}>
      <form className="modal-form" onSubmit={onSubmit}>
        <div className="form-grid">
          <label className="span-2">Account email<input value={member.email} readOnly /></label>
          <label className="span-2">Username<input value={form.username} onChange={event => setForm(current => ({ ...current, username: event.target.value }))} required minLength="2" maxLength="30" /></label>
          <label className="span-2">Home city<select value={form.preferredCity} onChange={event => setForm(current => ({ ...current, preferredCity: event.target.value }))} required>
            {cities.filter(city => city.is_active).map(city => <option key={city.name} value={city.name}>{city.name}</option>)}
          </select></label>
        </div>
        <p className="form-help">Email and administrator access are read-only here. This editor changes only the member’s TopTini username and home city.</p>
        <div className="dialog-actions"><button type="button" className="button quiet" onClick={onClose} disabled={saving}>Cancel</button><button className="button primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button></div>
      </form>
    </Modal>
  );
}

function parseCsv(text) {
  const rows = []; let row = []; let cell = ''; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += char;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  const headers = (rows.shift() || []).map(value => value.trim().toLowerCase());
  return rows.filter(values => values.some(value => value.trim())).map(values => Object.fromEntries(headers.map((header, index) => [header, (values[index] || '').trim()])));
}
