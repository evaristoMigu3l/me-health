import { View, TextInput, Text, FlatList, TouchableOpacity, Modal } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

interface SearchableDropdownProps {
    items: { id: string; name: string }[];
    onSelect: (item: { id: string; name: string }) => void;
    placeholder?: string;
    label?: string;
}

export function SearchableDropdown({ items, onSelect, placeholder = "Search...", label }: SearchableDropdownProps) {
    const [query, setQuery] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<{ id: string; name: string } | null>(null);

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase())
    );

    const handleSelect = (item: { id: string; name: string }) => {
        setSelectedItem(item);
        onSelect(item);
        setIsVisible(false);
        setQuery('');
    };

    return (
        <View className="mb-4">
            {label && <Text className="text-sm font-medium text-secondary-text mb-2">{label}</Text>}

            <TouchableOpacity
                onPress={() => setIsVisible(true)}
                className="flex-row items-center bg-white border border-gray-200 rounded-xl p-4"
            >
                <Text className={`flex-1 ${selectedItem ? 'text-primary-text' : 'text-gray-400'}`}>
                    {selectedItem ? selectedItem.name : placeholder}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
                <View className="flex-1 bg-background pt-6">
                    <View className="flex-row items-center px-4 pb-4 border-b border-gray-100 bg-white">
                        {/* Close Button */}
                        <TouchableOpacity onPress={() => setIsVisible(false)} className="mr-3">
                            <Ionicons name="close" size={24} color="#1A1A1A" />
                        </TouchableOpacity>

                        {/* Search Input */}
                        <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                            <Ionicons name="search" size={20} color="#9CA3AF" />
                            <TextInput
                                className="flex-1 ml-2 text-base text-primary-text"
                                placeholder="Search..."
                                value={query}
                                onChangeText={setQuery}
                                autoFocus
                            />
                        </View>
                    </View>

                    <FlatList
                        data={filteredItems}
                        keyExtractor={(item) => item.id}
                        className="flex-1 px-4"
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => handleSelect(item)}
                                className="py-4 border-b border-gray-100"
                            >
                                <Text className="text-base text-primary-text">{item.name}</Text>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <View className="py-8 items-center">
                                <Text className="text-secondary-text">No results found.</Text>
                            </View>
                        }
                    />
                </View>
            </Modal>
        </View>
    );
}
