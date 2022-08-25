import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';
import axios from 'axios';


/**
    Setup sprkl function.
 */
(async () => {
    // get the input values from the action
    const sprklVersion = core.getInput('version');
    const analyze = core.getInput('analyze');
    const setEnv = core.getInput('setenv');
    const recipe = core.getInput('recipe');

    // set sprkl recipe environment variable, by default if there isn't input, the recipe is commitsList
    core.exportVariable('SPRKL_RECIPE', recipe);

    // run sprkl install command
    const installCmd = `npx @sprkl/scripts@${sprklVersion} install`;
    await exec.exec(installCmd);

    if (recipe === 'commitsList') {
        // get commits list string for analysis
        const commitsListString = await createCommitsList();
        // export environment variables for commitsList recipe 
        core.exportVariable('SPRKL_COMMITS', commitsListString);
    }
    
    // run sprkl analysis if requested
    if (analyze === 'true') {
        await exec.exec('sprkl apply');
    }

    // set sprkl environment if requested
    if (setEnv === 'true') {
        const sprklPrefix = await getSprklPrefixOrFail();

        core.exportVariable('SPRKL_PREFIX', sprklPrefix);
        core.exportVariable('NODE_OPTIONS','-r @sprkl/obs');
        core.exportVariable('NODE_PATH', `${sprklPrefix}/lib/node_modules`);
    }
})();

/**
    Returns sprkl prefix.
 */
async function getSprklPrefixOrFail(): Promise<string> {
    const command = 'sprkl config get prefix';
    let myOutput = '';
    let myError = '';

    // set listeners for the command exec
    const listeners = {
    stdout: (data: Buffer) => {
        myOutput += data.toString();
    },
    stderr: (data: Buffer) => {
        myError += data.toString();
    }
    };

    await exec.exec(command, [], {listeners: listeners});

    // return the command output if the command ran successfully 
    if (myError.length == 0) {
        return myOutput.trim();
    } else {
        throw new Error(myError);
    }
}

/**
    Returns commits list string depending on the workflow event(push, pull request or others).
 */
async function createCommitsList(): Promise<string> {
    const eventName = github.context.eventName;
    // get the workflow json which include all the data about the workflow
    const workflowContext = JSON.parse(JSON.stringify(github.context.payload, undefined, 2));

    if (eventName === 'push') {
        return getPushCommitsOrFail(workflowContext);
    } else if (eventName === 'pull_request') {
        return await getPullRequestCommitsOrFail(workflowContext);
    } else {
        return await getLastCommitsOrFail();
    }
}

/**
    Returns commits list string of all the commits in a push event. Or fail.
 */
function getPushCommitsOrFail(workflowContext: any): string {
    try {
        const commits = workflowContext.commits;
        let commitsIdsArray: string[] = [];
        for (var commit of commits) {
            commitsIdsArray.push(commit.id);
        }
        return commitsIdsArray.toString();
    } catch(error) {
        console.error(error);
        process.exit(1);
    }
    
}


/**
    Returns commits list string of all the commits in a pull request event. Or fail.
 */
async function getPullRequestCommitsOrFail(workflowContext: any): Promise<string> {
    const commitsListLink = workflowContext.pull_request.commits_url;
    // try to get the commits ids list of the pull request from the given Github API url
    try {
        const {data, } = await axios.get(commitsListLink, {
            headers: {
              Accept: 'application/json',
            },
            params: {
                per_page: 100
            },
          },);
        const commits = JSON.parse(JSON.stringify(data));
        let commitsIdsArray: string[] = [];
        for (var commit of commits) {
            commitsIdsArray.push(commit.sha);
        }
        return commitsIdsArray.toString();
    } catch(error) {
        console.error(error);
        process.exit(1);
    }
    
}

/**
    Returns commits list string of the last 10 commits on the master branch. Or fail.
    This option is the default for all the events that aren't push or pull request.
 */
async function getLastCommitsOrFail(): Promise<string> {
    const repoOwner = github.context.repo.owner;
    const repo = github.context.repo.repo
    const url = `https://api.github.com/repos/${repoOwner}/${repo}/commits`
    // try to get the last 10 commits on the master branch from Github API
    try {
        const {data, } = await axios.get(url, {
            headers: {
              Accept: 'application/json',
            },
            params: {
                per_page: 10
            },
          },);
        const commits = JSON.parse(JSON.stringify(data));
        let commitsIdsArray: string[] = [];
        for (var commit of commits) {
            commitsIdsArray.push(commit.sha);
        }
        return commitsIdsArray.toString();
    } catch(error) {
        console.error(error);
        process.exit(1);
    }
}

