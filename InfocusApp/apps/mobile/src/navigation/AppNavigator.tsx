import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View } from 'react-native';
import { Home, Search, User, LayoutGrid } from 'lucide-react-native';

// Screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
// import SearchScreen from '../screens/SearchScreen'; // To be created
// import ProfileScreen from '../screens/ProfileScreen'; // To be created

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#0f1115',
                    borderTopColor: '#1e293b',
                },
                tabBarActiveTintColor: '#06b6d4', // Cyan
                tabBarInactiveTintColor: '#64748b', // Slate
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
                }}
            />
            {/* Placeholders for now */}
            <Tab.Screen
                name="Search"
                component={HomeScreen} // Temporary
                options={{
                    tabBarIcon: ({ color, size }) => <Search color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Profile"
                component={HomeScreen} // Temporary
                options={{
                    tabBarIcon: ({ color, size }) => <User color={color} size={size} />
                }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState<string | null>(null);

    useEffect(() => {
        const checkToken = async () => {
            try {
                const token = await SecureStore.getItemAsync('token');
                setUserToken(token);
            } catch (e) {
                console.warn(e);
            } finally {
                setIsLoading(false);
            }
        };

        checkToken();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1115' }}>
                <ActivityIndicator size="large" color="#06b6d4" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {userToken ? (
                    <Stack.Screen name="Main" component={MainTabNavigator} />
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Main" component={MainTabNavigator} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
