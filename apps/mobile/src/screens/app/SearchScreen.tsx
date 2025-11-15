import React, { useState } from 'react';
import { Box, VStack, Heading, Input, Icon, Text, Center } from 'native-base';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <Box flex={1} bg="white" px={4} py={6}>
      <VStack space={4}>
        <Heading size="lg">Search</Heading>
        <Input
          placeholder="Search for movies and TV shows..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          size="lg"
          InputLeftElement={<Icon name="search" ml={2} />}
        />
        <Center flex={1} py={12}>
          <Text fontSize="md" color="gray.500">
            {searchQuery ? 'Search results will appear here' : 'Start typing to search'}
          </Text>
        </Center>
      </VStack>
    </Box>
  );
}
