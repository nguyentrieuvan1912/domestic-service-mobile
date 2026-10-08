import type { AddOn, Service, ServicePackage } from '../types/service';

// Local preview rules only: no AI calls, inferred popularity or invented discounts.
export interface BookingExtra {
  key: string;
  id: string;
  kind: 'ADD_ON' | 'SERVICE';
  name: string;
  image: string;
  reason: string;
  price: number;
  minutes: number;
  scope: string;
  workGroups: string[];
}

const RELATED: Record<string, [string, string][]> = {
  'srv-001': [['srv-003', 'Làm sạch đồ vải bên cạnh việc lau dọn nhà.'], ['srv-016', 'Chọn thêm khi bạn cần khử khuẩn không gian.']],
  'srv-002': [['srv-003', 'Giặt đồ vải riêng với phần tổng vệ sinh nhà.']],
  'srv-003': [['srv-001', 'Lau dọn không gian xung quanh đồ vừa giặt.']],
  'srv-004': [['srv-006', 'Tiện kiểm tra thêm thiết bị giặt trong nhà.'], ['srv-008', 'Làm sạch thêm thiết bị lạnh trong nhà.']],
  'srv-005': [['srv-006', 'Chăm sóc thêm thiết bị giặt trong nhà.']],
  'srv-006': [['srv-007', 'Chăm sóc cả bộ máy giặt và máy sấy.'], ['srv-004', 'Vệ sinh thêm máy lạnh nếu bạn có nhu cầu.']],
  'srv-007': [['srv-006', 'Làm sạch máy giặt trong bộ giặt sấy.']],
  'srv-008': [['srv-004', 'Vệ sinh thêm thiết bị lạnh trong nhà.']],
  'srv-009': [['srv-011', 'Chuẩn bị bữa ăn gia đình trong ngày chăm bé.']],
  'srv-010': [['srv-013', 'Mua thực phẩm theo danh sách của gia đình.'], ['srv-011', 'Chuẩn bị bữa ăn theo yêu cầu của gia đình.']],
  'srv-011': [['srv-013', 'Mua nguyên liệu trước khi bắt đầu nấu ăn.']],
  'srv-012': [['srv-001', 'Kết hợp giặt ủi với lau dọn nhà.']],
  'srv-013': [['srv-011', 'Nấu bữa ăn từ nguyên liệu vừa mua.']],
  'srv-014': [['srv-003', 'Làm sạch đồ vải ở khu vực thú cưng sinh hoạt.']],
  'srv-015': [['srv-001', 'Lau dọn không gian sinh hoạt sau khi chăm cây.']],
  'srv-016': [['srv-001', 'Lau dọn nhà trước khi khử khuẩn.']],
};

const ADD_ON_HINTS: Record<string, [string, string]> = {
  'addon-001': ['SOFA', 'Chọn khi sofa cần được giặt riêng.'],
  'addon-002': ['CARPET', 'Chọn khi thảm cần được làm sạch riêng.'],
  'addon-003': ['MATTRESS', 'Chọn khi nệm cần được làm sạch riêng.'],
  'addon-004': ['CURTAIN', 'Làm sạch rèm ngoài phần lau dọn thông thường.'],
  'addon-005': ['FRIDGE', 'Lau thêm bên trong tủ lạnh.'],
  'addon-006': ['OVEN', 'Làm sạch thêm các thiết bị trong bếp.'],
  'addon-007': ['WINDOW', 'Lau riêng kính ban công và cửa sổ.'],
  'addon-008': ['TOOLS', 'Phù hợp nếu nhà chưa có dụng cụ vệ sinh.'],
};
const PACKAGE_GROUPS: Record<string, string[]> = {
  'pkg-011': ['SOFA'],
  'pkg-012': ['MATTRESS'],
  'pkg-019': ['FRIDGE'],
  'pkg-020': ['FRIDGE'],
};

export function buildBookingExtras(
  service: Service,
  addOns: AddOn[],
  services: Service[],
  packages: ServicePackage[],
  // Explicit coverage only; never infer that a general package covers all extras.
  includedAddOnIds: string[] = [],
): BookingExtra[] {
  const extras: BookingExtra[] = addOns
    .filter(a => a.isActive && a.serviceId === service.id && !includedAddOnIds.includes(a.id))
    .map(a => ({
      key: `addon:${a.id}`, id: a.id, kind: 'ADD_ON', name: a.name,
      image: a.image, price: a.price, minutes: a.durationMinutes,
      scope: 'Hạng mục bổ sung',
      reason: ADD_ON_HINTS[a.id]?.[1] || `Bổ sung cho ${service.name.toLowerCase()}.`,
      workGroups: [ADD_ON_HINTS[a.id]?.[0] || a.id],
    }));

  for (const [id, reason] of RELATED[service.id] || []) {
    const related = services.find(s => s.id === id && s.isActive && s.id !== service.id);
    const pkg = packages.find(p => p.serviceId === id && p.isActive);
    // A concrete package makes the displayed price and scope unambiguous.
    if (!related || !pkg) continue;
    extras.push({
      key: `service:${id}`, id, kind: 'SERVICE', name: related.name,
      image: related.image, reason, price: pkg.price, minutes: pkg.durationMinutes,
      scope: pkg.name, workGroups: PACKAGE_GROUPS[pkg.id] || [id],
    });
  }
  return extras.filter((extra, index, all) => all.findIndex(e => e.key === extra.key) === index);
}

export function conflictsWithSelection(extra: BookingExtra, options: BookingExtra[], keys: string[]) {
  return options.some(other => other.key !== extra.key && keys.includes(other.key)
    && other.workGroups.some(group => extra.workGroups.includes(group)));
}

export function toggleBookingExtra(options: BookingExtra[], keys: string[], key: string): string[] {
  if (keys.includes(key)) return keys.filter(k => k !== key);
  const extra = options.find(e => e.key === key);
  if (!extra || conflictsWithSelection(extra, options, keys)) return keys;
  return [...new Set([...keys, key])];
}

export function getSuggestedExtras(options: BookingExtra[]): BookingExtra[] {
  const addOns = options.filter(e => e.kind === 'ADD_ON');
  const services = options.filter(e => e.kind === 'SERVICE');
  // Prefer short, practical tasks; keep at least one related service when available.
  const priority = ['addon-008', 'addon-007', 'addon-ac-01', 'addon-ac-02'];
  const ranked = [...addOns].sort((a, b) => {
    const rank = (key: string) => priority.includes(key) ? priority.indexOf(key) : priority.length;
    return rank(a.id) - rank(b.id);
  });
  return [...ranked.slice(0, services.length ? 2 : 3), ...services]
    .slice(0, 3);
}

export function getExtraTotals(options: BookingExtra[], keys: string[]) {
  const selected = options.filter(e => keys.includes(e.key));
  return {
    selected,
    addOnsTotal: selected.filter(e => e.kind === 'ADD_ON').reduce((sum, e) => sum + e.price, 0),
    servicesTotal: selected.filter(e => e.kind === 'SERVICE').reduce((sum, e) => sum + e.price, 0),
    addOnMinutes: selected.filter(e => e.kind === 'ADD_ON').reduce((sum, e) => sum + e.minutes, 0),
  };
}
