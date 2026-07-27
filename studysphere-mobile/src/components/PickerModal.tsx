import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SPACING, ThemeColors, GlobalStyles } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';

export interface PickerItem {
    id: string;
    name: string;
}

interface PickerModalProps {
    visible: boolean;
    title: string;
    items?: PickerItem[];
    loading?: boolean;
    emptyText?: string;
    onSelect: (item: PickerItem) => void;
    onClose: () => void;
}

export const PickerModal: React.FC<PickerModalProps> = ({
    visible,
    title,
    items,
    loading = false,
    emptyText = 'Kayıt bulunamadı.',
    onSelect,
    onClose,
}) => {
    const { colors, globalStyles } = useTheme();
    const styles = useMemo(() => createStyles(colors, globalStyles), [colors, globalStyles]);
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeText}>Kapat</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.listContainer}>
                        {loading ? (
                            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
                        ) : (
                            <FlatList
                                data={items}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.listItem} onPress={() => onSelect(item)}>
                                        <Text style={styles.listText}>{item.name}</Text>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={<Text style={styles.emptyText}>{emptyText}</Text>}
                            />
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const createStyles = (colors: ThemeColors, globalStyles: GlobalStyles) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: colors.overlay,
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '60%',
        padding: SPACING.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    title: {
        ...globalStyles.title,
        fontSize: 20,
    },
    closeButton: {
        padding: SPACING.xs,
    },
    closeText: {
        color: colors.error,
        fontWeight: 'bold',
    },
    listContainer: {
        flex: 1,
    },
    listItem: {
        backgroundColor: colors.background,
        padding: SPACING.md,
        borderRadius: 12,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    listText: {
        fontSize: 16,
        color: colors.text,
        fontWeight: '500',
    },
    loader: {
        marginTop: SPACING.xl,
    },
    emptyText: {
        textAlign: 'center',
        color: colors.textSecondary,
        marginTop: SPACING.xl,
        fontStyle: 'italic',
    },
});
