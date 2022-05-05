const express = require('express');
const app = express();
const cors = require('cors');
const EC = require('elliptic').ec;
const SHA256 = require('crypto-js/sha256');
const port = 3042;

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

const ec = new EC('secp256k1');
// const key = ec.genKeyPair();

// const privateKey = key.getPrivate().toString(16);

// encode the entire public key as a hexadecimal string
// const publicKey = key.getPublic().encode('hex');

/*
Generating three sets of public keys w/ corresponding private keys:
1:
  public - 046628b70d4ed4e15513f2eeb128c9992ab6b415e8938a5be0fdf1f664e761b338b891dbd22bd81bd11ae29b2c1399576117e13c0ecb6c0e2fadad0c6de4656a3f
  private - 2114f5aaa19bfd5a2a40459f9f988c3d4c3f969107d81352102fb0d9f4035894
2:
  public - 0452e23f41d7549617bfde1a27720fd9741cd1fc93b65ea981b04f0c9a788eccb232595f55ba57388e366876bdd45d9e42abf66ae453fcdc8eecde72b457cf49d2
  private - 593e063777a259a32c0e7274e507d56f1bf2899ea93eecc68f4ee14215ce9e6a
3:
  public - 042ba1a06e7c80981dab19c96e2c61581cbbbf4c588e82cd59bfc0bf6e88168acbdee712a3aec225f9e1be2fb1841e3d170443cd81561128c5f3202851ee0b52c4
  private - e79827dede6771383c473e2154ebc485ed2f291bf8a8bba679f059a47f8eefd5
*/

const balances = {
  '046628b70d4ed4e15513f2eeb128c9992ab6b415e8938a5be0fdf1f664e761b338b891dbd22bd81bd11ae29b2c1399576117e13c0ecb6c0e2fadad0c6de4656a3f': 100,
  '0452e23f41d7549617bfde1a27720fd9741cd1fc93b65ea981b04f0c9a788eccb232595f55ba57388e366876bdd45d9e42abf66ae453fcdc8eecde72b457cf49d2': 50,
  '042ba1a06e7c80981dab19c96e2c61581cbbbf4c588e82cd59bfc0bf6e88168acbdee712a3aec225f9e1be2fb1841e3d170443cd81561128c5f3202851ee0b52c4': 75,
};

// create mapping of public keys to corresponding private keys
const keyMap = {
  '046628b70d4ed4e15513f2eeb128c9992ab6b415e8938a5be0fdf1f664e761b338b891dbd22bd81bd11ae29b2c1399576117e13c0ecb6c0e2fadad0c6de4656a3f':
    '2114f5aaa19bfd5a2a40459f9f988c3d4c3f969107d81352102fb0d9f4035894',
  '0452e23f41d7549617bfde1a27720fd9741cd1fc93b65ea981b04f0c9a788eccb232595f55ba57388e366876bdd45d9e42abf66ae453fcdc8eecde72b457cf49d2':
    '593e063777a259a32c0e7274e507d56f1bf2899ea93eecc68f4ee14215ce9e6a',
  '042ba1a06e7c80981dab19c96e2c61581cbbbf4c588e82cd59bfc0bf6e88168acbdee712a3aec225f9e1be2fb1841e3d170443cd81561128c5f3202851ee0b52c4':
    'e79827dede6771383c473e2154ebc485ed2f291bf8a8bba679f059a47f8eefd5',
};

let pubI = 0;
let privI = 0;

console.log(`
Available Accounts \n
==================
`);
for (let key in balances) {
  // display last 40 chars as public address (ref ethereum)
  console.log(`(${pubI}) ${key.slice(-40)} (${balances[key]}eth)`);
  pubI++;
}

console.log(`
Private Keys \n
==================
`);
for (let key in balances) {
  console.log(`(${privI}) ${keyMap[key]}`);
  privI++;
}

console.log(`\n==================\n`);

app.get('/balance/:address', (req, res) => {
  const { address } = req.params;
  let addressFull = Object.keys(balances).find(
    hex => hex.slice(-40) === address
  );
  const balance = balances[addressFull] || 0;
  res.send({ balance });
});

app.post('/send', (req, res) => {
  const { sender, recipient, amount, privateKey } = req.body;

  // map 40-char pub address to corresponding full-length address in balances obj
  let senderFull = Object.keys(balances).find(hex => hex.slice(-40) === sender);
  let recipientFull = Object.keys(balances).find(
    hex => hex.slice(-40) === recipient
  );

  const key = ec.keyFromPrivate(privateKey);
  // using recipient public address + amt sent as the 'message'
  const recAmt = recipientFull + amount;
  const recAmtHash = SHA256(recAmt);
  const signature = key.sign(recAmtHash.toString());

  const pubKey = ec.keyFromPublic(senderFull, 'hex');
  const msgHash = recAmtHash.toString();
  const sigValid = pubKey.verify(msgHash, signature);

  if (sigValid) {
    if (balances[senderFull] - amount >= 0) {
      balances[senderFull] -= amount;
      balances[recipientFull] = (balances[recipientFull] || 0) + +amount;
      res.send({ balance: balances[senderFull] });
    } else {
      res.send({ error: 'insufficient' });
    }
  } else {
    res.send({ error: 'invalid' });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
