# Sprkl Action


Further documentation and guidelines are maintained on our [docs](https://docs.sprkl.dev/documentations/sprkl-for-github-actions).
## Usage

### Setup Sprkl in your workflow

Add the following step to make [Sprkl CLI](https://docs.sprkl.dev/documentations/getting-started/instrument-your-code) available in your workflow:

```yaml
      - name: Sprkl Setup
        uses: sprkl-dev/sprkl-action/setup@master
        with:
          token: ${{ secrets.SPRKL_GITHUB_ACTIONS_TOKEN }}
```
Since Sprkl analyzes your git history ([Why?](https://docs.sprkl.dev/documentations/concepts)) during the workflow, so make sure to include it in your action by setting `fetch-depth: 0` in [actions/checkout](https://github.com/actions/checkout):
```yaml
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
          
      - name: Sprkl Setup
        uses: sprkl-dev/sprkl-action/setup@master
        with:
          token: ${{ secrets.SPRKL_GITHUB_ACTIONS_TOKEN }}

```

Follow the [example action](https://github.com/sprkl-dev/use-sprkl/blob/ci/.github/workflows/ci.yml) in sprkl microservices example repository.

## Access

In order to get an acces token, setup the [Sprkl Reviewer](https://github.com/marketplace/sprkl-reviewer) (GitHub Application).
