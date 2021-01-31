// type nbtEntry = (
//   { type: 'byte', value: number }
//   | { type: 'short', value: number }
//   | { type: 'int', value: number }
//   | { type: 'long', value: number }
//   | { type: 'float', value: number }
//   | { type: 'double', value: number }

//   | { type: 'byteArray', value: number[] }
//   | { type: 'intArray', value: number[] }
//   | { type: 'longArray', value: number[] }

//   | { type: 'string', value: string }

//   | { type: 'compound', value: nbtEntry }
// );

// export type nbtData = {
//   name: string;
//   value: {
//     [name: string]: nbtEntry;
//   };
// };

// export function promisify<T, U>(
//   func: (data: T, callback: (error: any, result: U) => void) => void,
//   self?: any,
// ) {
//   return function(data: any): Promise<U> {
//     return new Promise((resolve, reject) => {
//       func.call(self, data, (error: any, result: U) => {
//         if (error) {
//           reject(error);
//         } else {
//           resolve(result);
//         }
//       });
//     });
//   }
// }
