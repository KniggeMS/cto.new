import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { NativeBaseProvider } from 'native-base';
import { AuthProvider } from '@/contexts/AuthContext';

const inset = {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <NativeBaseProvider initialWindowMetrics={inset}>
      <AuthProvider>{children}</AuthProvider>
    </NativeBaseProvider>
  );
};

const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react-native';
export { customRender as render };
