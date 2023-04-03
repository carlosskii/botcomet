# @botcomet/auth

This package contains functions to authenticate Comets and Plugins. It is used internally by BotComet.

## Installation

```bash
npm install @botcomet/auth
```

## Usage

```js
import { Padlock, Certificate } from '@botcomet/auth';

const padlock = new Padlock(publicKey);
const cert = new Certificate(publicKey, privateKey);


let test = 'test';
test = padlock.lock(test);
test = certificate.unlock(test);
if (!padlock.verify(test)) {
  throw new Error('Invalid signature');
}
```
