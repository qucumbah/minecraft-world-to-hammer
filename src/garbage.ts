const uint32 = new Uint32Array(1);
uint32[0] = 4193965235;

// const bytes = new Uint8Array(uint32.buffer);
// const buff = Buffer.alloc(4);
// buff[0] = 0;
// buff[1] = bytes[0];
// buff[2] = bytes[1];
// buff[3] = bytes[2];

// console.log(buff);
// console.log(buff.readInt32BE());

const buff = Buffer.from(uint32.buffer);

const buff2 = Buffer.from(new Uint8Array(Array.from(buff).unshift(0)));
console.log(buff2);
