import { RgbChannelOrder, RgbColor, WebBluetoothCharacteristic, WebBluetoothDevice } from '../types/led';

// Common Bluetooth Low Energy Service & Characteristic UUIDs used by Lotus Lantern & ELK-BLEDOM LED controllers
export const BLE_SERVICES = [
  '0000ffd0-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '0000fff0-0000-1000-8000-00805f9b34fb',
  '00001000-0000-1000-8000-00805f9b34fb',
];

export const BLE_WRITE_CHARACTERISTICS = [
  '0000ffd9-0000-1000-8000-00805f9b34fb',
  '0000ffe1-0000-1000-8000-00805f9b34fb',
  '0000fff1-0000-1000-8000-00805f9b34fb',
];

/**
 * Encodes commands into Lotus Lantern 7E Protocol byte frames (9 bytes)
 * Format: 0x7E [Length] [Command] [Params...] 0xEF
 */
export function buildLotusPacket(type: 'power' | 'color' | 'brightness' | 'mode' | 'speed', val1: number, val2?: number, val3?: number, channelOrder: RgbChannelOrder = 'RGB'): Uint8Array {
  const packet = new Uint8Array(9);
  packet[0] = 0x7e; // Start marker
  packet[8] = 0xef; // End marker

  switch (type) {
    case 'power':
      // val1: 1 (on) or 0 (off)
      packet[1] = 0x00;
      packet[2] = 0x04;
      packet[3] = val1 ? 0xf0 : 0x00;
      packet[4] = 0x00;
      packet[5] = val1 ? 0x01 : 0x00;
      packet[6] = 0xff;
      packet[7] = 0x00;
      break;

    case 'color':
      // val1: R, val2: G, val3: B
      packet[1] = 0x00;
      packet[2] = 0x05;
      packet[3] = 0x03;
      const channels: Record<'R' | 'G' | 'B', number> = { R: val1 || 0, G: val2 || 0, B: val3 || 0 };
      const order = channelOrder.split('') as Array<'R' | 'G' | 'B'>;
      packet[4] = Math.max(0, Math.min(255, channels[order[0]]));
      packet[5] = Math.max(0, Math.min(255, channels[order[1]]));
      packet[6] = Math.max(0, Math.min(255, channels[order[2]]));
      packet[7] = 0x00;
      break;

    case 'brightness':
      // val1: brightness (1-100)
      packet[1] = 0x00;
      packet[2] = 0x01;
      packet[3] = Math.max(1, Math.min(100, val1));
      packet[4] = 0x00;
      packet[5] = 0x00;
      packet[6] = 0x00;
      packet[7] = 0x00;
      break;

    case 'mode':
      // val1: mode index (0x80 to 0x9B for Lotus dynamic modes)
      packet[1] = 0x00;
      packet[2] = 0x03;
      packet[3] = val1;
      packet[4] = 0x03;
      packet[5] = 0x00;
      packet[6] = 0x00;
      packet[7] = 0x00;
      break;

    case 'speed':
      // val1: speed (1-100)
      packet[1] = 0x00;
      packet[2] = 0x02;
      packet[3] = Math.max(1, Math.min(100, val1));
      packet[4] = 0x00;
      packet[5] = 0x00;
      packet[6] = 0x00;
      packet[7] = 0x00;
      break;
  }

  return packet;
}

export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in (navigator as any);
}

export async function requestLotusBluetoothDevice(): Promise<{
  device: WebBluetoothDevice;
  characteristic: WebBluetoothCharacteristic | null;
} | null> {
  if (!isWebBluetoothSupported()) {
    throw new Error('Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera on Windows/Mac/Linux.');
  }

  try {
    const nav = navigator as any;
    const device = await nav.bluetooth.requestDevice({
      filters: [
        { namePrefix: 'ELK' },
        { namePrefix: 'Triones' },
        { namePrefix: 'Lotus' },
        { namePrefix: 'LED' },
        { namePrefix: 'Ble' },
        { namePrefix: 'QHM' },
      ],
      optionalServices: BLE_SERVICES,
    });

    if (!device.gatt) {
      return { device, characteristic: null };
    }

    const server = await device.gatt.connect();

    // Search for writeable characteristic across standard services
    let characteristic: WebBluetoothCharacteristic | null = null;
    for (const serviceUuid of BLE_SERVICES) {
      try {
        const service = await server.getPrimaryService(serviceUuid);
        const characteristics = await service.getCharacteristics();
        for (const c of characteristics) {
          if (c.properties.write || c.properties.writeWithoutResponse) {
            characteristic = c;
            break;
          }
        }
        if (characteristic) break;
      } catch {
        // service not found, continue to next candidate
      }
    }

    return { device, characteristic };
  } catch (err: any) {
    if (err.name === 'NotFoundError') {
      // User cancelled picker
      return null;
    }
    throw err;
  }
}

export async function sendLotusPacket(
  characteristic: WebBluetoothCharacteristic | null | undefined,
  packet: Uint8Array
): Promise<boolean> {
  if (!characteristic) return false;
  try {
    if (characteristic.writeValueWithoutResponse) {
      await characteristic.writeValueWithoutResponse(packet as unknown as BufferSource);
    } else {
      await characteristic.writeValue(packet as unknown as BufferSource);
    }
    return true;
  } catch (error) {
    console.warn('Failed to transmit BLE packet:', error);
    return false;
  }
}
