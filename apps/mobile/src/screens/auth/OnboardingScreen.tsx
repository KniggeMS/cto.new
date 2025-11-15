import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Container } from '../../components/layout/Container';
import { Input } from '../../components/forms/Input';
import { Button } from '../../components/forms/Button';
import { onboardingSchema, OnboardingFormData } from '../../lib/validation/auth';
import { useAuth } from '../../lib/context/AuthContext';

const STREAMING_PROVIDERS = [
  { id: 'netflix', name: 'Netflix' },
  { id: 'amazon', name: 'Prime Video' },
  { id: 'disney', name: 'Disney+' },
  { id: 'hulu', name: 'Hulu' },
  { id: 'hbo', name: 'Max' },
  { id: 'apple', name: 'Apple TV+' },
];

export const OnboardingScreen: React.FC = () => {
  const { completeOnboarding } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      displayName: '',
      streamingProviders: [],
    },
  });

  const toggleProvider = (providerId: string) => {
    setSelectedProviders((prev) =>
      prev.includes(providerId) ? prev.filter((id) => id !== providerId) : [...prev, providerId],
    );
  };

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      setLoading(true);
      await completeOnboarding(data.displayName, selectedProviders);
    } catch (error: any) {
      Alert.alert(
        'Onboarding Failed',
        error.response?.data?.error || error.message || 'Unable to complete onboarding',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      setLoading(true);
      await completeOnboarding();
    } catch (error: any) {
      Alert.alert('Error', 'Unable to skip onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container scrollable>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to InFocus!</Text>
        <Text style={styles.subtitle}>Let's personalize your experience</Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="displayName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Display Name (Optional)"
              placeholder="How should we call you?"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.displayName?.message}
              autoCapitalize="words"
              testID="displayName-input"
            />
          )}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streaming Services</Text>
          <Text style={styles.sectionSubtitle}>Select the services you have access to</Text>

          <View style={styles.providersGrid}>
            {STREAMING_PROVIDERS.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                style={[
                  styles.providerCard,
                  selectedProviders.includes(provider.id) && styles.providerCardSelected,
                ]}
                onPress={() => toggleProvider(provider.id)}
                testID={`provider-${provider.id}`}
              >
                <Text
                  style={[
                    styles.providerText,
                    selectedProviders.includes(provider.id) && styles.providerTextSelected,
                  ]}
                >
                  {provider.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title="Get Started"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          testID="complete-button"
        />

        <Button
          title="Skip for Now"
          onPress={handleSkip}
          variant="outline"
          style={styles.skipButton}
          testID="skip-button"
        />
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 32,
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  form: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  providersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  providerCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  providerCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  providerText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  providerTextSelected: {
    color: '#3b82f6',
  },
  skipButton: {
    marginTop: 12,
  },
});
