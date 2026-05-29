# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 16 application for a shared household expense book. Application routes live in `src/app`, API endpoints are under `src/app/api`, reusable UI components are in `src/components`, and server-side helpers, validation, repository access, and tests are in `src/lib`. Global styles are in `src/app/globals.css`. Deployment files are at the repository root: `Dockerfile`, `docker-compose.example.yml`, `.dockerignore`, and `.env.example`. Product and implementation notes are kept in `DESIGN.md`, `README.md`, and `docs/`.

## Build, Test, and Development Commands

- `npm run dev`: start the local Next.js development server.
- `npm run build`: create a production build and catch compile-time issues.
- `npm run start`: run the built production server.
- `npm run lint`: run ESLint checks.
- `npm test`: run the Vitest test suite.
- `docker build -t paybook:local .`: build the deployable container image.

## Coding Style & Naming Conventions

Use TypeScript with React functional components. Keep indentation at two spaces and prefer small, explicit functions over broad utility modules. Component files use PascalCase, such as `Dashboard.tsx`; library modules use lower camel case or domain nouns, such as `repository.ts` and `validation.ts`. Keep API route logic thin and place reusable database, auth, date, and validation behavior in `src/lib`.

## Testing Guidelines

Vitest is used for unit tests. Place tests next to the module they cover using the `*.test.ts` naming pattern, for example `src/lib/month.test.ts`. Add tests for validation, date calculations, auth/session logic, and repository behavior when changing those areas. Run `npm test`, `npm run lint`, and `npm run build` before committing.

## Commit & Pull Request Guidelines

There is no established Git history yet. Use short conventional-style commit messages, for example `feat: bootstrap paybook MVP` or `fix: validate expense amount`. Pull requests should include a concise summary, verification commands run, linked issues when available, and screenshots for visible UI changes.

## Security & Configuration Tips

Do not commit `.env.local` or real credentials. Configure deployment through environment variables: `DATABASE_URL`, `PAYBOOK_PIN`, and `PAYBOOK_SESSION_SECRET`. Use `.env.example` and `docker-compose.example.yml` as templates, then inject real values only on the deployment host.
