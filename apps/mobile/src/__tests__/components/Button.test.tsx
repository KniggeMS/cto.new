import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from '../../components/forms/Button';

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button title="Click me" onPress={() => {}} testID="test-button" />);
    expect(screen.getByTestId('test-button')).toBeTruthy();
    expect(screen.getByText('Click me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<Button title="Click me" onPress={onPress} testID="test-button" />);
    fireEvent.press(screen.getByTestId('test-button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading indicator when loading', () => {
    render(<Button title="Click me" onPress={() => {}} loading testID="test-button" />);
    expect(screen.queryByText('Click me')).toBeNull();
  });

  it('is disabled when loading', () => {
    const onPress = jest.fn();
    render(<Button title="Click me" onPress={onPress} loading testID="test-button" />);
    const button = screen.getByTestId('test-button');
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it('is disabled when disabled prop is true', () => {
    const onPress = jest.fn();
    render(<Button title="Click me" onPress={onPress} disabled testID="test-button" />);
    const button = screen.getByTestId('test-button');
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it('applies variant styles correctly', () => {
    const { rerender } = render(
      <Button title="Primary" onPress={() => {}} variant="primary" testID="test-button" />,
    );
    let button = screen.getByTestId('test-button');
    expect(button.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: '#3b82f6' })]),
    );

    rerender(
      <Button title="Secondary" onPress={() => {}} variant="secondary" testID="test-button" />,
    );
    button = screen.getByTestId('test-button');
    expect(button.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: '#64748b' })]),
    );

    rerender(<Button title="Outline" onPress={() => {}} variant="outline" testID="test-button" />);
    button = screen.getByTestId('test-button');
    expect(button.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ borderColor: '#3b82f6' })]),
    );
  });
});
