import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';

import { useTheme } from '../hooks';

interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
}) => {
  const { colors, radii, shadow } = useTheme();

  const getButtonStyle = (): ViewStyle[] => {
    const defaultStyles = {
      borderRadius: radii.md,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    };

    const variants = {
      primary: {
        backgroundColor: colors.primary,
        ...shadow,
      },
      secondary: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      },
      danger: {
        backgroundColor: colors.error,
        ...shadow,
      },
    };

    const sizes = {
      small: styles.smallButton,
      medium: styles.mediumButton,
      large: styles.largeButton,
    };

    return [defaultStyles, variants[variant], sizes[size]];
  };

  const getTextStyle = (): TextStyle[] => {
    const variants = {
      primary: {
        color: '#ffffff',
        fontWeight: '600' as const,
      },
      secondary: {
        color: colors.text,
        fontWeight: '600' as const,
      },
      danger: {
        color: '#ffffff',
        fontWeight: '600' as const,
      },
    };

    const sizes = {
      small: styles.smallText,
      medium: styles.mediumText,
      large: styles.largeText,
    };

    return [variants[variant], sizes[size]];
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.primary : '#ffffff'} size="small" />
      ) : (
        <Text style={[...getTextStyle(), textStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Sizes
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  mediumButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  largeButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },

  // Text sizes
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 16,
  },

  disabled: {
    opacity: 0.5,
  },
});
