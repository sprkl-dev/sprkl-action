import * as core from '@actions/core';
import * as exec from '@actions/exec';


/**
    Setup sprkl function
 */
(async () => {
    // get the input values from the action
    const sprklVersion = core.getInput('version');
    const analyze = core.getInput('analyze');
    const setEnv = core.getInput('setenv');

    // run sprkl install command
    const installCmd = `npx @sprkl/scripts@${sprklVersion} install`;
    await exec.exec(installCmd);

    // run sprkl analysis if requested
    if (analyze === 'true') {
        await exec.exec('sprkl apply');
    }

    // set sprkl environment if requested
    if (setEnv === 'true') {
        const sprklPrefix = await getSprklPrefix();
        console.log(sprklPrefix);

        core.exportVariable('SPRKL_PREFIX', sprklPrefix);
        core.exportVariable('NODE_OPTIONS','-r @sprkl/obs');
        core.exportVariable('NODE_PATH', `${sprklPrefix}/lib/node_modules`)
    }
})();

/**
    Returns sprkl prefix
 */
async function getSprklPrefix(): Promise<string> {
    let myOutput = '';
    let myError = '';

    const listeners = {
    stdout: (data: Buffer) => {
        myOutput += data.toString();
    },
    stderr: (data: Buffer) => {
        myError += data.toString();
    }
    };

    await exec.exec('sprkl config get prefix', [], {listeners: listeners});

    if (myError.length == 0) {
        return myOutput;
    } else {
        throw new Error(myError);
    }
}