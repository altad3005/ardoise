const businessModules = '(bar|treasury|directory)';

module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'treasury-does-not-depend-on-bar',
      severity: 'error',
      from: { path: '^apps/management/src/treasury/' },
      to: { path: '^apps/management/src/bar/' },
    },
    {
      name: 'directory-depends-on-no-other-module',
      severity: 'error',
      from: { path: '^apps/management/src/directory/' },
      to: { path: '^apps/management/src/(bar|treasury)/' },
    },
    {
      name: 'modules-talk-through-public-facades',
      comment:
        'A module may only reach another module through its public/ folder or its NestJS module file.',
      severity: 'error',
      from: { path: `^apps/management/src/${businessModules}/` },
      to: {
        path: `^apps/management/src/${businessModules}/`,
        pathNot: [
          '^apps/management/src/$1/',
          `^apps/management/src/${businessModules}/public/`,
          `^apps/management/src/${businessModules}/[^/]+\\.module\\.ts$`,
        ],
      },
    },
    {
      name: 'database-only-in-infrastructure',
      comment: 'Inside business modules, only infrastructure/ may touch Prisma.',
      severity: 'error',
      from: {
        path: `^apps/management/src/${businessModules}/`,
        pathNot: `^apps/management/src/${businessModules}/infrastructure/`,
      },
      to: { path: '^apps/management/src/database/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(/dist/|/generated/)' },
    tsPreCompilationDeps: true,
  },
};
