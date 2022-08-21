import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';

(async () => {

    const TOKEN = core.getInput('token');
    const GITHUB_REPOSITORY = github.context.repo
    const GITHUB_RUN_ID = github.context.runId
    const sprklPushCmd = `sprkl ci push --token=${TOKEN} --repository=${GITHUB_REPOSITORY} --run=${GITHUB_RUN_ID}`

    await exec.exec(sprklPushCmd, [], {});
})();