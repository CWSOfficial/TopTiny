import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../components/AppIcon';
import { colors } from '../styles/theme';
import styles from './LegalScreen.styles';

const policies = {
  privacy: {
    title: 'Privacy Policy',
    intro: 'This policy explains what TopTini collects and how it is used when you discover, rate, and review espresso martinis.',
    sections: [
      ['Information you provide', 'TopTini stores your account email, username, home city, ratings, reviews, profile photo, drink photos, saved venues, and venue suggestions.'],
      ['Location', 'If you choose Near Me and grant permission, TopTini uses your device location to sort nearby venues and show your position on the map. The app uses that location for the current discovery session; it does not save it to your profile. You can deny or revoke location access in device settings.'],
      ['How information is used', 'Your information supports sign-in, your profile, venue discovery, community scores, saved venues, review moderation, and account support.'],
      ['What is public', 'Published ratings, review text, username, review date, and any drink photo attached to a published review may be visible to other users. Venue suggestions remain private while they are reviewed.'],
      ['Service providers', 'TopTini uses Supabase to provide authentication, database, and photo storage. Sign in with Apple sends the identity information you authorize to the app and its authentication provider. These services process information to provide their features.'],
      ['Your choices and deletion', 'You can update your profile, remove your own reviews or saved venues, and request account deletion from Profile. Account deletion removes your profile and associated activity and uploaded photos, subject to completion by the service.'],
      ['Contact', 'For privacy questions, use the contact details on the TopTini website. The public support email is being finalized.'],
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    intro: 'By using TopTini, you agree to these terms. Please use the guide responsibly and share accurate information.',
    sections: [
      ['Eligibility', 'You must be at least 21 years old to use TopTini in the United States. Follow local laws and venue rules when visiting a bar or restaurant.'],
      ['Community content', 'Submit honest ratings and reviews based on your own experience. Do not post unlawful, abusive, deceptive, threatening, or infringing content, or attempt to manipulate venue scores.'],
      ['Reviews and photos', 'You retain ownership of what you submit. You give TopTini permission to display submitted reviews and photos as part of the guide and its community features. You can edit or delete your own reviews in the app. TopTini may hide or remove content that violates these terms or is reported.'],
      ['Venue suggestions and accuracy', 'Venue suggestions are reviewed and are not published automatically. Listings, menus, hours, prices, and availability can change. Confirm details directly with a venue before visiting. Community scores are opinions, not guarantees or endorsements.'],
      ['Account and deletion', 'Keep your sign-in credentials secure. You may request account deletion from Profile; deletion removes your profile and associated contributions from TopTini.'],
      ['Changes', 'TopTini may update these terms as the service changes. Continued use after a change means you accept the updated terms.'],
      ['Contact', 'For questions about these terms, use the contact details on the TopTini website. The public support email is being finalized.'],
    ],
  },
};

export default function LegalScreen({ navigation, route }) {
  const document = route.params?.document === 'terms' ? 'terms' : 'privacy';
  const policy = policies[document];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <AppIcon name="arrow-left" size={17} color={colors.roast} />
        <Text style={styles.backText}>BACK</Text>
      </TouchableOpacity>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>TOPTINI · LEGAL</Text>
        <Text style={styles.title}>{policy.title}</Text>
        <Text style={styles.updated}>Last updated November 10, 2026</Text>
        <Text style={styles.intro}>{policy.intro}</Text>
      </View>
      <View style={styles.sections}>
        {policy.sections.map(([title, body], index) => (
          <View key={title} style={styles.section}>
            <Text style={styles.sectionNumber}>{String(index + 1).padStart(2, '0')}</Text>
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionTitle}>{title}</Text>
              <Text style={styles.body}>{body}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.switchPolicy}>
        <Text style={styles.switchLabel}>ALSO READ</Text>
        <TouchableOpacity
          accessibilityRole="link"
          onPress={() => navigation.setParams({ document: document === 'privacy' ? 'terms' : 'privacy' })}
          style={styles.switchButton}
        >
          <Text style={styles.switchText}>{document === 'privacy' ? 'Terms & Conditions' : 'Privacy Policy'}</Text>
          <AppIcon name="chevron-right" size={14} color={colors.roast} />
        </TouchableOpacity>
      </View>
      <Text style={styles.footer}>TOPTINI · A CITY GUIDE FOR THE ESPRESSO MARTINI CURIOUS</Text>
    </ScrollView>
  );
}
