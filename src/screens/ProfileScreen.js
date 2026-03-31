import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Image,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const PINK_DARK = '#FF8A9F';
const TEXT_DARK = '#2D3142';
const TEXT_GRAY = '#9098B1';
const WHITE = '#FFFFFF';

export default function ProfileScreen() {
  const { user } = useAuth();
  
  // Extract user details (if available from Google OAuth)
  const userMetadata = user?.user_metadata || {};
  const avatarUrl = userMetadata.avatar_url;
  const fullName = userMetadata.full_name || user?.email || 'Guest User';

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const SettingsItem = ({ icon, label, onPress, color = TEXT_DARK }) => (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={styles.settingsLeft}>
        <View style={[styles.iconWrapper, { backgroundColor: color === '#FF4B4B' ? '#FFF0F0' : '#F5F7FA' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={[styles.settingsLabel, { color }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#D0D5DD" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header / Avatar */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.placeholderAvatar]}>
                <Ionicons name="person" size={40} color={PINK_DARK} />
              </View>
            )}
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="pencil" size={14} color={WHITE} />
            </TouchableOpacity>
          </View>

          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Tests</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>85%</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>3.2k</Text>
            <Text style={styles.statLabel}>XP Earned</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Account settings</Text>
          
          <SettingsItem icon="person-outline" label="Personal Information" />
          <SettingsItem icon="notifications-outline" label="Notifications" />
          <SettingsItem icon="lock-closed-outline" label="Privacy & Security" />
          
          <Text style={styles.sectionTitle}>Support</Text>
          <SettingsItem icon="headset-outline" label="Help Center" />
          <SettingsItem icon="document-text-outline" label="Terms & Policies" />

          {/* Logout */}
          <View style={styles.logoutContainer}>
            <SettingsItem icon="log-out-outline" label="Log Out" color="#FF4B4B" onPress={handleLogout} />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  scrollContent: {
    paddingBottom: 100, // accommodate bottom tab
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: WHITE,
  },
  placeholderAvatar: {
    backgroundColor: '#FFEBF0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: PINK_DARK,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: WHITE,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: TEXT_GRAY,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    marginHorizontal: 20,
    borderRadius: 20,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: TEXT_GRAY,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F2F5',
    marginVertical: 4,
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_GRAY,
    marginTop: 16,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: WHITE,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutContainer: {
    marginTop: 24,
  }
});
