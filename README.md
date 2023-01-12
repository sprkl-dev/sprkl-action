# sprkl-action

## Usage

Add the following step to make `sprkl` CLI available in your workflow:

```yaml
      - name: Sprkl Setup
        uses: sprkl-dev/sprkl-action/setup@master
        with:
          token: ${{ secrets.SPRKL_GITHUB_ACTIONS_TOKEN }}
```

Follow the [example action](https://github.com/sprkl-dev/use-sprkl/blob/main/.github/workflows/ci.yml) in sprkl microservices example repository.

## Access

In order to get an acces token, setup the [Sprkl Reviewer](https://github.com/marketplace/sprkl-reviewer) (GitHub Application).
