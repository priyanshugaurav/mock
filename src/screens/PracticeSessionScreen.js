import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  FlatList, StatusBar, Animated, PanResponder, ScrollView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const PINK = '#FF8A9F';
const PINK_LIGHT = '#FFF0F3';
const PINK_DARK = '#D95C72';
const GREEN = '#34C759';
const RED = '#FF3B30';
const DARK = '#1A1A2E';
const GRAY = '#8E8E93';

// ─── Questions ─────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 1, question: 'Simplify the ratio 6 : 9',
    options: ['1 : 2', '2 : 3', '3 : 4', '3 : 5'], correctIndex: 1,
    visualData: {
      type: 'simplify', leftName: 'A', rightName: 'B',
      initialLeft: 6, initialRight: 9,
      finalLeft: 2, finalRight: 3,
      divisor: 3
    },
    explanationSteps: [
      "HCF (6, 9) = 3",
      "6 ÷ 3 = 2",
      "9 ÷ 3 = 3",
      "∴ Final Ratio = 2 : 3"
    ]
  },
  {
    id: 2, question: 'Divide ₹45 in the ratio 2 : 3. What is the larger share?',
    options: ['₹15', '₹18', '₹27', '₹30'], correctIndex: 2,
    visualData: { 
      type: 'share', leftName: 'Part 1', rightName: 'Part 2',
      total: 45, leftShare: 2, rightShare: 3 
    },
    explanationSteps: [
      "Total Parts = 2 + 3 = 5",
      "Value of 1 Part = 45 ÷ 5 = 9",
      "Larger Share (3 parts) = 3 × 9 = 27",
      "∴ Larger Share = ₹27"
    ]
  },
  {
    id: 3, question: 'If boys to girls is 3:4 and there are 12 girls, how many boys are there?',
    options: ['6', '8', '9', '16'], correctIndex: 2,
    visualData: { 
      type: 'scale', leftName: 'Boys', rightName: 'Girls',
      leftRatio: 3, rightRatio: 4, rightActual: 12 
    },
    explanationSteps: [
      "Let Boys = 3x, Girls = 4x",
      "Given: Girls = 12",
      "4x = 12 ⟹ x = 3",
      "Boys = 3x = 3 × 3 = 9",
      "∴ Boys = 9"
    ]
  }
];

const INFINITE_DATA = Array.from({ length: 200 }).map((_, i) => ({
  ...QUESTIONS[i % QUESTIONS.length],
  uniqueKey: String(i),
}));

const formatTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}`;
};

// ─── Direction Hints ───────────────────────────────────────────
// Animated italic hints: "swipe up for next ↑" and "swipe left for solution ←"
function DirectionHints({ answered }) {
  const fadeUp = useRef(new Animated.Value(0)).current;
  const fadeLeft = useRef(new Animated.Value(0)).current;
  const nudgeY = useRef(new Animated.Value(4)).current;
  const nudgeX = useRef(new Animated.Value(-4)).current;

  useEffect(() => {
    // Fade in after brief delay
    Animated.parallel([
      Animated.timing(fadeUp, { toValue: 1, duration: 600, delay: 400, useNativeDriver: true }),
      Animated.timing(fadeLeft, { toValue: 1, duration: 600, delay: 700, useNativeDriver: true }),
    ]).start();

    // Gentle looping nudge for up arrow
    Animated.loop(
      Animated.sequence([
        Animated.timing(nudgeY, { toValue: -4, duration: 700, useNativeDriver: true }),
        Animated.timing(nudgeY, { toValue: 4, duration: 700, useNativeDriver: true }),
      ])
    ).start();

    // Gentle looping nudge for left arrow
    Animated.loop(
      Animated.sequence([
        Animated.timing(nudgeX, { toValue: 4, duration: 700, useNativeDriver: true }),
        Animated.timing(nudgeX, { toValue: -4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.hintsRow}>
      {/* Swipe left for solution */}
      <Animated.View
        style={[styles.hintItem, { opacity: fadeLeft, transform: [{ translateX: nudgeX }] }]}
      >
        <Ionicons name="arrow-back" size={13} color={PINK} />
        <Text style={styles.hintText}>swipe left for solution</Text>
      </Animated.View>

      {/* Divider dot */}
      <View style={styles.hintDot} />

      {/* Swipe up for next */}
      <Animated.View
        style={[styles.hintItem, { opacity: fadeUp, transform: [{ translateY: nudgeY }] }]}
      >
        <Text style={styles.hintText}>swipe up for next</Text>
        <Ionicons name="arrow-up" size={13} color={PINK} />
      </Animated.View>
    </View>
  );
}

// ─── Question Reel Item ──────────────────────────────────────────
const QuestionItem = ({ item, index, onAnswer, timerText, insets, currentQuestionIndex, openSolution }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const scaleAnims = useRef(item.options.map(() => new Animated.Value(1))).current;
  const letterArray = ['A', 'B', 'C', 'D'];

  const handleSelect = (idx) => {
    if (isAnswered) return;
    Animated.sequence([
      Animated.timing(scaleAnims[idx], { toValue: 0.96, duration: 50, useNativeDriver: true }),
      Animated.timing(scaleAnims[idx], { toValue: 1,    duration: 50, useNativeDriver: true }),
    ]).start();
    setSelectedAnswer(idx);
    setIsAnswered(true);
    onAnswer(idx === item.correctIndex);
  };

  return (
    <View style={styles.reelItem}>
      <View style={styles.contentWrapper}>
        <View style={styles.timerRow}>
          <Ionicons name="time-outline" size={14} color={GRAY} />
          <Text style={styles.timerLabel}>{timerText}</Text>
        </View>

        <View style={styles.questionMeta}>
          <View style={styles.pinkBar} />
          <Text style={styles.qIndex}>Question {index + 1}</Text>
          <View style={styles.solTapBadge}>
            <Ionicons name="bulb-outline" size={12} color={PINK_DARK} />
            <Text style={styles.solTapBadgeText}>Swipe for Solution</Text>
            <Ionicons name="chevron-forward" size={11} color={PINK_DARK} />
          </View>
        </View>

        <Text style={styles.questionText}>{item.question}</Text>

        <View style={styles.optionsWrap}>
          {item.options.map((opt, i) => {
            const isSelected = selectedAnswer === i;
            const isCorrect = i === item.correctIndex;
            const letter = letterArray[i];

            let borderColor = '#EFEFEF', bgColor = '#FFF', txtColor = DARK;
            let letterBg = PINK_LIGHT, letterColor = PINK;

            if (isAnswered) {
              if (isCorrect) {
                borderColor = GREEN; bgColor = '#EDFFF3'; txtColor = '#1B8C3D';
                letterBg = GREEN; letterColor = '#FFF';
              } else if (isSelected) {
                borderColor = RED; bgColor = '#FFF5F5'; txtColor = RED;
                letterBg = RED; letterColor = '#FFF';
              } else {
                borderColor = '#F5F5F5'; bgColor = '#FAFAFA'; txtColor = '#C5C5C5';
                letterBg = '#F0F0F0'; letterColor = '#C5C5C5';
              }
            }

            return (
              <Animated.View key={i} style={{ transform: [{ scale: scaleAnims[i] }] }}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleSelect(i)}
                  style={[styles.optionRow, { borderColor, backgroundColor: bgColor }]}
                >
                  <View style={[styles.letterBadge, { backgroundColor: letterBg }]}>
                    <Text style={[styles.letterText, { color: letterColor }]}>{letter}</Text>
                  </View>
                  <Text style={[styles.optionText, { color: txtColor }]}>{opt}</Text>
                  {isAnswered && isCorrect && <Ionicons name="checkmark-circle" size={20} color={GREEN} />}
                  {isAnswered && isSelected && !isCorrect && <Ionicons name="close-circle" size={20} color={RED} />}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        <DirectionHints answered={isAnswered} />
      </View>
    </View>
  );
};



// ─── Gamified Inline Solution Components ─────────────────────────────────

const GAMIFIED_BG = '#F3F4F6';
const GAMIFIED_SURFACE = '#FFFFFF';
const GAMIFIED_TEXT_PRIMARY = '#1F2937';
const GAMIFIED_TEXT_MUTED = '#6B7280';
const GAMIFIED_GREEN = '#10B981';
const GAMIFIED_DARK = '#111827';
const GAMIFIED_GOLD = '#F59E0B';
const GAMIFIED_BORDER = '#E5E7EB';

const InlineHeroCard = ({ item }) => {
  if (!item) return null;
  const correctAnswer = item.options[item.correctIndex];
  return (
    <View style={styles.solHeroCard}>
      <View style={styles.solHeroHeader}>
        <View style={styles.solHeroBadge}>
          <Ionicons name="checkmark-circle" size={14} color={GAMIFIED_GREEN} />
          <Text style={styles.solHeroBadgeTxt}>Correct Answer</Text>
        </View>
        <View style={styles.solHeroXp}>
          <Ionicons name="star" size={12} color={GAMIFIED_GOLD} />
          <Text style={styles.solHeroXpTxt}>+10 XP</Text>
        </View>
      </View>
      <Text style={styles.solHeroValue}>{correctAnswer}</Text>
    </View>
  );
};

const InlineStepTimeline = ({ steps }) => {
  if (!steps || steps.length === 0) return null;
  return (
    <View style={styles.solSectionWrap}>
      <Text style={styles.solSectionTitle}>SOLUTION WORKING</Text>
      <View style={styles.solMathWorkArea}>
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const isFinal = step.startsWith('∴') || step.startsWith('Final') || isLast;
          return (
            <View key={idx} style={[styles.solMathStepRow, isFinal && styles.solMathStepRowFinal]}>
              {isFinal && <View style={styles.solMathFinalAccent} />}
              <Text style={styles.solMathStepNum}>{idx + 1}.</Text>
              <Text style={[styles.solMathStepText, isFinal && styles.solMathStepTextFinal]}>
                {step}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// ─── Main ───────────────────────────────────────────────────────
export default function PracticeSessionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const [currentQIndex, setCurrentQIndex] = useState(0);

  useEffect(() => {
    if (showResults) return;
    const t = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [showResults]);

  const handleAnswer = useCallback((isCorrect) => {
    setTotalAttempted(prev => prev + 1);
    if (isCorrect) setCorrectCount(prev => prev + 1);
  }, []);

  const wrongCount = totalAttempted - correctCount;
  const accuracy = totalAttempted === 0 ? 0 : Math.round((correctCount / totalAttempted) * 100);
  const timerText = formatTime(elapsed);

  const currentItem = INFINITE_DATA[currentQIndex];
  const globalScrollRef = useRef(null);

  // ─── Results ──────────────────────────────────────────────────
  if (showResults) {
    return (
      <View style={[styles.resultsContainer, { paddingTop: insets.top + 20 }]}>
        <View style={styles.resultsInner}>
          <Text style={styles.resultsEmoji}>{accuracy >= 80 ? '🏆' : '👏'}</Text>
          <Text style={styles.resultsTitle}>Session Complete</Text>
          <Text style={styles.resultsTime}>{timerText} spent</Text>
          <View style={styles.resultsTiles}>
            <View style={[styles.rTile, { backgroundColor: PINK_LIGHT }]}>
              <Text style={[styles.rTileVal, { color: PINK_DARK }]}>{totalAttempted}</Text>
              <Text style={styles.rTileLabel}>Attempted</Text>
            </View>
            <View style={[styles.rTile, { backgroundColor: '#EDFFF3' }]}>
              <Text style={[styles.rTileVal, { color: GREEN }]}>{correctCount}</Text>
              <Text style={styles.rTileLabel}>Correct</Text>
            </View>
            <View style={[styles.rTile, { backgroundColor: '#FFF5F5' }]}>
              <Text style={[styles.rTileVal, { color: RED }]}>{wrongCount}</Text>
              <Text style={styles.rTileLabel}>Wrong</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={styles.closeBtnText}>Close Practice</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" translucent />

      {/* X close (Global fixed) */}
      <TouchableOpacity
        style={[styles.xBtn, { top: insets.top > 0 ? insets.top + 8 : 30 }]}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        onPress={() => setShowResults(true)}
      >
        <Ionicons name="close" size={22} color={PINK_DARK} />
      </TouchableOpacity>

      <ScrollView
        ref={globalScrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        directionalLockEnabled
      >
        {/* ─── PAGE 1: GLOBAL VERTICAL REEL + BOTTOM CARD ───── */}
        <View style={styles.pageWrap}>
          {/* Reel */}
          <FlatList
            data={INFINITE_DATA}
            keyExtractor={(item) => item.uniqueKey}
            onMomentumScrollEnd={(e) => {
              const newIdx = Math.round(e.nativeEvent.contentOffset.y / height);
              setCurrentQIndex(newIdx);
            }}
            renderItem={({ item, index }) => (
              <QuestionItem
                item={item}
                index={index}
                onAnswer={handleAnswer}
                timerText={timerText}
                insets={insets}
                currentQuestionIndex={currentQIndex}
                openSolution={() => globalScrollRef.current?.scrollTo({ x: width, animated: true })}
              />
            )}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            bounces={false}
            snapToInterval={height}
            snapToAlignment="start"
            decelerationRate="fast"
            initialNumToRender={2}
            windowSize={5}
            getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
          />

          {/* ─── Bottom Stats Card Embedded (Slides away horizontally, fixed vertically) ───── */}
          <View style={[styles.bottomCard, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 18 }]}>
            <View style={styles.chipRow}>
              <View style={styles.statChip}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="checkmark-circle" size={14} color={GREEN} />
                  <Text style={[styles.chipValue, { color: DARK }]}>{correctCount}</Text>
                </View>
                <Text style={styles.chipLabel}>Correct</Text>
              </View>

              <View style={styles.accuracyCenter}>
                <View style={styles.accuracyRing}>
                  <LinearGradient colors={[PINK, PINK_DARK]} style={styles.accuracyGradient}>
                    <Text style={styles.accuracyValue}>{accuracy}%</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.accuracyLabel}>Accuracy</Text>
              </View>

              <View style={styles.statChip}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="close-circle" size={14} color={RED} />
                  <Text style={[styles.chipValue, { color: DARK }]}>{wrongCount}</Text>
                </View>
                <Text style={styles.chipLabel}>Wrong</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.endBtn} onPress={() => setShowResults(true)} activeOpacity={0.85}>
              <LinearGradient
                colors={[PINK, PINK_DARK]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.endBtnGrad}
              >
                <Ionicons name="stop-circle-outline" size={20} color="#FFF" />
                <Text style={styles.endBtnText}>End Session</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── PAGE 2: SOLUTION PAGE ───────────────────────── */}
        <View style={[styles.pageWrap, { backgroundColor: GAMIFIED_BG }]}>
          <View style={[styles.solNavbar, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
            <TouchableOpacity
              style={styles.solNavBtn}
              onPress={() => globalScrollRef.current?.scrollTo({ x: 0, animated: true })}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={GAMIFIED_TEXT_PRIMARY} />
            </TouchableOpacity>
            <Text style={styles.solNavTitle}>Solution</Text>
            <View style={styles.solNavBtn} /> {/* Spacer */}
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.solScrollPad, { paddingBottom: Math.max(insets.bottom, 20) + 40 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Gamified Hero Card */}
            <InlineHeroCard item={currentItem} />

            {/* Question Block */}
            <View style={styles.solQBlock}>
              <Text style={styles.solQHeader}>QUESTION {currentQIndex + 1}</Text>
              <Text style={styles.solQText}>{currentItem?.question}</Text>
            </View>

        {/* Options Review removed entirely per design spec */}

            {/* Timeline */}
            <InlineStepTimeline steps={currentItem?.explanationSteps} />

            {/* Explanation */}
            {currentItem?.explanation && (
              <View style={styles.solSectionWrap}>
                <Text style={styles.solSectionTitle}>EXPLANATION</Text>
                <View style={styles.solExplCard}>
                  <Text style={styles.solExplText}>{currentItem.explanation}</Text>
                </View>
              </View>
            )}

            {/* Smart Tip */}
            {currentItem?.tip && (
              <View style={styles.solTipCard}>
                <View style={styles.solTipIconWrap}>
                  <Ionicons name="bulb" size={20} color={GAMIFIED_GOLD} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.solTipTitle}>Pro Tip</Text>
                  <Text style={styles.solTipText}>{currentItem.tip}</Text>
                </View>
              </View>
            )}

          </ScrollView>
        </View>
      </ScrollView>

    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },

  xBtn: {
    position: 'absolute', left: 20, zIndex: 20,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: PINK_LIGHT,
    justifyContent: 'center', alignItems: 'center',
  },

  // ─── Reel ────────────────────────────────────────────────────
  reelItem: {
    width, height,
    overflow: 'hidden',
  },
  carouselTrack: {
    flexDirection: 'row',
    width: width * 2,
    height: '100%',
  },
  pageWrap: {
    width,
    height: '100%',
    backgroundColor: '#FFF',
  },
  contentWrapper: { 
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24, 
    paddingBottom: 80 
  },

  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 20 },
  timerLabel: { fontSize: 14, fontWeight: '600', color: GRAY, fontVariant: ['tabular-nums'] },

  questionMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  pinkBar: { width: 4, height: 18, backgroundColor: PINK, borderRadius: 2 },
  qIndex: { fontSize: 12, fontWeight: '700', color: PINK, textTransform: 'uppercase', letterSpacing: 2 },

  // Tap badge
  solTapBadge: {
    marginLeft: 'auto',
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: PINK_LIGHT,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1, borderColor: '#FFD6DF',
  },
  solTapBadgeText: { fontSize: 11, fontWeight: '700', color: PINK_DARK },

  questionText: { fontSize: 26, fontWeight: '800', color: DARK, lineHeight: 36, marginBottom: 28 },

  optionsWrap: { gap: 12 },
  optionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 16,
    borderWidth: 1.5, borderRadius: 18,
  },
  letterBadge: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  letterText: { fontSize: 14, fontWeight: '800' },
  optionText: { fontSize: 17, fontWeight: '600', flex: 1, lineHeight: 22 },

  // ─── Direction Hints ─────────────────────────────────────────
  hintsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 28,
  },
  hintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  hintText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: PINK,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  hintDot: {
    width: 4, height: 4,
    borderRadius: 2,
    backgroundColor: '#FFD6DF',
  },

  // ─── Solution Panel (Inline Page 2) Styles ─────────────────────────
  solNavbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 16, backgroundColor: GAMIFIED_BG,
  },
  solNavBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  solNavTitle: { fontSize: 18, fontWeight: '800', color: GAMIFIED_TEXT_PRIMARY, letterSpacing: -0.5 },
  solScrollPad: { paddingHorizontal: 20, paddingTop: 8, gap: 32 },

  // Hero Card
  solHeroCard: {
    backgroundColor: GAMIFIED_DARK, borderRadius: 24, padding: 24,
    shadowColor: GAMIFIED_DARK, shadowOpacity: 0.2, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  solHeroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  solHeroBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 6,
  },
  solHeroBadgeTxt: { fontSize: 12, fontWeight: '800', color: GAMIFIED_GREEN, textTransform: 'uppercase' },
  solHeroXp: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4,
  },
  solHeroXpTxt: { fontSize: 14, fontWeight: '900', color: GAMIFIED_GOLD },
  solHeroValue: { fontSize: 24, fontWeight: '800', color: GAMIFIED_SURFACE, lineHeight: 32 },

  // Question Block
  solQBlock: { gap: 8 },
  solQHeader: { fontSize: 12, fontWeight: '800', color: GAMIFIED_TEXT_MUTED, letterSpacing: 1.5 },
  solQText: { fontSize: 18, fontWeight: '700', color: GAMIFIED_TEXT_PRIMARY, lineHeight: 26 },

  // Sections
  solSectionWrap: { gap: 12 },
  solSectionTitle: { fontSize: 12, fontWeight: '800', color: GAMIFIED_TEXT_MUTED, letterSpacing: 1.5 },

  // Math Working Area (Replaces Options / Timeline)
  solMathWorkArea: {
    backgroundColor: GAMIFIED_DARK, borderRadius: 20, paddingVertical: 16, overflow: 'hidden',
    shadowColor: GAMIFIED_DARK, shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  solMathStepRow: {
    flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, alignItems: 'flex-start', position: 'relative',
  },
  solMathStepRowFinal: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)', // Subtle green tint
  },
  solMathFinalAccent: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: GAMIFIED_GREEN,
  },
  solMathStepNum: {
    width: 28, fontSize: 14, fontWeight: '800', color: '#4B5563', marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  solMathStepText: {
    flex: 1, fontSize: 16, color: '#E2E8F0', lineHeight: 26, fontWeight: '500', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  solMathStepTextFinal: {
    color: GAMIFIED_GREEN, fontWeight: '800',
  },

  // Explanation
  solExplCard: { backgroundColor: GAMIFIED_SURFACE, borderRadius: 20, padding: 20 },
  solExplText: { fontSize: 15, color: GAMIFIED_TEXT_PRIMARY, lineHeight: 24, fontWeight: '500' },

  // Smart Tip
  solTipCard: { flexDirection: 'row', backgroundColor: '#FEF3C7', borderRadius: 20, padding: 20, gap: 16, alignItems: 'flex-start' },
  solTipIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FDE68A', justifyContent: 'center', alignItems: 'center' },
  solTipTitle: { fontSize: 14, fontWeight: '800', color: '#B45309', marginBottom: 4 },
  solTipText: { fontSize: 15, fontWeight: '500', color: '#92400E', lineHeight: 22 },

  bottomHint: {
    position: 'absolute', left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, backgroundColor: 'rgba(255, 255, 255, 0.95)',
    gap: 4
  },
  bottomHintText: {
    fontSize: 12, fontStyle: 'italic', color: GRAY, fontWeight: '500'
  },

  // ─── Bottom Stats Card ───────────────────────────────────────
  bottomCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF', paddingTop: 20, paddingHorizontal: 20, zIndex: 15,
  },
  chipRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 16,
  },
  statChip: {
    alignItems: 'center', justifyContent: 'center',
    flex: 1,
  },
  chipValue: { fontSize: 20, fontWeight: '800' },
  chipLabel: { fontSize: 11, fontWeight: '600', color: GRAY, marginTop: 2 },

  accuracyCenter: { alignItems: 'center', marginHorizontal: 12 },
  accuracyRing: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 3, borderColor: PINK_LIGHT,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  accuracyGradient: {
    width: '100%', height: '100%', borderRadius: 25,
    justifyContent: 'center', alignItems: 'center',
  },
  accuracyValue: { fontSize: 15, fontWeight: '900', color: '#FFF' },
  accuracyLabel: { fontSize: 11, fontWeight: '600', color: GRAY, marginTop: 6 },

  endBtn: {
    borderRadius: 18, overflow: 'hidden',
    shadowColor: PINK_DARK, shadowOpacity: 0.25,
    shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  endBtnGrad: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 18,
  },
  endBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },

  // ─── Results ─────────────────────────────────────────────────
  resultsContainer: { flex: 1, backgroundColor: '#FFF' },
  resultsInner: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  resultsEmoji: { fontSize: 72, marginBottom: 12 },
  resultsTitle: { fontSize: 26, fontWeight: '900', color: DARK, marginBottom: 4 },
  resultsTime: { fontSize: 14, color: GRAY, fontWeight: '600', marginBottom: 36 },
  resultsTiles: { flexDirection: 'row', gap: 12, marginBottom: 40, width: '100%' },
  rTile: { flex: 1, alignItems: 'center', paddingVertical: 18, borderRadius: 20 },
  rTileVal: { fontSize: 28, fontWeight: '900', marginBottom: 4 },
  rTileLabel: { fontSize: 12, fontWeight: '600', color: GRAY },
  closeBtn: { width: '100%', backgroundColor: DARK, paddingVertical: 18, borderRadius: 18, alignItems: 'center' },
  closeBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
