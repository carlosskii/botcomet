# @botcomet/plugin

This package contains the Plugin class for the BotComet ecosystem.

## Installation

```bash
npm install @botcomet/plugin
```

## Usage

```js
import { Plugin } from '@botcomet/plugin';

const plugin = new Plugin(publicKey, privateKey, {
  address: "localhost",
  port: 6197
});
plugin.start();
```
