import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';

/**
 Push sprkl state to CI platfrom at the end of the job
 */
(async () => {
    // get the input values from the action
    const TOKEN = core.getInput('token');
    const GITHUB_REPOSITORY = `${github.context.repo.owner}/${github.context.repo.repo}`
    const GITHUB_RUN_ID = github.context.runId

    // push sprkl state to CI platfrom
    const sprklPushCmd = `sprkl ci push --token=${TOKEN} --repository=${GITHUB_REPOSITORY} --run=${GITHUB_RUN_ID}`
    await exec.exec(sprklPushCmd);
})();