import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../src/theme/colors';
import { Language, t } from '../../src/i18n/translations';

export default function TabLayout() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('UK');

  useEffect(() => {
    loadLanguage();
    
    // Listen for language changes
    const interval = setInterval(() => {
      loadLanguage();
    }, 500); // Check every 500ms for language changes
    
    return () => clearInterval(interval);
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem('userLanguage');
      if (saved && (saved === 'UK' || saved === 'EN' || saved === 'RU')) {
        if (saved !== currentLanguage) {
          setCurrentLanguage(saved as Language);
        }
      }
    } catch (error) {
      console.error('Failed to load language:', error);
    }
  };

  return (
    <Tabs
      key={currentLanguage} // Force re-render when language changes
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab_chat', currentLanguage),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: t('tab_scanner', currentLanguage),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'scan' : 'scan-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t('tab_chat', currentLanguage),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.chatIconContainer, focused && styles.chatIconActive]}>
              <Ionicons
                name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
                size={20}
                color={focused ? Colors.black : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('tab_history', currentLanguage),
          tabBarIcon: ({ color, focused}) => (
            <Ionicons
              name={focused ? 'time' : 'time-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tab_profile', currentLanguage),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#090909',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 25 : 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  tabItem: {
    paddingTop: 4,
  },
  chatIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -10,
  },
  chatIconActive: {
    backgroundColor: Colors.gold,
  },
});
