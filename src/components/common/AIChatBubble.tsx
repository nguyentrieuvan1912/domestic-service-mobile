import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { AIMessage, AISuggestion } from '@/types/ai';
import { formatVND } from './Badge';

interface AIChatBubbleProps {
  message: AIMessage;
  onSuggestionPress?: (suggestion: AISuggestion) => void;
}

export const AIChatBubble: React.FC<AIChatBubbleProps> = ({
  message,
  onSuggestionPress,
}) => {
  const isUser = message.role === 'USER';

  return (
    <View style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperBot]}>
      {!isUser && (
        <Image
          source={require('@/assets/images/ai-mascot.png')}
          style={styles.avatar}
          resizeMode="cover"
        />
      )}

      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        <Text style={[styles.messageText, isUser ? styles.textUser : styles.textBot]}>
          {message.content}
        </Text>

        {/* Actionable suggestions */}
        {message.suggestions && message.suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {message.suggestions.map((sug, idx) => (
              <Pressable
                key={idx}
                style={styles.suggestionCard}
                onPress={() => onSuggestionPress && onSuggestionPress(sug)}>
                <View style={styles.sugLeft}>
                  <Text style={styles.sugTitle}>{sug.title}</Text>
                  {sug.subtitle ? (
                    <Text style={styles.sugSubtitle}>{sug.subtitle}</Text>
                  ) : null}
                </View>
                <View style={styles.sugRight}>
                  {sug.price !== undefined && (
                    <Text style={styles.sugPrice}>{formatVND(sug.price)}</Text>
                  )}
                  <View style={styles.sugBtn}>
                    <Text style={styles.sugBtnText}>Xem ngay →</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={[styles.timeText, isUser ? styles.timeUser : styles.timeBot]}>
          {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    marginBottom: Spacing.three,
    gap: 8,
  },
  wrapperUser: {
    justifyContent: 'flex-end',
  },
  wrapperBot: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginTop: 4,
  },
  bubble: {
    maxWidth: '82%',
    padding: Spacing.three,
    borderRadius: BorderRadius.xl,
  },
  bubbleUser: {
    backgroundColor: BrandColors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  textUser: {
    color: '#FFF',
  },
  textBot: {
    color: BrandColors.gray900,
  },
  suggestionsContainer: {
    marginTop: 10,
    gap: 8,
  },
  suggestionCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: BorderRadius.lg,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  sugLeft: {
    flex: 1,
  },
  sugTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: 2,
  },
  sugSubtitle: {
    fontSize: 11,
    color: BrandColors.gray600,
  },
  sugRight: {
    alignItems: 'flex-end',
  },
  sugPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandColors.primary,
    marginBottom: 4,
  },
  sugBtn: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  sugBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeUser: {
    color: 'rgba(255,255,255,0.7)',
  },
  timeBot: {
    color: BrandColors.gray400,
  },
});
