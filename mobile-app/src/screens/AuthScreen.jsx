import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import AppIcon from '../components/AppIcon';
import { resendSignupConfirmation, signIn, signInApple, signUp } from '../api';
import { useApp } from '../context/AppContext';
import PrimaryButton from '../components/PrimaryButton';
import TopTiniLogo from '../components/TopTiniLogo';
import { colors } from '../styles/theme';
import styles from './AuthScreen.styles';

function authErrorMessage(error) {
  const message = error?.message || '';
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) {
    return 'Email or password is incorrect. If you just registered, confirm your email first.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Please confirm your email using the link we sent, then sign in.';
  }
  if (normalized.includes('user already registered')) {
    return 'An account already exists with this email. Sign in instead.';
  }
  if (normalized.includes('signup is disabled')) {
    return 'New account registration is temporarily unavailable. Please try again later.';
  }
  if (normalized.includes('email address not authorized') || normalized.includes('email_address_not_authorized')) {
    return 'Supabase email delivery is limited to team addresses right now. Configure a custom SMTP provider to send confirmation emails to all users.';
  }
  if (normalized.includes('permission denied for table profiles') || normalized.includes('could not find the table') && normalized.includes('profiles')) {
    return 'Sign-in worked, but the TopTini profile table or its permissions are not set up correctly. Please contact the app administrator.';
  }
  if (normalized.includes('network request failed') || normalized.includes('fetch failed')) {
    return 'Could not reach TopTini. Check your internet connection and try again.';
  }
  if (normalized.includes('provider') && normalized.includes('not enabled')) {
    return 'Apple sign-in is not enabled for TopTini yet. The administrator must enable Apple under Supabase Auth providers and allow com.toptini.app.';
  }
  if (normalized.includes('unsupported provider') || normalized.includes('provider is disabled')) {
    return 'Apple sign-in is not enabled for TopTini yet. The administrator must enable Apple under Supabase Auth providers and allow com.toptini.app.';
  }
  if (normalized.includes('rate limit') || normalized.includes('too many')) {
    return 'Too many attempts. Please wait a moment before trying again.';
  }
  return (
    message ||
    'We couldn’t connect to your account. Check your connection and try again.'
  );
}

export default function AuthScreen({ navigation, route }) {
  const { city, setProfile, cities } = useApp();
  const mode = route.name === 'Signup' ? 'register' : 'login';
  const [email, setEmail] = useState(route.params?.email || '');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [preferredCity, setPreferredCity] = useState(city);
  const [loading, setLoading] = useState(false);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState(
    route.params?.confirmationEmail || '',
  );
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const notice = route.params?.notice;

  async function submit() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password)
      return setError('Enter your email and password to continue.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail))
      return setError('Enter a valid email address.');
    if (mode === 'register' && password.length < 8)
      return setError('Choose a password with at least 8 characters.');
    if (mode === 'register' && username.trim().length < 2)
      return setError('Choose a username with at least 2 characters.');
    if (mode === 'register' && username.trim().length > 30)
      return setError('Choose a username with 30 characters or fewer.');
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (mode === 'register') {
        const result = await signUp(
          normalizedEmail,
          password,
          username.trim(),
          preferredCity,
        );
        if (result.confirmationRequired) {
          setConfirmationEmail(normalizedEmail);
          setPassword('');
          setSuccess('Check your inbox (and spam folder) for the confirmation link. Confirm your email, then sign in.');
          return;
        }
        setProfile(result.profile);
        return;
      }

      const next = await signIn(normalizedEmail, password);
      setProfile(next);
    } catch (e) {
      if (e?.message?.toLowerCase().includes('email not confirmed')) {
        setConfirmationEmail(normalizedEmail);
      }
      setError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function resendConfirmation() {
    if (!confirmationEmail || resendingConfirmation) return;
    setResendingConfirmation(true);
    setError('');
    setSuccess('');
    try {
      await resendSignupConfirmation(confirmationEmail);
      setSuccess('A new confirmation link has been sent. Check your inbox and spam folder.');
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setResendingConfirmation(false);
    }
  }
  async function continueWithApple() {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });
      if (!result.identityToken)
        throw new Error('Apple sign in did not return a valid identity.');
      const name = [result.fullName?.givenName, result.fullName?.familyName]
        .filter(Boolean)
        .join(' ');
      const next = await signInApple(
        result.identityToken,
        result.nonce,
        name || undefined,
        result.authorizationCode,
      );
      setProfile(next);
    } catch (e) {
      if (e?.code !== appleAuth.Error.CANCELED) setError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {mode === 'register' ? (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => navigation.replace('Login', {
              email: email.trim().toLowerCase(),
              confirmationEmail,
              notice: confirmationEmail ? 'Confirm your email before signing in.' : undefined,
            })}
            style={styles.back}
          >
            <AppIcon name="arrow-left" size={17} color={colors.roast} />
            <Text style={styles.backText}>BACK TO SIGN IN</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.topLabel}>
            <Text style={styles.backText}>YOUR EVENING, WELL PLANNED</Text>
          </View>
        )}
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <TopTiniLogo size="large" />
          </View>
          <Text style={styles.eyebrow}>
            {mode === 'login' ? 'WELCOME BACK' : 'WELCOME TO THE TABLE'}
          </Text>
          <Text style={styles.title}>
            {mode === 'login'
              ? 'Your next night\nout starts here.'
              : 'Make it a night\nto remember.'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'login'
              ? 'Sign in to discover your next favorite night out.'
              : 'Create your account to make every night out your own.'}
          </Text>
        </View>
        {mode === 'register' ? (
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Choose a username"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
            autoComplete="username"
            textContentType="username"
            maxLength={30}
            style={styles.input}
          />
        ) : null}
        <TextInput
          value={email}
          onChangeText={value => {
            setEmail(value);
            if (value.trim().toLowerCase() !== confirmationEmail) {
              setConfirmationEmail('');
            }
          }}
          placeholder="Email address"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password · 8 characters minimum"
          placeholderTextColor={colors.muted}
          secureTextEntry
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          textContentType={mode === 'login' ? 'password' : 'newPassword'}
          style={styles.input}
        />
        {mode === 'register' ? (
          <View style={styles.cityPicker}>
            <Text style={styles.cityLabel}>YOUR HOME CITY</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cityRow}
            >
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
            </ScrollView>
          </View>
        ) : null}
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        {success || notice ? (
          <Text style={styles.success}>{success || notice}</Text>
        ) : null}
        {confirmationEmail ? (
          <TouchableOpacity
            accessibilityRole="button"
            disabled={resendingConfirmation}
            onPress={resendConfirmation}
            style={styles.resendConfirmation}
          >
            <Text style={styles.resendConfirmationText}>
              {resendingConfirmation ? 'SENDING LINK…' : 'RESEND CONFIRMATION EMAIL'}
            </Text>
          </TouchableOpacity>
        ) : null}
        <PrimaryButton
          title={
            mode === 'login'
              ? 'SIGN IN'
              : confirmationEmail
                ? 'BACK TO SIGN IN'
                : 'CREATE MY ACCOUNT'
          }
          onPress={
            mode === 'register' && confirmationEmail
              ? () => navigation.replace('Login', {
                  email: confirmationEmail,
                  confirmationEmail,
                  notice: 'Confirm your email using the link, then sign in.',
                })
              : submit
          }
          loading={loading}
          variant="dark"
        />
        {Platform.OS === 'ios' && appleAuth.isSupported ? (
          <>
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>OR CONTINUE WITH</Text>
              <View style={styles.separatorLine} />
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Continue with Apple"
              activeOpacity={0.82}
              onPress={continueWithApple}
              style={styles.appleButton}
            >
              <Text style={styles.appleMark}></Text>
              <Text style={styles.appleButtonText}>CONTINUE WITH APPLE</Text>
            </TouchableOpacity>
          </>
        ) : null}
        <TouchableOpacity
          style={styles.switch}
          onPress={() => {
            navigation.replace(mode === 'login' ? 'Signup' : 'Login', {
              email: email.trim().toLowerCase(),
              confirmationEmail,
              notice: mode === 'register' && confirmationEmail
                ? 'Confirm your email before signing in.'
                : undefined,
            });
            setError('');
            setSuccess('');
          }}
        >
          <Text style={styles.switchText}>
            {mode === 'login'
              ? 'New to TopTini?  Create an account'
              : 'Already have an account?  Sign in'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.privacy}>
          {mode === 'register' ? 'By creating an account, you agree to the ' : 'By continuing, you acknowledge the '}
          <Text
            accessibilityRole="link"
            onPress={() => navigation.navigate('Legal', { document: 'terms' })}
            style={styles.privacyLink}
          >
            Terms &amp; Conditions
          </Text>
          {' and acknowledge the '}
          <Text
            accessibilityRole="link"
            onPress={() => navigation.navigate('Legal', { document: 'privacy' })}
            style={styles.privacyLink}
          >
            Privacy Policy
          </Text>
          {'. TopTini is for adults 21 and older in the United States.'}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
