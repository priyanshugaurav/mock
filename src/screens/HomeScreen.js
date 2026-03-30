import React, { useRef, useEffect } from 'react';
import { StyleSheet, Text, View, ImageBackground, TouchableOpacity, Dimensions, Platform, Animated, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const PINK_BASE = '#FFDDE4';
const PINK_DARK = '#FF8A9F';
const PINK_TEXT = '#D95C72';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#2D3142';
const TEXT_GRAY = '#9098B1';
const BG_LIGHT = '#F8F9FB';

export default function HomeScreen({ navigation }) {
  const chartAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(chartAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.fixedContent}>

        {/* Full Image Header */}
        <ImageBackground
          source={{ uri: 'https://i.pinimg.com/1200x/1a/d9/4b/1ad94b746400d2a85c95c51f2b2d6d84.jpg' }}
          style={styles.heroBackground}
          imageStyle={styles.heroImageStyle}
        >
          {/* We can overlay a slight gradient to make text readable */}
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.0)', 'rgba(255,255,255,0.8)']}
            style={styles.headerOverlay}
          >
            <SafeAreaView style={styles.headerTop}>
              <View style={styles.logoTag}>
                <Text style={styles.logoText}>MATHS</Text>
              </View>
              <TouchableOpacity style={styles.notificationBtn}>
                <Ionicons name="notifications" size={20} color={PINK_DARK} />
                <View style={styles.badge} />
              </TouchableOpacity>
            </SafeAreaView>

            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>Master Exam</Text>
              <View style={styles.heroBadgeRow}>
                <View style={[styles.heroBadge, { backgroundColor: PINK_DARK }]}>
                  <Text style={styles.heroBadgeText}>Pro Member</Text>
                </View>
                <View style={[styles.heroBadge, { backgroundColor: '#FFB72B', marginLeft: 8 }]}>
                  <Text style={styles.heroBadgeText}>+50 XP</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>

        {/* Stats Section replacing the Categories & Cards */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Your Performance</Text>

          <View style={styles.statsGrid}>

            {/* Primary Stat: ELO */}
            <View style={[styles.statCard, styles.statCardLarge]}>
              <View style={styles.statIconFloat}>
                <FontAwesome5 name="chess" size={24} color={WHITE} />
              </View>
              <Text style={styles.statValue}>1450</Text>
              <Text style={styles.statLabel}>Current Elo</Text>
              <Text style={styles.statSubInfo}>Silver II Rank</Text>
            </View>

            <View style={styles.statsColumn}>
              {/* Accuracy */}
              <View style={styles.statCardSmall}>
                <View style={[styles.statIconSmall, { backgroundColor: '#E8F5E9' }]}>
                  <MaterialCommunityIcons name="target-account" size={20} color="#43A047" />
                </View>
                <View>
                  <Text style={styles.statValueSmall}>87%</Text>
                  <Text style={styles.statLabelSmall}>Accuracy</Text>
                </View>
              </View>

              {/* Streak */}
              <View style={[styles.statCardSmall, { marginTop: 12 }]}>
                <View style={[styles.statIconSmall, { backgroundColor: '#FFF3E0' }]}>
                  <MaterialCommunityIcons name="fire" size={20} color="#F4511E" />
                </View>
                <View>
                  <Text style={styles.statValueSmall}>12 Days</Text>
                  <Text style={styles.statLabelSmall}>Hot Streak</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Full Width Mini Animated Chart */}
          <View style={styles.miniChartCard}>
            <View style={styles.chartHeaderRow}>
              <Text style={styles.chartTitle}>Activity Graph</Text>
              <Text style={styles.chartSub}>Last 14 Days</Text>
            </View>
            <View style={styles.fullWidthBars}>
              <Animated.View style={[styles.fwBar, { height: chartAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '70%'] }) }]} />
              <Animated.View style={[styles.fwBar, { backgroundColor: PINK_DARK, height: chartAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '60%'] }) }]} />
              <Animated.View style={[styles.fwBar, { height: chartAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '90%'] }) }]} />
              <Animated.View style={[styles.fwBar, { backgroundColor: PINK_DARK, height: chartAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '40%'] }) }]} />
              <Animated.View style={[styles.fwBar, { height: chartAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '70%'] }) }]} />
              <Animated.View style={[styles.fwBar, { height: chartAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '20%'] }) }]} />
              <Animated.View style={[styles.fwBar, { height: chartAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '50%'] }) }]} />
              <Animated.View style={[styles.fwBar, { height: chartAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '80%'] }) }]} />
              <Animated.View style={[styles.fwBar, { backgroundColor: PINK_DARK, height: chartAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '40%'] }) }]} />
              <Animated.View style={[styles.fwBar, { height: chartAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '60%'] }) }]} />
              <Animated.View style={[styles.fwBar, { height: chartAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
              <Animated.View style={[styles.fwBar, { height: chartAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '30%'] }) }]} />
              <Animated.View style={[styles.fwBar, { backgroundColor: PINK_DARK, height: chartAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '90%'] }) }]} />
              <Animated.View style={[styles.fwBar, { backgroundColor: PINK_DARK, height: chartAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '80%'] }) }]} />
            </View>
          </View>

          {/* New Quick Practice Button at the bottom */}
          <TouchableOpacity
            style={styles.quickPracticeBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('QuickPractice')}
          >
            <LinearGradient
              colors={[PINK_DARK, '#E56D84']}
              style={styles.quickPracticeBtnInner}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Ionicons name="flash-outline" size={24} color={WHITE} />
              <Text style={styles.qpBtnText}>Start Quick Practice</Text>
            </LinearGradient>
          </TouchableOpacity>

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_LIGHT,
  },
  fixedContent: {
    flex: 1,
  },
  heroBackground: {
    width: '100%',
    height: 420, // Slightly shorter to guarantee fit without scroll
    backgroundColor: PINK_BASE,
  },
  heroImageStyle: {
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  headerOverlay: {
    flex: 1,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    paddingHorizontal: 25,
    justifyContent: 'space-between',
    paddingBottom: 30,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoTag: {
    backgroundColor: PINK_TEXT,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoText: {
    color: WHITE,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 1,
  },
  notificationBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 20,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 12,
    backgroundColor: '#FF3B30',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heroContent: {
    alignItems: 'flex-start',
  },
  heroTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
    fontSize: 36,
    fontWeight: '900',
    color: TEXT_DARK,
    marginBottom: 12,
  },
  heroBadgeRow: {
    flexDirection: 'row',
  },
  heroBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroBadgeText: {
    color: WHITE,
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionContainer: {
    marginTop: 25,
    paddingHorizontal: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: WHITE,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  statCardLarge: {
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
    backgroundColor: PINK_DARK,
  },
  statIconFloat: {
    position: 'absolute',
    top: -10,
    right: -10,
    opacity: 0.2,
    transform: [{ scale: 4 }]
  },
  statValue: {
    fontSize: 38,
    fontWeight: '900',
    color: WHITE,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
    opacity: 0.9,
  },
  statSubInfo: {
    fontSize: 12,
    color: WHITE,
    opacity: 0.7,
    marginTop: 8,
    fontWeight: '600',
  },
  statsColumn: {
    flex: 0.9,
  },
  statCardSmall: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  statIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statValueSmall: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  statLabelSmall: {
    fontSize: 12,
    color: TEXT_GRAY,
    fontWeight: '600',
  },
  quickPracticeBtn: {
    marginTop: 25,
    shadowColor: PINK_DARK,
    shadowOpacity: 0.4,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  quickPracticeBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 20,
  },
  qpBtnText: {
    color: WHITE,
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  miniChartCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
    marginTop: 15,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    height: 100,
    overflow: 'hidden',
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  chartSub: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_GRAY,
  },
  fullWidthBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 15,
  },
  fwBar: {
    flex: 1,
    marginHorizontal: 2,
    backgroundColor: '#E8EAF6',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  }
});
