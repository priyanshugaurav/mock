import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './src/screens/HomeScreen';
import QuickPracticeScreen from './src/screens/QuickPracticeScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const PINK_DARK = '#FF8A9F';
const TEXT_GRAY = '#9098B1';
const WHITE = '#FFFFFF';

// Custom Tab Bar to maintain the floating aesthetic
function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.bottomNav}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Icon configuration based on route name
        let iconName;
        let IconComponent = Ionicons;
        if (route.name === 'Home') iconName = isFocused ? 'home' : 'home-outline';
        else if (route.name === 'Discover') iconName = isFocused ? 'compass' : 'compass-outline';
        else if (route.name === 'Favorite') iconName = isFocused ? 'heart' : 'heart-outline';
        else if (route.name === 'Profile') iconName = isFocused ? 'person' : 'person-outline';
        else if (route.name === 'Tests') {
          IconComponent = MaterialCommunityIcons;
          iconName = isFocused ? 'clipboard-text' : 'clipboard-text-outline';
        }

        const color = isFocused ? PINK_DARK : TEXT_GRAY;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={[styles.navItem, route.name === 'Tests' && styles.cartNavItem]}
          >
            {route.name === 'Tests' ? (
              <View style={styles.cartIconWrapper}>
                <IconComponent name={iconName} size={24} color={color} />
              </View>
            ) : (
              <IconComponent name={iconName} size={24} color={color} />
            )}
            <Text style={[styles.navText, isFocused && styles.navTextActive]}>
              {route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Dummy screens for other tabs
const DummyScreen = () => <View style={{ flex: 1, backgroundColor: '#F8F9FB' }} />;

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Discover" component={DummyScreen} />
      <Tab.Screen name="Tests" component={DummyScreen} />
      <Tab.Screen name="Favorite" component={DummyScreen} />
      <Tab.Screen name="Profile" component={DummyScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen 
          name="QuickPractice" 
          component={QuickPracticeScreen} 
          options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: WHITE,
    height: 85,
    paddingHorizontal: 15,
    paddingBottom: Platform.OS === 'ios' ? 25 : 15,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: -5 },
    elevation: 20,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 10,
    marginTop: 5,
    color: TEXT_GRAY,
    fontWeight: '600',
  },
  navTextActive: {
    color: PINK_DARK,
    fontWeight: '700',
  },
  cartNavItem: {
    position: 'relative',
    top: -5,
  },
  cartIconWrapper: {
    padding: 8,
    borderRadius: 16,
  }
});
