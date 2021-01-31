import * as nbt from 'nbt';
import * as zlib from 'zlib';

export default class Region {
  constructor(private data: Buffer) {

  }

  static getRegionFileName(x: number, z: number) {
    return `r.${Math.floor(x / 32)}.${Math.floor(z / 32)}.mca`;
  }

  private static headerOffset(chunkX: number, chunkZ: number): number {
    return 4 * (chunkX % 32 + chunkZ % 32 * 32);
  }

  private chunkLocation(chunkX: number, chunkZ: number): [number, Buffer] {
    const b_off: number = Region.headerOffset(chunkX, chunkZ);

    if (b_off + 3 > this.data.length) {
      throw new Error('Invalid chunk location');
    }

    const offsetBytes: number[] = Array.from(this.data.slice(b_off, b_off + 3));
    const offset: number = (offsetBytes[0] << 16) + (offsetBytes[1] << 8) + (offsetBytes[2] << 0);
    const sectors: Buffer = this.data.slice(b_off + 3);
    return [offset, sectors];
  }

  chunkData(chunkX: number, chunkZ: number): any {
    const [offset]: [number, Buffer] = this.chunkLocation(chunkX, chunkZ);

    console.log('Chunk metadata base offset', offset);

    if (offset === 0) {
      return null;
    }

    const otherOffset: number = offset * 4096;

    console.log('Chunk data start', offset);

    const length: number = this.data.slice(otherOffset, otherOffset + 4).readInt32BE();
    const compressedData: Buffer = this.data.slice(otherOffset + 5, otherOffset + 5 + length - 1);

    console.log('Uncompressing data...');

    const uncompressedData: Buffer = zlib.unzipSync(compressedData);

    console.log('Done, parsing NBT data...');

    const result: object = nbt.parseUncompressed(uncompressedData);

    console.log('Done');

    return result;
  }
}
