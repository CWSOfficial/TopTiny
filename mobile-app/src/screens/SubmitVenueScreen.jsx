import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AppIcon from '../components/AppIcon';
import PrimaryButton from '../components/PrimaryButton';
import { submitVenue } from '../api';
import { useApp } from '../context/AppContext';
import { colors } from '../styles/theme';
import styles from './SubmitVenueScreen.styles';

export default function SubmitVenueScreen({ navigation }) {
  const { city, cities, cityMeta } = useApp();
  const [form, setForm] = useState({ name: '', address: '', city, phone: '', website: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const change = (key, value) => setForm(current => ({ ...current, [key]: value }));
  async function send() {
    setSaving(true); setMessage('');
    try {
      await submitVenue({ ...form, state: cityMeta[form.city].state });
      setMessage('Thanks. Your suggestion is in the review queue and will appear in the guide after approval.');
      setForm(current => ({ ...current, name: '', address: '', phone: '', website: '', note: '' }));
    } catch (error) { setMessage(error?.message || 'Your venue could not be submitted.'); }
    finally { setSaving(false); }
  }
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}><AppIcon name="arrow-left" size={16} color={colors.roast} /><Text style={styles.backText}>BACK</Text></TouchableOpacity>
        <View style={styles.heading}><Text style={styles.eyebrow}>GROW THE GUIDE</Text><Text style={styles.title}>Know a great{'\n'}espresso martini?</Text><Text style={styles.subtitle}>Send us the place. We’ll check the details and add it to the city guide after review.</Text></View>
        <View style={styles.card}>
          <Text style={styles.label}>VENUE NAME *</Text><TextInput value={form.name} onChangeText={value => change('name', value)} placeholder="e.g. The Copper Lounge" placeholderTextColor={colors.muted} style={styles.input} maxLength={120} />
          <Text style={[styles.label, styles.spaced]}>STREET ADDRESS *</Text><TextInput value={form.address} onChangeText={value => change('address', value)} placeholder="Street address and neighborhood" placeholderTextColor={colors.muted} style={styles.input} maxLength={240} />
          <Text style={[styles.label, styles.spaced]}>CITY *</Text><View style={styles.cityGrid}>{cities.map(cityName => <TouchableOpacity key={cityName} onPress={() => change('city', cityName)} style={[styles.cityChip, form.city === cityName && styles.cityChipActive]}><Text style={[styles.cityChipText, form.city === cityName && styles.cityChipTextActive]}>{cityName}</Text></TouchableOpacity>)}</View>
          <Text style={[styles.label, styles.spaced]}>PHONE <Text style={styles.optional}>OPTIONAL</Text></Text><TextInput value={form.phone} onChangeText={value => change('phone', value)} placeholder="(555) 123-4567" placeholderTextColor={colors.muted} style={styles.input} keyboardType="phone-pad" maxLength={40} />
          <Text style={[styles.label, styles.spaced]}>WEBSITE <Text style={styles.optional}>OPTIONAL</Text></Text><TextInput value={form.website} onChangeText={value => change('website', value)} placeholder="https://" placeholderTextColor={colors.muted} style={styles.input} keyboardType="url" autoCapitalize="none" maxLength={240} />
          <Text style={[styles.label, styles.spaced]}>WHY THIS PLACE? <Text style={styles.optional}>OPTIONAL</Text></Text><TextInput value={form.note} onChangeText={value => change('note', value)} placeholder="What makes their espresso martini worth a visit?" placeholderTextColor={colors.muted} style={styles.noteInput} multiline maxLength={1000} textAlignVertical="top" />
          <View style={styles.reviewNote}><AppIcon name="shield-check" size={15} color={colors.green} /><Text style={styles.reviewNoteText}>Every suggestion is checked for accuracy and duplicates before it becomes public.</Text></View>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <PrimaryButton title="SEND FOR REVIEW" onPress={send} loading={saving} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

