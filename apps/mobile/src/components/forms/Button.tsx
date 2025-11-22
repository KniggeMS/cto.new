import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  testID,
}) => {
  const isDisabled = disabled || loading;

  const buttonStyle = [
    styles.button,
    variant === 'primary' && styles.primaryButton,
    variant === 'secondary' && styles.secondaryButton,
    variant === 'outline' && styles.outlineButton,
    isDisabled && styles.disabledButton,
    style,
  ];

  const textStyle = [
    styles.text,
    variant === 'primary' && styles.primaryText,
    variant === 'secondary' && styles.secondaryText,
    variant === 'outline' && styles.outlineText,
    isDisabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#3b82f6' : '#fff'} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderColor: '#3b82f6',
    borderWidth: 1,
  },
  outlineText: {
    color: '#3b82f6',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  primaryText: {
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: '#64748b',
  },
  secondaryText: {
    color: '#fff',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
