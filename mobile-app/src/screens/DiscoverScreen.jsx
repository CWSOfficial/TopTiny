import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import AppIcon from '../components/AppIcon';
import { useApp } from '../context/AppContext';
import { colors } from '../styles/theme';
import ScreenHeader from '../components/ScreenHeader';
import SectionHeading from '../components/SectionHeading';
import VenueCard from '../components/VenueCard';
import EmptyState from '../components/EmptyState';
import styles from './DiscoverScreen.styles';

export default function DiscoverScreen({ navigation }) {
  const { city, setCity, cities, cityMeta, venues, profile, venueLoading, apiUnavailable } =
    useApp();
  const [view, setView] = useState('list');
  const [query, setQuery] = useState('');
  const [cityPicker, setCityPicker] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationMessage, setLocationMessage] = useState('');
  const filtered = useMemo(() => {
    const matches = venues.filter(item =>
      `${item.name} ${item.address}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    );
    if (!userLocation) return matches;
    const distance = venue => {
      const radians = degree => (degree * Math.PI) / 180;
      const dLat = radians(venue.latitude - userLocation.latitude);
      const dLon = radians(venue.longitude - userLocation.longitude);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(radians(userLocation.latitude)) *
          Math.cos(radians(venue.latitude)) *
          Math.sin(dLon / 2) ** 2;
      return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };
    return matches.sort((first, second) => distance(first) - distance(second));
  }, [venues, query, userLocation]);
  const meta = cityMeta[city];
  const openProfile = () => navigation.navigate(profile ? 'Profile' : 'Auth');
  const onMarker = venue => navigation.navigate('VenueDetail', { venue });
  const findNearby = () => {
    setLocationMessage('');
    Geolocation.getCurrentPosition(
      position => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setView('map');
      },
      error => {
        setLocationMessage(
          error.code === 1
            ? 'Allow location access in Settings to see what’s nearby.'
            : 'Your location is unavailable right now. Showing the selected city.',
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        city={city}
        onCityPress={() => setCityPicker(true)}
        onProfilePress={openProfile}
      />
      {view === 'map' ? (
        <View style={styles.fullMapScreen}>
          <MapView
            style={styles.fullMap}
            initialRegion={{
              ...meta,
              latitudeDelta: 0.07,
              longitudeDelta: 0.07,
            }}
            region={{
              ...(userLocation || meta),
              latitudeDelta: 0.07,
              longitudeDelta: 0.07,
            }}
            showsUserLocation={Boolean(userLocation)}
          >
            {filtered.map(venue => (
              <Marker
                key={venue.id}
                coordinate={{
                  latitude: venue.latitude,
                  longitude: venue.longitude,
                }}
                title={venue.name}
                description={
                  venue.address +
                  (venue.reviewCount
                    ? ` · ${Number(venue.averageScore).toFixed(1)} (${venue.reviewCount} ratings)`
                    : ' · Be the first to rate')
                }
                onCalloutPress={() => onMarker(venue)}
              >
                <View style={styles.mapPin}>
                  <AppIcon name="coffee" size={13} color={colors.cream} />
                </View>
              </Marker>
            ))}
          </MapView>
          <View style={styles.mapControls}>
            <View style={styles.search}>
              <AppIcon name="search" size={17} color={colors.roast} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search places or addresses"
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
                returnKeyType="search"
              />
              <TouchableOpacity onPress={() => setQuery('')}>
              <AppIcon name="sliders" size={16} color={colors.roast} />
              </TouchableOpacity>
            </View>
            <View style={styles.mapToolsRow}>
              <TouchableOpacity onPress={findNearby} style={styles.nearButton}>
                <AppIcon name="navigation" size={12} color={colors.roast} />
                <Text style={styles.nearButtonText}>NEAR ME</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel="Switch to list view"
                onPress={() => setView('list')}
                style={styles.mapListButton}
              >
                <AppIcon name="list" size={15} color={colors.cream} />
                <Text style={styles.mapListButtonText}>LIST</Text>
              </TouchableOpacity>
            </View>
            {locationMessage ? (
              <Text style={styles.mapLocationMessage}>{locationMessage}</Text>
            ) : null}
          </View>
          <View pointerEvents="none" style={styles.mapCaption}>
            <Text style={styles.mapCaptionTitle}>{city}, {meta.state}</Text>
            <Text style={styles.mapCaptionBody}>
              {filtered.length} places to discover
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Suggest a venue"
            onPress={() => navigation.navigate('SubmitVenue')}
            style={styles.mapSuggest}
          >
            <AppIcon name="plus" size={18} color={colors.cream} />
          </TouchableOpacity>
        </View>
      ) : <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground
          source={{
            uri: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1400&q=90',
          }}
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroShade} />
          <View style={styles.heroContent}>
            <View style={styles.heroTag}>
              <View style={styles.liveDot} />
              <Text style={styles.heroEyebrow}>THE CITY IS YOURS</Text>
            </View>
            <Text style={styles.heroTitle}>
              Find your
              <Text style={styles.heroItalic}>{'\n'}perfect pour.</Text>
            </Text>
            <Text style={styles.heroSub}>
              The espresso martinis worth going out for.
            </Text>
            <View style={styles.heroBottom}>
              <View>
                <Text style={styles.heroCount}>
                  {String(venues.length).padStart(2, '0')}
                </Text>
                <Text style={styles.heroMeta}>LOCAL SPOTS</Text>
              </View>
              <View style={styles.heroDivider} />
              <Text style={styles.heroCity}>
                {city.toUpperCase()}
                {'\n'}
                {meta.state} · EST. FOR TONIGHT
              </Text>
            </View>
          </View>
        </ImageBackground>
        <View style={styles.searchRow}>
          <View style={styles.search}>
            <AppIcon name="search" size={17} color={colors.roast} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search places or addresses"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={() => setQuery('')}>
              <AppIcon name="sliders" size={16} color={colors.roast} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.sectionHeader}>
          <SectionHeading eyebrow="CURATED FOR YOU" title={`Around ${city}`} />
          <View style={styles.toolsRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Find venues near me"
              onPress={findNearby}
              style={styles.nearButton}
            >
              <AppIcon name="navigation" size={12} color={colors.roast} />
              <Text style={styles.nearButtonText}>NEAR ME</Text>
            </TouchableOpacity>
            <View style={styles.viewToggle}>
              <TouchableOpacity
                accessibilityLabel="List view"
                onPress={() => setView('list')}
                style={[
                  styles.toggleButton,
                  view === 'list' && styles.toggleActive,
                ]}
              >
                <AppIcon
                  name="list"
                  size={15}
                  color={view === 'list' ? colors.cream : colors.muted}
                />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel="Map view"
                onPress={() => setView('map')}
                style={[
                  styles.toggleButton,
                  view === 'map' && styles.toggleActive,
                ]}
              >
                <AppIcon
                  name="map"
                  size={15}
                  color={view === 'map' ? colors.cream : colors.muted}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {locationMessage ? (
          <Text style={styles.locationMessage}>{locationMessage}</Text>
        ) : null}
        {venueLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.roast} />
            <Text style={styles.loadingText}>Finding your next favorite…</Text>
          </View>
        ) : null}
        <View style={styles.cards}>
            {filtered.length ? (
              filtered.map(venue => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  onPress={() => onMarker(venue)}
                />
              ))
            ) : (
              <EmptyState
                icon={apiUnavailable ? 'wifi-off' : 'coffee'}
                title={
                  apiUnavailable
                    ? 'We can’t reach your guide just yet.'
                    : query
                    ? 'No matches this time.'
                    : `${city} is getting ready.`
                }
                message={
                  apiUnavailable
                    ? 'Please check your connection and try again. Your city guide will be here when the database is available.'
                    : query
                    ? 'Try another name or address to find a great pour.'
                    : 'Our local venue guide is being prepared. Check back soon for the first verified places.'
                }
              />
            )}
        </View>
        <TouchableOpacity
          activeOpacity={0.86}
          onPress={() => navigation.navigate('SubmitVenue')}
          style={styles.upcoming}
        >
          <View style={styles.upcomingIcon}>
            <AppIcon name="plus" size={15} color={colors.gold} />
          </View>
          <View style={styles.upcomingText}>
            <Text style={styles.upcomingTitle}>Know a great local pour?</Text>
            <Text style={styles.upcomingBody}>
              Suggest a venue. We’ll verify the details before it joins the guide.
            </Text>
          </View>
          <AppIcon name="arrow-right" size={14} color={colors.roast} />
        </TouchableOpacity>
        <View style={styles.footer}>
          <Text style={styles.footerMark}>T.</Text>
          <Text style={styles.footerLegal}>
            Discover responsibly · For guests 21+
          </Text>
        </View>
      </ScrollView>}
      <Modal
        visible={cityPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setCityPicker(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setCityPicker(false)}
          style={styles.modalBackdrop}
        >
          <View style={styles.citySheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetEyebrow}>CHOOSE YOUR CITY</Text>
            <Text style={styles.sheetTitle}>Where tonight?</Text>
            {cities.map(item => (
              <TouchableOpacity
                key={item}
                onPress={() => {
                  setCity(item);
                  setCityPicker(false);
                }}
                style={styles.cityOption}
              >
                <View
                  style={[
                    styles.cityDot,
                    item === city && styles.cityDotSelected,
                  ]}
                />
                <Text
                  style={[
                    styles.cityOptionText,
                    item === city && styles.cityOptionSelected,
                  ]}
                >
                  {item}
                </Text>
                <Text style={styles.cityState}>{cityMeta[item]?.state}</Text>
                {item === city ? (
                  <AppIcon name="check" size={16} color={colors.roast} />
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
