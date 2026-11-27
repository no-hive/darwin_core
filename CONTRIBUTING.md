# Contributing

Use English for code, comments, documentation, and commit messages.

## Commits

Use the format `type(scope): description`, with an imperative description and a first line no longer than 72 characters. For example: `fix(app): correct article preview`.

Supported types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, and `revert`. Use `!` after the scope for breaking changes and explain them in the commit body.

Each commit covers one scope: `web`, `app`, `tools`, `studio`, `score-as-a-service`, `main-protocol`, `agora-governor-fork`, `docs`, or `repo` for repository-wide configuration. Split work touching multiple scopes into separate commits. Review the staged changes to verify the scope: the message hook validates the format, not the meaning of the changes.

Enable the local commit hook and template after cloning:

```sh
git config --local core.hooksPath .githooks
git config --local commit.template .gitmessage
```

## Development

See [local development](frontend/web/README-LOCAL.md) for the site build. Published blog articles are managed in Sanity, not in the repository.

## Licensing

Code is distributed under the [MIT License](LICENSE). Original project images are subject to the separate [image license](IMAGE-LICENSE.md). Third-party dependencies and assets retain their own licenses.
