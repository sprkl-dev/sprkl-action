import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';
import axios from 'axios';
import type { WebhookPayload } from '@actions/github/lib/interfaces';

const SPRKL_RECIPES = ['auto', 'uncommitted', 'mine', 'recent', 'all', 'lastPush', 'commitsList'];
const PR_COMMITS_AMOUNT = 100;

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
    // get the workflow json which include all the data about the workflow
    const workflowPayload = github.context.payload;

    // validate the inputs from the action user(only analyze, setEnv and recipe. No vaildation for sprklVersion)
    validateInputOrFail(analyze, setEnv, recipe);

    // run sprkl install command
    const installCmd = `npx @sprkl/scripts@${sprklVersion} install`;
    await exec.exec(installCmd);

    if (recipe === 'auto') {
        // get environment variables to set based on the event(SPRKL_RECIPE and more env vars based on recipe)
        const envVarsToSet = await getRecipeEnv(eventName, workflowPayload);
        // set all the environment variables in the recieved list
        for (let [key, value] of envVarsToSet){
            core.exportVariable(key, value);
        }
    } else {
        // set sprkl recipe environment variable based on input
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
export async function getRecipeEnv(eventName: string, workflowPayload: WebhookPayload): Promise<Map<string, string | number>> {
    if (eventName === 'push' && workflowPayload.commits) {
        return getPushEnvVarsOrFail(workflowPayload);
    } else if (eventName === 'pull_request' && workflowPayload.pull_request) {
        return await getPullRequestEnvVarsOrFail(workflowPayload.pull_request.commits_url);
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
export function getPushEnvVarsOrFail(workflowPayload: WebhookPayload): Map<string, string> {
    try {
        const commits = workflowPayload.commits;
        const commitsIdsArray = commits.map((commit: { id: string; }) => commit.id);
        console.log(commitsIdsArray);
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
export async function getPullRequestEnvVarsOrFail(commitsListUrl: string): Promise<Map<string, string>> {
    // try to get the commits ids list of the pull request from the given Github API url
    try {
        const {data, } = await axios.get(commitsListUrl, {
            headers: {
            Accept: 'application/json',
            },
            params: {
                per_page: PR_COMMITS_AMOUNT
            },
        },);
        const commitsIdsArray = data.map((commit: { sha: string; }) => commit.sha);
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
    Validates the input from the action user
 */
function validateInputOrFail(analyze: string, setEnv: string, recipe: string) {
    if (!(['true', 'false'].includes(analyze))){
        throw new Error(`The input ${analyze} for the analyze param is not boolean`)
    } 
    if (!(['true', 'false'].includes(setEnv))){
        throw new Error(`The input ${analyze} for the analyze param is not boolean`)
    }
    if (!(SPRKL_RECIPES.includes(recipe))) {
        throw new Error(`The received recipe input: ${recipe} doesn't exist.
The available recipes are: ${SPRKL_RECIPES}`)
    }
}

