import * as core from '@actions/core';
import * as exec from '@actions/exec';


/**
    Setup sprkl function
 */
(async () => {
    // get the input values from the action
    const SPRKL_VERSION = core.getInput('version');
    const ANALYZE = core.getInput('analyze');
    const SET_ENV = core.getInput('setenv');

    // run sprkl install command
    const InstallCmd = `npx @sprkl/scripts@${SPRKL_VERSION} install`;
    await exec.exec(InstallCmd);

    // run sprkl analysis if requested
    if (ANALYZE === 'true') {
        await exec.exec('sprkl apply');
    }

    // set sprkl environment if requested
    if (SET_ENV === 'true') {
        const SetEnvCmd = `SPRKL_PREFIX=$(sprkl config get prefix) && 
        "NODE_OPTIONS=-r @sprkl/sprkl" >> $GITHUB_ENV && 
        echo "SPRKL_PREFIX=$SPRKL_PREFIX" >> $GITHUB_ENV && 
        echo "NODE_PATH=$SPRKL_PREFIX/lib/node_modules" >> $GITHUB_ENV`;
        await exec.exec(SetEnvCmd);
    }
})();