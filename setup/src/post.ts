import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';

/**
 Push sprkl state to CI platfrom at the end of the job
 */
(async () => {
    // get the input values from the action
    const token = core.getInput('token');
    const githubRepository = `${github.context.repo.owner}/${github.context.repo.repo}`
    const githubRunId = github.context.runId
    const headSha = github.context.sha

    // push sprkl state to CI platfrom
    const sprklPushCmd = `sprkl ci push data --token=${token} --repository=${githubRepository} --run=${githubRunId}`
    await exec.exec(sprklPushCmd);

    // push sprkl dashboard to CI platform
    const sprklPushDashboardCmd = `sprkl ci push dashboard --token=${token} --repository=${githubRepository} --run=${githubRunId} --headSha=${headSha}`
    await exec.exec(sprklPushDashboardCmd);
})();
