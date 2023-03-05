import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as github from "@actions/github";
import type { WebhookPayload } from "@actions/github/lib/interfaces";

// commitsList recipe isn't here because the user of the action cannot define the list of commits
const POSSIBLE_INPUT_RECIPES = [
  "auto",
  "uncommitted",
  "mine",
  "recent",
  "all",
  "lastPush",
];

const GITHUB_ACTION_ID = "xghaction"

interface Inputs {
  sprklVersion: string;
  analyze: string;
  setEnv: string;
  recipe: string;
  analysisCwd: string;
  githubToken: string;
}
//amount limit of commits to ask from the github api
export const PR_COMMITS_AMOUNT_LIMIT = 100;

type ClientType = ReturnType<typeof github.getOctokit>;

if (require.main === module) {
  main();
}

/**
    Setup sprkl function.
 */
async function main() {
  // get the input values from the action and make the InputsObj
  const inputsObj: Inputs = {
    sprklVersion: core.getInput("version"),
    analyze: core.getInput("analyze"),
    setEnv: core.getInput("setenv"),
    recipe: core.getInput("recipe"),
    analysisCwd: core.getInput("analysisCwd"),
    githubToken: core.getInput("githubToken"),
  };
  const eventName = github.context.eventName;
  // Get the workflow json which include all the data about the workflow
  const workflowPayload = github.context.payload;

  // Validate the inputs from the action user(only analyze, setEnv and recipe. No vaildation for sprklVersion and analysisCwd)
  validateInputOrFail(inputsObj);

  // Run sprkl install command
  const installCmd = `npx @sprkl/scripts@${inputsObj.sprklVersion} install --id=${GITHUB_ACTION_ID} --rewrite-global-links=true --docker-enable=true`;
  await exec.exec(installCmd);

  if (inputsObj.recipe === "auto") {
    // Get environment variables to set based on the event(SPRKL_RECIPE and more env vars based on recipe)
    const envVarsToSet = await getRecipeEnv(eventName, workflowPayload, inputsObj.githubToken);
    // Set all the environment variables in the recieved list
    for (const [key, value] of envVarsToSet) {
      core.exportVariable(key, value);
    }
  } else {
    // Set sprkl recipe environment variable based on input
    core.exportVariable("SPRKL_RECIPE", inputsObj.recipe);
  }

  // Run sprkl analysis if requested
  if (inputsObj.analyze === "true") {
    if (inputsObj.analysisCwd === "") {
      await exec.exec("sprkl apply");
    } else {
      await exec.exec("sprkl apply", [], { cwd: inputsObj.analysisCwd });
    }
  }

  // Set sprkl environment if requested
  if (inputsObj.setEnv === "true") {
    const sprklPrefix = await getSprklPrefixOrFail();

    core.exportVariable("SPRKL_PREFIX", sprklPrefix);
    core.exportVariable("NODE_OPTIONS", "-r @sprkl/obs");
    core.exportVariable("NODE_PATH", `${sprklPrefix}/lib/node_modules`);
  }
}

/**
    Returns sprkl prefix.
 */
async function getSprklPrefixOrFail(): Promise<string> {
  const command = "sprkl config get prefix";
  let myOutput = "";
  let myError = "";

  // Set listeners for the command exec
  const listeners = {
    stdout: (data: Buffer) => {
      myOutput += data.toString();
    },
    stderr: (data: Buffer) => {
      myError += data.toString();
    },
  };

  await exec.exec(command, [], { listeners: listeners });

  // Return the command output if the command ran successfully
  if (myError.length == 0) {
    return myOutput.trim();
  } else {
    throw new Error(myError);
  }
}

/**
    Return map of env vars to set depending on the workflow event(push, pull request or others).
 */
export async function getRecipeEnv(
  eventName: string,
  workflowPayload: WebhookPayload,
  githubToken: string
): Promise<Map<string, string | number>> {
  if (eventName === "push" && workflowPayload.commits) {
    return getPushEnvVarsOrFail(workflowPayload);
  } else if (eventName === "pull_request" && workflowPayload.pull_request) {
    return await getPullRequestEnvVarsOrFail(githubToken, workflowPayload.pull_request.number);
  } else {
    // Return 'recent' recipe with last 10 commits
    const envVarsMap = new Map<string, string | number>();
    envVarsMap.set("SPRKL_RECIPE", "recent");
    envVarsMap.set("SPRKL_RECIPE_ATTRIBUTES_AMOUNT", 10);
    return envVarsMap;
  }
}

/**
    Return map of env vars to instrument all the commits in the push event. Or fail.
 */
export function getPushEnvVarsOrFail(
  workflowPayload: WebhookPayload
): Map<string, string> {
  try {
    const commits = workflowPayload.commits;
    const commitsIdsArray = commits.map((commit: { id: string }) => commit.id);
    // Return environment variables map for sprkl recipe
    const envVarsMap = new Map<string, string>();
    envVarsMap.set("SPRKL_RECIPE", "commitsList");
    envVarsMap.set("SPRKL_COMMITS", commitsIdsArray.toString());
    return envVarsMap;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

/**
    Return map of env vars to instrument all the commits in the pull request event. Or fail.
 */
export async function getPullRequestEnvVarsOrFail(
  githubToken: string,
  prNumber: number
): Promise<Map<string, string>> {
  // Create github octokit client using the github token input
  const githubClient: ClientType = github.getOctokit(githubToken);

  try {
    // Try to get the commits ids list of the pull request using the github client
    const { data } = await githubClient.rest.pulls.listCommits({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: prNumber,
      per_page: PR_COMMITS_AMOUNT_LIMIT,
    })

    const commitsIdsArray = data.map((commit: { sha: string }) => commit.sha);
    // Return environment variables map for sprkl recipe
    const envVarsMap = new Map<string, string>();
    envVarsMap.set("SPRKL_RECIPE", "commitsList");
    envVarsMap.set("SPRKL_COMMITS", commitsIdsArray.toString());
    return envVarsMap;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

/**
    Validates the input from the action user
 */
function validateInputOrFail(inputsObj: Inputs) {
  if (!["true", "false"].includes(inputsObj.analyze)) {
    throw new Error(
      `The input ${inputsObj.analyze} for the analyze param is not boolean`
    );
  }
  if (!["true", "false"].includes(inputsObj.setEnv)) {
    throw new Error(
      `The input ${inputsObj.analyze} for the analyze param is not boolean`
    );
  }
  if (inputsObj.githubToken.length == 0) {
    throw new Error(
      "Can't continue without valid Github token"
    );
  }
  // TODO: maybe give the user an option to input commitsList in the action
  if (inputsObj.recipe === "commitsList") {
    throw new Error(`The received recipe input: ${inputsObj.recipe} isn't possible.
The available recipes are: ${POSSIBLE_INPUT_RECIPES}`);
  }
  // TODO: do this validation in the CLI(currently falling back to dafualt)
  if (!POSSIBLE_INPUT_RECIPES.includes(inputsObj.recipe)) {
    throw new Error(`The received recipe input: ${inputsObj.recipe} doesn't exist.
The available recipes are: ${POSSIBLE_INPUT_RECIPES}`);
  }
}
