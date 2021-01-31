import * as fs from 'fs';
import Chunk from './Chunk';
import Region from './Region';
import Hammer from './Hammer';

// const world: Buffer = fs.readFileSync('data/r.0.0.mca');
const world: Buffer = fs.readFileSync('data/r.0.-2.mca');
const region = new Region(world);
const nbtData: any = region.chunkData(0, 0);
const chunk = new Chunk(nbtData);

const hammer = new Hammer([chunk]);
hammer.saveVmf(50, 100);
// hammer.saveVmf(0, 10);
hammer.saveTextures();
