import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../src/theme/colors';
import { CheflyLogo } from '../src/components/CheflyLogo';
import { GoldButton } from '../src/components/GoldButton';
import { DarkCard } from '../src/components/DarkCard';
import IMAGES from '../src/constants/images';
import * as api from '../src/services/api';

const { width } = Dimensions.get('window');

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
];

const BUDGETS = [
  { id: 'everyday', label: 'Everyday', range: 'Under $30', value: 30, icon: 'cart-outline' as const },
  { id: 'premium', label: 'Premium', range: '$30 - $100', value: 100, icon: 'diamond-outline' as const },
  { id: 'collector', label: 'Collector', range: '$100+', value: 500, icon: 'trophy-outline' as const },
];

const LANGUAGES = [
  { code: 'UK', name: 'Українська', flag: '🇺🇦' },
  { code: 'EN', name: 'English', flag: '🇺🇸' },
  { code: 'RU', name: 'Русский', flag: '🇷🇺' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currency, setCurrency] = useState('USD');
  const [budgetTier, setBudgetTier] = useState('premium');
  const [language, setLanguage] = useState('UK');
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    try {
      setLoading(true);
      
      const selectedBudget = BUDGETS.find(b => b.id === budgetTier);
      const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create user
      const user = await api.createUser(deviceId, {
        preferred_language: language,
        preferred_currency: currency,
        budget_limit: selectedBudget?.value || 100,
      });
      
      // Save to storage
      await AsyncStorage.setItem('isOnboarded', 'true');
      await AsyncStorage.setItem('userId', user.id);
      
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Onboarding error:', error);
      // Still proceed even if API fails
      await AsyncStorage.setItem('isOnboarded', 'true');
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image Section */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: IMAGES.onboardingHero }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroOverlayBottom} />
          
          {/* Logo over the image */}
          <View style={styles.logoOverImage}>
            <CheflyLogo size={70} glowing />
            <Text style={styles.appName}>CHEFLY</Text>
            <Text style={styles.tagline}>YOUR AI CONCIERGE</Text>
          </View>
        </View>

        {/* Welcome text */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to the Elite Circle</Text>
          <Text style={styles.welcomeSubtitle}>
            I am your personal sommelier. To provide the most exquisite recommendations, let's tailor your experience.
          </Text>
        </View>

        {/* Currency Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERRED CURRENCY</Text>
          <View style={styles.currencyGrid}>
            {CURRENCIES.map((curr) => (
              <TouchableOpacity
                key={curr.code}
                style={[
                  styles.currencyItem,
                  currency === curr.code && styles.currencyItemActive,
                ]}
                onPress={() => setCurrency(curr.code)}
              >
                <Text style={[
                  styles.currencySymbol,
                  currency === curr.code && styles.currencySymbolActive,
                ]}>
                  {curr.symbol}
                </Text>
                <Text style={[
                  styles.currencyCode,
                  currency === curr.code && styles.currencyCodeActive,
                ]}>
                  {curr.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Budget Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TYPICAL BOTTLE BUDGET</Text>
          {BUDGETS.map((budget) => (
            <DarkCard
              key={budget.id}
              highlighted={budgetTier === budget.id}
              goldBorder={budgetTier === budget.id}
              padding={16}
              onPress={() => setBudgetTier(budget.id)}
              style={styles.budgetCard}
            >
              <View style={styles.budgetContent}>
                <View style={[
                  styles.budgetIcon,
                  budgetTier === budget.id && styles.budgetIconActive,
                ]}>
                  <Ionicons
                    name={budget.icon}
                    size={20}
                    color={budgetTier === budget.id ? Colors.black : Colors.textMuted}
                  />
                </View>
                <View style={styles.budgetText}>
                  <Text style={[
                    styles.budgetLabel,
                    budgetTier === budget.id && styles.budgetLabelActive,
                  ]}>
                    {budget.label}
                  </Text>
                  <Text style={styles.budgetRange}>{budget.range}</Text>
                </View>
                <View style={[
                  styles.radio,
                  budgetTier === budget.id && styles.radioActive,
                ]}>
                  {budgetTier === budget.id && <View style={styles.radioDot} />}
                </View>
              </View>
            </DarkCard>
          ))}
        </View>

        {/* Language Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INTERFACE LANGUAGE</Text>
          <DarkCard padding={4}>
            {LANGUAGES.map((lang, index) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageItem,
                  language === lang.code && styles.languageItemActive,
                  index < LANGUAGES.length - 1 && styles.languageItemBorder,
                ]}
                onPress={() => setLanguage(lang.code)}
              >
                <Text style={styles.flag}>{lang.flag}</Text>
                <Text style={[
                  styles.languageName,
                  language === lang.code && styles.languageNameActive,
                ]}>
                  {lang.name}
                </Text>
                {language === lang.code && (
                  <Ionicons name="checkmark" size={20} color={Colors.gold} />
                )}
              </TouchableOpacity>
            ))}
          </DarkCard>
        </View>

        {/* Start Button */}
        <View style={styles.buttonSection}>
          <GoldButton
            label="Begin My Journey"
            icon="arrow-forward"
            onPress={handleStart}
            loading={loading}
          />
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
          </Text>
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
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    width: '100%',
    height: 280,
    marginBottom: 24,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  heroOverlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  logoOverImage: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.gold,
    letterSpacing: 6,
    marginTop: 12,
    fontFamily: 'Georgia',
  },
  tagline: {
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginTop: 6,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: 'Georgia',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gold,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  currencyGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  currencyItem: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currencyItemActive: {
    backgroundColor: Colors.goldTransparent,
    borderColor: Colors.gold,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  currencySymbolActive: {
    color: Colors.gold,
  },
  currencyCode: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  currencyCodeActive: {
    color: Colors.textPrimary,
  },
  budgetCard: {
    marginBottom: 10,
  },
  budgetContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  budgetIconActive: {
    backgroundColor: Colors.gold,
  },
  budgetText: {
    flex: 1,
  },
  budgetLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  budgetLabelActive: {
    color: Colors.gold,
  },
  budgetRange: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: Colors.gold,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.gold,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  languageItemActive: {
    backgroundColor: Colors.goldTransparent,
  },
  languageItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  flag: {
    fontSize: 20,
    marginRight: 12,
  },
  languageName: {
    flex: 1,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  languageNameActive: {
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  buttonSection: {
    marginTop: 10,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  termsText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 16,
  },
  termsLink: {
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
