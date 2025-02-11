import { launchWebBrowser } from './methods/route-scan.js';

launchWebBrowser({
  scanId: 'KoXo9898',
  target: 'https://p-gsk-kyc-qa.medomino.com',
  headers: {
    Signature: 'signature',
    Token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Imh6ejMyNjc2IiwidXNlcl9pZCI6IjBiYzQ2NjFjZThmODViMjg0ZmIwNGIxNGJhNmQ1YmY4IiwiaXNBWiI6ZmFsc2UsImlhdCI6MTczODk5Mzk4MCwiZXhwIjoxNzM5MDM3MTgwfQ.yZu-26QGeJpx4HU2aHcAkLAXbwNWyLpFJd9dkbH7YW0',
  },
  localStorages: [
    {
      name: 'token',
      value:
        '{"data":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Imh6ejMyNjc2IiwidXNlcl9pZCI6IjBiYzQ2NjFjZThmODViMjg0ZmIwNGIxNGJhNmQ1YmY4IiwiaXNBWiI6ZmFsc2UsImlhdCI6MTczODk5Mzk4MCwiZXhwIjoxNzM5MDM3MTgwfQ.yZu-26QGeJpx4HU2aHcAkLAXbwNWyLpFJd9dkbH7YW0"}',
    },
  ],
})
  .then((res) => {
    console.log('res', res);
  })
  .catch((err) => {
    console.log('err', err);
  });
