import React from 'react';
import { Text, View } from 'react-native';
import { formatDate } from '@infocus/shared';

const App: React.FC = () => {
  return (
    <View>
      <Text>InFocus Mobile App</Text>
      <Text>Placeholder for the InFocus mobile application</Text>
      <Text>Current date: {formatDate(new Date())}</Text>
    </View>
  );
};

export default App;
