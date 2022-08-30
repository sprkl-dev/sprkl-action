import axios from "axios";
import {
  getRecipeEnv,
  getPullRequestEnvVarsOrFail,
  getPushEnvVarsOrFail,
} from "./main";

const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("axios", () => ({
  ...jest.requireActual("axios"),
  get: jest.fn(),
}));

describe("getRecipeEnv function tests", () => {
  beforeEach(() => jest.resetAllMocks());
  it("push event", async () => {
    const eventName = "push";
    const workflowPayload = {
      commits: [{ id: "a" }, { id: "b" }, { id: "c" }],
    };
    const result = await getRecipeEnv(eventName, workflowPayload);
    const expectedResult = new Map(
      Object.entries({ SPRKL_RECIPE: "commitsList", SPRKL_COMMITS: "a,b,c" })
    );
    expect(result).toMatchObject(expectedResult);
  });

  it("pull request event", async () => {
    const eventName = "pull_request";
    const workflowPayload = {
      pull_request: { commits_url: "url", number: 10 },
    };
    // set mock for the get function of axios
    mockedAxios.get.mockImplementation(async (url: string, config: any) => {
      const commits = [{ sha: "a" }, { sha: "b" }, { sha: "c" }];
      return { data: commits };
    });
    const result = await getRecipeEnv(eventName, workflowPayload);
    const expectedResult = new Map(
      Object.entries({ SPRKL_RECIPE: "commitsList", SPRKL_COMMITS: "a,b,c" })
    );
    expect(result).toMatchObject(expectedResult);
  });

  it("other event example", async () => {
    const eventName = "pull_request_review";
    const workflowPayload = {};
    const result = await getRecipeEnv(eventName, workflowPayload);
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
  beforeEach(() => jest.resetAllMocks());
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
    const commitsListUrl = "url";
    // set mock for the get function of axios
    mockedAxios.get.mockImplementation(async (url: string, config: any) => {
      const commits = [{ sha: "a" }, { sha: "b" }, { sha: "c" }];
      return { data: commits };
    });
    const result = getPullRequestEnvVarsOrFail(commitsListUrl);
    const expectedResult = new Map(
      Object.entries({ SPRKL_RECIPE: "commitsList", SPRKL_COMMITS: "a,b,c" })
    );
    expect(result).toMatchObject(expectedResult);
  });
});
