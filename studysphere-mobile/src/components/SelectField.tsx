import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Feather } from '@expo/vector-icons';
import { SPACING } from "../theme/theme";
import { useTheme } from "../context/ThemeContext";

interface SelectFieldProps {
    label?: string;
    placeholder: string;
    displayValue?: string;
    error?: string;
    disabled?: boolean;
    onPress: () => void;
}

export const SelectField: React.FC<SelectFieldProps> = ({
    label,
    placeholder,
    displayValue,
    error,
    disabled = false,
    onPress,
}) => {
    const { colors } = useTheme();
    return (
        <View style={styles.container}>
            {label && (
                <Text style={[styles.label, { color: colors.text }]}>
                    {label}
                </Text>
            )}
            <TouchableOpacity
                activeOpacity={0.7}
                disabled={disabled}
                onPress={onPress}
                style={[
                    styles.inputWrapper,
                    {
                        backgroundColor: colors.surface,
                        borderColor: error ? colors.error : colors.surface,
                        borderWidth: error ? 1 : 0,
                        opacity: disabled ? 0.5 : 1,
                    },
                ]}
            >
                <Text
                    style={[
                        styles.valueText,
                        { color: displayValue ? colors.text : colors.textSecondary },
                    ]}
                    numberOfLines={1}
                >
                    {displayValue || placeholder}
                </Text>
                <Feather name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: SPACING.xs,
        marginLeft: SPACING.xs,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 50,
        borderRadius: 12,
        paddingHorizontal: SPACING.md,
    },
    valueText: {
        flex: 1,
        fontSize: 16,
        marginRight: SPACING.sm,
    },
    errorText: {
        fontSize: 12,
        marginTop: SPACING.xs,
        marginLeft: SPACING.xs,
    },
});
