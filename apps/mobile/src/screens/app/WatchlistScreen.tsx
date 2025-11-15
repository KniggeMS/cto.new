import React from 'react';
import { Box, VStack, Heading, Text, Center } from 'native-base';

export default function WatchlistScreen() {
  return (
    <Box flex={1} bg="white" px={4} py={6}>
      <VStack space={4}>
        <Heading size="lg">My Watchlist</Heading>
        <Center flex={1} py={12}>
          <Text fontSize="md" color="gray.500">
            Your watchlist will appear here
          </Text>
          <Text fontSize="sm" color="gray.400" mt={2}>
            Add items from the search screen
          </Text>
        </Center>
      </VStack>
    </Box>
  );
}
