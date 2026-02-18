import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

function TabIcon({ name, color }: { name: string; color: string }) {
    return <Ionicons name={name as any} size={24} color={color} />;
}

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#3B82F6',
                tabBarInactiveTintColor: '#6B7280',
                tabBarStyle: {
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 1,
                    borderTopColor: '#F3F4F6',
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500',
                },
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name={focused ? 'home' : 'home-outline'} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="track"
                options={{
                    title: 'Track',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name={focused ? 'add-circle' : 'add-circle-outline'} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name={focused ? 'person' : 'person-outline'} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
