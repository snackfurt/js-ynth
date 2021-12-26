import * as fs from 'fs';
import * as path from 'path';

const versionFile = path.resolve('./version.txt');
const versionFileContent = fs.readFileSync(versionFile).toString();
const versionParts = versionFileContent.split('.');
const newMinorVersion = parseInt(versionParts[1], 10) + 1;
const version = `${versionParts[0]}.${newMinorVersion}`;

const packageJsonFile = path.resolve('./package.json');
const packageJsonFileContent = fs.readFileSync(packageJsonFile).toString();
const packageConfig = JSON.parse(packageJsonFileContent);

packageConfig.version = version;
fs.writeFileSync(packageJsonFile, JSON.stringify(packageConfig, null, 2));

console.log('✔ update package.json');

const mainJsFile = path.resolve('./src/main.js');
const mainJsFileContent = fs.readFileSync(mainJsFile).toString();
const regex = /version: '.*'/;
const replaceString = `version: '${version}'`;
const newMainJsFileContent = mainJsFileContent.replace(regex, replaceString);
fs.writeFileSync(mainJsFile, newMainJsFileContent);

console.log('✔ update main.js');
