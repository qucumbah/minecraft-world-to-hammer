import vmfTemplate from './vmfTemplate';
import Chunk from './Chunk';
import * as fs from 'fs';
import * as cp from 'child_process';
import * as path from 'path';

type TextureState = 'missing' | 'exists' | 'replaced';
type BlockTextures = {
  baseTexture: TextureState;
  topTexture: TextureState;
  sideTexture: TextureState;
  bottomTexture: TextureState;
};

export default class Hammer {
  private cachedBlocks = new Map<string, string>();

  constructor(private chunks: Chunk[]) {

  }

  saveVmf(yBottom: number, yTop: number): void {
    const solids = [] as string[];

    let id = 0;

    for (const chunk of this.chunks) {
      console.log('Creating solids for yet another chunk...');
      for (let x = 0; x < 16; x += 1) {
        for (let z = 0; z < 16; z += 1) {
          for (let y = yBottom; y < yTop; y += 1) {
            const [globalX, globalY, globalZ] = [chunk.x + x, y, chunk.z + z];

            const blockCoordinatesKey = `${globalX},${globalY},${globalZ}`;
            let blockName: string;
            if (this.cachedBlocks.has(blockCoordinatesKey)) {
              blockName = this.cachedBlocks.get(blockCoordinatesKey)!;
            } else {
              blockName = chunk.getBlock(x, y, z);
            }

            if (blockName === 'minecraft:air') {
              continue;
            }

            // TODO: optimize blocks that are surrounded by other blocks? think about non-solids

            solids.push(this.generateSolid(chunk.x + x, y, chunk.z + z, id, blockName));
            id += 1;
          }
        }
      }
    }

    const vmfContent: string = (
      vmfTemplate
        .replace('PLACEHOLDER_SOLIDS', solids.join(' '))
        .replace(/\n/g, ' ')
        .replace(/ +/g, ' ')
    );
    fs.writeFileSync('build/map.vmf', vmfContent);
  }

  private generateSolid(
    xIn: number,
    yIn: number,
    zIn: number,
    id: number,
    blockName: string,
  ): string {
    const solid = {
      id: `${id}`,
      editor: {
        'color': '0 231 228',
        'visgroupshown': '1',
        'visgroupautoshown': '1',
      },
      replace: 'this',
    };

    const size = 48;
    const [x, y, z] = [xIn * size, zIn * size, yIn * size];

    const normalizedBlockName: string = blockName.slice(blockName.indexOf(':') + 1);

    const {
      topTexture,
      sideTexture,
      bottomTexture,
     } = this.getTexture(normalizedBlockName);

    const sides = [
      this.generateSide(
        `${id * 6 + 0}`,
        `(${x} ${y + size} ${z + size}) (${x + size} ${y + size} ${z + size}) (${x + size} ${y} ${z + size})`,
        (topTexture === 'missing') ? `/${normalizedBlockName}` : `/${normalizedBlockName}_top`,
        '[1 0 0 0] 0.1875',
        '[0 -1 0 0] 0.1875',
      ),
      this.generateSide(
        `${id * 6 + 1}`,
        `(${x} ${y} ${z}) (${x + size} ${y} ${z}) (${x + size} ${y + size} ${z})`,
        (bottomTexture == 'missing') ? `/${normalizedBlockName}` : `/${normalizedBlockName}_bottom`,
        '[1 0 0 0] 0.1875',
        '[0 -1 0 0] 0.1875',
      ),
      this.generateSide(
        `${id * 6 + 2}`,
        `(${x} ${y + size} ${z + size}) (${x} ${y} ${z + size}) (${x} ${y} ${z})`,
        (sideTexture === 'missing') ? `/${normalizedBlockName}` : `/${normalizedBlockName}_side`,
        '[0 1 0 0] 0.1875',
        '[0 0 -1 0] 0.1875',
      ),
      this.generateSide(
        `${id * 6 + 3}`,
        `(${x + size} ${y + size} ${z}) (${x + size} ${y} ${z}) (${x + size} ${y} ${z + size})`,
        (sideTexture === 'missing') ? `/${normalizedBlockName}` : `/${normalizedBlockName}_side`,
        '[0 1 0 0] 0.1875',
        '[0 0 -1 0] 0.1875',
      ),
      this.generateSide(
        `${id * 6 + 4}`,
        `(${x + size} ${y + size} ${z + size}) (${x} ${y + size} ${z + size}) (${x} ${y + size} ${z})`,
        (sideTexture === 'missing') ? `/${normalizedBlockName}` : `/${normalizedBlockName}_side`,
        '[1 0 0 0] 0.1875',
        '[0 0 -1 0] 0.1875',
      ),
      this.generateSide(
        `${id * 6 + 5}`,
        `(${x + size} ${y} ${z}) (${x} ${y} ${z}) (${x} ${y} ${z + size})`,
        (sideTexture === 'missing') ? `/${normalizedBlockName}` : `/${normalizedBlockName}_side`,
        '[1 0 0 0] 0.1875',
        '[0 0 -1 0] 0.1875',
      ),
    ];

    const formattedSolid: string = (
      JSON.stringify(solid, null, 2)
        .replace(/[,:]/g, '')
        .replace('"replace" "this"', sides.join(' '))
    );
    return `solid ${formattedSolid}`;
  }

  private cachedTextures = new Map<string, BlockTextures>();

  private getTexture(normalizedBlockName: string): BlockTextures {
    if (this.cachedTextures.has(normalizedBlockName)) {
      return this.cachedTextures.get(normalizedBlockName)!;
    }

    const textures: BlockTextures = {
      baseTexture: 'missing',
      topTexture: 'missing',
      sideTexture: 'missing',
      bottomTexture: 'missing',
    };

    if (fs.existsSync(`replacedBlockTextures/${normalizedBlockName}.png`)) {
      textures.baseTexture = 'replaced';
    } else if (fs.existsSync(`minecraftBlockTextures/${normalizedBlockName}.png`)) {
      textures.baseTexture = 'exists';
    }

    if (fs.existsSync(`replacedBlockTextures/${normalizedBlockName}_top.png`)) {
      textures.topTexture = 'replaced';
    } else if (fs.existsSync(`minecraftBlockTextures/${normalizedBlockName}_top.png`)) {
      textures.topTexture = 'exists';
    }

    if (fs.existsSync(`replacedBlockTextures/${normalizedBlockName}_side.png`)) {
      textures.sideTexture = 'replaced';
    } else if (fs.existsSync(`minecraftBlockTextures/${normalizedBlockName}_side.png`)) {
      textures.sideTexture = 'exists';
    }

    if (fs.existsSync(`replacedBlockTextures/${normalizedBlockName}_bottom.png`)) {
      textures.bottomTexture = 'replaced';
    } else if (fs.existsSync(`minecraftBlockTextures/${normalizedBlockName}_bottom.png`)) {
      textures.bottomTexture = 'exists';
    }

    this.cachedTextures.set(normalizedBlockName, textures);

    return textures;
  }

  private static minecraftTexturesDir = 'minecraftBlockTextures';
  private static replacedTexturesDir = 'replacedBlockTextures';
  private static materialDir = 'build\\materials';
  private static materialSubDir = 'convertedMinecraftTextures';
  private static outputDir = path.join(Hammer.materialDir, Hammer.materialSubDir);

  saveTextures(): void {
    if (this.cachedTextures.size === 0) {
      throw new Error('No textures were cached. Make sure to call saveVmf() first');
    }

    fs.rmdirSync(Hammer.materialDir, { recursive: true });
    fs.mkdirSync(Hammer.materialDir);
    fs.mkdirSync(Hammer.outputDir);

    Array.from(this.cachedTextures.entries()).forEach(
      ([blockName, blockTexture]: [string, BlockTextures]) => {
        this.tryToSaveTexture(blockName, blockTexture.baseTexture);
        this.tryToSaveTexture(`${blockName}_top`, blockTexture.topTexture);
        this.tryToSaveTexture(`${blockName}_side`, blockTexture.sideTexture);
        this.tryToSaveTexture(`${blockName}_bottom`, blockTexture.bottomTexture);
      }
    );

    console.log('Moving vmt files to root because vtfCmd is not very smart');
    fs.readdirSync(Hammer.outputDir).forEach((fileName: string) => {
      if (fileName.endsWith('vmt')) {
        console.log('Moving', fileName);
        const fileContent: Buffer = fs.readFileSync(path.join(Hammer.outputDir, fileName));
        fs.unlinkSync(path.join(Hammer.outputDir, fileName));
        fs.writeFileSync(path.join(Hammer.materialDir, fileName), fileContent);
      }
    });
    console.log('Finished saving textures');
  }

  private static transparentList = [
    'glass',
  ];

  private tryToSaveTexture(textureName: string, textureMarker: TextureState) {
    if (textureMarker === 'missing') {
      return;
    }

    const inputDir: string = (
      (textureMarker === 'replaced') ? Hammer.replacedTexturesDir : Hammer.minecraftTexturesDir
    );

    const transparent: boolean = Hammer.transparentList.includes(textureName);

    const executable = 'vtfCmd\\x64\\VTFCmd.exe';
    const args = [
      '-resize',
      '-rwidth', '256',
      '-rheight', '256',
      '-rfilter', 'point',

      '-shader', 'LightmappedGeneric',
      '-param', '$translucent', transparent ? '1' : '0',

      '-file', `${inputDir}\\${textureName}.png`,
      '-output', Hammer.outputDir,
    ] as string[];

    console.log('Converting', textureName);
    const conversionResult: string = cp.execFileSync(executable, args).toString();
    // console.log(conversionResult);
  }

  private generateSide(
    id: string,
    plane: string,
    material: string,
    uaxis: string,
    vaxis: string,
  ): string {
    const side = {
      id,
      plane,
      material,
      uaxis,
      vaxis,
      'rotation': '0',
      'lightmapscale': '16',
      'smoothing_groups': '0',
    };

    const formattedSide: string = JSON.stringify(side, null, 2).replace(/[,:]/g, '');
    return `side ${formattedSide}`;
  };
};
