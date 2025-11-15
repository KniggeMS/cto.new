import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Input } from '../../components/forms/Input';

describe('Input Component', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Test input" testID="test-input" />);
    expect(screen.getByTestId('test-input')).toBeTruthy();
  });

  it('displays label when provided', () => {
    render(<Input label="Email" placeholder="Enter email" testID="test-input" />);
    expect(screen.getByText('Email')).toBeTruthy();
  });

  it('displays error message when provided', () => {
    render(<Input error="This field is required" testID="test-input" />);
    expect(screen.getByText('This field is required')).toBeTruthy();
  });

  it('applies error styles when error is present', () => {
    const { getByTestId } = render(<Input error="Error message" testID="test-input" />);
    const input = getByTestId('test-input');
    expect(input.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ borderColor: '#ef4444' })]),
    );
  });
});
