import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';

interface MultiStepFormLayoutProps {
    title: string;
    children: ReactNode;
    onNext?: () => void;
    nextLabel?: string;
    currentStep?: number;
    totalSteps?: number;
    isSubmitting?: boolean;
}

export function MultiStepFormLayout({
    title,
    children,
    onNext,
    nextLabel = "Next",
    currentStep,
    totalSteps,
    isSubmitting
}: MultiStepFormLayoutProps) {
    const router = useRouter();

    return (
        <View className="flex-1 bg-background">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="flex-row items-center px-4 py-4 pt-12 bg-white border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-lg font-bold text-primary-text">{title}</Text>
                    {currentStep && totalSteps && (
                        <Text className="text-xs text-secondary-text">Step {currentStep} of {totalSteps}</Text>
                    )}
                </View>
            </View>

            {/* Content */}
            <ScrollView className="flex-1 px-4 py-6">
                {children}
            </ScrollView>

            {/* Footer / CTA */}
            {onNext && (
                <View className="p-4 bg-white border-t border-gray-100 safe-bottom">
                    <TouchableOpacity
                        onPress={onNext}
                        disabled={isSubmitting}
                        className={`w-full py-4 rounded-xl items-center ${isSubmitting ? 'bg-gray-300' : 'bg-blue-600'}`}
                    >
                        <Text className="text-white font-bold text-base">
                            {isSubmitting ? 'Processing...' : nextLabel}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
