import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../components/AppIcon';
import EmptyState from '../components/EmptyState';
import ScreenHeader from '../components/ScreenHeader';
import { getCityLeaderboard } from '../api';
import { useApp } from '../context/AppContext';
import { colors } from '../styles/theme';
import styles from './LeaderboardScreen.styles';

export default function LeaderboardScreen({ navigation }) {
  const { city, setCity, cities, cityMeta, profile } = useApp();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setMessage('');
    try { setRows(await getCityLeaderboard(city)); }
    catch (error) { setMessage(error?.message || 'The leaderboard could not be loaded.'); setRows([]); }
    finally { setLoading(false); }
  }, [city]);
  useEffect(() => { load(); }, [load]);
  return (
    <View style={styles.screen}>
      <ScreenHeader city={city} onCityPress={() => {}} onProfilePress={() => navigation.navigate(profile ? 'Profile' : 'Login')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>THE TOPTINI 10</Text>
          <Text style={styles.title}>Best pours,{'\n'}by city.</Text>
          <Text style={styles.subtitle}>Ranked by community ratings, with a little weight for how many people have tried it.</Text>
        </View>
        <View style={styles.cityPicker}>
          {cities.map(item => <TouchableOpacity key={item} onPress={() => setCity(item)} style={[styles.cityChip, city === item && styles.cityChipActive]}><Text style={[styles.cityChipText, city === item && styles.cityChipTextActive]}>{item}</Text></TouchableOpacity>)}
        </View>
        <View style={styles.listHeader}><View><Text style={styles.listEyebrow}>{cityMeta[city]?.state} · CITY RANKINGS</Text><Text style={styles.listTitle}>{city}</Text></View><AppIcon name="trophy" size={20} color={colors.gold} /></View>
        {loading ? <ActivityIndicator style={styles.loader} color={colors.roast} /> : rows.length ? rows.map((venue, index) => (
          <TouchableOpacity key={venue.id} activeOpacity={0.84} onPress={() => navigation.navigate('VenueDetail', { venue })} style={styles.rankCard}>
            <View style={[styles.rankNumber, index === 0 && styles.rankNumberFirst]}><Text style={[styles.rankText, index === 0 && styles.rankTextFirst]}>{String(index + 1).padStart(2, '0')}</Text></View>
            {venue.photoUrl ? <Image source={{ uri: venue.photoUrl }} style={styles.venuePhoto} /> : <View style={styles.venuePhotoFallback}><AppIcon name="coffee" size={18} color={colors.gold} /></View>}
            <View style={styles.venueInfo}><Text numberOfLines={1} style={styles.venueName}>{venue.name}</Text><Text numberOfLines={1} style={styles.venueAddress}>{venue.address}</Text><Text style={styles.reviewMeta}>{venue.reviewCount} {venue.reviewCount === 1 ? 'RATING' : 'RATINGS'}</Text></View>
            <View style={styles.scoreBlock}><Text style={styles.score}>{Number(venue.averageScore).toFixed(1)}</Text><AppIcon name="star" size={11} color={colors.gold} /></View>
          </TouchableOpacity>
        )) : <View style={styles.empty}><EmptyState icon={message ? 'wifi-off' : 'trophy'} title={message ? 'Rankings unavailable' : 'The first round is on you'} message={message || 'No published ratings in ' + city + ' yet. Rate a venue and put your city on the board.'} /></View>}
        <TouchableOpacity onPress={() => navigation.navigate('SubmitVenue')} style={styles.submitLink}><AppIcon name="plus" size={15} color={colors.roast} /><Text style={styles.submitLinkText}>SUGGEST A VENUE</Text><AppIcon name="arrow-right" size={15} color={colors.roast} /></TouchableOpacity>
        <Text style={styles.scoringNote}>A Bayesian score balances a venue’s average with the city’s average, so one rating does not instantly decide the whole list.</Text>
      </ScrollView>
    </View>
  );
}

