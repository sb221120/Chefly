import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../src/theme/colors';
import { GoldButton, GoldOutlineButton } from '../../src/components/GoldButton';
import { DarkCard } from '../../src/components/DarkCard';
import IMAGES from '../../src/constants/images';
import * as api from '../../src/services/api';

const { width } = Dimensions.get('window');

const SCAN_TIPS = [
  'Hold camera steady for best results',
  'Ensure good lighting conditions',
  'Avoid reflections on glass',
  'Keep the label centered in frame',
];

export default function ScannerScreen() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [budget, setBudget] = useState(500);
  const [currency, setCurrency] = useState('UAH');

  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const user = await api.getUser(userId);
        setBudget(user.budget_limit || 500);
        setCurrency(user.preferred_currency || 'UAH');
      }
    } catch (error) {
      console.log('Error loading preferences:', error);
    }
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      const permissionResult = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Error', 'Permission is required');
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            base64: true,
          });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].base64 || null);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select photo');
    }
  };

  const analyzeShelf = async () => {
    if (!image) return;

    try {
      setIsAnalyzing(true);
      const userId = await AsyncStorage.getItem('userId');
      
      if (!userId) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const result = await api.scanShelf(
        userId,
        image,
        budget,
        currency,
        'UK'
      );

      // Navigate to results
      router.push({
        pathname: '/scan-result',
        params: {
          recommendations: result.recommendations,
          budget: budget.toString(),
          currency: currency,
        },
      });
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Error', 'Failed to analyze. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SHELF SCANNER</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Budget display */}
        <View style={styles.budgetSection}>
          <View>
            <Text style={styles.budgetLabel}>CURRENT BUDGET</Text>
            <Text style={styles.budgetSubtext}>Find bottles within your range</Text>
          </View>
          <Text style={styles.budgetValue}>
            {budget} {currency}
          </Text>
        </View>

        {/* Image preview area */}
        <View style={styles.previewContainer}>
          {image ? (
            <Image
              source={{ uri: `data:image/jpeg;base64,${image}` }}
              style={styles.previewImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.placeholderContainer}>
              {/* Background wine shelf image */}
              <Image
                source={{ uri: IMAGES.wineShelf }}
                style={styles.placeholderImage}
                contentFit="cover"
              />
              <View style={styles.placeholderOverlay} />
              
              {/* Scanning target overlay */}
              <View style={styles.scanTarget}>
                <View style={styles.scanCrosshair}>
                  <View style={[styles.scanLine, styles.scanLineH]} />
                  <View style={[styles.scanLine, styles.scanLineV]} />
                </View>
              </View>
              
              <Text style={styles.placeholderText}>
                Point camera at wine shelf
              </Text>
            </View>
          )}

          {/* Corner brackets */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        {/* Action buttons */}
        {!image ? (
          <View style={styles.actionButtons}>
            <GoldOutlineButton
              label="Gallery"
              icon="images-outline"
              onPress={() => pickImage(false)}
              style={styles.actionButton}
            />
            <GoldOutlineButton
              label="Camera"
              icon="camera-outline"
              onPress={() => pickImage(true)}
              style={styles.actionButton}
            />
          </View>
        ) : (
          <View style={styles.analyzeButtons}>
            <GoldButton
              label={isAnalyzing ? 'Analyzing...' : 'Analyze Shelf'}
              icon="sparkles"
              onPress={analyzeShelf}
              loading={isAnalyzing}
            />
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => setImage(null)}
            >
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tips */}
        <DarkCard style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.gold} />
            <Text style={styles.tipsTitle}>SCANNING PROTOCOL</Text>
          </View>
          {SCAN_TIPS.map((tip, index) => (
            <View key={index} style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </DarkCard>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  budgetSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 14,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  budgetLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gold,
    letterSpacing: 1.5,
  },
  budgetSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  budgetValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.gold,
    fontFamily: 'Georgia',
  },
  previewContainer: {
    aspectRatio: 3 / 4,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  placeholderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  scanTarget: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  scanCrosshair: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLine: {
    position: 'absolute',
    backgroundColor: Colors.gold,
  },
  scanLineH: {
    width: 40,
    height: 1.5,
  },
  scanLineV: {
    width: 1.5,
    height: 40,
  },
  placeholderText: {
    fontSize: 14,
    color: Colors.textSecondary,
    zIndex: 1,
    fontWeight: '500',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: Colors.gold,
  },
  topLeft: {
    top: 20,
    left: 20,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
  },
  topRight: {
    top: 20,
    right: 20,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
  },
  analyzeButtons: {
    marginBottom: 20,
  },
  resetButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resetText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  tipsCard: {
    marginBottom: 20,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsTitle: {
    marginLeft: 8,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.gold,
    letterSpacing: 1.5,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gold,
    marginRight: 10,
  },
  tipText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
