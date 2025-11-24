import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Container } from '../../components/layout/Container';
import { ImportExportSection } from '../../components/watchlist/ImportExportSection';

export const WatchlistScreen: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleImportComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <Container scrollable>
      <View style={styles.header}>
        <Text style={styles.title}>Watchlist</Text>
        <Text style={styles.subtitle}>Your watchlist will appear here</Text>
      </View>

      <ImportExportSection onImportComplete={handleImportComplete} />
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 16,
    marginTop: 8,
  },
  title: {
    color: '#1f2937',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
