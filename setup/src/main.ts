import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';
import axios from 'axios';


if (require.main === module) {
    main();
}

/**
    Setup sprkl function.
 */
async function main() {
    // get the input values from the action
    const sprklVersion = core.getInput('version');
    const analyze = core.getInput('analyze');
    const setEnv = core.getInput('setenv');
    const recipe = core.getInput('recipe');
    const eventName = github.context.eventName;


    // run sprkl install command
    const installCmd = `npx @sprkl/scripts@${sprklVersion} install`;
    await exec.exec(installCmd);

    if (recipe === 'auto') {
        const envVarsToSet = await autoRecipe(eventName);
        console.log(envVarsToSet);
        for (let [key, value] of envVarsToSet){
            core.exportVariable(key, value);
        }
    } else {
        // set sprkl recipe environment variable
        core.exportVariable('SPRKL_RECIPE', recipe);
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
}

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
    Return map of env vars to set depending on the workflow event(push, pull request or others).
 */
export async function autoRecipe(eventName: string): Promise<Map<string, string| number>> {
    // get the workflow json which include all the data about the workflow
    const workflowContext = JSON.parse(JSON.stringify(github.context.payload, undefined, 2));
    if (eventName === 'push') {
        return getPushEnvVarsOrFail(workflowContext);
    } else if (eventName === 'pull_request') {
        return await getPullRequestEnvVarsOrFail(workflowContext);
    } else {
        // return 'recent' recipe with last 10 commits
        let envVarsMap = new Map<string, string|number>();
        envVarsMap.set('SPRKL_RECIPE', 'recent');
        envVarsMap.set('SPRKL_RECIPE_ATTRIBUTES_AMOUNT', 10);
        return envVarsMap;
    }
}

/**
    Return map of env vars to instrument all the commits in the push event. Or fail.
 */
export function getPushEnvVarsOrFail(workflowContext: any): Map<string, string> {
    try {
        const commits = workflowContext.commits;
        let commitsIdsArray: string[] = [];
        for (var commit of commits) {
            commitsIdsArray.push(commit.id);
        }
        // return environment variables map for sprkl recipe
        let envVarsMap = new Map<string, string>();
        envVarsMap.set('SPRKL_RECIPE', 'commitsList');
        envVarsMap.set('SPRKL_COMMITS', commitsIdsArray.toString());
        return envVarsMap;
    } catch(error) {
        console.error(error);
        process.exit(1);
    }
    
}


/**
    Return map of env vars to instrument all the commits in the pull request event. Or fail.
 */
export async function getPullRequestEnvVarsOrFail(workflowContext: any): Promise<Map<string, string>> {
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
        // return environment variables map for sprkl recipe
        let envVarsMap = new Map<string, string>();
        envVarsMap.set('SPRKL_RECIPE', 'commitsList');
        envVarsMap.set('SPRKL_COMMITS', commitsIdsArray.toString());
        return envVarsMap;
    } catch(error) {
        console.error(error);
        process.exit(1);
    }
    
}

