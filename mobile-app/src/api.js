import { assertSupabaseConfigured, supabase } from './supabase/client';
import { decode } from 'base64-arraybuffer';

const profileColumns = 'id,username,preferred_city,avatar_path,is_admin';
const venueColumns =
  'id,name,address,city,state,latitude,longitude,price_level,photo_url,description,is_demo,phone,website,espresso_martini_verified,verification_source,verified_at';

function toProfile(row, user) {
  const avatarUrl = row.avatar_path
    ? supabase.storage.from('profile-photos').getPublicUrl(row.avatar_path).data
        .publicUrl
    : null;
  return {
    id: row.id,
    email: user.email || '',
    username: row.username,
    preferredCity: row.preferred_city,
    avatarUrl,
    isAdmin: row.is_admin === true,
  };
}

function profileDefaults(user, preferredCity, username) {
  const metadataName =
    user.user_metadata?.username || user.user_metadata?.full_name;
  const emailName = user.email?.split('@')[0];
  const safeName = (username || metadataName || emailName || 'Tini Explorer')
    .trim()
    .slice(0, 30);

  return {
    id: user.id,
    username: safeName.length >= 2 ? safeName : 'Tini Explorer',
    preferred_city:
      preferredCity || user.user_metadata?.preferred_city || 'Milwaukee',
  };
}

async function ensureProfile(user, preferredCity, username) {
  assertSupabaseConfigured();

  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select(profileColumns)
    .eq('id', user.id)
    .maybeSingle();
  if (readError) throw readError;
  if (existing) return toProfile(existing, user);

  const { data: created, error: createError } = await supabase
    .from('profiles')
    .insert(profileDefaults(user, preferredCity, username))
    .select(profileColumns)
    .single();
  if (!createError) return toProfile(created, user);

  // A second sign-in can create the profile between the read and insert.
  if (createError.code === '23505') {
    const { data: racedProfile, error: racedReadError } = await supabase
      .from('profiles')
      .select(profileColumns)
      .eq('id', user.id)
      .single();
    if (racedReadError) throw racedReadError;
    return toProfile(racedProfile, user);
  }
  throw createError;
}

function toVenue(row) {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
    state: row.state,
    latitude: row.latitude,
    longitude: row.longitude,
    priceLevel: row.price_level,
    photoUrl: row.photo_url
      ? /^https?:\/\//i.test(row.photo_url)
        ? row.photo_url
        : publicPhotoUrl('venue-photos', row.photo_url)
      : null,
    description: row.description,
    isDemo: row.is_demo === true,
    phone: row.phone || null,
    website: row.website || null,
    espressoMartiniVerified: row.espresso_martini_verified === true,
    verificationSource: row.verification_source || null,
    verifiedAt: row.verified_at || null,
    averageScore: Number(row.average_score || 0),
    reviewCount: Number(row.review_count || 0),
  };
}

export async function getVenues(city, search = '') {
  assertSupabaseConfigured();
  let query = supabase
    .from('venues')
    .select(venueColumns)
    .eq('city', city)
    .order('name')
    .limit(300);

  const term = search.trim();
  let rows;
  if (!term) {
    const { data, error } = await query;
    if (error) throw error;
    rows = data;
  } else {
    const [byName, byAddress] = await Promise.all([
      query.ilike('name', `%${term}%`),
      supabase
        .from('venues')
        .select(venueColumns)
        .eq('city', city)
        .ilike('address', `%${term}%`)
        .order('name')
        .limit(300),
    ]);
    if (byName.error) throw byName.error;
    if (byAddress.error) throw byAddress.error;

    rows = [
      ...new Map(
        [...byName.data, ...byAddress.data].map(row => [row.id, row]),
      ).values(),
    ].sort((first, second) => first.name.localeCompare(second.name));
  }
  if (!rows.length) return [];
  const { data: scores, error: scoreError } = await supabase
    .from('venue_score_summary')
    .select('venue_id,review_count,average_score')
    .in('venue_id', rows.map(row => row.id));
  if (scoreError && scoreError.code !== 'PGRST205') throw scoreError;
  const scoreByVenue = new Map((scores || []).map(row => [row.venue_id, row]));
  return rows.map(row => toVenue({ ...row, ...scoreByVenue.get(row.id) }));
}

export async function getCities() {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from('cities')
    .select('name,state,latitude,longitude')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data.map(row => ({
    name: row.name,
    state: row.state,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
  }));
}

export async function getMe() {
  assertSupabaseConfigured();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) return null;
  return ensureProfile(data.user);
}

export async function saveProfile(profile) {
  assertSupabaseConfigured();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error('Sign in again to save your profile.');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      username: profile.username.trim(),
      preferred_city: profile.preferredCity,
    })
    .eq('id', authData.user.id)
    .select(profileColumns)
    .single();
  if (error) throw error;
  return toProfile(data, authData.user);
}

export async function uploadAvatar(asset) {
  assertSupabaseConfigured();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error('Sign in to add a profile photo.');
  if (!asset?.base64) throw new Error('The selected photo could not be read.');
  if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
    throw new Error('Choose a photo smaller than 5 MB.');
  }

  const contentType = asset.type || 'image/jpeg';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) {
    throw new Error('Please choose a JPEG, PNG, or WebP image.');
  }
  const extension = contentType.split('/')[1].replace('jpeg', 'jpg');
  const path = `${authData.user.id}/${Date.now()}.${extension}`;
  const { data: currentProfile, error: profileReadError } = await supabase
    .from('profiles')
    .select('avatar_path')
    .eq('id', authData.user.id)
    .maybeSingle();
  if (profileReadError) throw profileReadError;

  const { error: uploadError } = await supabase.storage
    .from('profile-photos')
    .upload(path, decode(asset.base64), {
      contentType,
      cacheControl: '3600',
      upsert: false,
    });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_path: path })
    .eq('id', authData.user.id)
    .select(profileColumns)
    .single();
  if (error) {
    await supabase.storage.from('profile-photos').remove([path]);
    throw error;
  }
  if (currentProfile?.avatar_path) {
    await supabase.storage
      .from('profile-photos')
      .remove([currentProfile.avatar_path]);
  }
  return toProfile(data, authData.user);
}

export async function signIn(email, password) {
  assertSupabaseConfigured();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return ensureProfile(data.user);
}

export async function signUp(email, password, username, preferredCity) {
  assertSupabaseConfigured();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, preferred_city: preferredCity },
    },
  });
  if (error) throw error;
  if (!data.session) {
    return { profile: null, confirmationRequired: true };
  }
  return {
    profile: await ensureProfile(data.user, preferredCity, username),
    confirmationRequired: false,
  };
}

export async function resendSignupConfirmation(email) {
  assertSupabaseConfigured();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
  });
  if (error) throw error;
}

export async function signInApple(
  identityToken,
  nonce,
  username,
  authorizationCode,
) {
  assertSupabaseConfigured();
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: identityToken,
    nonce,
    access_token: authorizationCode,
  });
  if (error) throw error;

  if (username) {
    const { error: updateError } = await supabase.auth.updateUser({
      data: { full_name: username },
    });
    if (updateError) throw updateError;
  }
  return ensureProfile(data.user, undefined, username);
}

export async function signOut() {
  assertSupabaseConfigured();
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

function publicPhotoUrl(bucket, path) {
  if (!path) return null;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

function toReview(row) {
  return {
    id: row.id,
    userId: row.user_id,
    venueId: row.venue_id,
    rating: Number(row.rating),
    body: row.body || '',
    authorName: row.author_name || 'TopTini member',
    photoPath: row.photo_path || null,
    photoUrl: publicPhotoUrl('review-photos', row.photo_path),
    status: row.status,
    createdAt: row.created_at,
    venue: row.venue ? toVenue(row.venue) : null,
  };
}

export async function getVenueReviews(venueId) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from('reviews')
    .select('id,user_id,venue_id,rating,body,author_name,photo_path,status,created_at')
    .eq('venue_id', venueId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data.map(toReview);
}

export async function getMyVenueReview(venueId) {
  assertSupabaseConfigured();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return null;
  const { data, error } = await supabase
    .from('reviews')
    .select('id,user_id,venue_id,rating,body,author_name,photo_path,status,created_at')
    .eq('user_id', authData.user.id)
    .eq('venue_id', venueId)
    .maybeSingle();
  if (error) throw error;
  return data ? toReview(data) : null;
}

export async function getMyReviews() {
  assertSupabaseConfigured();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return [];
  const { data, error } = await supabase
    .from('reviews')
    .select('id,user_id,venue_id,rating,body,author_name,photo_path,status,created_at,venue:venues(*)')
    .eq('user_id', authData.user.id)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data.map(toReview);
}

async function uploadReviewPhoto(asset, venueId) {
  if (!asset?.base64) return null;
  if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
    throw new Error('Choose a photo smaller than 10 MB.');
  }
  const contentType = asset.type || 'image/jpeg';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) {
    throw new Error('Please choose a JPEG, PNG, or WebP photo.');
  }
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Sign in to add a drink photo.');
  const extension = contentType.split('/')[1].replace('jpeg', 'jpg');
  const path = `${user.id}/${venueId}/${Date.now()}.${extension}`;
  const { error } = await supabase.storage
    .from('review-photos')
    .upload(path, decode(asset.base64), { contentType, cacheControl: '3600' });
  if (error) throw error;
  return path;
}

export async function saveVenueReview({ venueId, rating, body, photoAsset }) {
  assertSupabaseConfigured();
  const value = Number(rating);
  if (!Number.isFinite(value) || value < 0 || value > 10) {
    throw new Error('Choose a rating from 0.0 to 10.0.');
  }
  if (Math.round(value * 10) !== value * 10) {
    throw new Error('Ratings can use one decimal place.');
  }
  if (body.trim().length > 1500) {
    throw new Error('Reviews must be 1,500 characters or fewer.');
  }
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error('Sign in to rate this venue.');

  const { data: previous, error: previousError } = await supabase
    .from('reviews')
    .select('id,photo_path')
    .eq('user_id', authData.user.id)
    .eq('venue_id', venueId)
    .maybeSingle();
  if (previousError) throw previousError;

  const newPhotoPath = photoAsset
    ? await uploadReviewPhoto(photoAsset, venueId)
    : previous?.photo_path || null;
  const reviewFields = {
    rating: value,
    body: body.trim(),
    photo_path: newPhotoPath,
  };
  const saveQuery = previous
    ? supabase
        .from('reviews')
        .update(reviewFields)
        .eq('id', previous.id)
        .eq('user_id', authData.user.id)
    : supabase.from('reviews').insert({
        ...reviewFields,
        user_id: authData.user.id,
        venue_id: venueId,
      });
  const { data, error } = await saveQuery
    .select('id,user_id,venue_id,rating,body,author_name,photo_path,status,created_at')
    .single();
  if (error) {
    if (newPhotoPath && newPhotoPath !== previous?.photo_path) {
      await supabase.storage.from('review-photos').remove([newPhotoPath]);
    }
    if (error.code === '23505') {
      throw new Error('You already reviewed this venue. Edit your existing review instead.');
    }
    throw error;
  }
  if (previous?.photo_path && previous.photo_path !== newPhotoPath) {
    await supabase.storage.from('review-photos').remove([previous.photo_path]);
  }
  return toReview(data);
}

export async function deleteReview(review) {
  assertSupabaseConfigured();
  const { error } = await supabase.from('reviews').delete().eq('id', review.id);
  if (error) throw error;
  if (review.photoPath) {
    await supabase.storage.from('review-photos').remove([review.photoPath]);
  }
}

export async function reportReview(reviewId, reason, details = '') {
  assertSupabaseConfigured();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error('Sign in to report a review.');
  const { error } = await supabase.from('review_reports').insert({
    reporter_id: authData.user.id,
    review_id: reviewId,
    reason,
    details: details.trim() || null,
  });
  if (error?.code === '23505') throw new Error('You have already reported this review.');
  if (error) throw error;
}

export async function getFavorites() {
  assertSupabaseConfigured();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return [];
  const { data, error } = await supabase
    .from('favorites')
    .select('venue:venues(*)')
    .eq('user_id', authData.user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const venues = data.map(row => row.venue).filter(Boolean);
  if (!venues.length) return [];
  const { data: scores, error: scoreError } = await supabase
    .from('venue_score_summary')
    .select('venue_id,review_count,average_score')
    .in('venue_id', venues.map(item => item.id));
  if (scoreError) throw scoreError;
  const scoreByVenue = new Map(scores.map(row => [row.venue_id, row]));
  return venues.map(row => toVenue({ ...row, ...scoreByVenue.get(row.id) }));
}

export async function setFavorite(venueId, saved) {
  assertSupabaseConfigured();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error('Sign in to save favorite venues.');
  const query = supabase.from('favorites');
  const result = saved
    ? await query.insert({ user_id: authData.user.id, venue_id: venueId })
    : await query.delete().eq('user_id', authData.user.id).eq('venue_id', venueId);
  if (result.error && result.error.code !== '23505') throw result.error;
}

export async function getCityLeaderboard(city) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from('city_leaderboards')
    .select('venue_id,name,city,state,address,photo_url,review_count,average_score,ranking_score,city_rank')
    .eq('city', city)
    .order('city_rank')
    .limit(100);
  if (error) throw error;
  return data.map(row => ({
    ...toVenue({ ...row, id: row.venue_id, photo_url: row.photo_url }),
    cityRank: row.city_rank,
    rankingScore: Number(row.ranking_score),
  }));
}

export async function submitVenue(input) {
  assertSupabaseConfigured();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error('Sign in to suggest a venue.');
  const name = input.name.trim();
  const address = input.address.trim();
  if (name.length < 2 || address.length < 5) {
    throw new Error('Add a venue name and full street address.');
  }
  const { data: venues, error: duplicateError } = await supabase
    .from('venues')
    .select('name,address')
    .eq('city', input.city)
    .ilike('name', name);
  if (duplicateError) throw duplicateError;
  const normalizedAddress = value => value.trim().toLowerCase().replace(/\s+/g, ' ');
  if (venues.some(item => normalizedAddress(item.address) === normalizedAddress(address))) {
    throw new Error('This venue is already in the guide.');
  }
  const { data, error } = await supabase
    .from('venue_submissions')
    .insert({
      user_id: authData.user.id,
      name,
      address,
      city: input.city,
      state: input.state,
      phone: input.phone.trim() || null,
      website: input.website.trim() || null,
      note: input.note.trim() || null,
    })
    .select('id,name,address,city,state,status,admin_note,created_at')
    .single();
  if (error?.code === '23505') {
    throw new Error('This venue has already been suggested or is in the guide.');
  }
  if (error) throw error;
  return data;
}

export async function getMySubmissions() {
  assertSupabaseConfigured();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return [];
  const { data, error } = await supabase
    .from('venue_submissions')
    .select('id,name,address,city,state,status,admin_note,created_at')
    .eq('user_id', authData.user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function requestAccountDeletion() {
  assertSupabaseConfigured();
  const { error } = await supabase.functions.invoke('delete-account', {
    body: { confirmation: 'DELETE_MY_TOPTINI_ACCOUNT' },
  });
  if (error) throw error;
  await supabase.auth.signOut({ scope: 'local' });
}
