import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  Alert,
  Linking,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AppIcon from '../components/AppIcon';
import {
  getMyReviews,
  getMySubmissions,
  requestAccountDeletion,
  saveProfile,
  signOut,
  uploadAvatar,
} from '../api';
import { useApp } from '../context/AppContext';
import PrimaryButton from '../components/PrimaryButton';
import { colors } from '../styles/theme';
import styles from './ProfileScreen.styles';
import { launchImageLibrary } from 'react-native-image-picker';

export default function ProfileScreen({ navigation }) {
  const { profile, setProfile, city, setCity, cities, favorites } = useApp();
  const [username, setUsername] = useState(profile?.username || '');
  const [preferredCity, setPreferredCity] = useState(
    profile?.preferredCity || city,
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [communityBusy, setCommunityBusy] = useState(false);
  const [myReviews, setMyReviews] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const hasUnsavedChanges =
    !profile ||
    username.trim() !== (profile.username || '').trim() ||
    preferredCity !== (profile.preferredCity || city);

  useEffect(() => {
    setUsername(profile?.username || '');
    setPreferredCity(profile?.preferredCity || city);
  }, [profile?.id, profile?.username, profile?.preferredCity, city]);
  useEffect(() => {
    let active = true;
    if (!profile) {
      setMyReviews([]);
      setMySubmissions([]);
      return () => { active = false; };
    }
    setCommunityBusy(true);
    Promise.all([getMyReviews(), getMySubmissions()])
      .then(([reviews, submissions]) => {
        if (!active) return;
        setMyReviews(reviews);
        setMySubmissions(submissions);
      })
      .catch(error => {
        if (active) setMessage(error?.message || 'Your community activity could not be loaded.');
      })
      .finally(() => { if (active) setCommunityBusy(false); });
    return () => { active = false; };
  }, [profile?.id]);
  async function changePhoto() {
    if (!profile) return navigation.navigate('Auth');
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.82,
      includeBase64: true,
      assetRepresentationMode: 'compatible',
    });
    if (result.didCancel) return;
    if (result.errorCode) {
      setMessage(
        result.errorMessage || 'The photo library could not be opened.',
      );
      return;
    }
    if (!result.assets?.[0]) return;
    setUploadingPhoto(true);
    setMessage('');
    try {
      setProfile(await uploadAvatar(result.assets[0]));
      setMessage('Your profile photo is saved.');
    } catch (error) {
      setMessage(error?.message || 'Your photo could not be uploaded.');
    } finally {
      setUploadingPhoto(false);
    }
  }
  async function save() {
    if (!profile) return navigation.navigate('Auth');
    if (username.trim().length < 2)
      return setMessage('Please choose a name with at least 2 characters.');
    setSaving(true);
    setMessage('');
    try {
      const updated = await saveProfile({
        username: username.trim(),
        preferredCity,
      });
      setProfile(updated);
      setCity(updated.preferredCity);
      setMessage('Your profile is saved.');
    } catch (error) {
      setMessage(
        error?.message ||
          'Profile changes could not be saved. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  }
  async function logOut() {
    setSigningOut(true);
    setMessage('');
    try {
      await signOut();
      setProfile(null);
    } catch (error) {
      setMessage(
        error?.message || 'You could not be signed out. Please try again.',
      );
    } finally {
      setSigningOut(false);
    }
  }
  function confirmAccountDeletion() {
    Alert.alert(
      'Delete your TopTini account?',
      'This permanently deletes your profile, ratings, reviews, submitted venues, favorites, and uploaded photos.',
      [
        { text: 'Keep my account', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            setDeletingAccount(true);
            setMessage('');
            try {
              await requestAccountDeletion();
              setProfile(null);
            } catch (error) {
              setMessage(error?.message || 'Account deletion could not be completed.');
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ],
    );
  }
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>YOUR TOPTINI</Text>
        <Text style={styles.title}>A good night{'\n'}starts with you.</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.identity}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            onPress={changePhoto}
            disabled={uploadingPhoto}
            style={styles.avatar}
          >
            {profile?.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <AppIcon name="user" size={23} color={colors.softGold} />
            )}
          </TouchableOpacity>
          <View style={styles.identityText}>
            <Text style={styles.name}>
              {profile?.username || 'Your profile'}
            </Text>
            <Text style={styles.email}>
              {profile?.email || 'Sign in to keep your details with you'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={changePhoto}
          disabled={uploadingPhoto}
          style={styles.photoAction}
        >
          <Text style={styles.photoActionText}>
            {uploadingPhoto ? 'UPLOADING PHOTO…' : 'CHANGE PROFILE PHOTO'}
          </Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <Text style={styles.label}>YOUR NAME</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Choose a username"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <Text style={[styles.label, styles.cityLabel]}>YOUR HOME CITY</Text>
        <View style={styles.cityGrid}>
          {cities.map(item => (
            <TouchableOpacity
              key={item}
              onPress={() => setPreferredCity(item)}
              style={[
                styles.cityChip,
                preferredCity === item && styles.cityChipActive,
              ]}
            >
              <Text
                style={[
                  styles.cityChipText,
                  preferredCity === item && styles.cityChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.hint}>
          Your home city helps us bring the best local pours closer.
        </Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {hasUnsavedChanges ? (
          <PrimaryButton
            title={profile ? 'SAVE PROFILE' : 'SIGN IN TO SAVE'}
            onPress={save}
            loading={saving}
          />
        ) : null}
      </View>
      <View style={styles.communitySection}>
        <View style={styles.sectionHeading}>
          <View><Text style={styles.label}>YOUR GUIDE</Text><Text style={styles.sectionTitle}>Saved places</Text></View>
          <Text style={styles.sectionCount}>{favorites.length}</Text>
        </View>
        {favorites.length ? favorites.map(venue => (
          <TouchableOpacity key={venue.id} onPress={() => navigation.navigate('VenueDetail', { venue })} style={styles.activityRow}>
            <AppIcon name="heart" size={15} color={colors.terracotta} />
            <View style={styles.activityText}><Text style={styles.activityTitle}>{venue.name}</Text><Text style={styles.activityMeta}>{venue.city} · {venue.address}</Text></View>
            <AppIcon name="chevron-right" size={15} color={colors.muted} />
          </TouchableOpacity>
        )) : <Text style={styles.sectionEmpty}>Save venues from their detail page and they’ll be waiting here.</Text>}
      </View>
      <View style={styles.communitySection}>
        <View style={styles.sectionHeading}>
          <View><Text style={styles.label}>YOUR TASTES</Text><Text style={styles.sectionTitle}>Ratings & reviews</Text></View>
          <Text style={styles.sectionCount}>{myReviews.length}</Text>
        </View>
        {communityBusy ? <Text style={styles.sectionEmpty}>Loading your reviews…</Text> : myReviews.length ? myReviews.map(review => (
          <TouchableOpacity key={review.id} onPress={() => review.venue && navigation.navigate('VenueDetail', { venue: review.venue })} style={styles.activityRow}>
            <AppIcon name="star" size={15} color={colors.gold} />
            <View style={styles.activityText}><Text style={styles.activityTitle}>{review.venue?.name || 'Venue review'} · {review.rating.toFixed(1)}</Text><Text numberOfLines={2} style={styles.activityMeta}>{review.body || 'Rating saved'} </Text></View>
            <AppIcon name="chevron-right" size={15} color={colors.muted} />
          </TouchableOpacity>
        )) : <Text style={styles.sectionEmpty}>Your ratings and reviews will show here.</Text>}
      </View>
      <View style={styles.communitySection}>
        <View style={styles.sectionHeading}>
          <View><Text style={styles.label}>YOUR CONTRIBUTIONS</Text><Text style={styles.sectionTitle}>Venue suggestions</Text></View>
          <Text style={styles.sectionCount}>{mySubmissions.length}</Text>
        </View>
        {communityBusy ? <Text style={styles.sectionEmpty}>Loading your suggestions…</Text> : mySubmissions.length ? mySubmissions.map(item => (
          <View key={item.id} style={styles.activityRow}>
            <AppIcon name="map-pin" size={15} color={colors.roast} />
            <View style={styles.activityText}><Text style={styles.activityTitle}>{item.name}</Text><Text style={styles.activityMeta}>{item.city} · {item.address}</Text></View>
            <Text style={[styles.statusTag, item.status === 'approved' && styles.statusApproved, item.status === 'rejected' && styles.statusRejected]}>{item.status.toUpperCase()}</Text>
          </View>
        )) : <Text style={styles.sectionEmpty}>Venue ideas you send for review will show here.</Text>}
      </View>
      {profile ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={logOut}
          disabled={signingOut}
          style={styles.signOut}
        >
          <AppIcon name="log-out" size={15} color={colors.roast} />
          <Text style={styles.signOutText}>
            {signingOut ? 'SIGNING OUT…' : 'SIGN OUT'}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => navigation.navigate('Auth')}
          style={styles.signOut}
        >
          <Text style={styles.signOutText}>SIGN IN OR CREATE ACCOUNT</Text>
        </TouchableOpacity>
      )}
      {profile ? (
        <TouchableOpacity accessibilityRole="button" onPress={confirmAccountDeletion} disabled={deletingAccount} style={styles.deleteAccount}>
          <AppIcon name="trash" size={14} color={colors.terracotta} />
          <Text style={styles.deleteAccountText}>{deletingAccount ? 'DELETING ACCOUNT…' : 'DELETE ACCOUNT'}</Text>
        </TouchableOpacity>
      ) : null}
      <View style={styles.legalLinks}>
        <TouchableOpacity
          accessibilityRole="link"
          onPress={() => navigation.navigate('Legal', { document: 'privacy' })}
          style={styles.legalLinkButton}
        >
          <Text style={styles.legalLinkText}>PRIVACY POLICY</Text>
        </TouchableOpacity>
        <Text style={styles.legalSeparator}>·</Text>
        <TouchableOpacity
          accessibilityRole="link"
          onPress={() => navigation.navigate('Legal', { document: 'terms' })}
          style={styles.legalLinkButton}
        >
          <Text style={styles.legalLinkText}>TERMS &amp; CONDITIONS</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.attribution}>
        Icons by{' '}
        <Text
          style={styles.attributionLink}
          onPress={() => Linking.openURL('https://www.flaticon.com/uicons')}
        >
          Flaticon
        </Text>
      </Text>
    </ScrollView>
  );
}
