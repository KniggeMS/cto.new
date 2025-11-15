import React from 'react';
import { Box, VStack, Heading, Text, Button, Divider, useToast } from 'native-base';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const toast = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast.show({
        description: 'Logged out successfully',
        bg: 'green.600',
      });
    } catch (error) {
      toast.show({
        description: 'Error logging out',
        bg: 'red.600',
      });
    }
  };

  return (
    <Box flex={1} bg="white" px={4} py={6}>
      <VStack space={4}>
        <Heading size="lg">Settings</Heading>

        <Box mt={4} p={4} bg="gray.50" borderRadius="md">
          <Text fontSize="sm" color="gray.600" mb={1}>
            Signed in as
          </Text>
          <Text fontSize="lg" fontWeight="bold">
            {user?.displayName || user?.name || 'User'}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {user?.email}
          </Text>
        </Box>

        <Divider my={4} />

        <VStack space={3}>
          <Button variant="outline" size="lg">
            Edit Profile
          </Button>
          <Button variant="outline" size="lg">
            Preferences
          </Button>
          <Button variant="outline" size="lg">
            Notifications
          </Button>
        </VStack>

        <Divider my={4} />

        <Button colorScheme="red" variant="outline" size="lg" onPress={handleLogout}>
          Sign Out
        </Button>

        <Text fontSize="xs" color="gray.400" textAlign="center" mt={8}>
          InFocus v1.0.0
        </Text>
      </VStack>
    </Box>
  );
}
