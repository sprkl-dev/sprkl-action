import nock from 'nock'
import * as github from "@actions/github";
import {
  getRecipeEnv,
  getPullRequestEnvVarsOrFail,
  getPushEnvVarsOrFail,
  PR_COMMITS_AMOUNT_LIMIT
} from "./main";

const TEST_PR_NUMBER = 2;
const GITHUB_TOKEN = '123456';

// Set the github repo env var for the github.context usage in the tests
process.env.GITHUB_REPOSITORY = 'testOwner/testRepo';

// Create a mock response for the PR commits request to Github API
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const githubAPIMock = nock('https://api.github.com').persist().get(`/repos/${github.context.repo.owner}/${github.context.repo.repo}/pulls/${TEST_PR_NUMBER}/commits?per_page=${PR_COMMITS_AMOUNT_LIMIT}`).reply(200, [{ sha: "a" }, { sha: "b" }, { sha: "c" }])

describe("getRecipeEnv function tests", () => {
  it("push event", async () => {
    const eventName = "push";
    const workflowPayload = {
      commits: [{ id: "a" }, { id: "b" }, { id: "c" }],
    };
    const result = await getRecipeEnv(eventName, workflowPayload, GITHUB_TOKEN);
    const expectedResult = new Map(
      Object.entries({ SPRKL_RECIPE: "commitsList", SPRKL_COMMITS: "a,b,c" })
    );
    expect(result).toMatchObject(expectedResult);
  });

  it("pull request event", async () => {
    const eventName = "pull_request";
    const workflowPayload = {
      pull_request: { number: TEST_PR_NUMBER },
    };
    const result = await getRecipeEnv(eventName, workflowPayload, GITHUB_TOKEN);
    const expectedResult = new Map(
      Object.entries({ SPRKL_RECIPE: "commitsList", SPRKL_COMMITS: "a,b,c" })
    );
    expect(result).toMatchObject(expectedResult);
  });

  it("other event example", async () => {
    const eventName = "pull_request_review";
    const workflowPayload = {};
    const result = await getRecipeEnv(eventName, workflowPayload, GITHUB_TOKEN);
    const expectedResult = new Map(
      Object.entries({
        SPRKL_RECIPE: "recent",
        SPRKL_RECIPE_ATTRIBUTES_AMOUNT: 10,
      })
    );
    expect(result).toMatchObject(expectedResult);
  });
});

describe("Events functions tests", () => {
  it("getPushEnvVarsOrFail function", () => {
    const workflowPayload = {
      commits: [{ id: "a" }, { id: "b" }, { id: "c" }],
    };
    const result = getPushEnvVarsOrFail(workflowPayload);
    const expectedResult = new Map(
      Object.entries({ SPRKL_RECIPE: "commitsList", SPRKL_COMMITS: "a,b,c" })
    );
    expect(result).toMatchObject(expectedResult);
  });

  it("getPullRequestEnvVarsOrFail function", () => {
    const result = getPullRequestEnvVarsOrFail(GITHUB_TOKEN, TEST_PR_NUMBER);
    const expectedResult = new Map(
      Object.entries({ SPRKL_RECIPE: "commitsList", SPRKL_COMMITS: "a,b,c" })
    );
    expect(result).toMatchObject(expectedResult);
  });
});
