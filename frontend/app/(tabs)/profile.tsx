import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../src/theme/colors';
import { DarkCard } from '../../src/components/DarkCard';
import { GoldButton } from '../../src/components/GoldButton';
import IMAGES from '../../src/constants/images';
import * as api from '../../src/services/api';

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

const MENU_ITEMS = [
  { icon: 'scan-outline', title: 'Scan History', subtitle: 'View your previous recommendations', route: '/(tabs)/history' },
  { icon: 'notifications-outline', title: 'Notifications', subtitle: 'Daily pairing tips & alerts', route: null },
  { icon: 'shield-outline', title: 'Privacy & Security', subtitle: 'Manage your data and personal', route: null },
  { icon: 'help-circle-outline', title: 'Support', subtitle: 'Contact your personal concierge', route: null },
];

export default function ProfileScreen() {
  const router = useRouter();
  const [language, setLanguage] = useState('UK');
  const [currency, setCurrency] = useState('UAH');
  const [budget, setBudget] = useState(500);
  const [notifications, setNotifications] = useState(true);
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
        setLanguage(user.preferred_language || 'UK');
        setCurrency(user.preferred_currency || 'UAH');
        setBudget(user.budget_limit || 500);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const saveSettings = async () => {
    try {
      if (userId) {
        await api.updateUser(userId, {
          preferred_language: language,
          preferred_currency: currency,
          budget_limit: budget,
        });
        Alert.alert('Збережено', 'Налаштування збережено');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Помилка', 'Не вдалося зберегти');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Вихід',
      'Ви впевнені, що хочете вийти?',
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Вийти',
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Profile */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
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
            <Text style={styles.premiumBadgeText}>PREMIUM MEMBER</Text>
          </View>
          
          <Text style={styles.userName}>Unlimited AI Scans</Text>
          <Text style={styles.userMeta}>Valid until Oct 2026</Text>
        </View>

        <View style={styles.content}>
          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PREFERENCES</Text>
            
            {/* Default Budget */}
            <DarkCard padding={16} style={styles.card}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetLabel}>Default Budget</Text>
                <Text style={styles.budgetValue}>
                  {budget} {CURRENCIES.find(c => c.code === currency)?.symbol}
                </Text>
              </View>
              <View style={styles.budgetSlider}>
                <Text style={styles.sliderMin}>0</Text>
                <View style={styles.sliderTrack}>
                  <View style={[styles.sliderFill, { width: `${Math.min((budget / 2000) * 100, 100)}%` }]} />
                  <View style={[styles.sliderThumb, { left: `${Math.min((budget / 2000) * 100, 100)}%` }]} />
                </View>
                <Text style={styles.sliderMax}>$1,000+</Text>
              </View>
              <Text style={styles.budgetHint}>This budget will be used as a default filter for all shelf scans.</Text>
            </DarkCard>
          </View>

          {/* Currency & Language */}
          <View style={styles.rowSection}>
            <View style={styles.halfSection}>
              <Text style={styles.sectionTitle}>Currency</Text>
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
              <Text style={styles.sectionTitle}>Language</Text>
              <DarkCard padding={4}>
                {LANGUAGES.map((lang, index) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.langItem,
                      language === lang.code && styles.langItemActive,
                      index < LANGUAGES.length - 1 && styles.langItemBorder,
                    ]}
                    onPress={() => setLanguage(lang.code)}
                  >
                    <Text style={[styles.langText, language === lang.code && styles.langTextActive]}>
                      {lang.name}
                    </Text>
                    {language === lang.code && <Ionicons name="checkmark" size={16} color={Colors.gold} />}
                  </TouchableOpacity>
                ))}
              </DarkCard>
            </View>
          </View>

          {/* Account & Security */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACCOUNT & SECURITY</Text>
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
            label="Save Settings"
            icon="save-outline"
            onPress={saveSettings}
            style={styles.saveButton}
          />

          {/* Logout */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={Colors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
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
  budgetSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sliderMin: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  sliderMax: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 4,
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.gold,
    marginLeft: -8,
  },
  budgetHint: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
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
