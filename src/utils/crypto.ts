// Self-contained cryptographic helpers for UtylitiRaw

export function md5(str: string): string {
  let k: number[] = [];
  for (let i = 0; i < 64; ) {
    k[i] = 0 | (Math.abs(Math.sin(++i)) * 4294967296);
  }
  
  let s = unescape(encodeURIComponent(str));
  let len = s.length;
  let words: number[] = [];
  
  for (let i = 0; i < len; i++) {
    words[i >> 2] |= s.charCodeAt(i) << ((i % 4) * 8);
  }
  
  words[len >> 2] |= 0x80 << ((len % 4) * 8);
  let max_len = (((len + 8) >> 6) + 1) * 16;
  while (words.length < max_len) {
    words.push(0);
  }
  
  words[max_len - 2] = len * 8;
  words[max_len - 1] = 0;
  
  function safeAdd(x: number, y: number): number {
    let lsw = (x & 0xffff) + (y & 0xffff);
    let msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  
  function bitRoll(num: number, cnt: number): number {
    return (num << cnt) | (num >>> (32 - cnt));
  }
  
  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  
  for (let i = 0; i < words.length; i += 16) {
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    
    for (let j = 0; j < 64; j++) {
      let f = 0;
      let g = 0;
      
      if (j < 16) {
        f = (b & c) | (~b & d);
        g = j;
      } else if (j < 32) {
        f = (d & b) | (~d & c);
        g = (5 * j + 1) % 16;
      } else if (j < 48) {
        f = b ^ c ^ d;
        g = (3 * j + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * j) % 16;
      }
      
      const s_rot = [
        7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,
        5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,
        4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,
        6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21
      ];
      
      let temp = d;
      d = c;
      c = b;
      b = safeAdd(b, bitRoll(safeAdd(safeAdd(a, f), safeAdd(k[j], words[i + g])), s_rot[j]));
      a = temp;
    }
    
    h0 = safeAdd(h0, a);
    h1 = safeAdd(h1, b);
    h2 = safeAdd(h2, c);
    h3 = safeAdd(h3, d);
  }
  
  let hex = "";
  const hashArr = [h0, h1, h2, h3];
  for (let i = 0; i < 4; i++) {
    let val = hashArr[i];
    for (let j = 0; j < 4; j++) {
      let byte = (val >> (j * 8)) & 0xff;
      hex += (byte < 16 ? "0" : "") + byte.toString(16);
    }
  }
  return hex;
}

export async function sha1(str: string): Promise<string> {
  const buf = new TextEncoder().encode(str);
  const hashBuf = await crypto.subtle.digest('SHA-1', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function sha256(str: string): Promise<string> {
  const buf = new TextEncoder().encode(str);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function sha512(str: string): Promise<string> {
  const buf = new TextEncoder().encode(str);
  const hashBuf = await crypto.subtle.digest('SHA-512', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
