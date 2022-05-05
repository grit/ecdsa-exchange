import './index.scss';

const server = 'http://localhost:3042';

document
  .getElementById('exchange-address')
  .addEventListener('input', ({ target: { value } }) => {
    if (value === '') {
      document.getElementById('balance').innerHTML = 0;
      return;
    }

    fetch(`${server}/balance/${value}`)
      .then(response => {
        return response.json();
      })
      .then(({ balance }) => {
        document.getElementById('balance').innerHTML = balance;
      });
  });

const senderField = document.getElementById('exchange-address');
const amountField = document.getElementById('send-amount');
const recipientField = document.getElementById('recipient');
const privateKeyField = document.getElementById('private-key');

// resets all input fields after transaction attempt
const resetFields = () => {
  senderField.value = null;
  amountField.value = null;
  recipientField.value = null;
  privateKeyField.value = null;
  document.getElementById('balance').innerHTML = 0;
};

document.getElementById('transfer-amount').addEventListener('click', () => {
  const sender = senderField.value;
  const amount = amountField.value;
  const recipient = recipientField.value;
  const privateKey = privateKeyField.value;

  const body = JSON.stringify({
    sender,
    amount,
    recipient,
    privateKey,
  });

  const request = new Request(`${server}/send`, { method: 'POST', body });

  fetch(request, { headers: { 'Content-Type': 'application/json' } })
    .then(response => {
      return response.json();
    })
    .then(res => {
      if (res.balance) {
        document.getElementById('balance').innerHTML = res.balance;
        console.log(`Valid transaction! - Updated balance: ${res.balance}`);
        resetFields();
      } else if (res.error === 'invalid') {
        console.log('Invalid transaction!');
        resetFields();
      } else if (res.error === 'insufficient') {
        console.log('Insufficient funds!');
        resetFields();
      }
    });
});
