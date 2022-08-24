import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';
import axios from 'axios';


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
        EventHandler();
        await exec.exec('sprkl apply');
    }

    // set sprkl environment if requested
    if (setEnv === 'true') {
        const sprklPrefix = await getSprklPrefixOrFail();

        core.exportVariable('SPRKL_PREFIX', sprklPrefix);
        core.exportVariable('NODE_OPTIONS','-r @sprkl/obs');
        core.exportVariable('NODE_PATH', `${sprklPrefix}/lib/node_modules`)
    }
})();

/**
    Returns sprkl prefix
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

// async function runCommandOrFail(command:string): Promise<string> {
//     let myOutput = '';
//     let myError = '';

//     // set listeners for the command exec
//     const listeners = {
//     stdout: (data: Buffer) => {
//         myOutput += data.toString();
//     },
//     stderr: (data: Buffer) => {
//         myError += data.toString();
//     }
//     };

//     await exec.exec(command, [], {listeners: listeners});

//     // return the command output if the command ran successfully 
//     if (myError.length == 0) {
//         return myOutput;
//     } else {
//         throw new Error(myError);
//     }
// }

async function EventHandler() {
    const eventName = github.context.eventName;
    const workflowContext = JSON.parse(JSON.stringify(github.context.payload, undefined, 2));

    if (eventName === 'push') {
        const commits = workflowContext.commits;
        let commitsIdsArray: string[] = [];
        for (var commit of commits) {
            commitsIdsArray.push(commit.id);
        }
        console.log(`Commits: ${commitsIdsArray}`);
    } 
    else if (eventName === 'pull_request') {
        const commitsListLink = workflowContext.pull_request.commits_url;
        getPullRequestCommits(commitsListLink);
    } else {
        getLastCommitsInRepo();
    }
}

async function getPullRequestCommits(url: string) {
    const {data, status} = await axios.get(url, {
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
        console.log(`status: ${status}`);
        console.log(`number of commits: ${commitsIdsArray.length}`);
        console.log(`Commits: ${commitsIdsArray}`);  
}

async function getLastCommitsInRepo() {
    const repoOwner = github.context.repo.owner;
    const repo = github.context.repo.repo
    const url = `https://api.github.com/repos/${repoOwner}/${repo}/commits`
    const {data, status} = await axios.get(url, {
        headers: {
          Accept: 'application/json',
        },
        params: {
            per_page: 10,
            sha: ''
        },
      },);
      const commits = JSON.parse(JSON.stringify(data));
      console.log(commits);
      let commitsIdsArray: string[] = [];
        for (var commit of commits) {
            commitsIdsArray.push(commit.sha);
        }
        console.log(`status: ${status}`);
        console.log(`number of commits: ${commitsIdsArray.length}`);
        console.log(`Commits: ${commitsIdsArray}`);  
}

