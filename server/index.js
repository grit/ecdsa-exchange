const express = require('express');
const app = express();
const cors = require('cors');
const port = 3042;
const secp = require('@noble/secp256k1');

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

let keys = {};

for (let i = 0; i < 3; i++) {
  let privateKey = secp.utils.randomPrivateKey();
  privateKey = Buffer.from(privateKey).toString('hex');

  let publicKey = secp.getPublicKey(privateKey);
  publicKey = Buffer.from(publicKey).toString('hex');
  publicKey = '0x' + publicKey.slice(publicKey.length - 40);

  keys[publicKey] = privateKey;
}

let balances = {};
for (key in keys) {
  balances[key] = 100;
}

let accounts = Object.keys(keys);

console.log(`
Available Accounts
==================
(0) ${accounts[0]} (${balances[accounts[0]]} ETH)
(1) ${accounts[1]} (${balances[accounts[1]]} ETH)
(2) ${accounts[2]} (${balances[accounts[2]]} ETH)

PRIVATE KEYS
==================
(0) ${keys[accounts[0]]}
(1) ${keys[accounts[1]]}
(2) ${keys[accounts[2]]}
`);

app.get('/balance/:address', (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post('/send', (req, res) => {
  const { sender, recipient, amount } = req.body;
  balances[sender] -= amount;
  balances[recipient] = (balances[recipient] || 0) + +amount;
  res.send({ balance: balances[sender] });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
