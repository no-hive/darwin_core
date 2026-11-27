# Contracts

This directory contains independent Foundry projects. Each project has its own
dependencies, build output, tests, and Conventional Commit scope.

| Directory | Commit scope | Purpose |
| --- | --- | --- |
| `score-as-a-service/` | `score-as-a-service` | Score-as-a-Service contracts. |
| `main-protocol/` | `main-protocol` | Darwin Core Protocol contracts. |
| `agora-governor-fork/` | `agora-governor-fork` | Agora Governor fork and adaptations. |

Run Foundry commands from the module directory, for example:

```sh
cd contracts/main-protocol
forge build
forge test
```
