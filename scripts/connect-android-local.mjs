import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const sdkRoots = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT,
  process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Android', 'Sdk')].filter(Boolean);
const executable = process.platform === 'win32' ? 'adb.exe' : 'adb';
const adb = sdkRoots.map(root => join(root, 'platform-tools', executable)).find(existsSync) || executable;
const run = args => execFileSync(adb, args, { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }).trim();

try {
  const devices = run(['devices']).split(/\r?\n/).map(line => line.trim().split(/\s+/))
    .filter(([serial, state]) => serial.startsWith('emulator-') && state === 'device').map(([serial]) => serial);
  if (!devices.length) throw new Error('Chưa có máy ảo Android đang chạy. Bật máy ảo rồi chạy lại lệnh này.');
  for (const serial of devices) {
    run(['-s', serial, 'reverse', 'tcp:8090', 'tcp:8090']);
    if (!run(['-s', serial, 'reverse', '--list']).includes('tcp:8090 tcp:8090')) throw new Error(`Chưa nối được cổng cho ${serial}.`);
    console.log(`${serial}: đã nối Expo qua localhost:8090.`);
  }
  const response = await fetch('http://127.0.0.1:8090/status', { signal: AbortSignal.timeout(3000) }).catch(() => null);
  if (!response?.ok) console.log('Expo chưa chạy ở cổng 8090. Chạy npm start nếu chưa có dev server.');
  console.log('Trong Expo Go trên mỗi máy ảo, mở exp://127.0.0.1:8090 thay cho địa chỉ IP Wi-Fi.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Không kết nối được ADB.');
  process.exitCode = 1;
}
