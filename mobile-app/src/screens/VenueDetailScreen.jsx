import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Linking,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import AppIcon from '../components/AppIcon';
import PrimaryButton from '../components/PrimaryButton';
import { deleteReview, getMyVenueReview, getVenueReviews, reportReview, saveVenueReview, setFavorite } from '../api';
import { useApp } from '../context/AppContext';
import { colors } from '../styles/theme';
import styles from './VenueDetailScreen.styles';

const fallbackPhoto = 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1400&q=90';

export default function VenueDetailScreen({ route, navigation }) {
  const { venue: initialVenue } = route.params;
  const { venues, favoriteIds, refreshVenues, refreshFavorites, session } = useApp();
  const venue = venues.find(item => item.id === initialVenue.id) || initialVenue;
  const isFavorite = favoriteIds.has(venue.id);
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [score, setScore] = useState({ averageScore: venue.averageScore || 0, reviewCount: venue.reviewCount || 0 });
  const [rating, setRating] = useState('');
  const [body, setBody] = useState('');
  const [photoAsset, setPhotoAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [message, setMessage] = useState('');

  const loadCommunity = useCallback(async () => {
    setLoading(true);
    try {
      const [published, mine] = await Promise.all([
        getVenueReviews(venue.id),
        getMyVenueReview(venue.id),
      ]);
      setReviews(published);
      setMyReview(mine);
      if (mine) {
        setRating(String(mine.rating));
        setBody(mine.body || '');
      }
      const rows = await refreshVenues();
      const updated = rows.find(item => item.id === venue.id);
      if (updated) setScore({ averageScore: updated.averageScore, reviewCount: updated.reviewCount });
    } catch (error) {
      setMessage(error?.message || 'Reviews are unavailable right now.');
    } finally {
      setLoading(false);
    }
  }, [refreshVenues, venue.id]);

  useEffect(() => { loadCommunity(); }, [loadCommunity]);

  async function toggleFavorite() {
    setFavoriteBusy(true);
    setMessage('');
    try {
      await setFavorite(venue.id, !isFavorite);
      await refreshFavorites();
    } catch (error) {
      setMessage(error?.message || 'Your favorite could not be updated.');
    } finally {
      setFavoriteBusy(false);
    }
  }

  async function choosePhoto() {
    setMessage('');
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo', selectionLimit: 1, maxWidth: 1600, maxHeight: 1600,
        quality: 0.84, includeBase64: true, assetRepresentationMode: 'compatible',
      });
      if (result.didCancel) return;
      if (result.errorCode) {
        setMessage(result.errorMessage || 'The photo library could not be opened.');
        return;
      }
      if (result.assets?.[0]) setPhotoAsset(result.assets[0]);
    } catch (error) {
      setMessage(error?.message || 'The photo library could not be opened.');
    }
  }

  async function submitReview() {
    if (!session?.user) return navigation.navigate('Login');
    if (!rating.trim()) return setMessage('Add a rating from 0.0 to 10.0.');
    setSaving(true);
    setMessage('');
    try {
      const saved = await saveVenueReview({ venueId: venue.id, rating, body, photoAsset });
      setMyReview(saved);
      setPhotoAsset(null);
      await loadCommunity();
      setMessage('Your rating and review are saved.');
    } catch (error) {
      setMessage(error?.message || 'Your review could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(review) {
    Alert.alert('Delete your review?', 'Your rating and photo will be removed from this venue.', [
      { text: 'Keep review', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteReview(review); setMyReview(null); setRating(''); setBody(''); await loadCommunity(); }
        catch (error) { setMessage(error?.message || 'The review could not be deleted.'); }
      } },
    ]);
  }

  function confirmReport(review) {
    Alert.alert('Report this review', 'Our team will review this content.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report', style: 'destructive', onPress: async () => {
        try { await reportReview(review.id, 'other'); setMessage('Thanks. Your report was sent to the moderation team.'); }
        catch (error) { setMessage(error?.message || 'This review could not be reported.'); }
      } },
    ]);
  }

  function directions() {
    const query = encodeURIComponent([venue.name, venue.address, venue.city, venue.state].filter(Boolean).join(', '));
    Linking.openURL('https://maps.google.com/?q=' + query).catch(() => setMessage('Directions could not be opened.'));
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <TouchableOpacity accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.back}>
        <AppIcon name="arrow-left" size={17} color={colors.roast} />
        <Text style={styles.backText}>BACK TO DISCOVERY</Text>
      </TouchableOpacity>
      <ImageBackground source={{ uri: venue.photoUrl || fallbackPhoto }} resizeMode="contain" style={styles.photo} imageStyle={styles.photoImage}>
        <View style={styles.shade} />
        <View style={styles.photoLabel}>
          <Text style={styles.photoTag}>{venue.isDemo ? 'DEMO PLACEHOLDER' : venue.espressoMartiniVerified ? 'ESPRESSO MARTINI VERIFIED' : 'TOPTINI CITY GUIDE'}</Text>
          <Text style={styles.photoCity}>{venue.city.toUpperCase()}{venue.state ? ' · ' + venue.state : ''}</Text>
        </View>
      </ImageBackground>
      <View style={styles.nameRow}>
        <View style={styles.nameBlock}>
          <Text style={styles.eyebrow}>THE POUR</Text>
          <Text style={styles.name}>{venue.name}</Text>
        </View>
        <View style={styles.scoreBadge}>
          <AppIcon name="star" size={14} color={colors.gold} />
          <Text style={styles.scoreValue}>{score.reviewCount ? Number(score.averageScore).toFixed(1) : '—'}</Text>
          <Text style={styles.scoreCaption}>{score.reviewCount ? score.reviewCount + ' RATINGS' : 'NO RATINGS'}</Text>
        </View>
      </View>
      <View style={styles.addressRow}>
        <AppIcon name="map-pin" size={15} color={colors.roast} />
        <Text style={styles.address}>{venue.address}{venue.city ? ', ' + venue.city : ''}{venue.state ? ', ' + venue.state : ''}</Text>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity onPress={toggleFavorite} disabled={favoriteBusy} style={[styles.actionButton, isFavorite && styles.actionButtonActive]}>
          <AppIcon name="heart" size={15} color={isFavorite ? colors.cream : colors.roast} />
          <Text style={[styles.actionLabel, isFavorite && styles.actionLabelActive]}>{favoriteBusy ? 'SAVING…' : isFavorite ? 'SAVED' : 'SAVE PLACE'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={directions} style={styles.actionButton}>
          <AppIcon name="navigation" size={15} color={colors.roast} />
          <Text style={styles.actionLabel}>DIRECTIONS</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />
      <Text style={styles.sectionLabel}>ABOUT THIS PLACE</Text>
      <Text style={styles.description}>{venue.description || 'Venue details are being verified for the TopTini city guide.'}</Text>
      {venue.isDemo ? <Text style={styles.demoNote}>Placeholder listing. Replace this venue with verified client venue details before launch.</Text> : null}
      {venue.website || venue.phone ? (
        <View style={styles.contactRow}>
          {venue.website ? <Text onPress={() => Linking.openURL(venue.website).catch(() => {})} style={styles.contactLink}>VISIT WEBSITE</Text> : null}
          {venue.phone ? <Text onPress={() => Linking.openURL('tel:' + venue.phone).catch(() => {})} style={styles.contactLink}>{venue.phone}</Text> : null}
        </View>
      ) : null}
      <View style={styles.divider} />
      <View style={styles.sectionHeading}>
        <View><Text style={styles.sectionLabel}>THE COMMUNITY</Text><Text style={styles.sectionTitle}>Rate this pour</Text></View>
        {myReview ? <Text style={styles.editHint}>YOUR REVIEW · EDITABLE</Text> : null}
      </View>
      <Text style={styles.formHint}>One honest rating per person and venue. Decimal scores are welcome.</Text>
      <View style={styles.ratingInputRow}>
        <TextInput value={rating} onChangeText={value => setRating(value.replace(/[^0-9.]/g, '').slice(0, 4))} keyboardType="decimal-pad" placeholder="8.5" placeholderTextColor={colors.muted} style={styles.ratingInput} maxLength={4} />
        <Text style={styles.ratingScale}>/ 10.0</Text>
        <View style={styles.ratingStars}><AppIcon name="star" size={17} color={colors.gold} /><Text style={styles.ratingStarsText}>TOPTINI SCORE</Text></View>
      </View>
      <TextInput value={body} onChangeText={setBody} placeholder="What made this espresso martini stand out?" placeholderTextColor={colors.muted} multiline maxLength={1500} textAlignVertical="top" style={styles.reviewInput} />
      <TouchableOpacity onPress={choosePhoto} style={styles.photoPicker}>
        {photoAsset ? <Image source={{ uri: photoAsset.uri }} resizeMode="contain" style={styles.selectedPhoto} /> : myReview?.photoUrl && !photoAsset ? <Image source={{ uri: myReview.photoUrl }} resizeMode="contain" style={styles.selectedPhoto} /> : <AppIcon name="camera" size={17} color={colors.roast} />}
        <Text style={styles.photoPickerText}>{photoAsset ? 'PHOTO READY TO UPLOAD' : myReview?.photoUrl ? 'CHANGE DRINK PHOTO' : 'ADD A DRINK PHOTO'}</Text>
        <AppIcon name="arrow-right" size={15} color={colors.muted} />
      </TouchableOpacity>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <PrimaryButton title={myReview ? 'UPDATE MY REVIEW' : 'SUBMIT RATING'} onPress={submitReview} loading={saving} />
      {myReview ? <TouchableOpacity onPress={() => confirmDelete(myReview)} style={styles.deleteReview}><Text style={styles.deleteReviewText}>DELETE MY REVIEW</Text></TouchableOpacity> : null}
      <View style={styles.divider} />
      <View style={styles.sectionHeading}>
        <View><Text style={styles.sectionLabel}>RECENT TASTES</Text><Text style={styles.sectionTitle}>What people are saying</Text></View>
        <Text style={styles.reviewCount}>{score.reviewCount} TOTAL</Text>
      </View>
      {loading ? <ActivityIndicator style={styles.loader} color={colors.roast} /> : reviews.length ? reviews.map(review => (
        <View key={review.id} style={styles.reviewCard}>
          <View style={styles.reviewTop}>
            <View style={styles.reviewerAvatar}><Text style={styles.reviewerInitial}>{review.authorName.slice(0, 1).toUpperCase()}</Text></View>
            <View style={styles.reviewerInfo}><Text style={styles.reviewerName}>{review.authorName}</Text><Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</Text></View>
            <View style={styles.reviewRating}><AppIcon name="star" size={12} color={colors.gold} /><Text style={styles.reviewRatingText}>{review.rating.toFixed(1)}</Text></View>
          </View>
          {review.body ? <Text style={styles.reviewBody}>{review.body}</Text> : null}
          {review.photoUrl ? <Image source={{ uri: review.photoUrl }} resizeMode="contain" style={styles.reviewPhoto} /> : null}
          <View style={styles.reviewFooter}>
            {review.userId === session?.user?.id ? <Text style={styles.ownReviewTag}>YOUR REVIEW</Text> : <TouchableOpacity onPress={() => confirmReport(review)}><Text style={styles.reportText}>REPORT</Text></TouchableOpacity>}
            {review.userId === session?.user?.id ? <TouchableOpacity onPress={() => confirmDelete(review)}><Text style={styles.reportText}>DELETE</Text></TouchableOpacity> : null}
          </View>
        </View>
      )) : <View style={styles.emptyReviews}><AppIcon name="sparkles" size={17} color={colors.gold} /><Text style={styles.emptyTitle}>Be the first to rate this pour</Text><Text style={styles.emptyBody}>Your review helps the next person find their new favorite.</Text></View>}
    </ScrollView>
  );
}

