# @botcomet/comet

This package contains the Comet node class for the BotComet ecosystem.

## Installation

```bash
npm install @botcomet/comet
```

## Usage

```js
import { Comet } from '@botcomet/comet';


const comet = new Comet({
  address: "localhost",
  port: 6197
});
comet.start();
```
