import { View, Text, TouchableOpacity } from 'react-native';

interface HealthDataCardProps {
    title: string;
    value: string | number;
    unit?: string;
    subtitle?: string;
    onUpdate?: () => void;
}

export function HealthDataCard({ title, value, unit, subtitle, onUpdate }: HealthDataCardProps) {
    return (
        <View className="bg-white p-4 rounded-xl shadow-sm my-2 flex-1 mx-1 min-w-[150px]">
            <Text className="text-sm font-medium text-secondary-text mb-2">{title}</Text>
            <View className="flex-row items-end">
                <Text className="text-2xl font-bold text-primary-text">{value}</Text>
                {unit && <Text className="text-sm text-secondary-text mb-1 ml-1">{unit}</Text>}
            </View>
            {subtitle && <Text className="text-xs text-secondary-text mt-1">{subtitle}</Text>}

            {onUpdate && (
                <TouchableOpacity
                    onPress={onUpdate}
                    className="mt-4 bg-gray-100 py-2 px-3 rounded-lg items-center"
                >
                    <Text className="text-xs font-bold text-primary-text">Update</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
