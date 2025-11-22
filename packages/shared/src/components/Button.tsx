import React from 'react';

export interface ButtonProps {
  children?: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
}) => {
  return null;
};