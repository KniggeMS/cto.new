import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../../screens/auth/LoginScreen';
import { useAuth } from '../../lib/context/AuthContext';
import { Alert } from 'react-native';

jest.mock('../../lib/context/AuthContext');
jest.spyOn(Alert, 'alert');

describe('LoginScreen', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  });

  it('renders login form', () => {
    render(<LoginScreen />);
    expect(screen.getByText('Welcome Back')).toBeTruthy();
    expect(screen.getByTestId('email-input')).toBeTruthy();
    expect(screen.getByTestId('password-input')).toBeTruthy();
    expect(screen.getByTestId('login-button')).toBeTruthy();
  });

  it('displays validation errors for empty fields', async () => {
    render(<LoginScreen />);
    const loginButton = screen.getByTestId('login-button');

    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
      expect(screen.getByText('Password is required')).toBeTruthy();
    });
  });

  it('displays validation error for invalid email', async () => {
    render(<LoginScreen />);
    const emailInput = screen.getByTestId('email-input');
    const loginButton = screen.getByTestId('login-button');

    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
    });
  });

  it('calls login with valid credentials', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    render(<LoginScreen />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('displays error alert on login failure', async () => {
    const error = {
      response: {
        data: {
          error: 'Invalid credentials',
        },
      },
    };
    mockLogin.mockRejectedValueOnce(error);

    render(<LoginScreen />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'wrongpassword');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Login Failed', 'Invalid credentials');
    });
  });

  it('shows loading state during login', async () => {
    mockLogin.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
    render(<LoginScreen />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      const button = screen.getByTestId('login-button');
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });
  });
});
