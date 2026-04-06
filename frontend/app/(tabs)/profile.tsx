import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../src/theme/colors';
import { DarkCard } from '../../src/components/DarkCard';
import { GoldButton } from '../../src/components/GoldButton';
import IMAGES from '../../src/constants/images';
import * as api from '../../src/services/api';
import { useLanguage } from '../../src/contexts/LanguageContext';

const { width } = Dimensions.get('window');

const LANGUAGES = [
  { code: 'UK', name: 'Українська' },
  { code: 'EN', name: 'English' },
  { code: 'RU', name: 'Русский' },
];

const CURRENCIES = [
  { code: 'UAH', symbol: '₴' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { language: globalLanguage, setLanguage: setGlobalLanguage, t } = useLanguage();
  const [currency, setCurrency] = useState('UAH');
  const [budget, setBudget] = useState(500);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
      
      if (id) {
        const user = await api.getUser(id);
        setCurrency(user.preferred_currency || 'UAH');
        setBudget(user.budget_limit || 500);
        // Sync language from backend to context
        if (user.preferred_language) {
          await setGlobalLanguage(user.preferred_language as 'UK' | 'EN' | 'RU');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLanguageChange = async (newLang: 'UK' | 'EN' | 'RU') => {
    await setGlobalLanguage(newLang);
    // Save immediately to backend
    if (userId) {
      try {
        await api.updateUser(userId, {
          preferred_language: newLang,
        });
      } catch (error) {
        console.error('Error updating language:', error);
      }
    }
  };

  const handleBudgetChange = (value: number) => {
    setBudget(Math.round(value));
  };

  const handleBudgetSlidingComplete = async (value: number) => {
    const roundedBudget = Math.round(value);
    setBudget(roundedBudget);
    // Save to AsyncStorage and backend
    await AsyncStorage.setItem('userBudget', roundedBudget.toString());
    if (userId) {
      try {
        await api.updateUser(userId, {
          budget_limit: roundedBudget,
        });
      } catch (error) {
        console.error('Error updating budget:', error);
      }
    }
  };

  const saveSettings = async () => {
    try {
      if (userId) {
        await api.updateUser(userId, {
          preferred_language: globalLanguage,
          preferred_currency: currency,
          budget_limit: budget,
        });
        Alert.alert(t('profile_settings_saved'), t('profile_settings_saved_message'));
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert(t('profile_error'), t('profile_error_message'));
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t('profile_logout_title'),
      t('profile_logout_message'),
      [
        { text: t('profile_cancel'), style: 'cancel' },
        {
          text: t('profile_logout'),
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('isOnboarded');
            await AsyncStorage.removeItem('userId');
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  const MENU_ITEMS = [
    { icon: 'scan-outline', title: t('profile_scan_history'), subtitle: t('profile_scan_history_subtitle'), route: '/(tabs)/history' },
    { icon: 'notifications-outline', title: t('profile_notifications'), subtitle: t('profile_notifications_subtitle'), route: null },
    { icon: 'shield-outline', title: t('profile_privacy'), subtitle: t('profile_privacy_subtitle'), route: null },
    { icon: 'help-circle-outline', title: t('profile_support'), subtitle: t('profile_support_subtitle'), route: null },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Profile */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('profile_title')}</Text>
        </View>

        {/* Premium Card with Avatar */}
        <View style={styles.profileSection}>
          {/* Gold bordered circular avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Image
                  source={{ uri: IMAGES.wineGlass }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
                <View style={styles.avatarOverlay} />
                <Text style={styles.avatarText}>C</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.premiumBadge}>
            <Ionicons name="diamond" size={12} color={Colors.black} />
            <Text style={styles.premiumBadgeText}>{t('profile_premium_member')}</Text>
          </View>
          
          <Text style={styles.userName}>{t('profile_unlimited_scans')}</Text>
          <Text style={styles.userMeta}>{t('profile_valid_until')}</Text>
        </View>

        <View style={styles.content}>
          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile_preferences')}</Text>
            
            {/* Default Budget with REAL Slider */}
            <DarkCard padding={16} style={styles.card}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetLabel}>{t('profile_budget_label')}</Text>
                <Text style={styles.budgetValue}>
                  {budget} {CURRENCIES.find(c => c.code === currency)?.symbol}
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={100}
                maximumValue={2000}
                step={50}
                value={budget}
                onValueChange={handleBudgetChange}
                onSlidingComplete={handleBudgetSlidingComplete}
                minimumTrackTintColor={Colors.gold}
                maximumTrackTintColor={Colors.border}
                thumbTintColor={Colors.gold}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>100</Text>
                <Text style={styles.sliderLabelText}>2000+</Text>
              </View>
              <Text style={styles.budgetHint}>{t('profile_budget_hint')}</Text>
            </DarkCard>
          </View>

          {/* Currency & Language */}
          <View style={styles.rowSection}>
            <View style={styles.halfSection}>
              <Text style={styles.sectionTitle}>{t('profile_currency')}</Text>
              <View style={styles.currencyGrid}>
                {CURRENCIES.map((curr) => (
                  <TouchableOpacity
                    key={curr.code}
                    style={[styles.currencyItem, currency === curr.code && styles.currencyItemActive]}
                    onPress={() => setCurrency(curr.code)}
                  >
                    <Text style={[styles.currencySymbol, currency === curr.code && styles.currencySymbolActive]}>
                      {curr.symbol}
                    </Text>
                    <Text style={[styles.currencyCode, currency === curr.code && styles.currencyCodeActive]}>
                      {curr.code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.halfSection}>
              <Text style={styles.sectionTitle}>{t('profile_language')}</Text>
              <DarkCard padding={4}>
                {LANGUAGES.map((lang, index) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.langItem,
                      globalLanguage === lang.code && styles.langItemActive,
                      index < LANGUAGES.length - 1 && styles.langItemBorder,
                    ]}
                    onPress={() => handleLanguageChange(lang.code as 'UK' | 'EN' | 'RU')}
                  >
                    <Text style={[styles.langText, globalLanguage === lang.code && styles.langTextActive]}>
                      {lang.name}
                    </Text>
                    {globalLanguage === lang.code && <Ionicons name="checkmark" size={16} color={Colors.gold} />}
                  </TouchableOpacity>
                ))}
              </DarkCard>
            </View>
          </View>

          {/* Account & Security */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile_account_security')}</Text>
            <DarkCard padding={0}>
              {MENU_ITEMS.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.menuItem, index < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
                  onPress={() => item.route ? router.push(item.route as any) : null}
                >
                  <View style={styles.menuIcon}>
                    <Ionicons name={item.icon as any} size={20} color={Colors.gold} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
            </DarkCard>
          </View>

          {/* Save Button */}
          <GoldButton
            label={t('profile_save_settings')}
            icon="save-outline"
            onPress={saveSettings}
            style={styles.saveButton}
          />

          {/* Logout */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={Colors.error} />
            <Text style={styles.logoutText}>{t('profile_sign_out')}</Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={styles.footer}>CHEFLY v1.0.1{'\n'}Crafted for connoisseurs</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    padding: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Georgia',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 24,
  },
  avatarContainer: {
    marginBottom: 14,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2.5,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  avatarImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  avatarText: {
    color: Colors.gold,
    fontSize: 36,
    fontWeight: '900',
    fontFamily: 'Georgia',
    zIndex: 1,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    marginBottom: 10,
  },
  premiumBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.black,
    letterSpacing: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  userMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gold,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  card: {
    marginBottom: 0,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  budgetValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gold,
    fontFamily: 'Georgia',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  sliderLabelText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  budgetHint: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 8,
  },
  rowSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  halfSection: {
    flex: 1,
  },
  currencyGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyItem: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currencyItemActive: {
    backgroundColor: Colors.goldTransparent,
    borderColor: Colors.gold,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  currencySymbolActive: {
    color: Colors.gold,
  },
  currencyCode: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 2,
  },
  currencyCodeActive: {
    color: Colors.textPrimary,
  },
  langItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  langItemActive: {
    backgroundColor: Colors.goldTransparent,
  },
  langItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  langText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  langTextActive: {
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.goldTransparent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  saveButton: {
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    color: Colors.error,
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 18,
  },
});
