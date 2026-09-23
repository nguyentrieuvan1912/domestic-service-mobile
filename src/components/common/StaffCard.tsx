import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { Staff } from '@/types/user';
import { RatingStars } from './RatingStars';
import { IconSymbol } from './IconSymbol';

interface StaffCardProps {
  staff: Staff;
  isSelected?: boolean;
  onSelect?: () => void;
  showSelectButton?: boolean;
}

export const StaffCard: React.FC<StaffCardProps> = ({
  staff,
  isSelected,
  onSelect,
  showSelectButton = true,
}) => {
  return (
    <Pressable
      style={[styles.container, isSelected && styles.containerSelected]}
      onPress={onSelect}>
      <View style={styles.topRow}>
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: staff.avatar }} style={styles.avatar} />
          {staff.isOnline && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={styles.staffName}>{staff.fullName}</Text>
            {staff.isVerified ? (
              <View style={styles.verifiedBadge}>
                <IconSymbol name="check" size={10} color="#059669" />
                <Text style={styles.verifiedText}>Đã xác minh</Text>
              </View>
            ) : (
              <View style={styles.unverifiedBadge}>
                <Text style={styles.unverifiedText}>Chưa xác minh</Text>
              </View>
            )}
          </View>

          <View style={styles.statsRow}>
            <RatingStars rating={staff.rating} size={12} reviewCount={staff.reviewCount} />
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.expText}>{staff.experienceYears} năm KN</Text>
            {staff.completedBookingsCount ? (
              <>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.expText}>{staff.completedBookingsCount} đơn</Text>
              </>
            ) : null}
          </View>

          {staff.distanceKm !== undefined && (
            <View style={styles.distanceRow}>
              <IconSymbol name="location" size={12} color={BrandColors.gray500} />
              <Text style={styles.distanceText}>
                Cách bạn {staff.distanceKm} km (đến sau ~{staff.arrivalTimeMin || 20}p)
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Specialties Tags */}
      {staff.specialties && staff.specialties.length > 0 && (
        <View style={styles.specialtiesRow}>
          {staff.specialties.map((tag, idx) => (
            <View key={idx} style={styles.specialtyPill}>
              <Text style={styles.specialtyText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {staff.bio ? (
        <Text numberOfLines={2} style={styles.bioText}>
          "{staff.bio}"
        </Text>
      ) : null}

      {showSelectButton && onSelect && (
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.selectBtn, isSelected && styles.selectBtnActive]}
            onPress={onSelect}>
            <Text style={[styles.selectBtnText, isSelected && styles.selectBtnTextActive]}>
              {isSelected ? '✓ Đã chọn nhân viên này' : 'Chọn nhân viên này'}
            </Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.three,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.two,
  },
  containerSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: '#F0FDF4',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E2E8F0',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  staffName: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    gap: 3,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  unverifiedBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  unverifiedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dotSeparator: {
    marginHorizontal: 6,
    color: BrandColors.gray400,
    fontSize: 10,
  },
  expText: {
    fontSize: 11,
    color: BrandColors.gray600,
    fontWeight: '500',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  distanceText: {
    fontSize: 11,
    color: BrandColors.gray500,
  },
  specialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.two,
  },
  specialtyPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  specialtyText: {
    fontSize: 11,
    color: BrandColors.gray700,
    fontWeight: '500',
  },
  bioText: {
    fontSize: 12,
    color: BrandColors.gray500,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 16,
  },
  actionRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  selectBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  selectBtnActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  selectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray700,
  },
  selectBtnTextActive: {
    color: '#FFF',
  },
});
