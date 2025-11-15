import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export const SplashScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>InFocus</Text>
      <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 24,
  },
  loader: {
    marginTop: 16,
  },
});
