import React from 'react';
import { Image } from 'expo-image';

const LOGO_MARK = require('../../../assets/images/brand/cleanmaster-logo-v1.png');

export function BrandLogo({ size = 64, label = 'Biểu tượng CleanMaster' }: { size?: number; label?: string }) {
  return <Image source={LOGO_MARK} style={{ width: size, height: size }} contentFit="contain" accessibilityLabel={label} />;
}
