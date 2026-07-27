import { StyleSheet, TextInputProps, View, Text, TextInput, TouchableOpacity } from "react-native";
import { Feather } from '@expo/vector-icons'; // Expo'nun yerleşik ikon kütüphanesi
import { SPACING } from "../theme/theme";
import { useTheme } from "../context/ThemeContext";
import { useState } from "react";

interface CustomInputProps extends TextInputProps{
    label ?: string;
    error ?: string;
    isPassword ?: boolean;
    leftIcon ?: keyof typeof Feather.glyphMap;
}

export const CustomInput : React.FC<CustomInputProps> = ({
    label,
    error,
    isPassword = false,
    leftIcon,
    style,
    ...rest
}) =>{
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
   const { colors } = useTheme();
    const togglePassword = () => setIsPasswordVisible(!isPasswordVisible);

    return (
        <View style = {styles.container}>
            {label && (
                <Text style = {[styles.label, {color : colors.text}]}>
                    {label}
                </Text>
            )}
            <View style = {[
                styles.inputWrapper,
                {
                    backgroundColor : colors.surface,
                    borderColor : error ? colors.error : colors.surface,
                    borderWidth : error ? 1 : 0
                },
                style
            ]}>
                {leftIcon &&(
                    <Feather name={leftIcon} size={20} color={colors.textSecondary} style = {styles.leftIcon} />
                )}

                <TextInput
                style = {[styles.input,{color : colors.text}]}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry = {isPassword && !isPasswordVisible}
                autoCapitalize={isPassword ? 'none' : 'sentences'}
                {...rest}
                />
                {
                    isPassword && (
                        <TouchableOpacity onPress={togglePassword} style = {styles.rightIcon}>
                            <Feather
                                name={isPasswordVisible ? 'eye-off' : 'eye'}
                                size={20}
                                color={colors.textSecondary}
                                />
                        </TouchableOpacity>
                    )}
            </View>
            {error && <Text style = {[styles.errorText, { color: colors.error }]}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container:{
        marginBottom : SPACING.md,
    },
    label : {
        fontSize : 14,
        fontWeight : '500',
        marginBottom : SPACING.xs,
        marginLeft : SPACING.xs,
    },
    inputWrapper:{
        flexDirection : 'row',
        alignItems : 'center',
        height : 50,
        borderRadius :12,
        paddingHorizontal: SPACING.md
    },
    input :{
        flex : 1,
        fontSize : 16,
        height :'100%',
    },
    leftIcon : {
        marginRight : SPACING.sm,
    },
    rightIcon : {
        padding :SPACING.xs,
    },
    errorText: {
        fontSize : 12,
        marginTop : SPACING.xs,
        marginLeft : SPACING.xs,
    }
});
