# Setting up Ram Dodging with esbuild-bitburner-plugin

Install the extension with `npm i ramdodger-extension`

In your `build.mjs`, import the extension and add it to the BitburnerPlugin

```js
import {RamDodgerExtension} from 'ramdodger-extension'

const createContext = async () => await context({
  entryPoints: [
    'servers/**/*.js',
    'servers/**/*.jsx',
    'servers/**/*.ts',
    'servers/**/*.tsx',
  ],
  outdir: './build',
  plugins: [
    BitburnerPlugin({
      port: 12525,
      types: 'NetscriptDefinitions.d.ts',
      extensions: [RamDodgerExtension],
    })
  ],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  logLevel: 'debug',
});

const ctx = await createContext();
ctx.watch();
```

This will remove any static ram from your transpiled scripts. Since a script will crash when using a ns function that causes the dynamic ram to exceed the expected static ram you need to explicitly declare what ns functions you use. This is best done at the top of main or library functions like this

```js
export async function main(ns){
  'use scan';
  'use getServer';
  const neighbors = ns.scan().map(hostname => ns.getServer(hostname));
}

//or in a library 

export function getAllServers(ns: NS) {
  'use scan';
  const servers = ns.scan('home');
  for (const server of servers) {
    servers.push(...ns.scan(server).filter(s => !servers.includes(s)));
  }
  return servers;
}
```

## Unsafe Plugin

If you want to import a library function without incurring its static ram, because you know it wont exceed dynamic ram for example, you can add the UnsafePlugin to esbuild

```js
import {RamDodgerExtension, UnsafePlugin} from 'ramdodger-extension'

const createContext = async () => await context({
  entryPoints: [
    'servers/**/*.js',
    'servers/**/*.jsx',
    'servers/**/*.ts',
    'servers/**/*.tsx',
  ],
  outdir: './build',
  plugins: [
    UnsafePlugin,
    BitburnerPlugin({
      port: 12525,
      types: 'NetscriptDefinitions.d.ts',
      extensions: [RamDodgerExtension],
    })
  ],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  logLevel: 'debug',
});

const ctx = await createContext();
ctx.watch();
```

Library functions can then be imported with an import attribute to import them without adding to static ram.

```js
import { getAllServers } from '@/lib/Network' with {type: 'unsafe'};
```
