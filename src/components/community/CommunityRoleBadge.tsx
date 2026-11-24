import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import type { CommunityAuthorRole } from '@/api/community';
import { useAppTheme } from '@/context/ThemeContext';

const VERIFIED_BLUE_TICK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2563EB">
  <path d="M12 1.8l2.4 2.1 3.2-.4 1.1 3 2.9 1.4-.6 3.1 1.8 2.6-1.8 2.6.6 3.1-2.9 1.4-1.1 3-3.2-.4L12 22.2l-2.4-2.1-3.2.4-1.1-3-2.9-1.4.6-3.1-1.8-2.6 1.8-2.6-.6-3.1 2.9-1.4 1.1-3 3.2.4L12 1.8z"/>
  <path d="M8.6 12.3l2.2 2.2 4.8-5" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const STAFF_SHIELD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#059669">
  <path d="M10 1.8l6.5 2.4v4.7c0 4.2-2.8 7.5-6.5 9.1-3.7-1.6-6.5-4.9-6.5-9.1V4.2L10 1.8z"/>
  <path d="M7.3 10.2l1.8 1.8 3.7-3.8" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export function isAdminRole(role?: CommunityAuthorRole, author?: string): boolean {
  if (role === 'ADMIN') return true;
  if (!role && author && /quản trị viên|admin/i.test(author)) return true;
  return false;
}

export const VerifiedAdminTick: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <SvgXml xml={VERIFIED_BLUE_TICK_SVG} width={size} height={size} />
);

export const CommunityRoleBadge: React.FC<{
  role?: CommunityAuthorRole;
  author?: string;
  compact?: boolean;
}> = ({ role, author, compact = false }) => {
  const { colors } = useAppTheme();
  const admin = isAdminRole(role, author);

  if (admin) {
    return (
      <View style={styles.adminWrap}>
        <VerifiedAdminTick size={compact ? 14 : 16} />
        <View
          style={[
            styles.adminPill,
            compact && styles.pillCompact,
            colors.isDark && { backgroundColor: '#1E3A8A', borderColor: '#3B82F6' },
          ]}
        >
          <Text
            style={[
              styles.adminPillText,
              compact && styles.textCompact,
              colors.isDark && { color: '#DBEAFE' },
            ]}
          >
            Quản trị viên
          </Text>
        </View>
      </View>
    );
  }

  if (role === 'STAFF') {
    return (
      <View
        style={[
          styles.staffPill,
          compact && styles.pillCompact,
          { backgroundColor: colors.accentBg, borderColor: colors.accentBorder },
        ]}
      >
        <SvgXml xml={STAFF_SHIELD_SVG} width={compact ? 11 : 12} height={compact ? 11 : 12} />
        <Text
          style={[
            styles.staffPillText,
            compact && styles.textCompact,
            { color: colors.accentText },
          ]}
        >
          Đối tác Staff
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.customerPill,
        compact && styles.pillCompact,
        { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
      ]}
    >
      <Text
        style={[
          styles.customerPillText,
          compact && styles.textCompact,
          { color: colors.textSecondary },
        ]}
      >
        Khách hàng
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  adminWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adminPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  adminPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  staffPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  staffPillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  customerPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  customerPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  pillCompact: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  textCompact: {
    fontSize: 9.5,
  },
});
