# Changelog

## [0.2.0](https://github.com/altad3005/ardoise/compare/ardoise-v0.1.0...ardoise-v0.2.0) (2026-10-15)


### Features

* **identity:** add user registration use case ([daee27c](https://github.com/altad3005/ardoise/commit/daee27cf5fd6fb2ac656a71fbbaf6a1a26465f3b))
* **identity:** add users table and Prisma repository ([0b5c42e](https://github.com/altad3005/ardoise/commit/0b5c42e9c32b9216e52f615bcf84f20614fd1538))
* **identity:** expose user registration endpoint with rate limiting ([4c813c5](https://github.com/altad3005/ardoise/commit/4c813c5d5ceffe9111627795224620b2e4869c26))
* **identity:** hash passwords with Argon2id ([fcd031a](https://github.com/altad3005/ardoise/commit/fcd031ab78f109208b772fab8b8c371958e02907))
* **web:** add registration page ([6489340](https://github.com/altad3005/ardoise/commit/648934036240ff6c068335eb80f1fab30d10e0a7))


### Bug Fixes

* **infra:** forward the real client IP to the services ([b971148](https://github.com/altad3005/ardoise/commit/b97114811f5b3713546d67f4a9d35cefdbb25c17))

## 0.1.0 (2026-10-01)


### Features

* **identity:** add service skeleton with health endpoint ([f29e65f](https://github.com/altad3005/ardoise/commit/f29e65f63c1d24310882b49f1ec1ff6b55cae357))
* **management:** add service skeleton with bar, treasury and directory modules ([5ff5fad](https://github.com/altad3005/ardoise/commit/5ff5fad5efc925bafac5e5d2dd67649219af58a4))
* set up Prisma 7 and local PostgreSQL for both services ([630cb46](https://github.com/altad3005/ardoise/commit/630cb466849876866dfe79a0fe606b9345e23e3e))
* **types:** add shared package with Zod schemas ([26cdbb2](https://github.com/altad3005/ardoise/commit/26cdbb26315a209a7afd5cc8220f01726de0a4f8))
* **web:** add app skeleton with React, TanStack Router, Query and Tailwind ([1300364](https://github.com/altad3005/ardoise/commit/130036470c5f3929dbc02e7bacb022c8383bff64))
