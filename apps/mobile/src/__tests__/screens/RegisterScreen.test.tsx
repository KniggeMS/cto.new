import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../../screens/auth/RegisterScreen';
import { useAuth } from '../../lib/context/AuthContext';
import { Alert } from 'react-native';

jest.mock('../../lib/context/AuthContext');
jest.spyOn(Alert, 'alert');

describe('RegisterScreen', () => {
  const mockRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      register: mockRegister,
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  });

  it('renders register form', () => {
    render(<RegisterScreen />);
    expect(screen.getByText('Create Account')).toBeTruthy();
    expect(screen.getByTestId('displayName-input')).toBeTruthy();
    expect(screen.getByTestId('email-input')).toBeTruthy();
    expect(screen.getByTestId('password-input')).toBeTruthy();
    expect(screen.getByTestId('confirmPassword-input')).toBeTruthy();
    expect(screen.getByTestId('register-button')).toBeTruthy();
  });

  it('displays validation errors for empty fields', async () => {
    render(<RegisterScreen />);
    const registerButton = screen.getByTestId('register-button');

    fireEvent.press(registerButton);

    await waitFor(() => {
      expect(screen.getByText('Display name is required')).toBeTruthy();
      expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
    });
  });

  it('displays validation error for weak password', async () => {
    render(<RegisterScreen />);

    fireEvent.changeText(screen.getByTestId('displayName-input'), 'John Doe');
    fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(screen.getByTestId('password-input'), 'weak');
    fireEvent.changeText(screen.getByTestId('confirmPassword-input'), 'weak');
    fireEvent.press(screen.getByTestId('register-button'));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeTruthy();
    });
  });

  it('displays validation error for password mismatch', async () => {
    render(<RegisterScreen />);

    fireEvent.changeText(screen.getByTestId('displayName-input'), 'John Doe');
    fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(screen.getByTestId('password-input'), 'Password123');
    fireEvent.changeText(screen.getByTestId('confirmPassword-input'), 'Different123');
    fireEvent.press(screen.getByTestId('register-button'));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeTruthy();
    });
  });

  it('calls register with valid data', async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    render(<RegisterScreen />);

    fireEvent.changeText(screen.getByTestId('displayName-input'), 'John Doe');
    fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(screen.getByTestId('password-input'), 'Password123');
    fireEvent.changeText(screen.getByTestId('confirmPassword-input'), 'Password123');
    fireEvent.press(screen.getByTestId('register-button'));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('test@example.com', 'Password123', 'John Doe');
    });
  });

  it('displays error alert on registration failure', async () => {
    const error = {
      response: {
        data: {
          error: 'Email already exists',
        },
      },
    };
    mockRegister.mockRejectedValueOnce(error);

    render(<RegisterScreen />);

    fireEvent.changeText(screen.getByTestId('displayName-input'), 'John Doe');
    fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(screen.getByTestId('password-input'), 'Password123');
    fireEvent.changeText(screen.getByTestId('confirmPassword-input'), 'Password123');
    fireEvent.press(screen.getByTestId('register-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Registration Failed', 'Email already exists');
    });
  });
});
