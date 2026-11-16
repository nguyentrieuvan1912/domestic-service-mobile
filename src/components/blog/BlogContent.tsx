import type { ReactNode } from 'react';
import { Linking, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { BlogNode } from '@/api/blog';
import { BrandColors, BorderRadius, Fonts } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';

function httpsUrl(value: unknown) {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && !url.username && !url.password) return url.href;
  } catch {
    return undefined;
  }
}

export function BlogContent({ document }: { document: BlogNode }) {
  const router = useRouter();

  const openLink = (value: unknown) => {
    const blogPath = typeof value === 'string' ? /^\/blog\/([a-z0-9-]+)\/?$/.exec(value) : null;
    if (blogPath) return () => router.push({ pathname: '/blog/[slug]', params: { slug: blogPath[1] } });
    if (value === '/blog' || value === '/blog/') return () => router.navigate('/(tabs)');
    const url = httpsUrl(value);
    return url ? () => { void Linking.openURL(url).catch(() => undefined); } : undefined;
  };

  const render = (node: BlogNode, index: number): ReactNode => {
    const attrs = node.attrs ?? {};
    const children = node.content?.map(render);
    switch (node.type) {
      case 'doc': return <View key={index} style={styles.blocks}>{children}</View>;
      case 'paragraph': return <Text key={index} style={styles.paragraph}>{children?.length ? children : ' '}</Text>;
      case 'heading': return <Text key={index} accessibilityRole="header" style={[styles.heading, attrs.level === 3 && styles.subheading]}>{children}</Text>;
      case 'hardBreak': return '\n';
      case 'horizontalRule': return <View key={index} style={styles.rule} />;
      case 'blockquote': return <View key={index} style={styles.quote}>{children}</View>;
      case 'codeBlock': return <Text key={index} style={[styles.paragraph, styles.codeBlock]}>{children}</Text>;
      case 'listItem': return <View key={index} style={styles.blocks}>{children}</View>;
      case 'bulletList':
      case 'orderedList': {
        const start = Number(attrs.start) || 1;
        return <View key={index} style={styles.list}>
          {children?.map((child, position) => (
            <View key={position} style={styles.listRow}>
              <Text style={styles.paragraph}>{node.type === 'bulletList' ? '•' : `${start + position}.`}</Text>
              <View style={styles.listBody}>{child}</View>
            </View>
          ))}
        </View>;
      }
      case 'text': {
        const hasMark = (type: string) => node.marks?.some(mark => mark.type === type);
        const onPress = openLink(node.marks?.find(mark => mark.type === 'link')?.attrs?.href);
        const underline = hasMark('underline') || !!onPress;
        const strike = hasMark('strike');
        const style: TextStyle = {
          fontWeight: hasMark('bold') ? '700' : undefined,
          fontStyle: hasMark('italic') ? 'italic' : undefined,
          fontFamily: hasMark('code') ? Fonts.mono : undefined,
          color: onPress ? '#047857' : undefined,
          textDecorationLine: underline && strike ? 'underline line-through' : underline ? 'underline' : strike ? 'line-through' : undefined,
        };
        return <Text key={index} onPress={onPress} accessibilityRole={onPress ? 'link' : undefined} style={style}>{node.text}</Text>;
      }
      case 'image': {
        const source = httpsUrl(attrs.src);
        return source ? <View key={index} style={styles.media}>
          <Image source={source} style={styles.image} contentFit="contain" accessibilityLabel={String(attrs.alt ?? '')} />
          {typeof attrs.title === 'string' && !!attrs.title && <Text style={styles.caption}>{attrs.title}</Text>}
        </View> : null;
      }
      case 'video':
      case 'youtube': {
        const onPress = openLink(attrs.src);
        return onPress ? <Text key={index} accessibilityRole="link" onPress={onPress} style={[styles.paragraph, styles.link]}>
          {typeof attrs.title === 'string' && attrs.title ? attrs.title : 'Xem video'} ↗
        </Text> : null;
      }
      default: return null;
    }
  };

  return <>{render(document, 0)}</>;
}

export function BlogCover({ url, style }: { url: string; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.cover, style]}>
    <IconSymbol name="image" size={26} color="#047857" />
    <Image source={httpsUrl(url)} recyclingKey={url} style={StyleSheet.absoluteFill} contentFit="cover" />
  </View>;
}

const styles = StyleSheet.create({
  blocks: { gap: 13 },
  paragraph: { color: BrandColors.gray700, fontSize: 16, lineHeight: 26 },
  heading: { color: BrandColors.gray900, fontSize: 21, lineHeight: 29, fontWeight: '800', marginTop: 6 },
  subheading: { fontSize: 18, lineHeight: 25 },
  list: { gap: 8, paddingLeft: 4 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  listBody: { flex: 1 },
  quote: { borderLeftWidth: 3, borderLeftColor: BrandColors.primary, paddingLeft: 12, paddingVertical: 4, gap: 8 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: BrandColors.gray300 },
  codeBlock: { backgroundColor: BrandColors.gray100, padding: 12, borderRadius: BorderRadius.md, fontFamily: Fonts.mono },
  link: { color: '#047857', textDecorationLine: 'underline' },
  cover: { aspectRatio: 1.9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D6EFE3', borderRadius: BorderRadius.xl, overflow: 'hidden' },
  media: { gap: 5 },
  image: { width: '100%', aspectRatio: 1.5, backgroundColor: BrandColors.gray50, borderRadius: BorderRadius.md },
  caption: { textAlign: 'center', color: BrandColors.gray600, fontSize: 13 },
});
