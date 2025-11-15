import React, { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  FormControl,
  Input,
  Button,
  Link,
  useToast,
  KeyboardAvoidingView,
  ScrollView,
} from 'native-base';
import { Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { AuthStackParamList } from '@/navigation/AuthStack';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    displayName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register } = useAuth();
  const toast = useToast();

  const validate = () => {
    const newErrors: {
      displayName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!displayName) {
      newErrors.displayName = 'Display name is required';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      await register(email, password, displayName);
      toast.show({
        description: 'Account created successfully!',
        bg: 'green.600',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.show({
        description: errorMessage || 'Registration failed. Please try again.',
        bg: 'red.600',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView flex={1} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView flex={1} bg="white">
        <Box flex={1} px={6} py={12} justifyContent="center">
          <VStack space={6} alignItems="center">
            <Heading size="2xl" color="primary.600">
              Create Account
            </Heading>
            <Text fontSize="md" color="gray.600">
              Sign up to get started
            </Text>

            <VStack space={4} width="100%" mt={8}>
              <FormControl isInvalid={'displayName' in errors}>
                <FormControl.Label>Display Name</FormControl.Label>
                <Input
                  value={displayName}
                  onChangeText={(text) => {
                    setDisplayName(text);
                    if (errors.displayName) setErrors({ ...errors, displayName: undefined });
                  }}
                  placeholder="Enter your display name"
                  size="lg"
                />
                {'displayName' in errors && (
                  <FormControl.ErrorMessage>{errors.displayName}</FormControl.ErrorMessage>
                )}
              </FormControl>

              <FormControl isInvalid={'email' in errors}>
                <FormControl.Label>Email</FormControl.Label>
                <Input
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  size="lg"
                />
                {'email' in errors && (
                  <FormControl.ErrorMessage>{errors.email}</FormControl.ErrorMessage>
                )}
              </FormControl>

              <FormControl isInvalid={'password' in errors}>
                <FormControl.Label>Password</FormControl.Label>
                <Input
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  placeholder="Enter your password"
                  type="password"
                  size="lg"
                />
                {'password' in errors && (
                  <FormControl.ErrorMessage>{errors.password}</FormControl.ErrorMessage>
                )}
              </FormControl>

              <FormControl isInvalid={'confirmPassword' in errors}>
                <FormControl.Label>Confirm Password</FormControl.Label>
                <Input
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword)
                      setErrors({ ...errors, confirmPassword: undefined });
                  }}
                  placeholder="Confirm your password"
                  type="password"
                  size="lg"
                />
                {'confirmPassword' in errors && (
                  <FormControl.ErrorMessage>{errors.confirmPassword}</FormControl.ErrorMessage>
                )}
              </FormControl>

              <Button
                onPress={handleRegister}
                isLoading={isLoading}
                isLoadingText="Creating account..."
                size="lg"
                mt={4}
              >
                Sign Up
              </Button>

              <Box alignItems="center" mt={4}>
                <Text>
                  Already have an account?{' '}
                  <Link
                    onPress={() => navigation.navigate('Login')}
                    _text={{ color: 'primary.600', fontWeight: 'bold' }}
                  >
                    Sign In
                  </Link>
                </Text>
              </Box>
            </VStack>
          </VStack>
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
