/*
entropy
<Buffer 3c f1 e5 18 a8 ec d0 f5 3c 5a 3e 8c 3e 8e 1e cb 95 a5 15 43 ba 12 a4 53 63 f1 d9 a3 69 7d 5c 16>
Uint8Array(32) [
   60, 241, 229,  24, 168, 236, 208, 245,
   60,  90,  62, 140,  62, 142,  30, 203,
  149, 165,  21,  67, 186,  18, 164,  83,
   99, 241, 217, 163, 105, 125,  92,  22
]
3cf1e518a8ecd0f53c5a3e8c3e8e1ecb95a51543ba12a45363f1d9a3697d5c16
*/

/*
salt
<Buffer 0f 05 be d9 91 88 70 7d 4d 9b be 13 cf 58 b1 b7 8e 41 f5 d5 5b 26 82 fb b8 d5 16 be 75 a8 f7 fb>
Uint8Array(32) [
   15,   5, 190, 217, 145, 136, 112,
  125,  77, 155, 190,  19, 207,  88,
  177, 183, 142,  65, 245, 213,  91,
   38, 130, 251, 184, 213,  22, 190,
  117, 168, 247, 251
]
0f05bed99188707d4d9bbe13cf58b1b78e41f5d55b2682fbb8d516be75a8f7fb
*/

function xorTweak(entropy: Uint8Array, salt: Uint8Array): Uint8Array {
  const tweaked = new Uint8Array(entropy.length);
  for (let i = 0; i < entropy.length; i++) {
    tweaked[i] = entropy[i] ^ salt[i % salt.length]; // XOR with repeating salt
  }
  return tweaked;
}

function reverseXorTweak(tweakedEntropy: Uint8Array, salt: Uint8Array): Uint8Array {
  const originalEntropy = new Uint8Array(tweakedEntropy.length);
  for (let i = 0; i < tweakedEntropy.length; i++) {
    originalEntropy[i] = tweakedEntropy[i] ^ salt[i % salt.length]; // XOR with salt again
  }
  return originalEntropy;
}

const entropy = new Uint8Array([
  60, 241, 229, 24, 168, 236, 208, 245,
  60, 90, 62, 140, 62, 142, 30, 203,
  149, 165, 21, 67, 186, 18, 164, 83,
  99, 241, 217, 163, 105, 125, 92, 22
]);
const salt = new Uint8Array([
  15, 5, 190, 217, 145, 136, 112,
  125, 77, 155, 190, 19, 207, 88,
  177, 183, 142, 65, 245, 213, 91,
  38, 130, 251, 184, 213, 22, 190,
  117, 168, 247, 251
]);

const xorTweakedEntropy = xorTweak(entropy, salt);
console.log('XOR Tweaked Entropy:', xorTweakedEntropy);
const tweakedPrivateKey = reverseXorTweak(xorTweakedEntropy, salt);
console.log('Original Entropy:', tweakedPrivateKey);