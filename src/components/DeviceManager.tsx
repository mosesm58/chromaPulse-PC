import React, { useState } from 'react';
import { Bluetooth, Check, Monitor, Plus, Power, Radio, RefreshCw, Sliders, Trash2, Tv, Wifi } from 'lucide-react';
import { LedDevice } from '../types/led';
import { requestLotusBluetoothDevice } from '../utils/bluetooth';
import { rgbToHex } from '../utils/color';

interface DeviceManagerProps {
  devices: LedDevice[];
  activeDeviceId: string;
  onSelectDevice: (id: string) => void;
  onToggleDevicePower: (id: string) => void;
  onDeviceBrightnessChange: (id: string, brightness: number) => void;
  onAddDevice: (device: LedDevice) => void;
  onRemoveDevice: (id: string) => void;
  onSyncAll: () => void;
  allSynced: boolean;
  onToggleHardwareType?: (id: string) => void;
}

export const DeviceManager: React.FC<DeviceManagerProps> = ({
  devices,
  activeDeviceId,
  onSelectDevice,
  onToggleDevicePower,
  onDeviceBrightnessChange,
  onAddDevice,
  onRemoveDevice,
  onSyncAll,
  allSynced,
  onToggleHardwareType,
}) => {
  const [isScanningBle, setIsScanningBle] = useState(false);
  const [bleError, setBleError] = useState<string | null>(null);
  const [showAddVirtualModal, setShowAddVirtualModal] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('Underglow Neon Bar');
  const [newDeviceType, setNewDeviceType] = useState<'strip' | 'bar' | 'bulb' | 'neon'>('strip');
  const [newDeviceLocation, setNewDeviceLocation] = useState('Office Desk');

  const handleScanRealBluetooth = async () => {
    setIsScanningBle(true);
    setBleError(null);

    try {
      const res = await requestLotusBluetoothDevice();
      if (res && res.device) {
        const newBleDev: LedDevice = {
          id: `ble-${Date.now()}`,
          name: res.device.name || 'Lotus LED Controller (BLE)',
          location: 'Local Bluetooth Room',
          type: 'strip',
          hardwareType: 'whole-strip',
          ledCount: 150,
          isOnline: true,
          power: true,
          color: { r: 255, g: 255, b: 255 },
          brightness: 100,
          colorTemp: 4000,
          modeId: null,
          speed: 50,
          rssi: -58,
          isRealBluetooth: true,
          bleDevice: res.device,
          bleCharacteristic: res.characteristic || undefined,
        };
        onAddDevice(newBleDev);
        onSelectDevice(newBleDev.id);
      }
    } catch (err: any) {
      console.warn('Bluetooth scan error:', err);
      setBleError(err.message || 'Bluetooth connection was cancelled or unavailable.');
    } finally {
      setIsScanningBle(false);
    }
  };

  const handleAddVirtual = (e: React.FormEvent) => {
    e.preventDefault();
    const dev: LedDevice = {
      id: `dev-${Date.now()}`,
      name: newDeviceName,
      location: newDeviceLocation,
      type: newDeviceType,
      hardwareType: 'whole-strip',
      ledCount: 120,
      isOnline: true,
      power: true,
      color: { r: 99, g: 102, b: 241 },
      brightness: 85,
      colorTemp: 3500,
      modeId: null,
      speed: 60,
      rssi: -45,
    };
    onAddDevice(dev);
    onSelectDevice(dev.id);
    setShowAddVirtualModal(false);
  };

  const getDeviceIcon = (type: LedDevice['type']) => {
    switch (type) {
      case 'bar':
        return <Tv className="w-5 h-5 text-indigo-400" />;
      case 'bulb':
        return <Radio className="w-5 h-5 text-amber-400" />;
      default:
        return <Monitor className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Pairing & Group Controls */}
      <div className="p-6 bg-[#10141f] rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Bluetooth className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-semibold text-white">
                Hardware Device Rack & BLE Management
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pair real physical Bluetooth LED strips (Lotus/Triones/ELK-BLEDOM) or manage virtual room fixtures
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={onSyncAll}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                allSynced
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                  : 'bg-[#141926] border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              {allSynced ? '✓ All Devices Synced' : 'Sync All Devices'}
            </button>

            <button
              onClick={() => setShowAddVirtualModal(true)}
              className="px-3.5 py-2 text-xs font-medium bg-[#141926] hover:bg-[#1c2336] text-slate-200 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Virtual LED</span>
            </button>

            <button
              onClick={handleScanRealBluetooth}
              disabled={isScanningBle}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanningBle ? 'animate-spin' : ''}`} />
              <span>{isScanningBle ? 'Scanning BLE...' : 'Scan Bluetooth LED'}</span>
            </button>
          </div>
        </div>

        {bleError && (
          <div className="p-3 bg-slate-900/90 border border-indigo-500/40 rounded-xl text-xs text-indigo-200 flex items-start gap-2">
            <Bluetooth className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
            <div>
              <div className="font-medium text-slate-100">Web Bluetooth Pairing Notice</div>
              <div className="text-slate-400 text-[11px] mt-0.5">{bleError}</div>
              <div className="text-slate-400 text-[10px] mt-1">
                Note: Web Bluetooth works on Chromium browsers (Chrome, Edge, Opera) with a Bluetooth 4.0+ adapter. Virtual devices are active for instant full preview testing.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Virtual Device Creation Modal */}
      {showAddVirtualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleAddVirtual}
            className="w-full max-w-md bg-[#10141f] border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white">Add New LED Fixture</h3>
              <button
                type="button"
                onClick={() => setShowAddVirtualModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Device Name</label>
              <input
                type="text"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-[#0b0e17] border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Room / Location</label>
                <input
                  type="text"
                  value={newDeviceLocation}
                  onChange={(e) => setNewDeviceLocation(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-[#0b0e17] border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Fixture Type</label>
                <select
                  value={newDeviceType}
                  onChange={(e) => setNewDeviceType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-[#0b0e17] border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="strip">Addressable RGB Strip</option>
                  <option value="bar">Monitor Lightbar</option>
                  <option value="bulb">Smart Ambience Bulb</option>
                  <option value="neon">Neon Flex Rope</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddVirtualModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer"
              >
                Create Device
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Devices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {devices.map((device) => {
          const isSelected = activeDeviceId === device.id;
          const hex = rgbToHex(device.color);

          return (
            <div
              key={device.id}
              onClick={() => onSelectDevice(device.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-[#131826] border-indigo-500/80 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/50'
                  : 'bg-[#10141f] border-slate-800/80 hover:border-slate-700 hover:bg-[#141926]'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#0b0e17] border border-slate-800">
                    {getDeviceIcon(device.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{device.name}</span>
                      {device.isRealBluetooth && (
                        <span className="text-[10px] font-mono text-cyan-400">
                          BLE Hardware
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{device.location}</span>
                      <span aria-hidden="true">·</span>
                      <span>{device.ledCount} LEDs</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[11px] text-slate-400">{device.rssi} dBm</span>
                    </div>
                  </div>
                </div>

                {/* Power Toggle Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleDevicePower(device.id);
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    device.power
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                  title={device.power ? 'Turn Off' : 'Turn On'}
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>

              {/* Status and Color Strip */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
                      style={{
                        backgroundColor: device.power ? hex : '#27272a',
                        boxShadow: device.power ? `0 0 10px ${hex}` : undefined,
                      }}
                    />
                    <span className="text-slate-400 text-xs">
                      {device.power ? (device.modeId ? 'Dynamic Animation' : hex.toUpperCase()) : 'Powered Off'}
                    </span>
                  </div>

                  <span className="font-mono text-xs text-slate-400 tabular-nums">
                    {device.brightness}% Brightness
                  </span>
                </div>

                {/* Individual Brightness Slider */}
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={device.brightness}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    onDeviceBrightnessChange(device.id, Number(e.target.value));
                  }}
                  disabled={!device.power}
                  className="w-full disabled:opacity-40"
                  style={{
                    background: `linear-gradient(to right, #1e2536 0%, #6366f1 ${device.brightness}%, #1e2536 ${device.brightness}%)`,
                  }}
                />
              </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/60 text-[11px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleHardwareType?.(device.id);
                    }}
                    className="text-slate-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>Mode: {device.hardwareType === 'whole-strip' ? 'Whole-Strip RGB' : 'Addressable ARGB'}</span>
                    <span className="text-[10px] text-slate-500 underline">(switch)</span>
                  </button>

                  {devices.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveDevice(device.id);
                      }}
                      className="text-slate-400 hover:text-red-400 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
