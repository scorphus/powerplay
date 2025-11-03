const CYCLING_POWER_SERVICE_UUID = 0x1818
const CYCLING_POWER_MEASUREMENT_UUID = 0x2A63

interface PowerMeasurementCallback {
  (power: number): void
}

export class BluetoothPowerService {
  private device: BluetoothDevice | null = null
  private server: BluetoothRemoteGATTServer | null = null
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null
  private callback: PowerMeasurementCallback | null = null

  async requestDevice(): Promise<BluetoothDevice> {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth is not supported in this browser')
    }
    this.device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [CYCLING_POWER_SERVICE_UUID] }],
      optionalServices: [CYCLING_POWER_SERVICE_UUID],
    })
    return this.device
  }

  async connect(): Promise<void> {
    if (!this.device) {
      throw new Error('No device selected')
    }
    if (!this.device.gatt) {
      throw new Error('Device does not support GATT')
    }
    this.server = await this.device.gatt.connect()
    const service = await this.server.getPrimaryService(CYCLING_POWER_SERVICE_UUID)
    this.characteristic = await service.getCharacteristic(CYCLING_POWER_MEASUREMENT_UUID)
  }

  async startNotifications(callback: PowerMeasurementCallback): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Not connected to device')
    }
    this.callback = callback
    this.characteristic.addEventListener('characteristicvaluechanged', this.handlePowerMeasurement.bind(this))
    await this.characteristic.startNotifications()
  }

  async stopNotifications(): Promise<void> {
    if (!this.characteristic) {
      return
    }
    await this.characteristic.stopNotifications()
    this.characteristic.removeEventListener('characteristicvaluechanged', this.handlePowerMeasurement.bind(this))
    this.callback = null
  }

  async disconnect(): Promise<void> {
    if (this.characteristic) {
      await this.stopNotifications()
    }
    if (this.server && this.server.connected) {
      this.server.disconnect()
    }
    this.server = null
    this.characteristic = null
    this.device = null
  }

  private handlePowerMeasurement(event: Event): void {
    if (!this.callback) return
    const target = event.target as BluetoothRemoteGATTCharacteristic
    const value = target.value
    if (!value) return
    const power = this.parsePowerMeasurement(value)
    this.callback(power)
  }

  private parsePowerMeasurement(data: DataView): number {
    const flags = data.getUint16(0, true)
    const instantaneousPowerPresent = (flags & 0x01) === 0
    if (!instantaneousPowerPresent) {
      return 0
    }
    return data.getInt16(2, true)
  }

  isConnected(): boolean {
    return this.server?.connected || false
  }

  getDeviceName(): string | undefined {
    return this.device?.name
  }
}

export function isBluetoothSupported(): boolean {
  return 'bluetooth' in navigator
}
