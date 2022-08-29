jest.mock('axios', () => {
    return {
        get: async (url: string, config:any) => {
            const commits = [{sha: 'a'}, {sha: 'b'}, {sha: 'c'}];
            return {data: commits}
    }
    }
});

import {autoRecipe, getPullRequestEnvVarsOrFail, getPushEnvVarsOrFail} from './main';

describe('autoRecipe function tests', ()=>{
    jest.spyOn(global.JSON, 'parse').mockImplementationOnce((_: string) => {
        let workflowContextObj = {commits: [{id: 'a'}, {id: 'b'}, {id: 'c'}]};
        return workflowContextObj;
    });

    it('test push event', async () => {
        const eventName = 'push';
        const result = await autoRecipe(eventName);
        const expectedResult = new Map(Object.entries({SPRKL_RECIPE: "commitsList", SPRKL_COMMITS: "a,b,c"}));
        expect(result).toMatchObject(expectedResult);
    });

    jest.spyOn(global.JSON, 'parse').mockImplementationOnce((_: string) => {
        let workflowContextObj = {pull_request: {commits_url: 'url'}};
        return workflowContextObj;
    });


    it('test pull request event', async () => {
        const eventName = 'pull_request';
        const result = await autoRecipe(eventName);
        const expectedResult = new Map(Object.entries({SPRKL_RECIPE: "commitsList", SPRKL_COMMITS: "a,b,c"}));
        expect(result).toMatchObject(expectedResult);
    });

    it('test other event example', async () => {
        const eventName = 'pull_request_review';
        const result = await autoRecipe(eventName);
        const expectedResult = new Map(Object.entries({SPRKL_RECIPE: "recent", SPRKL_RECIPE_ATTRIBUTES_AMOUNT: 10}));
        expect(result).toMatchObject(expectedResult);
    });
});

it('test getPushEnvVarsOrFail function', () => {
    const workflowContextObj = {commits: [{id: 'a'}, {id: 'b'}, {id: 'c'}]};
    const result = getPushEnvVarsOrFail(workflowContextObj);
    const expectedResult = new Map(Object.entries({SPRKL_RECIPE: "commitsList", SPRKL_COMMITS: "a,b,c"}));
    expect(result).toMatchObject(expectedResult);
});

it('test getPullRequestEnvVarsOrFail function', () => {
    let workflowContextObj = {pull_request: {commits_url: 'url'}};
    const result = getPullRequestEnvVarsOrFail(workflowContextObj);
    const expectedResult = new Map(Object.entries({SPRKL_RECIPE: "commitsList", SPRKL_COMMITS: "a,b,c"}));
    expect(result).toMatchObject(expectedResult);
});


