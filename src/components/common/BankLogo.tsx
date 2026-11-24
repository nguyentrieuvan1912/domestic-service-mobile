import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

interface BankMeta {
  code: string;
  short: string;
  color: string;
}

const BANK_DIRECTORY: Array<{ match: RegExp; meta: BankMeta }> = [
  { match: /\b(mb|mbbank|quan doi|military)\b/i, meta: { code: 'MB', short: 'MB', color: '#141ED2' } },
  { match: /\b(tpb|tpbank|tien phong)\b/i, meta: { code: 'TPB', short: 'TP', color: '#6E2B8C' } },
  { match: /\b(vcb|vietcombank|ngoai thuong)\b/i, meta: { code: 'VCB', short: 'VCB', color: '#006B3F' } },
  { match: /\b(tcb|techcombank|ky thuong)\b/i, meta: { code: 'TCB', short: 'TCB', color: '#E31837' } },
  { match: /\b(bidv|dau tu va phat trien)\b/i, meta: { code: 'BIDV', short: 'BIDV', color: '#00579F' } },
  { match: /\b(icb|vietinbank|cong thuong)\b/i, meta: { code: 'ICB', short: 'VTB', color: '#005DAA' } },
  { match: /\b(acb|a chau)\b/i, meta: { code: 'ACB', short: 'ACB', color: '#0050A0' } },
  { match: /\b(vpb|vpbank|viet nam thinh vuong)\b/i, meta: { code: 'VPB', short: 'VPB', color: '#009B4D' } },
  { match: /\b(stb|sacombank|sai gon thuong tin)\b/i, meta: { code: 'STB', short: 'STB', color: '#0054A6' } },
  { match: /\b(vba|agribank|nong nghiep)\b/i, meta: { code: 'VBA', short: 'AGRI', color: '#AE1C3F' } },
  { match: /\b(hdb|hdbank|phat trien tp)\b/i, meta: { code: 'HDB', short: 'HDB', color: '#BE1E2D' } },
  { match: /\b(vib|quoc te)\b/i, meta: { code: 'VIB', short: 'VIB', color: '#0066B3' } },
  { match: /\b(shb|sai gon ha noi)\b/i, meta: { code: 'SHB', short: 'SHB', color: '#F37021' } },
  { match: /\b(ocb|phuong dong)\b/i, meta: { code: 'OCB', short: 'OCB', color: '#008C45' } },
  { match: /\b(msb|hang hai)\b/i, meta: { code: 'MSB', short: 'MSB', color: '#EE3124' } },
  { match: /\b(seab|seabank|dong nam a)\b/i, meta: { code: 'SEAB', short: 'SEA', color: '#D71920' } },
  { match: /\b(eib|eximbank|xuat nhap khau)\b/i, meta: { code: 'EIB', short: 'EIB', color: '#0072BC' } },
  { match: /\b(lpb|lpbank|lienviet|loc phat)\b/i, meta: { code: 'LPB', short: 'LPB', color: '#F58220' } },
  { match: /\b(nab|nam a|namabank)\b/i, meta: { code: 'NAB', short: 'NAB', color: '#004A99' } },
  { match: /\b(bab|bac a|bacabank)\b/i, meta: { code: 'BAB', short: 'BAB', color: '#F7941D' } },
  { match: /\b(abb|abbank|an binh)\b/i, meta: { code: 'ABB', short: 'ABB', color: '#00A99D' } },
  { match: /\b(ncb|quoc dan)\b/i, meta: { code: 'NCB', short: 'NCB', color: '#0068B7' } },
  { match: /\b(pvcb|pvcombank|dai chung)\b/i, meta: { code: 'PVCB', short: 'PVC', color: '#FDB913' } },
  { match: /\b(vccb|bvbank|ban viet)\b/i, meta: { code: 'VCCB', short: 'BVB', color: '#1E3A8A' } },
  { match: /\b(scb|sai gon)\b/i, meta: { code: 'SCB', short: 'SCB', color: '#004B8D' } },
  { match: /\b(cake)\b/i, meta: { code: 'CAKE', short: 'CAKE', color: '#FF2E93' } },
  { match: /\b(timo)\b/i, meta: { code: 'TIMO', short: 'TIMO', color: '#6366F1' } },
];

function normalizeBank(value?: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .trim();
}

function resolveBankMeta(bankName?: string, bankCode?: string): BankMeta | null {
  const haystack = `${normalizeBank(bankCode)} ${normalizeBank(bankName)}`;
  for (const entry of BANK_DIRECTORY) {
    if (entry.match.test(haystack)) return entry.meta;
  }
  const cleanCode = normalizeBank(bankCode).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (cleanCode.length >= 2 && cleanCode.length <= 6) {
    return { code: cleanCode, short: cleanCode.slice(0, 4), color: '#047857' };
  }
  return null;
}

interface BankLogoProps {
  bankName?: string;
  bankCode?: string;
  size?: number;
}

export const BankLogo: React.FC<BankLogoProps> = ({ bankName, bankCode, size = 26 }) => {
  const [failed, setFailed] = useState(false);
  const meta = resolveBankMeta(bankName, bankCode);
  const logoUri = meta ? `https://api.vietqr.io/img/${meta.code}.png` : null;
  const fallbackLabel = meta?.short || (bankName || 'BK').trim().slice(0, 2).toUpperCase();
  const width = Math.round(size * 1.48);

  return (
    <View
      style={[
        styles.badge,
        {
          width,
          height: size,
          borderRadius: Math.round(size * 0.28),
        },
      ]}
    >
      {logoUri && !failed ? (
        <Image
          source={{ uri: logoUri }}
          style={{ width: width - 6, height: size - 5 }}
          contentFit="contain"
          transition={120}
          onError={() => setFailed(true)}
        />
      ) : (
        <Text
          numberOfLines={1}
          style={[styles.fallbackText, { color: meta?.color || '#047857' }]}
        >
          {fallbackLabel}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },
  fallbackText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
