import React from 'react';
import { Box, VStack, Heading, Text, Center, Button } from 'native-base';

export default function FamilyScreen() {
  return (
    <Box flex={1} bg="white" px={4} py={6}>
      <VStack space={4}>
        <Heading size="lg">Family Groups</Heading>
        <Center flex={1} py={12}>
          <Text fontSize="md" color="gray.500" textAlign="center">
            Create or join a family group to share
          </Text>
          <Text fontSize="md" color="gray.500" textAlign="center">
            watchlists and recommendations
          </Text>
          <Button mt={6} size="lg">
            Create Family Group
          </Button>
        </Center>
      </VStack>
    </Box>
  );
}
