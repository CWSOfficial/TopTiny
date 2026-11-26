import React from 'react';
import { ImageBackground, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from './AppIcon';
import { colors } from '../styles/theme';
import styles from './VenueCard.styles';

const fallbackPhoto =
  'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=85';
export default function VenueCard({ venue, onPress, onRatePress }) {
  return (
    <View style={styles.card}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <ImageBackground
          source={{ uri: venue.photoUrl || fallbackPhoto }}
          imageStyle={styles.photoImage}
          style={styles.photo}
        >
          <View style={styles.photoShade} />
          <View style={styles.photoTop}>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>
                {venue.isDemo ? 'DEMO VENUE' : venue.espressoMartiniVerified ? 'MENU VERIFIED' : 'TOPTINI GUIDE'}
              </Text>
            </View>
            <View style={styles.scoreBadge}>
              <View style={styles.scoreValueRow}>
                <AppIcon name="star" size={14} color={colors.gold} />
                <Text style={styles.scoreValue}>
                  {venue.reviewCount ? Number(venue.averageScore).toFixed(1) : '—'}
                </Text>
                <Text style={styles.scoreScale}>/10</Text>
              </View>
              <Text style={styles.scoreLabel}>TOPTINI SCORE</Text>
            </View>
          </View>
          <View style={styles.photoText}>
            <Text style={styles.category}>ESPRESSO MARTINI</Text>
            <Text numberOfLines={1} style={styles.name}>
              {venue.name}
            </Text>
          </View>
        </ImageBackground>
      </TouchableOpacity>
      <View style={styles.meta}>
        <View style={styles.placeIcon}>
          <AppIcon name="map-pin" size={13} color={colors.roast} />
        </View>
        <View style={styles.metaText}>
          <Text numberOfLines={1} style={styles.address}>
            {venue.address}
          </Text>
          <View style={styles.ratingRow}>
            <AppIcon name="star" size={10} color={colors.gold} />
            <Text style={styles.ratingText}>
              {venue.reviewCount ? Number(venue.averageScore).toFixed(1) : 'New'}
            </Text>
            <Text style={styles.ratingCount}>
              {venue.reviewCount ? `· ${venue.reviewCount} ratings` : '· be the first to rate'}
            </Text>
          </View>
          <Text style={styles.city}>
            {venue.city}
            {venue.state ? `, ${venue.state}` : ''}
            {venue.priceLevel ? `  ·  ${'$'.repeat(venue.priceLevel)}` : ''}
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Rate ${venue.name}`}
          onPress={onRatePress}
          style={styles.rateButton}
        >
          <AppIcon name="star" size={13} color={colors.cream} />
          <Text style={styles.rateButtonText}>RATE IT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
