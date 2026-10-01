import React from 'react';
import { ColorValue, StyleSheet, TextStyle } from 'react-native';
import { Image } from 'expo-image';
import { SvgXml } from 'react-native-svg';
import { CATEGORY_ICONS } from '@/constants/categoryIcons';

// Shared illustrated family: rounded outlines and mint accents, matching service categories.
const SHAPES: Record<string, string> = {
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
  location: '<path d="M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 1 1 14 0Z"/><circle cx="12" cy="9" r="2"/>',
  bell: '<path d="M5 16h14l-2-3V9a5 5 0 0 0-10 0v4Z"/><path d="M10 20h4M12 2v2"/>',
  gift: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M12 10v11M3 7h18v4H3z"/><path d="M12 7c-9 0-6-7-2-4l2 4c9 0 6-7 2-4Z"/>',
  ticket: '<path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4Z"/><path d="M15 8v2m0 2v2m0 2v1"/>',
  back: '<path d="m15 5-7 7 7 7"/>',
  chevronRight: '<path d="m9 5 7 7-7 7"/>',
  chevronDown: '<path d="m5 9 7 7 7-7"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  minus: '<path d="M4 12h16"/>',
  filter: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',
  share: '<path d="M13 4h7v7m0-7L10 14M9 5H4v15h15v-5"/>',
  heart: '<path d="M12 21 3 12C-2 5 7 0 12 6c5-6 14-1 9 6Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  sparkle: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
  home: '<path d="m3 10 9-7 9 7M5 9v12h14V9M10 21v-7h4v7"/>',
  office: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h1m4 0h1M9 11h1m4 0h1M10 21v-5h4v5"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
  star: '<path d="m12 2 3 6.5 7 1-5 5 1 7-6-3.5L6 21l1-6.5-5-5 7-1Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2Z"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M2 20a7 7 0 0 1 14 0ZM16 5a3 3 0 0 1 0 6m2 3a6 6 0 0 1 4 6"/>',
  phone: '<path d="m7 3 3 5-3 3c1 3 3 5 6 6l3-3 5 3c-1 8-8 3-13-1S0 4 7 3Z"/>',
  chat: '<path d="M21 11a9 8 0 0 1-9 8H7l-5 3 2-6a8 8 0 1 1 17-5Z"/><path d="M7 11h.1M12 11h.1M17 11h.1"/>',
  bot: '<rect x="4" y="6" width="16" height="14" rx="5"/><path d="M12 3v3M8 11h1m6 0h1m-8 5h8M2 11v4m20-4v4"/>',
  send: '<path d="m3 3 19 9-19 9 3-9Zm3 9h16"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v5m10-5v5M3 10h18m-14 4h2m3 0h2m-7 3h2"/>',
  wallet: '<rect x="3" y="6" width="18" height="15" rx="3"/><path d="m4 6 13-3v3M21 11h-7v6h7m-4-3h.1"/>',
  cash: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M5 9v6m14-6v6"/>',
  receipt: '<path d="M5 3h14v19l-3-2-4 2-4-2-3 2Z"/><path d="M8 7h8M8 11h8m-8 4h5"/>',
  truck: '<path d="M3 5h11v12H3Zm11 5h4l4 5v2h-8"/><circle cx="7" cy="18" r="3"/><circle cx="18" cy="18" r="3"/>',
  warning: '<path d="m12 3 10 18H2Z"/><path d="M12 9v5m0 3h.1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 7h.1m0 4v6"/>',
  copy: '<rect x="8" y="7" width="12" height="14" rx="2"/><path d="M16 7V3H4v14h4"/>',
  thumbUp: '<path d="M8 21H3V10h5l4-7c4 0 2 5 2 7h6c3 0 0 11-2 11Z"/>',
  award: '<circle cx="12" cy="8" r="5"/><path d="m8 12-2 10 6-3 6 3-2-10"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  badge: '<path d="M3 3h9l10 10-9 9L3 12Z"/><circle cx="8" cy="8" r="1"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 7 9 7 9-7"/>',
};
const ALIASES: Record<string, string> = {
  magnifyingGlass: 'search', notification: 'bell', voucher: 'ticket', arrowBack: 'back',
  arrowForward: 'chevronRight', checkmark: 'check', heartOutline: 'heart', sparkles: 'sparkle',
  house: 'home', message: 'chat', creditCard: 'wallet', money: 'cash', success: 'check', bookings: 'calendar',
  services: 'users', profile: 'user',
};
const SERVICE_NAMES: Record<string, string> = {
  clean: 'CLEANING_HOURLY', cooking: 'COOKING', care: 'ELDERLY_CARE', laundry: 'LAUNDRY',
  sofa: 'CLEANING_UPHOLSTERY', carpet: 'CLEANING_UPHOLSTERY', bed: 'CLEANING_UPHOLSTERY',
  curtain: 'CLEANING_UPHOLSTERY', baby: 'CHILD_CARE', elderly: 'ELDERLY_CARE',
  fridge: 'REFRIGERATOR_CLEANING', bottle: 'CLEANING_DEEP',
};
export const GLYPH_ICON_NAMES: Record<string, string> = {
  '🏠': 'home', '🏡': 'home', '📍': 'location', '🔔': 'bell', '🎁': 'gift', '🎟️': 'ticket',
  '⏱️': 'clock', '🧹': 'clean', '✨': 'sparkle', '🧴': 'bottle', '🛡️': 'shield', '👤': 'user',
  '👥': 'users', '📞': 'phone', '💬': 'chat', '🤖': 'bot', '📅': 'calendar', '💳': 'wallet',
  '💵': 'cash', '🧾': 'receipt', '⚠️': 'warning', '✅': 'check', 'ℹ️': 'info', '📋': 'copy',
  '👍': 'thumbUp', '🏆': 'award', '🔒': 'lock', '✉️': 'mail', '☎️': 'phone',
  '🧑‍🔧': 'user', '⚡': 'sparkle', '😊': 'user', '🧼': 'clean', '📊': 'receipt',
  '💡': 'info', '🏦': 'office', '📄': 'receipt', '📦': 'gift', '📡': 'bot', '🎉': 'award',
  '⏳': 'clock', '🔄': 'clock', '❌': 'close', '✦': 'sparkle', '➤': 'send',
};

interface IconSymbolProps { name: string; size?: number; color?: ColorValue | string; style?: TextStyle }

export const IconSymbol: React.FC<IconSymbolProps> = ({ name, size = 18, color, style }) => {
  const resolved = GLYPH_ICON_NAMES[name] || ALIASES[name] || name;
  const category = CATEGORY_ICONS[SERVICE_NAMES[resolved] || resolved];
  const textStyle = StyleSheet.flatten(style) || {};
  const styleColor = textStyle.color;
  const ink = typeof color === 'string' ? color : typeof styleColor === 'string' ? styleColor : '#28594F';
  const fill = ['back', 'chevronRight', 'chevronDown', 'close', 'check', 'plus', 'minus', 'share', 'send'].includes(resolved) ? 'none' : '#E0F4EC';
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="' + (resolved === 'star' ? ink : fill) + '" stroke="' + ink + '" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">' + (SHAPES[resolved] || SHAPES.sparkle) + '</g></svg>';
  const { fontSize, lineHeight } = textStyle;
  const layoutStyle = {
    margin: textStyle.margin, marginTop: textStyle.marginTop, marginBottom: textStyle.marginBottom,
    marginLeft: textStyle.marginLeft, marginRight: textStyle.marginRight,
    marginHorizontal: textStyle.marginHorizontal, marginVertical: textStyle.marginVertical,
    alignSelf: textStyle.alignSelf, opacity: textStyle.opacity, transform: textStyle.transform,
    width: textStyle.width, height: textStyle.height,
  };
  const iconSize = fontSize || size;
  const width = textStyle.width || iconSize;
  const height = textStyle.height || lineHeight || iconSize * 1.15;
  if (category) {
    return <Image source={category} style={[layoutStyle, { width, height }]} contentFit="contain" transition={0} />;
  }
  return <SvgXml xml={svg} width={iconSize} height={lineHeight || iconSize * 1.15} style={layoutStyle} />;
};
