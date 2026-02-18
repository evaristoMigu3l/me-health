import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CircularProgressRingProps {
    progress: number; // 0 to 100
    size?: number;
    strokeWidth?: number;
    color?: string;
    label?: string;
}

export function CircularProgressRing({
    progress,
    size = 80,
    strokeWidth = 8,
    color = '#3B82F6',
    label
}: CircularProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <View className="items-center justify-center m-2">
            <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {/* Background Circle */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#E5E7EB"
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    {/* Progress Circle */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        rotation="-90"
                        origin={`${size / 2}, ${size / 2}`}
                    />
                </Svg>
                <View className="absolute items-center justify-center">
                    <Text className="text-sm font-bold text-primary-text">{Math.round(progress)}%</Text>
                </View>
            </View>
            {label && <Text className="mt-2 text-xs font-medium text-secondary-text">{label}</Text>}
        </View>
    );
}
