import React from 'react';
import { Text, StyleSheet, TextStyle, ColorValue } from 'react-native';

// Clean unicode / glyph mapping with zero external native font dependencies
// 100% reliable across Web, iOS, and Android
const GLYPH_MAP: Record<string, string> = {
  // Navigation & Actions
  search: '🔍',
  location: '📍',
  notification: '🔔',
  back: '‹',
  chevronRight: '›',
  chevronDown: '⌄',
  close: '✕',
  check: '✓',
  plus: '+',
  minus: '−',
  filter: '⚙️',
  share: '↗',
  heart: '❤️',
  heartOutline: '🤍',

  // Services
  clock: '⏱️',
  clean: '✨',
  cooking: '🍳',
  care: '🤲',
  office: '🏢',
  laundry: '🧺',
  sofa: '🛋️',
  baby: '👶',
  elderly: '👵',
  fridge: '❄️',
  shield: '🛡️',
  star: '★',
  starOutline: '☆',

  // Communication & Status
  phone: '📞',
  chat: '💬',
  message: '💬',
  bot: '🤖',
  send: '➤',
  calendar: '📅',
  wallet: '💳',
  receipt: '🧾',
  truck: '🚚',
  warning: '⚠️',
  success: '✅',
};

interface IconSymbolProps {
  name: string;
  size?: number;
  color?: ColorValue | string;
  style?: TextStyle;
}

export const IconSymbol: React.FC<IconSymbolProps> = ({
  name,
  size = 18,
  color,
  style,
}) => {
  const glyph = GLYPH_MAP[name] || '•';

  return (
    <Text
      style={[
        styles.icon,
        { fontSize: size, lineHeight: size * 1.15 },
        color ? { color } : undefined,
        style,
      ]}>
      {glyph}
    </Text>
  );
};

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
    includeFontPadding: false,
  },
});
