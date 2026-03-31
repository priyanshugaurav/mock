import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import Constants from 'expo-constants';
import { NativeModules } from 'react-native';

const { width, height } = Dimensions.get('window');

// Check if we are in Expo Go or if the native module is missing
const isNativeModuleAvailable = !!NativeModules.RNGoogleSignin;

let GoogleSignin = null;
let statusCodes = {};

// Only require the library if the native module exists to prevent crash
if (isNativeModuleAvailable) {
  const GSignin = require('@react-native-google-signin/google-signin');
  GoogleSignin = GSignin.GoogleSignin;
  statusCodes = GSignin.statusCodes;
}

const PINK_DARK = '#FF8A9F';
const TEXT_DARK = '#2D3142';
const TEXT_GRAY = '#9098B1';
const WHITE = '#FFFFFF';
const BORDER_COLOR = 'rgba(0,0,0,0.08)';

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (GoogleSignin) {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID || 'YOUR_WEB_CLIENT_ID_HERE', 
        offlineAccess: true,
        forceCodeForRefreshToken: true,
      });
    }
  }, []);

  const handleNativeGoogleLogin = async () => {
    if (!GoogleSignin) {
      Alert.alert('Native Module Required', 'Native Google Sign-In does not work in the standard Expo Go app. Please use Email login for development, or build a custom Dev Client/APK to test Google Sign-In.');
      return;
    }

    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      if (userInfo?.data?.idToken) {
        // Send the native Google token to Supabase
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: userInfo.data.idToken,
        });
        
        if (error) throw error;
      } else {
        throw new Error('No ID token present!');
      }

    } catch (error) {
      console.error('Native Google Auth Error:', error);
      
      // Specifically handle environment errors gracefully for Expo Go users
      if (error.message && error.message.includes('NativeModule')) {
         Alert.alert('Native Module Required', 'Native Google Sign-In does not work in the standard Expo Go app. Please use the Email login for development, or build an APK to test Google Sign-In.');
      } else if (error.code === statusCodes.SIGN_IN_CANCELLED) {
         // user cancelled the login flow
      } else if (error.code === statusCodes.IN_PROGRESS) {
         // operation already in progress
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
         Alert.alert('Google Play Services not available or outdated');
      } else {
         Alert.alert('Authentication Failed', error.message || 'An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both an email and a password.');
      return;
    }
    
    setIsLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
        });
        if (error) throw error;
        Alert.alert('Success', 'Check your email to confirm your account (if enabled), or you are now logged in!');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        if (error) throw error;
      }
    } catch (error) {
      Alert.alert('Authentication Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : null}>
      <StatusBar style="dark" />
      
      {/* Decorative Background Elements */}
      <View style={[styles.blurCircle, { top: -100, right: -50, width: 300, height: 300, backgroundColor: 'rgba(255, 138, 159, 0.15)' }]} />
      <View style={[styles.blurCircle, { bottom: height * 0.2, left: -100, width: 250, height: 250, backgroundColor: 'rgba(255, 138, 159, 0.1)' }]} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="sparkles" size={40} color={PINK_DARK} />
          </View>
          <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'Sign up to build your custom mock dashboard.' : 'Sign in to access your personalized learning journey.'}
          </Text>
        </View>

        <View style={styles.formContainer}>
          {/* Email Login Section */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={TEXT_GRAY} style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={TEXT_GRAY} style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="********"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleEmailAuth}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color={WHITE} /> : <Text style={styles.primaryButtonText}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>}
          </TouchableOpacity>

          {/* Toggle between Login and Signup */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            </Text>
            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
              <Text style={styles.toggleTextBold}>{isSignUp ? 'Sign In' : 'Sign Up'}</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Native Google Connect */}
          <TouchableOpacity 
            style={styles.googleButton} 
            onPress={handleNativeGoogleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-google" size={20} color={TEXT_DARK} />
            <Text style={styles.googleButtonText}>Continue with Google (Native)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 30,
    paddingTop: height * 0.12,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  blurCircle: {
    position: 'absolute',
    borderRadius: 200,
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: PINK_DARK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: TEXT_GRAY,
    lineHeight: 22,
    fontWeight: '500',
    maxWidth: '90%',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: TEXT_DARK,
    fontWeight: '500',
    height: '100%',
  },
  primaryButton: {
    backgroundColor: PINK_DARK,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: PINK_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  toggleText: {
    fontSize: 14,
    color: TEXT_GRAY,
    fontWeight: '500',
  },
  toggleTextBold: {
    fontSize: 14,
    color: PINK_DARK,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER_COLOR,
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 12,
    color: TEXT_GRAY,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WHITE,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    gap: 12,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
  }
});
