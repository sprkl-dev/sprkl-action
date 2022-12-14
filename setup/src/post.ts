import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';
import {existsSync, readFileSync} from 'fs';
/**
 Push sprkl state to CI platfrom at the end of the job
 */
(async () => {
    // get the input values from the action
    const token = core.getInput('token');
    const githubRepository = `${github.context.repo.owner}/${github.context.repo.repo}`
    const githubRunId = github.context.runId
    const headSha = getHeadCommitSha();

    // push sprkl state to CI platfrom (dashboard, snapshot and sysgraph)
    const sprklPushStateCmd = `sprkl ci push --token=${token} --repository=${githubRepository} --run=${githubRunId} --headSha=${headSha}`

    await exec.exec(sprklPushStateCmd);
})();

function getHeadCommitSha(): string {
    const eventPath = process.env['GITHUB_EVENT_PATH']!;
    if(!eventPath){
        console.log('[Sprkl Action]: GITHUB_EVENT_PATH is missing, using GITHUB_SHA instead');
        return github.context.sha;
    }

    if(!existsSync(eventPath)) {
        console.log(`[Sprkl Action]: Event path ${eventPath} is not exists, using GITHUB_SHA instead`);
        return github.context.sha;
    }

    try{
        const eventData = readFileSync(eventPath, {flag: 'r', encoding: 'utf-8'});
        const event = JSON.parse(eventData)
        return event.pull_request.head.sha!;
    }catch(e) {
        console.log(`[Sprkl Action]: Could not read & parse github event from ${eventPath}, using GITHUB_SHA instead. ${e}`);
        return github.context.sha;
    }

}
