import { useMemo } from 'react';
import { Text } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { create } from 'qrcode';

/** Render the provider payload locally; no third-party image URL sees payment data. */
export function PaymentQr({ value, size }: { value: string; size: number }) {
  const drawing = useMemo(() => {
    try {
      if (!value || value.length > 4000) return null;
      const { modules } = create(value, { errorCorrectionLevel: 'M' });
      const paths: string[] = [];
      for (let y = 0; y < modules.size; y++) {
        for (let x = 0; x < modules.size; x++) {
          if (!modules.get(y, x)) continue;
          const start = x;
          while (x + 1 < modules.size && modules.get(y, x + 1)) x++;
          paths.push(`M${start + 4} ${y + 4}h${x - start + 1}v1H${start + 4}z`);
        }
      }
      return { extent: modules.size + 8, path: paths.join('') };
    } catch { return null; }
  }, [value]);
  if (!drawing) return <Text accessibilityRole="alert">Chưa hiển thị được mã QR. Vui lòng kiểm tra lại giao dịch.</Text>;
  return <Svg width={size} height={size} viewBox={`0 0 ${drawing.extent} ${drawing.extent}`} accessibilityLabel="Mã QR chuyển khoản payOS">
    <Rect width={drawing.extent} height={drawing.extent} fill="#fff" />
    <Path d={drawing.path} fill="#000" />
  </Svg>;
}
