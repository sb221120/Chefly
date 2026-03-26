import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../src/theme/colors';
import { CheflyLogo } from '../src/components/CheflyLogo';
import IMAGES from '../src/constants/images';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const bgFade = useRef(new Animated.Value(0)).current;
  const btnFade = useRef(new Animated.Value(0)).current;
  const [loadingText, setLoadingText] = useState('Initializing your private cellar...');
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Background fade in
    Animated.timing(bgFade, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // Logo animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        delay: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Update loading text
    const textTimer = setTimeout(() => {
      setLoadingText('Preparing sommelier experience...');
    }, 1500);

    // Show button after delay
    const btnTimer = setTimeout(() => {
      setShowButton(true);
      Animated.timing(btnFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 2500);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(btnTimer);
    };
  }, []);

  const handleEnter = async () => {
    const isOnboarded = await AsyncStorage.getItem('isOnboarded');
    if (isOnboarded === 'true') {
      router.replace('/(tabs)');
    } else {
      router.replace('/onboarding');
    }
  };

  return (
    <View style={styles.container}>
      {/* Background wine image with overlay */}
      <Animated.View style={[styles.bgImageContainer, { opacity: bgFade }]}>
        <Image
          source={{ uri: IMAGES.wineCellar }}
          style={styles.bgImage}
          contentFit="cover"
        />
        <View style={styles.bgOverlay} />
        <View style={styles.bgGradientTop} />
        <View style={styles.bgGradientBottom} />
      </Animated.View>

      {/* Gold glow background */}
      <View style={styles.glowBackground} />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <CheflyLogo size={110} glowing animated />
      </Animated.View>

      {/* Text */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.appName}>CHEFLY</Text>
        <Text style={styles.tagline}>YOUR PREMIUM AI CONCIERGE</Text>
      </Animated.View>

      {/* Loading text */}
      <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
        <Text style={styles.loadingText}>{loadingText}</Text>
      </Animated.View>

      {/* Enter button */}
      {showButton && (
        <Animated.View style={[styles.enterButtonContainer, { opacity: btnFade }]}>
          <TouchableOpacity style={styles.enterButton} onPress={handleEnter} activeOpacity={0.8}>
            <Text style={styles.enterButtonText}>Enter the Experience</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Bottom gold line */}
      <Animated.View style={[styles.bottomLine, { opacity: fadeAnim }]} />

      {/* Version */}
      <Text style={styles.version}>EST. 2025 • VERSION 1.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgImageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  bgGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  bgGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  glowBackground: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width,
    backgroundColor: Colors.gold,
    opacity: 0.04,
  },
  logoContainer: {
    marginBottom: 40,
    zIndex: 1,
  },
  textContainer: {
    alignItems: 'center',
    zIndex: 1,
  },
  appName: {
    fontSize: 42,
    fontWeight: '900',
    color: Colors.gold,
    letterSpacing: 10,
    fontFamily: 'Georgia',
  },
  tagline: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.goldTransparent40,
    letterSpacing: 3,
    marginTop: 10,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 160,
    zIndex: 1,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  enterButtonContainer: {
    position: 'absolute',
    bottom: 100,
    left: 40,
    right: 40,
    zIndex: 1,
  },
  enterButton: {
    backgroundColor: Colors.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  enterButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.black,
    letterSpacing: 0.5,
  },
  bottomLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.goldTransparent40,
  },
  version: {
    position: 'absolute',
    bottom: 40,
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 2,
    zIndex: 1,
  },
});
