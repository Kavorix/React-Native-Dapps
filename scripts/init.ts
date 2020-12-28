import { execSync } from 'child_process';
import * as prompts from 'prompts';
import * as chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs';
import { flatten, unflatten } from 'flat';

const defaultPadding = 5;

const line = (message: string, padding: number = defaultPadding) =>
  console.log([...Array(padding)].map(() => ' ').join(''), message);

(async () => {
  console.clear();
  line(chalk.green.bold`Ξ Welcome to create-react-native-dapp! Ξ`);
  line(
    `Your next Ethereum application starts ${chalk.bold`here`}.`,
    defaultPadding - 1
  );

  console.log();

  const { name } = await prompts({
    type: 'text',
    name: 'name',
    message: 'What is your app named?',
    initial: 'my-react-dapp',
  });

  console.log();

  execSync(`npx create-react-native-app ${name} -t with-typescript`, {
    stdio: 'inherit',
  });

  // TODO: Set app icon here prior to eject.

  const dir = path.resolve(name);

  execSync(`cd ${dir}; expo eject;`, { stdio: 'inherit' });

  const index = path.resolve(dir, 'index.js');

  fs.writeFileSync(
    index,
    `
if (typeof Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

global.btoa = global.btoa || require('base-64').encode;
global.atob = global.atob || require('base-64').decode;

// TODO: Find a nice version.
process.version = 'v9.40';

import { registerRootComponent } from 'expo';

const { default: App } = require('./App');

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in the Expo client or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
    
    `.trim()
  );

  const scripts = path.resolve(dir, 'scripts');
  const postinstall = path.resolve(scripts, 'postinstall.js');
  const pkg = path.resolve(dir, 'package.json');

  const yarn = path.resolve(dir, 'yarn.lock');
  const shouldUseYarn = fs.existsSync(yarn);

  fs.mkdirSync(scripts);
  fs.writeFileSync(
    postinstall,
    `
const {execSync} = require('child_process');
execSync('npx pod-install', {stdio: 'inherit'});
    `.trim()
  );

  // package.json
  fs.writeFileSync(
    pkg,
    JSON.stringify(
      unflatten({
        ...flatten(JSON.parse(fs.readFileSync(pkg, 'utf-8'))),
        // scripts
        'scripts.postinstall': 'node scripts/postinstall.js',
        // dependencies
        'dependencies.base-64': '1.0.0',
        'dependencies.buffer': '6.0.3',
        'dependencies.web3': '1.3.1',
        'dependencies.node-libs-browser': '2.2.1',
        'dependencies.path-browserify': '0.0.0',
        'dependencies.react-native-stream': '0.1.9',
        'dependencies.react-native-crypto': '2.2.0',
        // react-native
        'react-native.stream': 'react-native-stream',
        'react-native.crypto': 'react-native-crypto',
        'react-native.path': 'path-browserify',
        'react-native.process': 'node-libs-browser/mock/process',
      }),
      null,
      2
    )
  );

  // .gitignore
  const gitignore = path.resolve(dir, '.gitignore');
  fs.writeFileSync(
    gitignore,
    `
${fs.readFileSync(gitignore, 'utf-8')}
    `.trim()
  );

  execSync(`cd ${dir}; ${shouldUseYarn ? 'yarn' : 'npm i'}; `.trim(), {
    stdio: 'inherit',
  });

  const metroConfig = path.resolve(dir, 'metro.config.js');

  fs.writeFileSync(
    metroConfig,
    `
const extraNodeModules = require('node-libs-browser');

module.exports = {
  resolver: {
    extraNodeModules,
  },
  transformer: {
    assetPlugins: ['expo-asset/tools/hashAssetFiles'],
  },
};

    `.trim()
  );
  // TODO: add node-libs-browser
})();
