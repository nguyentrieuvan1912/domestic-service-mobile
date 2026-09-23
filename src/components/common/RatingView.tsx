import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BrandColors } from '@/constants/theme';

interface RatingViewProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  interactive?: boolean;
  maxStars?: number;
  size?: number;
}

export const RatingView: React.FC<RatingViewProps> = ({
  rating,
  onRatingChange,
  interactive = false,
  maxStars = 5,
  size = 28,
}) => {
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);

  const getRatingLabel = (score: number) => {
    switch (score) {
      case 5:
        return 'Tuyệt vời, vượt mong đợi!';
      case 4:
        return 'Hài lòng, dịch vụ tốt';
      case 3:
        return 'Bình thường, tạm được';
      case 2:
        return 'Chưa hài lòng';
      case 1:
        return 'Kém, cần cải thiện';
      default:
        return 'Vui lòng chọn số sao đánh giá';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>
        {stars.map((starNum) => {
          const isFilled = starNum <= Math.round(rating);
          return (
            <Pressable
              key={starNum}
              disabled={!interactive}
              onPress={() => onRatingChange && onRatingChange(starNum)}
              hitSlop={8}
              style={styles.starTouch}>
              <Text style={{ fontSize: size }}>{isFilled ? '⭐' : '☆'}</Text>
            </Pressable>
          );
        })}
      </View>
      {interactive && <Text style={styles.ratingLabel}>{getRatingLabel(rating)}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starTouch: {
    padding: 2,
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.primary,
    marginTop: 8,
  },
});
