import { device, element, by, expect as detoxExpect, waitFor } from 'detox';

describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { notifications: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show login screen on app launch', async () => {
    await waitFor(element(by.text('Welcome Back')))
      .toBeVisible()
      .withTimeout(5000);
    await detoxExpect(element(by.id('email-input'))).toBeVisible();
    await detoxExpect(element(by.id('password-input'))).toBeVisible();
    await detoxExpect(element(by.id('login-button'))).toBeVisible();
  });

  it('should navigate to register screen', async () => {
    await waitFor(element(by.id('register-link')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('register-link')).tap();
    await waitFor(element(by.text('Create Account')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should show validation errors on empty login', async () => {
    await waitFor(element(by.id('login-button')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('login-button')).tap();
    
    await waitFor(element(by.text('Please enter a valid email address')))
      .toBeVisible()
      .withTimeout(5000);
    await waitFor(element(by.text('Password is required')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should successfully login with valid credentials', async () => {
    await waitFor(element(by.id('email-input')))
      .toBeVisible()
      .withTimeout(5000);
    
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('Password123');
    
    await element(by.id('login-button')).tap();
    
    await waitFor(element(by.text('Watchlist')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should persist authentication across app restarts', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('Password123');
    await element(by.id('login-button')).tap();
    
    await waitFor(element(by.text('Watchlist')))
      .toBeVisible()
      .withTimeout(10000);
    
    await device.reloadReactNative();
    
    await waitFor(element(by.text('Watchlist')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should logout successfully', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('Password123');
    await element(by.id('login-button')).tap();
    
    await waitFor(element(by.text('Settings')))
      .toBeVisible()
      .withTimeout(10000);
    
    await element(by.text('Settings')).tap();
    
    await waitFor(element(by.id('logout-button')))
      .toBeVisible()
      .withTimeout(5000);
    
    await element(by.id('logout-button')).tap();
    
    await waitFor(element(by.text('Logout')))
      .toBeVisible()
      .withTimeout(5000);
    
    await element(by.text('Logout')).tap();
    
    await waitFor(element(by.text('Welcome Back')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should show onboarding after registration without display name', async () => {
    await element(by.id('register-link')).tap();
    
    await waitFor(element(by.id('email-input')))
      .toBeVisible()
      .withTimeout(5000);
    
    await element(by.id('displayName-input')).typeText('');
    await element(by.id('email-input')).typeText('newuser@example.com');
    await element(by.id('password-input')).typeText('Password123');
    await element(by.id('confirmPassword-input')).typeText('Password123');
    
    await element(by.id('register-button')).tap();
    
    await waitFor(element(by.text('Welcome to InFocus!')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
