import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { OnboardingScreen } from '../../screens/auth/OnboardingScreen';
import { useAuth } from '../../lib/context/AuthContext';
import { Alert } from 'react-native';

jest.mock('../../lib/context/AuthContext');
jest.spyOn(Alert, 'alert');

describe('OnboardingScreen', () => {
  const mockCompleteOnboarding = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      completeOnboarding: mockCompleteOnboarding,
      user: null,
      isLoading: false,
      isAuthenticated: true,
      needsOnboarding: true,
    });
  });

  it('renders onboarding form', () => {
    render(<OnboardingScreen />);
    expect(screen.getByText('Welcome to InFocus!')).toBeTruthy();
    expect(screen.getByTestId('displayName-input')).toBeTruthy();
    expect(screen.getByText('Streaming Services')).toBeTruthy();
    expect(screen.getByTestId('complete-button')).toBeTruthy();
    expect(screen.getByTestId('skip-button')).toBeTruthy();
  });

  it('renders streaming provider options', () => {
    render(<OnboardingScreen />);
    expect(screen.getByTestId('provider-netflix')).toBeTruthy();
    expect(screen.getByTestId('provider-amazon')).toBeTruthy();
    expect(screen.getByTestId('provider-disney')).toBeTruthy();
    expect(screen.getByTestId('provider-hulu')).toBeTruthy();
  });

  it('allows selecting streaming providers', () => {
    render(<OnboardingScreen />);
    const netflixProvider = screen.getByTestId('provider-netflix');

    fireEvent.press(netflixProvider);

    expect(netflixProvider.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ borderColor: '#3b82f6' })]),
    );
  });

  it('completes onboarding with display name and providers', async () => {
    mockCompleteOnboarding.mockResolvedValueOnce(undefined);
    render(<OnboardingScreen />);

    fireEvent.changeText(screen.getByTestId('displayName-input'), 'John Doe');
    fireEvent.press(screen.getByTestId('provider-netflix'));
    fireEvent.press(screen.getByTestId('provider-disney'));
    fireEvent.press(screen.getByTestId('complete-button'));

    await waitFor(() => {
      expect(mockCompleteOnboarding).toHaveBeenCalledWith('John Doe', ['netflix', 'disney']);
    });
  });

  it('allows skipping onboarding', async () => {
    mockCompleteOnboarding.mockResolvedValueOnce(undefined);
    render(<OnboardingScreen />);

    fireEvent.press(screen.getByTestId('skip-button'));

    await waitFor(() => {
      expect(mockCompleteOnboarding).toHaveBeenCalledWith();
    });
  });

  it('displays error alert on onboarding failure', async () => {
    const error = {
      response: {
        data: {
          error: 'Failed to update profile',
        },
      },
    };
    mockCompleteOnboarding.mockRejectedValueOnce(error);

    render(<OnboardingScreen />);

    fireEvent.changeText(screen.getByTestId('displayName-input'), 'John Doe');
    fireEvent.press(screen.getByTestId('complete-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Onboarding Failed', 'Failed to update profile');
    });
  });
});
