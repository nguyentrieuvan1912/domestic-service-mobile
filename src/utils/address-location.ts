import type { LocationGeocodedAddress } from 'expo-location';
import { administrativeSearchKey, type AdministrativeUnit } from '@/api/administrative-units';

export class AddressLocationError extends Error {}

export function addressFields(location: LocationGeocodedAddress, units: AdministrativeUnit[]) {
  const wardKey = (value: string) => administrativeSearchKey(value).replace(/^(phuong|xa|dac khu)\s+/, '');
  const candidates = [location.district, location.subregion, location.city].filter((value): value is string => !!value);
  const matches = units.filter(unit => candidates.some(value => wardKey(value) === wardKey(unit.name)));
  const street = [location.streetNumber, location.street].filter(Boolean).join(' ').trim();
  return {
    street: street || location.name || '',
    ward: matches.length === 1 ? matches[0].name : '',
  };
}

async function within<T>(task: Promise<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([task, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new AddressLocationError('Chưa xác định được vị trí. Bạn thử lại ở nơi thoáng hơn hoặc nhập địa chỉ nhé.')), milliseconds);
    })]);
  } finally {
    clearTimeout(timer);
  }
}

export async function currentAddressLocation() {
  // Load native location only when requested, including on older installed builds.
  const Location: typeof import('expo-location') = require('expo-location');
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) throw new AddressLocationError('Bạn chưa cho phép truy cập vị trí. Bạn có thể cấp quyền trong cài đặt hoặc nhập địa chỉ bên dưới.');
  if (!await Location.hasServicesEnabledAsync()) throw new AddressLocationError('Vui lòng bật vị trí/GPS trên điện thoại rồi thử lại.');
  const position = await within(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }), 20000);
  let address: LocationGeocodedAddress | null = null;
  try {
    const results = await within(Location.reverseGeocodeAsync(position.coords), 10000);
    address = results[0] ?? null;
  } catch { /* Coordinates are available even when the address provider cannot resolve them. */ }
  return { latitude: position.coords.latitude, longitude: position.coords.longitude, address };
}
