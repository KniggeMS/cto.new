import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Container } from '../../components/layout/Container';
import { Button } from '../../components/forms/Button';
import { useAuth } from '../../lib/context/AuthContext';

export const SettingsScreen: React.FC = () => {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <Container>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          {user && (
            <View style={styles.userInfo}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user.email}</Text>
              {(user.displayName || user.name) && (
                <>
                  <Text style={styles.label}>Display Name</Text>
                  <Text style={styles.value}>{user.displayName || user.name}</Text>
                </>
              )}
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <Button title="Logout" onPress={handleLogout} variant="outline" testID="logout-button" />
        </View>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  actions: {
    marginTop: 'auto',
  },
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 32,
  },
  label: {
    color: '#6b7280',
    fontSize: 12,
    marginBottom: 4,
    marginTop: 12,
  },
  title: {
    color: '#1f2937',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  userInfo: {
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  value: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '500',
  },
});
