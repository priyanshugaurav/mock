import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Platform,
  Animated,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MathView from '../components/MathView';

const { width } = Dimensions.get('window');

// ─── Design Tokens (Premium Minimal - Notebook Aesthetic) ─────────────
const BG = '#FFFFFF';
const TEXT_PRI = '#1A1C1E';
const TEXT_SEC = '#42474E';
const TEXT_MUTED = '#72777F';
const GREEN = '#006D3A';
const PINK = '#BA1A1A';
const BORDER = '#DEE3EB';
const PAPER_BG = '#FAFBFF';
const HERO_IMG = 'https://i.pinimg.com/736x/3a/80/e8/3a80e89d21cf943848373568464f225d.jpg';

export default function SolutionScreen({ route, navigation }) {
  const { item, index } = route.params;
  const insets = useSafeAreaInsets();
  const correctAnswer = item.options[item.correctIndex];

  const latexSteps = [
    { label: 'given', math: `\\text{Total Amount} = ₹45`, sub: 'Ratio = 2 : 3' },
    { label: 'step 1', math: `2 + 3 = 5`, sub: 'Find total parts' },
    { label: 'step 2', math: `\\frac{45}{5} = 9`, sub: 'Value of one part' },
    { label: 'step 3', math: `3 \\times 9 = 27`, sub: 'Calculate share' }
  ];

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true
    }).start();
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      {/* ─── SCROLLABLE CONTENT ───────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 120 }}
        showsVerticalScrollIndicator={false}
        pointerEvents="auto"
        contentInsetAdjustmentBehavior="never"
      >
        {/* ─── IMAGE HERO (NO OVERLAYS) ───────────────────── */}
        <ImageBackground source={{ uri: HERO_IMG }} style={styles.heroImg} imageStyle={styles.heroImgStyle}>
          {/* Subtle bottom fade to transition to white content */}
          <LinearGradient
            colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
            style={[styles.heroOverlay, { paddingTop: Math.max(insets.top, 20) + 16 }]}
          >
            <View style={styles.navbar}>
              <TouchableOpacity style={styles.navCircle} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={24} color={TEXT_PRI} />
              </TouchableOpacity>
              <View style={styles.xpTag}>
                <Ionicons name="flash" size={14} color="#FFB800" />
                <Text style={styles.xpTxt}>+10 XP</Text>
              </View>
            </View>

            <View style={styles.heroInfo}>
              <Text style={styles.heroLabel}>CONCEPT SOLUTION</Text>
              <Text style={styles.heroTitle}>The Larger Share</Text>
              <View style={styles.heroBadgeRow}>
                <View style={styles.correctBadge}>
                  <Ionicons name="checkmark-done" size={16} color="#FFF" />
                  <Text style={styles.correctTxt}>Answer: {correctAnswer}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>

        <Animated.View style={[styles.contentArea, { opacity: fadeAnim }]}>
          <View style={styles.notebookSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="help-circle-outline" size={20} color={TEXT_PRI} />
              </View>
              <Text style={styles.sectionTitle}>QUESTION {index + 1}</Text>
            </View>

            <View style={styles.paperSurface}>
              <View style={styles.paperMargin} />
              <View style={styles.paperContent}>
                <Text style={styles.qText}>{item.question}</Text>
              </View>
            </View>
          </View>

          <View style={styles.notebookSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="create-outline" size={20} color={TEXT_PRI} />
              </View>
              <Text style={styles.sectionTitle}>DETAILED DERIVATION</Text>
            </View>

            <View style={styles.paperSurface}>
              <View style={styles.paperMargin} />
              <View style={styles.paperContent}>
                {latexSteps.map((step, idx) => (
                  <View key={idx} style={styles.derivationRow}>
                    <View style={styles.mathWrapper}>
                      <MathView 
                        math={step.math} 
                        fontSize={24}
                        center={false} 
                        style={{ marginLeft: -4 }} 
                      />
                      {step.sub && <Text style={styles.stepSub}>{step.sub}</Text>}
                    </View>
                    <View style={styles.labelWrapper}>
                      <Text style={styles.stepLabelRight}>— {step.label}</Text>
                    </View>
                  </View>
                ))}

                <View style={styles.resultRow}>
                  <View style={styles.resultDivider} />
                  <MathView
                    math={`\\therefore \\text{Larger Share} = ₹${correctAnswer.replace('₹', '')}`}
                    fontSize={26}
                    color={GREEN}
                    center={false}
                    style={{ marginLeft: -4 }}
                  />
                  <View style={styles.resultCheck}>
                    <View style={styles.resultCheckCircle}>
                      <Ionicons name="checkmark" size={18} color="#FFF" />
                    </View>
                    <Text style={styles.verifiedTxt}>Final Answer Verified</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.optionSection}>
            <Text style={styles.optionSectionTitle}>OPTION REVIEW</Text>
            {item.options.map((opt, i) => {
              const isCorrect = i === item.correctIndex;
              return (
                <View key={i} style={styles.miniOptRow}>
                  <View style={[styles.miniOptCircle, isCorrect && styles.miniOptCircleCorrect]}>
                    <Text style={[styles.miniOptChar, isCorrect && { color: '#FFF' }]}>{String.fromCharCode(65 + i)}</Text>
                  </View>
                  <Text style={[styles.miniOptTxt, isCorrect && styles.miniOptTxtCorrect]}>{opt}</Text>
                  {isCorrect && <Ionicons name="checkmark-circle" size={16} color={GREEN} />}
                </View>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* ─── STICKY PINK FOOTER ──────────────────────────── */}
      <View
        style={[styles.floatingFooter, { bottom: Math.max(insets.bottom, 16) + 10 }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.footerBtn}
          activeOpacity={0.9}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.footerBtnTxt}>Back to Practice</Text>
          <Ionicons name="arrow-back-circle-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // Hero
  heroImg: { width: '100%', height: 280 },
  heroImgStyle: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  heroOverlay: { flex: 1, paddingHorizontal: 20 },
  navbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' },
  xpTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  xpTxt: { fontSize: 13, fontWeight: '700', color: TEXT_PRI },
  heroInfo: { marginTop: 'auto', paddingBottom: 24 },
  heroLabel: { fontSize: 11, fontWeight: '800', color: TEXT_PRI, letterSpacing: 1.5 },
  heroTitle: { fontSize: 32, fontWeight: '900', color: TEXT_PRI, marginBottom: 12 },
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  correctBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GREEN, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25 },
  correctTxt: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // Content
  contentArea: { paddingHorizontal: 20, paddingTop: 10, gap: 24, backgroundColor: BG },
  qContainer: { position: 'relative', paddingLeft: 20 },
  qIndicator: { position: 'absolute', left: 0, top: 4, bottom: 4, width: 4, backgroundColor: PINK, borderRadius: 2 },
  qTag: { fontSize: 12, fontWeight: '800', color: PINK, letterSpacing: 1, marginBottom: 8 },
  qText: { fontSize: 18, fontWeight: '700', color: TEXT_PRI, lineHeight: 28 },

  // Notebook Section
  notebookSection: { gap: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F0F4F8', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: TEXT_PRI, letterSpacing: 1 },
  paperSurface: {
    backgroundColor: PAPER_BG,
    borderRadius: 16,
    minHeight: 200,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E1E4E8',
  },
  paperMargin: { width: 1.5, backgroundColor: '#FFD1D9', marginLeft: 40 },
  paperContent: { flex: 1, padding: 20 },
  derivationRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24, gap: 12 },
  mathWrapper: { flex: 1 },
  labelWrapper: { marginLeft: 10, minWidth: 60, marginTop: 10 },
  stepLabelRight: { fontSize: 11, fontWeight: '700', color: TEXT_MUTED, textTransform: 'lowercase', opacity: 0.7 },
  stepSub: { fontSize: 12, fontStyle: 'italic', color: TEXT_MUTED, marginTop: 4 },

  resultRow: { marginTop: 10 },
  resultDivider: { height: 1, backgroundColor: '#E1E4E8', marginBottom: 16 },
  resultCheck: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  resultCheckCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: GREEN, justifyContent: 'center', alignItems: 'center' },
  verifiedTxt: { fontSize: 13, fontWeight: '700', color: GREEN },

  // Option review
  optionSection: { gap: 12 },
  optionSectionTitle: { fontSize: 11, fontWeight: '800', color: TEXT_MUTED, letterSpacing: 1.5, marginBottom: 4 },
  miniOptRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 10 },
  miniOptCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: BORDER, justifyContent: 'center', alignItems: 'center' },
  miniOptCircleCorrect: { backgroundColor: GREEN, borderColor: GREEN },
  miniOptChar: { fontSize: 14, fontWeight: '800', color: TEXT_MUTED },
  miniOptTxt: { flex: 1, fontSize: 15, fontWeight: '600', color: TEXT_SEC },
  miniOptTxtCorrect: { color: GREEN, fontWeight: '700' },

  // Floating Footer
  floatingFooter: { position: 'absolute', left: 20, right: 20, zIndex: 100 },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: PINK,
    paddingVertical: 18,
    borderRadius: 20,
    shadowColor: PINK,
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8
  },
  footerBtnTxt: { fontSize: 17, fontWeight: '800', color: '#FFF' }
});
