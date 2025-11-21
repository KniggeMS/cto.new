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

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login } = useAuth();
  const toast = useToast();

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      await login(email, password);
      toast.show({
        description: 'Login successful!',
        bg: 'green.600',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.show({
        description: errorMessage || 'Login failed. Please try again.',
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
              InFocus
            </Heading>
            <Text fontSize="md" color="gray.600">
              Sign in to your account
            </Text>

            <VStack space={4} width="100%" mt={8}>
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

              <Button
                onPress={handleLogin}
                isLoading={isLoading}
                isLoadingText="Signing in..."
                size="lg"
                mt={4}
              >
                Sign In
              </Button>

              <Box alignItems="center" mt={4}>
                <Text>
                  Don&apos;t have an account?{' '}
                  <Link
                    onPress={() => navigation.navigate('Register')}
                    _text={{ color: 'primary.600', fontWeight: 'bold' }}
                  >
                    Sign Up
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
