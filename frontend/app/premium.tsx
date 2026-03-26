import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../src/theme/colors';
import { GoldButton } from '../src/components/GoldButton';
import IMAGES from '../src/constants/images';

const { width } = Dimensions.get('window');

type PlanType = 'annual' | 'monthly';

const FEATURES = [
  { icon: 'scan-outline', title: 'Unlimited Shelf Scans', desc: 'Analyze entire store aisles instantly with AI precision' },
  { icon: 'analytics-outline', title: 'Smart Budget AI', desc: 'Best $10 finds better than $50 competitors' },
  { icon: 'restaurant-outline', title: 'Exclusive Pairings', desc: 'Exquisite healthy recipes tailored to your personal cellar' },
  { icon: 'heart-outline', title: 'Calorie & Health Control', desc: 'Detailed nutritional statistics for every glass and pour' },
];

export default function PremiumScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual');
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    setIsLoading(true);
    // Simulate purchase - RevenueCat would be integrated here
    setTimeout(() => {
      setIsLoading(false);
      router.back();
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Close button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: IMAGES.premiumBottles }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroOverlayBottom} />
          
          {/* Premium badge over image */}
          <View style={styles.heroContent}>
            <View style={styles.premiumBadge}>
              <Ionicons name="diamond" size={14} color={Colors.black} />
              <Text style={styles.premiumBadgeText}>CHEFLY PREMIUM</Text>
            </View>
            <Text style={styles.heroTitle}>CHEFLY PREMIUM</Text>
            <Text style={styles.heroSubtitle}>
              Your passport to the world of High gastronomy
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Features List */}
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon as any} size={20} color={Colors.gold} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
            </View>
          ))}

          {/* Plan Cards */}
          <View style={styles.plansSection}>
            {/* Annual Plan */}
            <TouchableOpacity
              style={[styles.planCard, selectedPlan === 'annual' && styles.planCardActive]}
              onPress={() => setSelectedPlan('annual')}
              activeOpacity={0.8}
            >
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planLabel}>ANNUAL ACCESS</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.planPrice}>$39.00</Text>
                    <Text style={styles.planPeriod}>/year</Text>
                  </View>
                  <Text style={styles.planSavings}>$3.25 / month</Text>
                </View>
                {selectedPlan === 'annual' && (
                  <View style={styles.bestValueBadge}>
                    <Text style={styles.bestValueText}>BEST VALUE</Text>
                  </View>
                )}
              </View>
              <View style={[styles.radioOuter, selectedPlan === 'annual' && styles.radioOuterActive]}>
                {selectedPlan === 'annual' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            {/* Monthly Plan */}
            <TouchableOpacity
              style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardActive]}
              onPress={() => setSelectedPlan('monthly')}
              activeOpacity={0.8}
            >
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planLabel}>MONTHLY</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.planPrice}>$5.99</Text>
                    <Text style={styles.planPeriod}>/month</Text>
                  </View>
                  <Text style={styles.planSavings}>Cancel anytime</Text>
                </View>
              </View>
              <View style={[styles.radioOuter, selectedPlan === 'monthly' && styles.radioOuterActive]}>
                {selectedPlan === 'monthly' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          </View>

          {/* CTA Button */}
          <GoldButton
            label="START 7-DAY FREE TRIAL"
            icon="diamond"
            onPress={handlePurchase}
            loading={isLoading}
            style={styles.ctaButton}
          />

          {/* Trial notice */}
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              Recurring billing. Cancel anytime in settings.
            </Text>
          </View>

          {/* Links */}
          <View style={styles.linksRow}>
            <TouchableOpacity>
              <Text style={styles.linkText}>Terms of Service</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.linkText}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
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
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContainer: {
    width: '100%',
    height: 240,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  heroOverlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.black,
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gold,
    fontFamily: 'Georgia',
    letterSpacing: 2,
  },
  heroSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  content: {
    padding: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 14,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.goldTransparent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.goldTransparent20,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  plansSection: {
    marginTop: 8,
    marginBottom: 20,
    gap: 12,
  },
  planCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  planCardActive: {
    backgroundColor: Colors.goldTransparent,
    borderColor: Colors.gold,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  planLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.gold,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Georgia',
  },
  planPeriod: {
    fontSize: 14,
    color: Colors.textMuted,
    marginLeft: 2,
  },
  planSavings: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  bestValueBadge: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestValueText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.black,
    letterSpacing: 0.5,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    borderColor: Colors.gold,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.gold,
  },
  ctaButton: {
    marginBottom: 12,
  },
  noticeBox: {
    padding: 10,
    alignItems: 'center',
  },
  noticeText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 8,
    marginBottom: 40,
  },
  linkText: {
    fontSize: 12,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
});
