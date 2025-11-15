import { device, element, by, expect as detoxExpect } from 'detox';

describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show login screen on app launch', async () => {
    await detoxExpect(element(by.text('InFocus'))).toBeVisible();
    await detoxExpect(element(by.text('Sign in to your account'))).toBeVisible();
  });

  it('should show validation errors when submitting empty form', async () => {
    await element(by.text('Sign In')).tap();
    await detoxExpect(element(by.text('Email is required'))).toBeVisible();
    await detoxExpect(element(by.text('Password is required'))).toBeVisible();
  });

  it('should navigate to register screen', async () => {
    await element(by.text('Sign Up')).tap();
    await detoxExpect(element(by.text('Create Account'))).toBeVisible();
    await detoxExpect(element(by.text('Sign up to get started'))).toBeVisible();
  });

  it('should navigate back to login from register', async () => {
    await element(by.text('Sign Up')).tap();
    await element(by.text('Sign In')).tap();
    await detoxExpect(element(by.text('Sign in to your account'))).toBeVisible();
  });
});
