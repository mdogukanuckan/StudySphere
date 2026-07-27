import React from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, TouchableOpacityProps, Text } from "react-native";
import { SPACING } from "../theme/theme";
import { useTheme } from "../context/ThemeContext";

interface CustomButtonProps extends TouchableOpacityProps{
    title : string;
    loading ?: boolean;
    variant ?: 'primary' | 'secondary' | 'outline';
}

export const CustomButton : React.FC<CustomButtonProps> = ({
    title,
    loading = false,
    variant = 'primary',
    style,
    disabled,
    ...rest
}) => {
    const { colors } = useTheme();

    const styles = StyleSheet.create({
        button : {
            height : 50,
            borderRadius : 12,
            justifyContent : 'center',
            alignItems : 'center',
            paddingHorizontal : SPACING.md,
            marginVertical : SPACING.sm,
            shadowColor : '#000',
            shadowOffset : {width : 0, height:2},
            shadowOpacity : 0.1,
            shadowRadius : 4,
            elevation : 2
        },
        text:{
            fontSize : 16,
            fontWeight : '600',
        },
        disabledButton: {
            opacity : 0.6
        },
    });
    const buttonStyles = [
    styles.button,
    {backgroundColor : colors.primary},
    variant === 'secondary' && {backgroundColor : colors.surface},
    variant === 'outline' && {
        backgroundColor : 'transparent',
        borderWidth : 1,
            borderColor : colors.primary
    },
    (disabled || loading) && styles.disabledButton,
    style
  ];

  const textStyles = [
    styles.text,
    { color: '#FFFFFF' },
    variant === 'secondary' && { color: colors.text },
    variant === 'outline' && { color: colors.primary }
  ];

  return (
    <TouchableOpacity
        style = {buttonStyles}
        disabled = {disabled || loading}
        activeOpacity={0.7}
        {...rest}
    >
        {loading ?(
            <ActivityIndicator color={variant ==='outline' ? colors.primary : '#FFFFFF'}/>

        ) : (
           <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
