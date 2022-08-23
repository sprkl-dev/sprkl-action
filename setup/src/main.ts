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
        const setEnvCmd = `SPRKL_PREFIX=$(sprkl config get prefix) && 
        "NODE_OPTIONS=-r @sprkl/sprkl" >> $GITHUB_ENV && 
        echo "SPRKL_PREFIX=$SPRKL_PREFIX" >> $GITHUB_ENV && 
        echo "NODE_PATH=$SPRKL_PREFIX/lib/node_modules" >> $GITHUB_ENV`;
        await exec.exec(setEnvCmd);
    }
})();