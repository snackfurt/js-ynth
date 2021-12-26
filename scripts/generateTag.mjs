import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import { execSync } from 'child_process';

const versionFile = path.resolve('./version.txt');
const versionFileContent = fs.readFileSync(versionFile).toString();
const versionParts = versionFileContent.split('.');
const newMinorVersion = parseInt(versionParts[1], 10) + 1;

if (isNaN(newMinorVersion)) {
    console.error('Error setting new version!', {versionFileContent});
}
else {
    // copy public folder except "versions" subdir
    const publicDirPath = path.resolve('./public');
    const versionsPath = path.resolve(publicDirPath, 'versions');
    const newVersion = `${versionParts[0]}.${newMinorVersion}`;

    console.log(`creating version ${newVersion}`);

    // create dir for new version, delete dir if it already exists
    const newVersionDirPath = path.resolve(`./public/versions/${newVersion}`);
    if (fs.existsSync(newVersionDirPath)) {
        fs.rmdirSync(newVersionDirPath, { recursive: true, force: true });
    }
    fs.mkdirSync(newVersionDirPath);

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

    // store new version in versions.txt file
    fs.writeFileSync(versionFile, newVersion);

    // update versions/index.html
    const versionsIndexFile = path.resolve(versionsPath, 'index.html');
    const versionsIndexContent = fs.readFileSync(versionsIndexFile).toString();
    const searchString = `<div id="end"></div>`;
    const replaceString = `<a href="./${newVersion}">${newVersion}</a>
    <div id="end"></div>`;
    const newIndexContent = versionsIndexContent.replace(searchString, replaceString);
    fs.writeFileSync(versionsIndexFile, newIndexContent);

    // commit + tag
    try {
        //const currentBranch = execSync('git branch --show-current').toString().trim();
        const commitResult = execSync(`git commit -m "generateTag ${newVersion}"`).toString().trim();
        const tagResult = execSync(`git tag ${newVersion}`).toString().trim();
        //const pushResult = execSync(`git push origin ${currentBranch}`).toString().trim();

        console.log('tag data:', {tagResult, commitResult});
    }
    catch(e) {
        console.log('Error while tagging:', e);
    }
}
