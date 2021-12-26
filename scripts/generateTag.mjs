import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import { execSync } from 'child_process';

const versionFile = path.resolve('./version.txt');
const version = fs.readFileSync(versionFile).toString();

// copy public folder except "versions" subdir
const publicDirPath = path.resolve('./public');
const versionsPath = path.resolve(publicDirPath, 'versions');

console.log(`creating version ${version}`);

// create dir for new version, delete dir if it already exists
const newVersionDirPath = path.resolve(`./public/versions/${version}`);
if (fs.existsSync(newVersionDirPath)) {
    fs.rmdirSync(newVersionDirPath, { recursive: true, force: true });
}
fs.mkdirSync(newVersionDirPath);
console.log('✔ create version directory');

// create temp dir, because we cannot copy directly from "public" into a subfolder of "public"
const tempDir = fs.mkdtempSync(`${tmpdir()}${path.sep}`);

// now copy
fs.cpSync(publicDirPath, tempDir, {
    recursive: true,
    filter: (source, destination) => {
        //console.log('filter:', {source, destination});
        return source !== versionsPath;
    }
});
fs.cpSync(tempDir, newVersionDirPath, {
    recursive: true
});
console.log('✔ copy public folder');

// update versions/index.html
const versionsIndexFile = path.resolve(versionsPath, 'index.html');
const versionsIndexContent = fs.readFileSync(versionsIndexFile).toString();
const searchString = `<div id="end"></div>`;
const replaceString = `<a href="./${version}">${version} (${new Date().toISOString().substring(0, 19)})</a>
<div id="end"></div>`;
const newIndexContent = versionsIndexContent.replace(searchString, replaceString);
fs.writeFileSync(versionsIndexFile, newIndexContent);
console.log('✔ update versions/index.html');

// commit + tag
try {
    //const currentBranch = execSync('git branch --show-current').toString().trim();
    const pullResult = execSync(`git pull`).toString().trim();
    const addResult = execSync(`git add ${newVersionDirPath}`).toString().trim();
    const commitResult = execSync(`git commit -m "generateTag ${version}"`).toString().trim();
    const tagResult = execSync(`git tag ${version}`).toString().trim();
    //const pushResult = execSync(`git push origin ${currentBranch}`).toString().trim();

    //console.log('tag data:', {pullResult, addResult, commitResult, tagResult});
    console.log('✔ create git tag');
}
catch(e) {
    console.log('✘ create git tag');
    console.log(e);
}
