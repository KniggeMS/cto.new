import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Container } from '../../components/layout/Container';

export const FamilyScreen: React.FC = () => {
  return (
    <Container>
      <View style={styles.center}>
        <Text style={styles.title}>Family</Text>
        <Text style={styles.subtitle}>Manage your family groups</Text>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
});
