import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../src/theme/colors';
import { CheflyLogo } from '../../src/components/CheflyLogo';
import { PremiumBadge } from '../../src/components/PremiumBadge';
import { GoldButton, GoldOutlineButton } from '../../src/components/GoldButton';
import { DarkCard } from '../../src/components/DarkCard';
import { GoldIconBox } from '../../src/components/GoldIconBox';
import IMAGES from '../../src/constants/images';

const { width } = Dimensions.get('window');

const FEATURES = [
  {
    icon: 'camera-outline' as const,
    title: 'Bottle Photo',
    subtitle: 'Instant label recognition',
    route: '/scanner' as const,
  },
  {
    icon: 'layers-outline' as const,
    title: 'Smart Shelf Scan',
    subtitle: 'Find the best in the row',
    route: '/scanner' as const,
  },
  {
    icon: 'chatbubble-outline' as const,
    title: 'Private Sommelier',
    subtitle: 'Ask for expert advice',
    route: '/chat' as const,
  },
  {
    icon: 'restaurant-outline' as const,
    title: 'Gourmet Pairings',
    subtitle: 'Perfect match for your dish',
    route: '/chat' as const,
  },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLogo}>
            <View style={styles.miniLogo}>
              <Text style={styles.miniLogoText}>C</Text>
            </View>
            <Text style={styles.headerTitle}>CHEFLY</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="search-outline" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/profile')}
            >
              <Ionicons name="menu-outline" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section with Image */}
        <View style={styles.heroSection}>
          <View style={styles.heroImageContainer}>
            <Image
              source={{ uri: IMAGES.wineGlass }}
              style={styles.heroImage}
              contentFit="cover"
            />
            <View style={styles.heroImageOverlay} />
          </View>
          
          <View style={styles.heroContent}>
            <CheflyLogo size={80} glowing />
            <View style={styles.badgeContainer}>
              <PremiumBadge />
            </View>

            <Text style={styles.heroTitle}>
              Refine Your{' '}
              <Text style={styles.heroTitleGold}>Taste</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              Your private AI sommelier and culinary assistant.{'\n'}Experience unique gastronomic excellence.
            </Text>
          </View>
        </View>

        {/* Budget quick display */}
        <View style={styles.budgetBar}>
          <Ionicons name="wallet-outline" size={16} color={Colors.gold} />
          <Text style={styles.budgetText}>Budget: 500 UAH</Text>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <Text style={styles.budgetEdit}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Feature Tiles */}
        <View style={styles.featuresSection}>
          {FEATURES.map((feature, index) => (
            <DarkCard
              key={index}
              padding={14}
              onPress={() => router.push(feature.route)}
              style={styles.featureCard}
            >
              <View style={styles.featureContent}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon} size={20} color={Colors.gold} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Colors.textMuted}
                />
              </View>
            </DarkCard>
          ))}
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionBtn}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="chatbubble-ellipses" size={24} color={Colors.gold} />
            </View>
            <Text style={styles.quickActionLabel}>Pair with Steak</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionBtn}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="wine" size={24} color={Colors.gold} />
            </View>
            <Text style={styles.quickActionLabel}>Best under 500</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionBtn}
            onPress={() => router.push('/(tabs)/history')}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="time" size={24} color={Colors.gold} />
            </View>
            <Text style={styles.quickActionLabel}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Card */}
        <DarkCard goldBorder style={styles.privacyCard}>
          <View style={styles.privacyContent}>
            <GoldIconBox icon="shield-outline" size={40} />
            <View style={styles.privacyText}>
              <Text style={styles.privacyTitle}>Private AI Concierge</Text>
              <Text style={styles.privacySubtitle}>
                Your data is confidential. We don't store your photos on servers.
              </Text>
            </View>
          </View>
        </DarkCard>

        {/* Premium Button */}
        <GoldOutlineButton
          label="Get Premium Access"
          icon="diamond-outline"
          onPress={() => router.push('/premium')}
          style={styles.premiumButton}
        />

        {/* Footer */}
        <Text style={styles.footer}>
          CHEFLY • PREMIUM AI SOMMELIER
        </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniLogoText: {
    color: Colors.black,
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'Georgia',
  },
  headerTitle: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 320,
  },
  heroImageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  heroContent: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  badgeContainer: {
    marginTop: 12,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Georgia',
    textAlign: 'center',
  },
  heroTitleGold: {
    color: Colors.gold,
    fontStyle: 'italic',
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 12,
  },
  budgetBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  budgetText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  budgetEdit: {
    fontSize: 13,
    color: Colors.gold,
    fontWeight: '600',
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  featureCard: {
    marginBottom: 10,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.goldTransparent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.goldTransparent20,
  },
  featureText: {
    flex: 1,
    marginLeft: 14,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  featureSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.goldTransparent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  privacyCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  privacyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyText: {
    flex: 1,
    marginLeft: 14,
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gold,
  },
  privacySubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
    marginTop: 4,
  },
  premiumButton: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  footer: {
    textAlign: 'center',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 2,
    opacity: 0.5,
  },
});
