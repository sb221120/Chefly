import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import Colors from '../src/theme/colors';
import { LanguageProvider } from '../src/i18n/i18n';

export default function RootLayout() {
  return (
    <LanguageProvider>
      <View style={{ flex: 1, backgroundColor: Colors.black }}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.black },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="premium" options={{ presentation: 'modal' }} />
          <Stack.Screen name="scan-result" />
        </Stack>
      </View>
    </LanguageProvider>
  );
}
