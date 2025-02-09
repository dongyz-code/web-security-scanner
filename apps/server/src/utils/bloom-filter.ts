export class BloomFilter {
  private bitArray: Uint8Array;
  private size: number;
  private hashCount: number;

  constructor(maxItems: number, errorRate: number) {
    // 计算位数组大小和哈希函数数量
    this.size = Math.ceil(-(maxItems * Math.log(errorRate)) / Math.LN2 ** 2);
    this.hashCount = Math.ceil((this.size / maxItems) * Math.LN2);

    // 初始化位数组，每个字节8位
    const byteCount = Math.ceil(this.size / 8);
    this.bitArray = new Uint8Array(byteCount);
  }

  // 添加元素
  add(item: string): void {
    const hash1 = this.djb2Hash(item);
    const hash2 = this.sdbmHash(item);

    for (let i = 0; i < this.hashCount; i++) {
      const hash = hash1 + i * hash2;
      const position = hash % this.size;
      this.setBit(position);
    }
  }

  // 检查元素是否存在
  has(item: string): boolean {
    const hash1 = this.djb2Hash(item);
    const hash2 = this.sdbmHash(item);

    for (let i = 0; i < this.hashCount; i++) {
      const hash = hash1 + i * hash2;
      const position = hash % this.size;
      if (!this.getBit(position)) {
        return false;
      }
    }
    return true;
  }

  // 设置指定位为1
  private setBit(position: number): void {
    const byteIndex = Math.floor(position / 8);
    const bitIndex = position % 8;
    this.bitArray[byteIndex] |= 1 << bitIndex;
  }

  // 获取指定位的值
  private getBit(position: number): boolean {
    const byteIndex = Math.floor(position / 8);
    const bitIndex = position % 8;
    return (this.bitArray[byteIndex] & (1 << bitIndex)) !== 0;
  }

  // DJB2哈希函数
  private djb2Hash(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash >>> 0; // 确保为非负数
  }

  // SDBM哈希函数
  private sdbmHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + (hash << 6) + (hash << 16) - hash;
    }
    return hash >>> 0; // 确保为非负数
  }
}
