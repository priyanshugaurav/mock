import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder, Animated, Dimensions, ScrollView, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { height } = Dimensions.get('window');

const TOPICS = [
  { id: 'all',  name: 'All Topics',    icon: 'layers',    color: '#FF8A9F', bg: '#FFF0F3', elo: 1450 },
  { id: 'alg',  name: 'Algebra',       icon: 'calculator',color: '#6C63FF', bg: '#F0EEFF', elo: 1380 },
  { id: 'geo',  name: 'Geometry',      icon: 'shapes',    color: '#00B4D8', bg: '#E8F9FD', elo: 1290 },
  { id: 'trig', name: 'Trigonometry',  icon: 'triangle',  color: '#F4A261', bg: '#FFF4EC', elo: 1100 },
  { id: 'calc', name: 'Calculus',      icon: 'analytics', color: '#2EC4B6', bg: '#E8FAF8', elo: 1560 },
  { id: 'stat', name: 'Statistics',    icon: 'bar-chart', color: '#E9C46A', bg: '#FFFAE8', elo: 1210 },
];

export default function QuickPracticeScreen({ navigation }) {
  const panY = useRef(new Animated.Value(0)).current;
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTopics = TOPICS.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // One animated value per topic for the ring fill sweep
  const ringAnims = useRef(TOPICS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = TOPICS.map((topic, i) =>
      Animated.timing(ringAnims[i], {
        toValue: Math.min(topic.elo / 2000, 1),
        duration: 900,
        delay: i * 120, // stagger each ring
        useNativeDriver: false,
      })
    );
    Animated.parallel(animations).start();
  }, []);

  const closeScreen = () => {
    Animated.timing(panY, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => navigation.goBack());
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10, // Swipe down
      onPanResponderMove: Animated.event(
        [null, { dy: panY }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) { // Dropped it down
          closeScreen();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: panY }] }]} {...panResponder.panHandlers}>
      {/* Unified Sticky Header */}
      <View style={styles.stickyTop}>
        <TouchableOpacity style={styles.backBtn} onPress={closeScreen}>
          <Ionicons name="close" size={24} color="#9098B1" />
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Choose your{'\n'}training topic 🔥</Text>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={20} color="#9098B1" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search chapters..."
            placeholderTextColor="#9098B1"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Scrollable Topic List only */}
      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topicList}>
          {filteredTopics.map((topic, globalIdx) => {
            const isSelected = selectedTopic === topic.id;
            const topicIndex = TOPICS.findIndex(t => t.id === topic.id);
            const animPct = ringAnims[topicIndex];
            // Arcs are formed by Top+Right border segments (180deg).
            // Initially, Top+Right is -45 to 135deg.
            // We rotate by another -45deg to align it perfectly as the RIGHT half (-90 to 90).
            const rightDeg = animPct.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: ['-225deg', '-45deg', '-45deg'],
            });
            const leftDeg = animPct.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: ['-45deg', '-45deg', '135deg'],
            });
            const staticPct = Math.min(topic.elo / 2000, 1);
            return (
              <TouchableOpacity 
                key={topic.id} 
                onPress={() => setSelectedTopic(topic.id)}
                activeOpacity={0.85}
                style={[styles.topicRow, isSelected && { borderColor: topic.color, backgroundColor: topic.bg }]}
              >
                {/* Left: icon + meta */}
                <View style={[styles.rowIconBg, { backgroundColor: isSelected ? topic.color : topic.bg }]}>
                  <Ionicons name={topic.icon} size={22} color={isSelected ? '#FFF' : topic.color} />
                </View>
                <View style={styles.rowMeta}>
                  <Text style={[styles.rowTitle, isSelected && { color: topic.color }]}>{topic.name}</Text>
                  <Text style={styles.rowSubtitle}>{Math.round(staticPct * 100)}% of max ELO</Text>
                </View>

                {/* Right: big ELO ring */}
                <View style={styles.eloRingWrap}>
                  <View style={[styles.eloRingTrack, { borderColor: '#EAECF0' }]} />
                  
                  {/* Right half (0-50%): rotations -180 to 0 */}
                  <View style={styles.eloHalfClipRight}>
                    <Animated.View style={[styles.eloHalf, { 
                      borderTopColor: topic.color, 
                      borderRightColor: topic.color,
                      left: -36, 
                      transform: [{ rotateZ: rightDeg }] 
                    }]} />
                  </View>
                  
                  {/* Left half (50-100%): rotations -180 to 0 */}
                  <View style={styles.eloHalfClipLeft}>
                    <Animated.View style={[styles.eloHalf, { 
                      borderTopColor: topic.color, 
                      borderRightColor: topic.color,
                      left: 0,
                      transform: [{ rotateZ: leftDeg }] 
                    }]} />
                  </View>

                  <View style={[styles.eloInner, isSelected && { backgroundColor: topic.bg }]}>
                    <Text style={[styles.eloNumber, { color: topic.color }]}>{topic.elo}</Text>
                    <Text style={[styles.eloLabel, { color: topic.color + 'AA' }]}>{Math.round(staticPct * 100)}%</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>

      {/* Floating Bottom Action */}
      <View style={styles.bottomAction}>
        <TouchableOpacity activeOpacity={0.9} onPress={closeScreen}>
          <LinearGradient 
            colors={['#FF8A9F', '#D95C72']}
            start={{x: 0, y: 0}} end={{x: 1, y: 1}}
            style={styles.startBtnInner}
          >
            <Text style={styles.startBtnText}>Start Practice</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30, // Slight curve at the top to signify it slid up over the screen
    borderTopRightRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -10 },
    elevation: 20,
  },
  stickyTop: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 8,
  },
  backBtn: { 
    alignSelf: 'flex-end',
    width: 40, height: 40, 
    backgroundColor: '#F8F9FB', 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 10,
  },
  scrollArea: { 
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#2D3142',
    marginTop: 10,
    marginBottom: 25,
    lineHeight: 40,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    marginBottom: 30,
    borderWidth: 1.5,
    borderColor: '#E8EAF6',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#2D3142',
    fontWeight: '600',
  },
  topicList: {
    paddingBottom: 100,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 22,
    marginBottom: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#EDEEF2',
  },
  rowIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rowMeta: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3142',
  },
  rowSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9098B1',
    marginTop: 3,
  },
  /* ---- ELO Ring ---- */
  eloRingWrap: {
    width: 72,
    height: 72,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eloRingTrack: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 6,
  },
  eloHalfClipRight: {
    position: 'absolute',
    width: 36,
    height: 72,
    right: 0,
    overflow: 'hidden',
  },
  eloHalfClipLeft: {
    position: 'absolute',
    width: 36,
    height: 72,
    left: 0,
    overflow: 'hidden',
  },
  eloHalf: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 6,
    borderColor: 'transparent',
  },
  eloInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  eloNumber: {
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 16,
  },
  eloLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#9098B1',
    marginTop: 1,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0, width: '100%',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
    paddingTop: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  startBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 20,
    shadowColor: '#D95C72',
    shadowOpacity: 0.4,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  startBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginRight: 8,
    letterSpacing: 0.5,
  }
});
