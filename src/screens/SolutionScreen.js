import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// ─── Gamified Minimalist Design Tokens ─────────────────────
const BG = '#F3F4F6';         // Soft gray app background
const SURFACE = '#FFFFFF';    // Pure white cards
const TEXT_PRIMARY = '#1F2937';// Deep charcoal text
const TEXT_MUTED = '#6B7280'; // Slate text for secondary details
const PRIMARY_GREEN = '#10B981'; // Vibrant emerald green for correct
const PRIMARY_DARK = '#111827';  // Very dark blue/black for hero
const GOLD = '#F59E0B';       // Amber/Gold for XP & Tips
const PINK = '#EC4899';       // Accent pink
const BORDER = '#E5E7EB';     // Soft borders

export default function SolutionScreen({ route, navigation }) {
  const { item, index } = route.params;
  const insets = useSafeAreaInsets();
  const letters = ['A', 'B', 'C', 'D'];
  const correctAnswer = item.options[item.correctIndex];
  const steps = item.explanationSteps || [];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* ─── MINIMAL NAVBAR ───────────────────────────────── */}
      <View style={[styles.navbar, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Solution</Text>
        <View style={styles.navBtn} /> {/* Spacer */}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollPad,
          { paddingBottom: Math.max(insets.bottom, 20) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── GAMIFIED HERO CARD ───────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroBadge}>
              <Ionicons name="checkmark-circle" size={16} color={PRIMARY_GREEN} />
              <Text style={styles.heroBadgeTxt}>Correct Answer</Text>
            </View>
            <View style={styles.heroXp}>
              <Ionicons name="star" size={14} color={GOLD} />
              <Text style={styles.heroXpTxt}>+10 XP</Text>
            </View>
          </View>
          <Text style={styles.heroAnswerText}>{correctAnswer}</Text>
        </View>

        {/* ─── QUESTION BLOCK ───────────────────────────────── */}
        <View style={styles.qBlock}>
          <Text style={styles.qHeader}>
            QUESTION {index + 1}
          </Text>
          <Text style={styles.qText}>{item.question}</Text>
        </View>

        {/* ─── MATH WORKING AREA ──────────────────────────── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>SOLUTION WORKING</Text>
          <View style={styles.mathWorkArea}>
            {steps.map((step, idx) => {
              const isLast = idx === steps.length - 1;
              const isFinal = step.startsWith('∴') || step.startsWith('Final') || isLast;
              return (
                <View key={idx} style={[styles.mathStepRow, isFinal && styles.mathStepRowFinal]}>
                  {isFinal && <View style={styles.mathFinalAccent} />}
                  <Text style={styles.mathStepNum}>{idx + 1}.</Text>
                  <Text style={[styles.mathStepText, isFinal && styles.mathStepTextFinal]}>
                     {step}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ─── EXPLANATION ──────────────────────────────────── */}
        {item.explanation && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>EXPLANATION</Text>
            <View style={styles.explCard}>
              <Text style={styles.explText}>{item.explanation}</Text>
            </View>
          </View>
        )}

        {/* ─── SMART TIP ────────────────────────────────────── */}
        {item.tip && (
          <View style={styles.tipCard}>
            <View style={styles.tipIconWrap}>
              <Ionicons name="bulb" size={20} color={GOLD} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>Pro Tip</Text>
              <Text style={styles.tipText}>{item.tip}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: BG,
  },
  navBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: -0.5,
  },
  scrollPad: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 32,
  },

  // Hero Card
  heroCard: {
    backgroundColor: PRIMARY_DARK,
    borderRadius: 24,
    padding: 24,
    shadowColor: PRIMARY_DARK,
    shadowOpacity: 0.2,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)', // Light green tint
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  heroBadgeTxt: {
    fontSize: 12,
    fontWeight: '800',
    color: PRIMARY_GREEN,
    textTransform: 'uppercase',
  },
  heroXp: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)', // Light gold tint
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  heroXpTxt: {
    fontSize: 14,
    fontWeight: '900',
    color: GOLD,
  },
  heroAnswerText: {
    fontSize: 24,
    fontWeight: '800',
    color: SURFACE,
    lineHeight: 32,
  },

  // Question Block
  qBlock: {
    gap: 8,
  },
  qHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: TEXT_MUTED,
    letterSpacing: 1.5,
  },
  qText: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    lineHeight: 26,
  },

  // Sections
  sectionWrap: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: TEXT_MUTED,
    letterSpacing: 1.5,
  },

  // Math Working Area
  mathWorkArea: {
    backgroundColor: PRIMARY_DARK,
    borderRadius: 20,
    paddingVertical: 16,
    overflow: 'hidden',
    shadowColor: PRIMARY_DARK,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  mathStepRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'flex-start',
    position: 'relative',
  },
  mathStepRowFinal: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)', // Subtle green tint
  },
  mathFinalAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: PRIMARY_GREEN,
  },
  mathStepNum: {
    width: 28,
    fontSize: 14,
    fontWeight: '800',
    color: '#4B5563', // gray-600
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  mathStepText: {
    flex: 1,
    fontSize: 16,
    color: '#E2E8F0', // slate-200
    lineHeight: 26,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  mathStepTextFinal: {
    color: PRIMARY_GREEN,
    fontWeight: '800',
  },

  // Explanation
  explCard: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 20,
  },
  explText: {
    fontSize: 15,
    color: TEXT_PRIMARY,
    lineHeight: 24,
    fontWeight: '500',
  },

  // Smart Tip
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7', // light amber
    borderRadius: 20,
    padding: 20,
    gap: 16,
    alignItems: 'flex-start',
  },
  tipIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDE68A', // darker amber
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B45309', // deep amber
    marginBottom: 4,
  },
  tipText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#92400E',
    lineHeight: 22,
  },
});
