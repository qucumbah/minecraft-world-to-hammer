export default class Chunk {
  private levelData: any;

  public x: number;

  public z: number;

  constructor(nbtData: any) {
    this.levelData = nbtData.value.Level.value;
    this.x = this.levelData.xPos.value;
    this.z = this.levelData.zPos.value;
  }

  getBlock(x: number, yWorld: number, z: number): string {
    if (x < 0 || x > 15) {
      throw new Error('X should be between 0 and 15');
    }
    if (z < 0 || z > 15) {
      throw new Error('Z should be between 0 and 15');
    }
    if (yWorld < 0 || yWorld > 255) {
      throw new Error('Y should be between 0 and 255');
    }

    const section: any = this.getSection(Math.floor(yWorld / 16));

    if (!section || !section.BlockStates) {
      return 'minecraft:air';
    }

    const y: number = yWorld % 16;

    const index: number = y * 16 * 16 + z * 16 + x;

    const palette: any = section.Palette.value.value;

    const bitsNeededToStoreThisNumber = (num: number): number => Math.ceil(Math.log2(num));
    const bits: number = Math.max(bitsNeededToStoreThisNumber(palette.length), 4);

    const states: any = section.BlockStates.value;
    const stateIndex: number = Math.floor(index / Math.floor(64 / bits));

    const unsignedBigInt = (signedInteger: number): bigint => (
      BigInt(new Uint32Array([signedInteger])[0])
    );
    const state: bigint = (
      (unsignedBigInt(states[stateIndex][0]) << 32n) + unsignedBigInt(states[stateIndex][1])
    );

    const shiftedState: bigint = state >> BigInt(index % Math.floor(64 / bits) * bits);
    const paletteId: bigint = shiftedState & BigInt(2**bits - 1);

    const block: any = palette[Number(paletteId)];

    if (!block) {
      console.log(y);
      console.log(index);
      console.log(palette);
      console.log(bits);
      console.log(states);
      console.log(stateIndex);
      console.log(state);
      console.log(shiftedState);
      console.log(paletteId);
      console.log(block);
      debugger;
    }

    // console.log(x, yWorld, z, block.Name.value);

    return block.Name.value;
  }

  getSection(y: number): any {
    const sections = this.levelData.Sections.value.value as any[];
    return sections.find((section) => section.Y.value === y);
  }
}
