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
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    flex: 1,
    justifyContent: 'center',
  },
  loader: {
    marginTop: 16,
  },
  title: {
    color: '#1f2937',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 24,
  },
});
