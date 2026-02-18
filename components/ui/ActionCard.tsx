import { View, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ActionCardProps extends TouchableOpacityProps {
    title: string;
    subtitle?: string;
    iconName: keyof typeof Ionicons.glyphMap;
    color: string;
}

export function ActionCard({ title, subtitle, iconName, color, ...props }: ActionCardProps) {
    return (
        <TouchableOpacity
            className="flex-row items-center p-4 my-2 mr-4 bg-white rounded-xl shadow-sm w-72"
            {...props}
        >
            <View className="p-3 rounded-full mr-4" style={{ backgroundColor: color + '20' }}>
                <Ionicons name={iconName} size={24} color={color} />
            </View>
            <View className="flex-1">
                <Text className="text-base font-bold text-primary-text">{title}</Text>
                {subtitle && <Text className="text-xs text-secondary-text mt-1">{subtitle}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
    );
}
