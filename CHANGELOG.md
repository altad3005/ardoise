# Changelog

## [0.3.0](https://github.com/altad3005/ardoise/compare/ardoise-v0.2.0...ardoise-v0.3.0) (2026-10-19)


### Features

* **bar:** activate and deactivate catalogue products ([edb9ed5](https://github.com/altad3005/ardoise/commit/edb9ed5d50f80184d36b1272c05929362b9f50ab))
* **bar:** add catalogue tables with the shared products ([01ed61d](https://github.com/altad3005/ardoise/commit/01ed61ded3f869c4de7b9a48fa04a024383bba6f))
* **bar:** expose catalogue products and their activation ([af5def9](https://github.com/altad3005/ardoise/commit/af5def96fe56956e61a28083c2cd69165d386ba6))
* **bar:** split beers into pilsners and specialty beers ([d8d5d1e](https://github.com/altad3005/ardoise/commit/d8d5d1e34ec185b512488c57b73b9680a26bca23))
* **management:** add demo association context and role guard ([313bbc3](https://github.com/altad3005/ardoise/commit/313bbc31b0480e05c3cd4a72d3042cc196117b95))
* **types:** add catalogue product schema ([df906d1](https://github.com/altad3005/ardoise/commit/df906d16e18d67fdeec52718fd9a46f70493809a))
* **web:** add catalogue page ([cdabbeb](https://github.com/altad3005/ardoise/commit/cdabbeb6c09c9e69ffddb1696d29ba25e95756fe))


### Bug Fixes

* **web:** lock catalogue toggles while a change is pending ([57f3902](https://github.com/altad3005/ardoise/commit/57f3902fdd841eb8622a9877cf71a84edecdd4cd))

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
