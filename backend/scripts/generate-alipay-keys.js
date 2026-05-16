const crypto = require('crypto');

// 生成 RSA 2048 密钥对（PKCS8 格式）
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

// 去除 PEM 格式的换行和头部尾部
const cleanPrivateKey = privateKey
    .replace('-----BEGIN PRIVATE KEY-----\n', '')
    .replace('-----END PRIVATE KEY-----\n', '')
    .replace(/\n/g, '');

const cleanPublicKey = publicKey
    .replace('-----BEGIN PUBLIC KEY-----\n', '')
    .replace('-----END PUBLIC KEY-----\n', '')
    .replace(/\n/g, '');

console.log('========================================');
console.log('支付宝 RSA2 密钥对（PKCS8 格式）');
console.log('========================================');
console.log('');
console.log('=== 应用私钥（填入 .env ALIPAY_PRIVATE_KEY）===');
console.log(cleanPrivateKey);
console.log('');
console.log('=== 应用公钥（粘贴到沙箱控制台）===');
console.log(cleanPublicKey);
