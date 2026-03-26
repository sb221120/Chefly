import React from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../src/theme/colors';
import { GoldButton } from '../src/components/GoldButton';
import { DarkCard } from '../src/components/DarkCard';
import IMAGES from '../src/constants/images';

const { width } = Dimensions.get('window');

export default function ScanResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { recommendations, budget, currency } = params as {
    recommendations: string;
    budget: string;
    currency: string;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>CHEFLY AI</Text>
          <Text style={styles.headerTitle}>Top Selections</Text>
          <Text style={styles.headerSubtitle}>Best matches within your budget</Text>
        </View>
        <TouchableOpacity style={styles.shareBtn}>
          <Ionicons name="share-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Budget Info */}
        <View style={styles.budgetSection}>
          <Text style={styles.budgetLabel}>CURRENT BUDGET</Text>
          <Text style={styles.budgetValue}>{budget} {currency}</Text>
        </View>

        {/* AI Results Header with Image */}
        <View style={styles.resultsHeader}>
          <Image
            source={{ uri: IMAGES.winePairing }}
            style={styles.resultsHeaderImage}
            contentFit="cover"
          />
          <View style={styles.resultsHeaderOverlay} />
          <View style={styles.resultsHeaderContent}>
            <View style={styles.resultsIcon}>
              <Ionicons name="sparkles" size={18} color={Colors.gold} />
            </View>
            <View>
              <Text style={styles.resultsLabel}>SOMMELIER'S CHOICE</Text>
              <Text style={styles.resultsTitle}>AI Analysis Results</Text>
            </View>
          </View>
        </View>

        {/* Recommendations */}
        <DarkCard style={styles.recommendationsCard}>
          <Text style={styles.recommendationsText}>
            {recommendations || 'No recommendations found'}
          </Text>
        </DarkCard>

        {/* Action buttons */}
        <View style={styles.actions}>
          {/* Disclaimer */}
          <View style={styles.disclaimerRow}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.disclaimer}>
              Prices are estimated based on shelf tags. Always verify at checkout.
            </Text>
          </View>

          <GoldButton
            label="Start New Scan"
            icon="scan"
            onPress={() => router.replace('/(tabs)/scanner')}
          />
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <Ionicons name="chatbubble-outline" size={18} color={Colors.gold} />
            <Text style={styles.chatButtonText}>Ask the Sommelier</Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.gold,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Georgia',
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  budgetSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  budgetLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gold,
    letterSpacing: 1.5,
  },
  budgetValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.gold,
    fontFamily: 'Georgia',
  },
  resultsHeader: {
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'flex-end',
  },
  resultsHeaderImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  resultsHeaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  resultsHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  resultsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.goldTransparent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.gold,
    letterSpacing: 1,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  recommendationsCard: {
    marginBottom: 24,
  },
  recommendationsText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  actions: {
    marginBottom: 40,
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
    flex: 1,
  },
  chatButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 14,
    gap: 8,
  },
  chatButtonText: {
    fontSize: 14,
    color: Colors.gold,
    fontWeight: '500',
  },
});
