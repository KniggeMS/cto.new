import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { AxiosError } from 'axios';
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
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string }>;
      Alert.alert(
        'Onboarding Failed',
        axiosError.response?.data?.error ||
          (error as Error).message ||
          'Unable to complete onboarding',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      setLoading(true);
      await completeOnboarding();
    } catch {
      Alert.alert('Error', 'Unable to skip onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container scrollable>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to InFocus!</Text>
        <Text style={styles.subtitle}>Let&apos;s personalize your experience</Text>
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
  form: {
    flex: 1,
  },
  header: {
    marginBottom: 32,
    marginTop: 40,
  },
  providerCard: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  providerCardSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  providerText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  providerTextSelected: {
    color: '#3b82f6',
  },
  providersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionSubtitle: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#1f2937',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  skipButton: {
    marginTop: 12,
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 16,
  },
  title: {
    color: '#1f2937',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});
