import { View, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CategoryButtonProps extends TouchableOpacityProps {
    title: string;
    iconName: keyof typeof Ionicons.glyphMap;
    color: string;
    active?: boolean;
}

export function CategoryButton({ title, iconName, color, active, ...props }: CategoryButtonProps) {
    return (
        <TouchableOpacity
            className={`items-center justify-center p-4 m-2 rounded-2xl bg-white shadow-sm ${active ? 'border-2 border-primary-500' : ''}`}
            style={{ width: 100, height: 100 }}
            {...props}
        >
            <View className="p-3 rounded-full mb-2" style={{ backgroundColor: color + '20' }}>
                <Ionicons name={iconName} size={24} color={color} />
            </View>
            <Text className="text-xs font-medium text-center text-primary-text">{title}</Text>
        </TouchableOpacity>
    );
}
