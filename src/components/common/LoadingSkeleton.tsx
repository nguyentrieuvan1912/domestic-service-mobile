import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BorderRadius } from '@/constants/theme';

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.md,
  style,
}) => {
  return (
    <View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
        },
        style,
      ]}
    />
  );
};

export const ServiceCardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardSkeleton}>
      <LoadingSkeleton height={140} borderRadius={BorderRadius.lg} style={{ marginBottom: 10 }} />
      <LoadingSkeleton width="70%" height={16} style={{ marginBottom: 8 }} />
      <LoadingSkeleton width="90%" height={12} style={{ marginBottom: 6 }} />
      <LoadingSkeleton width="40%" height={12} style={{ marginBottom: 12 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <LoadingSkeleton width={80} height={18} />
        <LoadingSkeleton width={70} height={30} borderRadius={BorderRadius.md} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E2E8F0',
  },
  cardSkeleton: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
});
