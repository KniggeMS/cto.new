import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'native-base';
import WatchlistScreen from '@/screens/app/WatchlistScreen';
import SearchScreen from '@/screens/app/SearchScreen';
import FamilyScreen from '@/screens/app/FamilyScreen';
import SettingsScreen from '@/screens/app/SettingsScreen';

export type AppTabsParamList = {
  Watchlist: undefined;
  Search: undefined;
  Family: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();

function ListIcon() {
  return <Icon name="list" size="md" />;
}

function SearchIcon() {
  return <Icon name="search" size="md" />;
}

function UsersIcon() {
  return <Icon name="users" size="md" />;
}

function SettingsIcon() {
  return <Icon name="settings" size="md" />;
}

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#0284c7',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tab.Screen
        name="Watchlist"
        component={WatchlistScreen}
        options={{
          tabBarIcon: ListIcon,
          title: 'My Watchlist',
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: SearchIcon,
          title: 'Search',
        }}
      />
      <Tab.Screen
        name="Family"
        component={FamilyScreen}
        options={{
          tabBarIcon: UsersIcon,
          title: 'Family',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: SettingsIcon,
          title: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}
