# @botcomet/plugin

This package contains the Plugin class for the BotComet ecosystem.

## Installation

```bash
npm install @botcomet/plugin
```

## Usage

```js
import { Plugin } from '@botcomet/plugin';

const plugin = new Plugin(publicKey, privateKey);
plugin.start("ws://localhost:6197");
```
