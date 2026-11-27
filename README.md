# Darwin Core

Darwin Core is a monorepo for the Darwin Core Protocol website, application,
tools, content studio, and smart-contract modules.

## Repository structure

| Directory | Role | Commit scopes |
| --- | --- | --- |
| `frontend/` | Navigation group for public product interfaces. | `web`, `app`, `tools`, `studio` |
| `frontend/web/` | Public website, blog, and static delivery build. | `web` |
| `frontend/app/` | Interactive React application. | `app` |
| `frontend/tools/` | Browser-based data tools. | `tools` |
| `frontend/studio/` | Sanity Studio. | `studio` |
| `contracts/` | Navigation group for independent Foundry projects. | Module-specific scopes below |
| `contracts/score-as-a-service/` | Score-as-a-Service Foundry project. | `score-as-a-service` |
| `contracts/main-protocol/` | Darwin Core Protocol Foundry project. | `main-protocol` |
| `contracts/agora-governor-fork/` | Agora Governor fork Foundry project. | `agora-governor-fork` |
| `docs/` | Project documentation. | `docs` |
| `packages/` | Shared packages. | `repo` until a package has its own scope |

`frontend/` and `contracts/` are organizational groups for navigation. They do
not define commit boundaries. Each commit uses the scope of the concrete module
it changes.

Source code is available under the [MIT License](LICENSE). Original project
images are available under the [image license](IMAGE-LICENSE.md).
