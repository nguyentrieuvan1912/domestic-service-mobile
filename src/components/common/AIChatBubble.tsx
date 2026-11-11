import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { AIMessage, AISuggestion } from '@/types/ai';
import { formatVND } from './Badge';
import { IconSymbol } from './IconSymbol';

interface AIChatBubbleProps {
  message: AIMessage;
  onSuggestionPress?: (suggestion: AISuggestion) => void;
  suggestionsDisabled?: boolean;
  onSpeak?: () => void;
  speaking?: boolean;
  voiceDisabled?: boolean;
}

function renderEmphasis(text: string) {
  return text.split(/\*\*([^*\n]+)\*\*/g).map((part, index) =>
    index % 2 === 0 ? part : <Text key={index} style={styles.emphasis}>{part}</Text>,
  );
}

function AIReply({ content }: { content: string }) {
  const reply = content.replace(/[^\S\r\n]*\(\s*(?:service\s*)?id\s*[:#]?\s*\d+\s*\)/gi, '').trim();

  return (
    <View style={styles.reply}>
      {reply.split(/\r?\n(?:[^\S\r\n]*\r?\n)+/).map((paragraph, paragraphIndex) => (
        <View key={paragraphIndex} style={styles.replyParagraph}>
          {paragraph.split(/\r?\n/).map((line, lineIndex) => {
            const item = line.match(/^\s*(\d+[.)]|[-*•])\s+(.+)$/);
            if (item) {
              const [, marker, body] = item;
              return (
                <View key={lineIndex} style={styles.listItem}>
                  <Text style={styles.listMarker}>{/^\d/.test(marker) ? marker : '•'}</Text>
                  <Text style={[styles.replyText, styles.listBody]}>{renderEmphasis(body)}</Text>
                </View>
              );
            }

            const heading = line.match(/^\s*#{1,6}\s+(.+)$/);
            return (
              <Text key={lineIndex} style={[styles.replyText, heading && styles.emphasis]}>
                {renderEmphasis(heading?.[1] ?? line.trim())}
              </Text>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export const AIChatBubble: React.FC<AIChatBubbleProps> = ({
  message,
  onSuggestionPress,
  suggestionsDisabled = false,
  onSpeak,
  speaking = false,
  voiceDisabled = false,
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
        {isUser ? (
          <Text style={[styles.messageText, styles.textUser]}>{message.content}</Text>
        ) : (
          <AIReply content={message.content} />
        )}

        {/* Actionable suggestions */}
        {message.suggestions && message.suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {message.suggestions.map((sug, idx) => (
              <Pressable
                key={idx}
                accessibilityRole="button"
                disabled={suggestionsDisabled}
                style={[styles.suggestionCard, suggestionsDisabled && { opacity: 0.5 }]}
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
                    <Text style={styles.sugBtnText}>{sug.type === 'PACKAGE' && sug.serviceId
                      ? 'Chọn gói →' : sug.type === 'SERVICE' ? 'Xem dịch vụ →' : 'Xem ngay →'}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          {!isUser && onSpeak && <Pressable accessibilityRole="button" accessibilityLabel={speaking ? 'Dừng đọc câu trả lời' : 'Nghe câu trả lời'}
            disabled={voiceDisabled} onPress={onSpeak} style={[styles.listen, voiceDisabled && styles.listenDisabled]}>
            <IconSymbol name={speaking ? 'stop' : 'speaker'} size={15} color={BrandColors.primaryDark} />
            <Text style={styles.listenLabel}>{speaking ? 'Dừng' : 'Nghe'}</Text>
          </Pressable>}
          <Text style={[styles.timeText, isUser ? styles.timeUser : styles.timeBot]}>
            {new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8 },
  listen: { marginRight: 'auto', minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 5, paddingRight: 8 },
  listenDisabled: { opacity: 0.45 },
  listenLabel: { color: BrandColors.primaryDark, fontSize: 12, fontWeight: '700' },
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
    maxWidth: '88%',
    flexShrink: 1,
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
  reply: {
    gap: 12,
  },
  replyParagraph: {
    gap: 6,
  },
  replyText: {
    color: BrandColors.gray700,
    fontSize: 15,
    lineHeight: 22,
  },
  emphasis: {
    color: BrandColors.gray900,
    fontWeight: '700',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  listMarker: {
    minWidth: 20,
    color: BrandColors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 22,
  },
  listBody: {
    flex: 1,
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
    color: BrandColors.gray500,
    marginTop: 10,
  },
});
