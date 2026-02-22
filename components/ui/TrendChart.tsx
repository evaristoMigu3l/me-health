import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useAppTheme } from '../../hooks/useAppTheme';

interface TrendChartProps {
    data: { value: number; label?: string; dataPointText?: string }[];
    title?: string;
    unit?: string;
    color?: string;
    width?: number;
    height?: number;
}

export default function TrendChart({
    data,
    title,
    unit = '',
    color = '#10B981',
    width = Dimensions.get('window').width - 64,
    height = 220
}: TrendChartProps) {
    const { colors } = useAppTheme();

    if (!data || data.length === 0) {
        return (
            <View style={[styles.container, { height, backgroundColor: colors.surface }]}>
                <Text style={[styles.noDataText, { color: colors.textSecondary }]}>No data available for chart</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
            {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
            <LineChart
                data={data}
                color={color}
                thickness={3}
                dataPointsColor={color}
                startFillColor={color}
                endFillColor={color}
                startOpacity={0.2}
                endOpacity={0.05}
                areaChart
                yAxisTextStyle={{ color: colors.textSecondary, fontSize: 12 }}
                xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                noOfSections={4}
                width={width}
                height={height}
                rulesColor={colors.border}
                rulesType="solid"
                yAxisThickness={0}
                xAxisThickness={1}
                xAxisColor={colors.border}
                hideDataPoints={false}
                dataPointsRadius={4}
                pointerConfig={{
                    pointerStripHeight: 160,
                    pointerStripColor: 'lightgray',
                    pointerStripWidth: 2,
                    pointerColor: 'lightgray',
                    radius: 6,
                    pointerLabelWidth: 100,
                    pointerLabelHeight: 90,
                    activatePointersOnLongPress: true,
                    autoAdjustPointerLabelPosition: false,
                    pointerLabelComponent: (items: any) => {
                        return (
                            <View
                                style={{
                                    height: 90,
                                    width: 100,
                                    justifyContent: 'center',
                                    marginTop: -30,
                                    marginLeft: -40,
                                }}
                            >
                                <Text style={{ color: 'white', fontSize: 14, marginBottom: 6, textAlign: 'center' }}>
                                    {items[0].date}
                                </Text>
                                <View style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: 'white' }}>
                                    <Text style={{ fontWeight: 'bold', textAlign: 'center' }}>
                                        {items[0].value + (unit ? ' ' + unit : '')}
                                    </Text>
                                </View>
                            </View>
                        );
                    },
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 16,
        alignSelf: 'flex-start',
    },
    noDataText: {
        color: '#9CA3AF',
        fontSize: 14,
    }
});
