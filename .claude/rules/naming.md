# Naming

| Thing                       | Rule                                     | Example                                                      |
| --------------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| Files and folders           | kebab-case                               | `health-status.tsx`, `use-health.ts`, `health.service.ts`    |
| React components            | PascalCase                               | `HealthStatus`, `HealthContainer`                            |
| Containers                  | PascalCase ending in `Container`         | `ReportContainer`                                            |
| Hooks                       | `useX`                                   | `useHealth`                                                  |
| zod schemas                 | `xSchema` (camelCase)                    | `healthResponseSchema`                                       |
| Types                       | `X` (PascalCase), no `I` prefix          | `HealthResponse`, not `IHealthResponse`                      |
| Type inferred from a schema | same name without `Schema`               | `type HealthResponse = z.infer<typeof healthResponseSchema>` |
| API module files            | `<feature>.<role>.ts`                    | `reports.routes.ts`, `reports.repo.ts`                       |
| Hono route instance         | `<feature>Routes`                        | `healthRoutes`                                               |
| Constants                   | camelCase; UPPER_SNAKE only for env keys | `maxUploadBytes`, `DEV_USER_ID`                              |

Exports:

- Use named exports only. Default exports are allowed only in route files, shadcn files in `components/ui/`, and tool config files (`*.config.ts`, `*.config.js`).
- ESLint `import/no-default-export` enforces this inside `src/`.
