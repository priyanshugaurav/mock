import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  FlatList, StatusBar, Animated, PanResponder, ScrollView, Platform,
  ImageBackground, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MathView from '../components/MathView';
import { getNextQuestion, submitAnswer, getQuestionBatch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const PINK = '#FF8A9F';
const PINK_LIGHT = '#FFF0F3';
const PINK_DARK = '#D95C72';
const GREEN = '#34C759';
const RED = '#FF3B30';
const DARK = '#1A1C1E';
const GRAY = '#72777F';
const PAPER_BG = '#FAFBFF';
const BORDER = '#DEE3EB';

// ─── Normalize API questions to match existing UI field names ──
const normalizeQ = (q, idx) => ({
  ...q,
  question: q.question_text || q.question,
  correctIndex: q.correct_index ?? q.correctIndex,
  latexSteps: q.latex_steps || q.latexSteps || [],
  uniqueKey: `${q.id || 'fallback'}-${idx}-${Math.random().toString(36).substring(2, 9)}`,
});

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
      Animated.timing(scaleAnims[idx], { toValue: 1, duration: 50, useNativeDriver: true }),
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



// ─── Inline Solution Constants ─────────────────────────────────────────────
const SOL_BG = '#FFFFFF';
const SOL_GREEN = '#006D3A';
const SOL_GOLD = '#8E4D00';
const PINK_DARK_REF = '#BA1A1A';
const HERO_IMG = 'https://i.pinimg.com/736x/f1/9b/fd/f19bfd006ab89acddbef29e429533b95.jpg';

// ─── Inline Hero (ImageBackground banner) ──────────────────────────────────
const InlineHeroCard = ({ item, qIndex, onBack, topInset }) => {
  if (!item) return null;
  const correctAnswer = item.options[item.correctIndex];
  return (
    <View style={styles.solHeroImg}>
      <ImageBackground
        source={{ uri: HERO_IMG }}
        style={styles.solHeroInner}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
          style={[styles.solHeroOverlay, { paddingTop: Math.max(topInset, 20) + 16 }]}
        >
          <View style={styles.solHeroNavRow}>
            <TouchableOpacity style={styles.solHeroBackBtn} onPress={onBack} activeOpacity={0.8}>
              <Ionicons name="chevron-back" size={20} color={DARK} />
            </TouchableOpacity>
            <View style={styles.solHeroXpBadge}>
              <Ionicons name="flash" size={12} color="#FFB800" />
              <Text style={styles.solHeroXpTxt}>+10 XP</Text>
            </View>
          </View>

          <View style={{ marginTop: 'auto', paddingBottom: 16 }}>
            <Text style={styles.solHeroLabel}>CONCEPT SOLUTION</Text>
            <Text style={styles.solHeroTitle}>Quick Derivation</Text>
            <View style={styles.solHeroBadgeRow}>
              <View style={styles.solHeroCorrectBadge}>
                <Ionicons name="checkmark-done" size={12} color="#FFF" />
                <Text style={styles.solHeroCorrectTxt}>Ans: {correctAnswer}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

// ─── Inline Step Timeline (Notebook Style) ───────────────────────────────────
const InlineStepTimeline = ({ steps }) => {
  if (!steps || steps.length === 0) return null;
  return (
    <View style={styles.solSectionWrap}>
      <View style={styles.solSectionHeader}>
        <View style={styles.solSectionIcon}>
          <Ionicons name="create-outline" size={16} color={DARK} />
        </View>
        <Text style={styles.solSectionTitle}>WORKINGS</Text>
      </View>

      <View style={styles.solPaperSurface}>
        <View style={styles.solPaperMargin} />
        <View style={styles.solPaperContent}>
          {steps.map((step, idx) => (
            <View key={idx} style={styles.solDerivationRow}>
              <View style={styles.solMathWrapper}>
                <MathView 
                  math={step.math} 
                  fontSize={22} 
                  center={false} 
                  style={{ marginLeft: -4 }} 
                />
                {step.sub && <Text style={styles.solStepSub}>{step.sub}</Text>}
              </View>
              <View style={styles.solLabelWrapper}>
                <Text style={styles.solStepLabelRight}>— {step.label}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

// ─── Main ───────────────────────────────────────────────────────
export default function PracticeSessionScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topicParam = route?.params?.topicName?.toLowerCase()?.replace(/ /g, '_') || 'ratio';

  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [resultsList, setResultsList] = useState([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);

  // ── Dynamic question list (fetched from API) ──
  const [questions, setQuestions] = useState([]);
  const [isLoadingQ, setIsLoadingQ] = useState(true);

  // Fetch initial batch of questions for smooth, reel-like offline feel
  useEffect(() => {
    fetchInitialBatch();
  }, []);

  const fetchInitialBatch = async () => {
    try {
      const userId = user?.id || 'anonymous';
      const res = await getQuestionBatch(userId, topicParam, 5); // Preload 5 questions
      if (res?.questions && res.questions.length > 0) {
        setQuestions(prev => {
          // Double check to prevent any UI duplication
          const newQs = res.questions
            .filter(q => !prev.some(pq => pq.id === q.id))
            .map((q, idx) => normalizeQ(q, prev.length + idx));
          return [...prev, ...newQs];
        });
      } else {
        fetchNextQuestion();
      }
    } catch (err) {
      console.warn('API batch unreachable, fallback to single:', err.message);
      fetchNextQuestion();
    } finally {
      setIsLoadingQ(false);
    }
  };

  const fetchNextQuestion = async (currentIds = []) => {
    try {
      const userId = user?.id || 'anonymous';
      const res = await getNextQuestion(userId, topicParam, currentIds);
      if (res?.question) {
        setQuestions(prev => {
          if (prev.some(q => q.id === res.question.id)) return prev;
          return [...prev, normalizeQ(res.question, prev.length)];
        });
      }
    } catch (err) {
      console.warn('API unreachable, using fallback:', err.message);
    }
  };

  useEffect(() => {
    if (showResults) return;
    const t = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [showResults]);

  const handleAnswer = useCallback((isCorrect) => {
    const endTime = Date.now();
    const timeSpent = Math.round((endTime - questionStartTime) / 1000);
    
    setTotalAttempted(prev => prev + 1);
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setCurrentStreak(s => {
        const next = s + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
    } else {
      setCurrentStreak(0);
    }

    setResultsList(prev => [...prev, { time: timeSpent, isCorrect }]);
    setQuestionStartTime(Date.now());

    // Submit answer to backend (fire and forget)
    const currentQ = questions[currentQIndex];
    if (currentQ?.id && user?.id) {
      submitAnswer(user.id, currentQ.id, isCorrect, timeSpent).catch(() => {});
    }

    // Pre-fetch next adaptive question
    const currentIds = questions.map(q => q.id).filter(Boolean);
    fetchNextQuestion(currentIds);

    // Auto-scroll snappily to the next question after brief feedback delay
    setTimeout(() => {
      if (scrollRef.current) {
        const nextIdx = currentQIndex + 1;
        scrollRef.current.scrollToOffset({ offset: nextIdx * height, animated: true });
      }
    }, 700);
  }, [questionStartTime, maxStreak, currentQIndex, questions, user, height]);

  const wrongCount = totalAttempted - correctCount;
  const accuracy = totalAttempted === 0 ? 0 : Math.round((correctCount / totalAttempted) * 100);
  const timerText = formatTime(elapsed);

  const currentItem = questions[currentQIndex] || null;
  const globalScrollRef = useRef(null);

  // Show loading spinner while first question loads
  if (isLoadingQ && questions.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <ActivityIndicator size="large" color={PINK} />
        <Text style={{ marginTop: 12, color: GRAY, fontWeight: '600' }}>Loading question...</Text>
      </View>
    );
  }

  // ─── Results ──────────────────────────────────────────────────
  if (showResults) {
    const avgTime = totalAttempted === 0 ? 0 : Math.round(elapsed / totalAttempted);
    const topperAvg = 8; // Baseline for comparison
    const earnedXP = correctCount * 10 + (maxStreak * 5);

    return (
      <View style={styles.resContainer}>
        <StatusBar hidden />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Header Hero */}
          <ImageBackground source={{ uri: HERO_IMG }} style={styles.resHero}>
            <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']} style={styles.resHeroOverlay}>
              <View style={styles.resHeroBadge}>
                <Ionicons name="trophy" size={20} color="#FFB800" />
                <Text style={styles.resHeroBadgeTxt}>{accuracy >= 80 ? 'Mastery Unlocked' : 'Good Progress'}</Text>
              </View>
              <Text style={styles.resHeroTitle}>Session Outcome</Text>
            </LinearGradient>
          </ImageBackground>

          <View style={styles.resContent}>
            {/* Bento Layout Grid */}
            <View style={styles.resBentoGrid}>
              
              {/* Card 1: TOTAL QUESTIONS (Big, Pink) */}
              <View style={[styles.resBentoCard, styles.resBentoLarge, { backgroundColor: PINK }]}>
                <View style={styles.resBentoIconBox}>
                  <Ionicons name="layers" size={24} color="#FFF" />
                </View>
                <View style={{ marginTop: 'auto' }}>
                  <Text style={[styles.resBentoValue, { color: '#FFF' }]}>{totalAttempted}</Text>
                  <Text style={[styles.resBentoLabel, { color: 'rgba(255,255,255,0.8)' }]}>Questions Attempted</Text>
                </View>
              </View>

              {/* Card 2: ACCURACY (Big, Dark) */}
              <LinearGradient colors={[DARK, '#2D3142']} style={[styles.resBentoCard, styles.resBentoLarge]}>
                <View style={[styles.resBentoIconBox, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                  <Ionicons name="analytics" size={24} color="#FFB800" />
                </View>
                <View style={{ marginTop: 'auto' }}>
                  <Text style={[styles.resBentoValue, { color: '#FFF' }]}>{accuracy}%</Text>
                  <Text style={[styles.resBentoLabel, { color: 'rgba(255,255,255,0.6)' }]}>Accuracy Score</Text>
                  <View style={[styles.resMiniBar, { backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 8 }]}>
                    <View style={[styles.resMiniBarFill, { width: `${accuracy}%`, backgroundColor: '#FFB800' }]} />
                  </View>
                </View>
              </LinearGradient>

              {/* Card 3: CORRECT (Small, White) */}
              <View style={[styles.resBentoCard, styles.resBentoSmall]}>
                <Text style={[styles.resBentoValueSmall, { color: GREEN }]}>{correctCount}</Text>
                <Text style={styles.resBentoLabelSmall}>Correct</Text>
              </View>

              {/* Card 4: WRONG (Small, White) */}
              <View style={[styles.resBentoCard, styles.resBentoSmall]}>
                <Text style={[styles.resBentoValueSmall, { color: RED }]}>{wrongCount}</Text>
                <Text style={styles.resBentoLabelSmall}>Wrong</Text>
              </View>

              {/* Card 5: SPEED (Small, White) */}
              <View style={[styles.resBentoCard, styles.resBentoSmall]}>
                <Text style={styles.resBentoValueSmall}>{avgTime}s</Text>
                <Text style={styles.resBentoLabelSmall}>Avg Speed</Text>
              </View>

              {/* Card 6: STREAK (Small, White) */}
              <View style={[styles.resBentoCard, styles.resBentoSmall]}>
                <Text style={[styles.resBentoValueSmall, { color: PINK }]}>{maxStreak}</Text>
                <Text style={styles.resBentoLabelSmall}>Best Streak</Text>
              </View>

            </View>

            {/* Performance Comparison (Simplified Bento style) */}
            <View style={styles.resCompareCard}>
              <View style={styles.resCompareHeader}>
                <Ionicons name="flash-outline" size={16} color={DARK} />
                <Text style={styles.resCompareTitle}>Speed vs. Topper</Text>
              </View>
              <View style={styles.resBarRow}>
                <View style={[styles.resBarLabel, { flex: 0.3 }]}>
                  <Text style={styles.resBarTxt}>You</Text>
                </View>
                <View style={{ flex: 0.7, height: 8, backgroundColor: '#EDF2F7', borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ width: `${Math.min(100, (topperAvg / avgTime) * 100)}%`, height: '100%', backgroundColor: PINK }} />
                </View>
                <Text style={styles.resBarVal}>{avgTime}s</Text>
              </View>
              <View style={styles.resBarRow}>
                <View style={[styles.resBarLabel, { flex: 0.3 }]}>
                  <Text style={styles.resBarTxt}>Topper</Text>
                </View>
                <View style={{ flex: 0.7, height: 8, backgroundColor: '#EDF2F7', borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ width: '100%', height: '100%', backgroundColor: DARK }} />
                </View>
                <Text style={styles.resBarVal}>{topperAvg}s</Text>
              </View>
            </View>

            {/* Reward Card */}
            <LinearGradient colors={[DARK, '#2D3142']} style={styles.resRewardCard}>
              <View>
                <Text style={styles.resRewardLabel}>XP EARNED</Text>
                <Text style={styles.resRewardVal}>+{earnedXP} XP</Text>
              </View>
              <View style={styles.resXpCircle}>
                <Ionicons name="flash" size={24} color="#FFB800" />
              </View>
            </LinearGradient>

            {/* Footer Actions */}
            <View style={styles.resActions}>
              <TouchableOpacity style={styles.resPrimaryBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                <Text style={styles.resPrimaryBtnTxt}>Back to Practice</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resSecondaryBtn} onPress={() => setShowResults(false)} activeOpacity={0.8}>
                <Text style={styles.resSecondaryBtnTxt}>Review Solutions</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* X close (Page 1 ONLY) */}
      <Animated.View
        style={[
          styles.xBtn,
          {
            top: insets.top > 0 ? insets.top + 20 : 40,
            opacity: scrollX.interpolate({
              inputRange: [0, width],
              outputRange: [1, 0],
              extrapolate: 'clamp'
            }),
            pointerEvents: currentItem ? 'none' : 'auto' // Optional safety
          }
        ]}
      >
        <TouchableOpacity
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          onPress={() => setShowResults(true)}
        >
          <Ionicons name="close" size={22} color={PINK_DARK} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        ref={globalScrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        directionalLockEnabled
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* ─── PAGE 1: GLOBAL VERTICAL REEL + BOTTOM CARD ───── */}
        <View style={styles.pageWrap}>
          {/* Reel */}
          <FlatList
            ref={scrollRef}
            data={questions}
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

        {/* ─── PAGE 2: PREMIUM SOLUTION PAGE ──────────────── */}
        <View style={[styles.pageWrap, { backgroundColor: SOL_BG }]}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 120 }}
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentInsetAdjustmentBehavior="never"
          >
            {/* Image Hero */}
            <InlineHeroCard
              item={currentItem}
              qIndex={currentQIndex}
              topInset={insets.top}
              onBack={() => globalScrollRef.current?.scrollTo({ x: 0, animated: true })}
            />

            <View style={styles.solContentArea}>
              <View style={styles.solSectionHeader}>
                <View style={styles.solSectionIcon}>
                  <Ionicons name="help-circle-outline" size={16} color={DARK} />
                </View>
                <Text style={styles.solSectionTitle}>THE QUESTION</Text>
              </View>

              <View style={styles.solPaperSurface}>
                <View style={styles.solPaperMargin} />
                <View style={styles.solPaperContent}>
                  <Text style={styles.solQCardText}>{currentItem?.question}</Text>
                </View>
              </View>

              {/* Step timeline (Notebook Style) */}
              <InlineStepTimeline steps={currentItem?.latexSteps} />

              {/* Key Insight (Minimalist) */}
              {currentItem?.explanation && (
                <View style={styles.solTipCard}>
                  <View style={styles.solTipIconWrap}>
                    <Ionicons name="bulb" size={16} color="#FF9500" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.solTipTitle}>Expert Insight</Text>
                    <Text style={styles.solTipText}>{currentItem.explanation}</Text>
                  </View>
                </View>
              )}

              {/* Options Breakdown (Minimal) */}
              <View style={styles.solOptionSection}>
                <Text style={styles.solOptionSectionTitle}>OPTION REVIEW</Text>
                {currentItem?.options?.map((opt, i) => {
                  const letters = ['A', 'B', 'C', 'D'];
                  const isCorrect = i === currentItem.correctIndex;
                  return (
                    <View key={i} style={styles.solMiniOptRow}>
                      <View style={[styles.solMiniOptCircle, isCorrect && styles.solMiniOptCircleCorrect]}>
                        <Text style={[styles.solMiniOptChar, isCorrect && { color: '#FFF' }]}>{letters[i]}</Text>
                      </View>
                      <Text style={[styles.solMiniOptTxt, isCorrect && styles.solMiniOptTxtCorrect]}>{opt}</Text>
                      {isCorrect && <Ionicons name="checkmark-circle" size={14} color={SOL_GREEN} />}
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* FLOATING FOOTER FOR PAGE 2 */}
          <View
            style={[styles.solFloatingFooter, { bottom: Math.max(insets.bottom, 16) + 10 }]}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              onPress={() => globalScrollRef.current?.scrollTo({ x: 0, animated: true })}
              activeOpacity={0.9}
            >
              <View style={styles.solFooterBtn}>
                <Text style={styles.solFooterBtnTxt}>Back to Practice</Text>
                <Ionicons name="arrow-back-circle-outline" size={18} color="#FFF" />
              </View>
            </TouchableOpacity>
          </View>
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

  // ─── Solution Panel Page 2 Styles ──────────────────────────
  solContentArea: { paddingHorizontal: 20, paddingTop: 16, gap: 20 },

  // Hero Image
  solHeroImg: { width: '100%', height: 220, backgroundColor: '#FFF' },
  solHeroInner: { flex: 1 },
  solHeroOverlay: { flex: 1, paddingHorizontal: 20 },
  solHeroNavRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  solHeroBackBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' },
  solHeroXpBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  solHeroXpTxt: { fontSize: 12, fontWeight: '800', color: DARK },
  solHeroLabel: { fontSize: 10, fontWeight: '800', color: DARK, letterSpacing: 1 },
  solHeroTitle: { fontSize: 22, fontWeight: '900', color: DARK, marginBottom: 8 },
  solHeroBadgeRow: { flexDirection: 'row', alignItems: 'center' },
  solHeroCorrectBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: SOL_GREEN, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  solHeroCorrectTxt: { fontSize: 12, fontWeight: '700', color: '#FFF' },

  // Question card
  solQCard: { backgroundColor: '#FFF', borderRadius: 16, flexDirection: 'row', overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: BORDER },
  solQCardAccentBar: { width: 4, backgroundColor: PINK_DARK_REF },
  solQCardInner: { flex: 1, padding: 14 },
  solQCardLabel: { fontSize: 10, fontWeight: '800', color: GRAY, letterSpacing: 1, marginBottom: 4 },
  solQCardText: { fontSize: 16, fontWeight: '700', color: DARK, lineHeight: 24 },

  // Section
  solSectionWrap: { gap: 10 },
  solSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  solSectionIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F0F4F8', justifyContent: 'center', alignItems: 'center' },
  solSectionTitle: { fontSize: 13, fontWeight: '800', color: DARK, letterSpacing: 0.5 },

  // Notebook Surface
  solPaperSurface: { backgroundColor: PAPER_BG, borderRadius: 16, flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: BORDER },
  solPaperMargin: { width: 1.5, backgroundColor: '#FFD1D9', marginLeft: 30 },
  solPaperContent: { flex: 1, padding: 14 },
  solDerivationRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, gap: 10 },
  solMathWrapper: { flex: 1 },
  solLabelWrapper: { marginLeft: 8, minWidth: 50, marginTop: 8 },
  solStepLabelRight: { fontSize: 10, fontWeight: '700', color: GRAY, textTransform: 'lowercase', opacity: 0.6 },
  solStepSub: { fontSize: 11, fontStyle: 'italic', color: GRAY, marginTop: 4 },

  // Tip
  solTipCard: { flexDirection: 'row', gap: 12, backgroundColor: '#FFFBEB', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#FEF3C7' },
  solTipIconWrap: { width: 32, height: 32, borderRadius: 9, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center' },
  solTipTitle: { fontSize: 14, fontWeight: '800', color: '#92400E', marginBottom: 2 },
  solTipText: { fontSize: 13, color: '#92400E', lineHeight: 18 },

  // Options
  solOptionSection: { gap: 8 },
  solOptionSectionTitle: { fontSize: 10, fontWeight: '800', color: GRAY, letterSpacing: 1.2, marginBottom: 2 },
  solMiniOptRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  solMiniOptCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: BORDER, justifyContent: 'center', alignItems: 'center' },
  solMiniOptCircleCorrect: { backgroundColor: SOL_GREEN, borderColor: SOL_GREEN },
  solMiniOptChar: { fontSize: 12, fontWeight: '800', color: GRAY },
  solMiniOptTxt: { flex: 1, fontSize: 14, fontWeight: '600', color: DARK },
  solMiniOptTxtCorrect: { color: SOL_GREEN, fontWeight: '700' },

  // CTA
  solFooterBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: PINK, paddingVertical: 18, borderRadius: 18, shadowColor: PINK, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  solFooterBtnTxt: { fontSize: 16, fontWeight: '800', color: '#FFF' },

  solFloatingFooter: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    zIndex: 100,
  },

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

  // ─── Bento Results ─────────────────────────────────────────
  resContainer: { flex: 1, backgroundColor: '#FAFBFF' },
  resHero: { width: '100%', height: 260 },
  resHeroStyle: { borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  resHeroOverlay: { flex: 1, padding: 24, justifyContent: 'flex-end' },
  resHeroBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: 'rgba(255,255,255,0.9)', 
    alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 12
  },
  resHeroBadgeTxt: { fontSize: 12, fontWeight: '800', color: DARK },
  resHeroTitle: { fontSize: 32, fontWeight: '900', color: DARK },

  resContent: { padding: 20, gap: 16 },
  
  resBentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  resBentoCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10, elevation: 1,
  },
  resBentoLarge: {
    width: (width - 52) / 2, // Half width minus gap
    height: 160,
  },
  resBentoSmall: {
    width: (width - 56) / 2, // Slightly smaller for 2-column small
    height: 90,
    justifyContent: 'center',
  },
  resBentoIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  resBentoValue: { fontSize: 32, fontWeight: '900', marginBottom: 2 },
  resBentoLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  
  resBentoValueSmall: { fontSize: 20, fontWeight: '900' },
  resBentoLabelSmall: { fontSize: 10, fontWeight: '700', color: GRAY, marginTop: 2 },

  resMiniBar: { height: 6, backgroundColor: '#EDF2F7', borderRadius: 3, overflow: 'hidden' },
  resMiniBarFill: { height: '100%', borderRadius: 3 },

  resCompareCard: { 
    backgroundColor: '#FFF', padding: 18, borderRadius: 24, 
    borderWidth: 1, borderColor: '#EDF2F7' 
  },
  resCompareHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  resCompareTitle: { fontSize: 13, fontWeight: '800', color: DARK },
  resBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  resBarLabel: { width: 45 },
  resBarTxt: { fontSize: 11, fontWeight: '700', color: GRAY },
  resBarVal: { width: 35, fontSize: 11, fontWeight: '800', color: DARK, textAlign: 'right' },

  resRewardCard: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 24, borderRadius: 24,
  },
  resRewardLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
  resRewardVal: { fontSize: 28, fontWeight: '900', color: '#FFF' },
  resXpCircle: { 
    width: 48, height: 48, borderRadius: 24, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    justifyContent: 'center', alignItems: 'center' 
  },

  resActions: { gap: 10, marginTop: 5 },
  resPrimaryBtn: { 
    backgroundColor: PINK, paddingVertical: 18, borderRadius: 20, 
    alignItems: 'center', shadowColor: PINK, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 
  },
  resPrimaryBtnTxt: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  resSecondaryBtn: { 
    paddingVertical: 16, borderRadius: 20, alignItems: 'center',
    borderWidth: 2, borderColor: '#EDF2F7'
  },
  resSecondaryBtnTxt: { color: DARK, fontSize: 15, fontWeight: '800' },
});
