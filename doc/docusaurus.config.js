/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'Replicache Docs',
  tagline: 'Realtime Sync for any Backend Stack',
  url: 'https://doc.replicache.dev/',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/replicache.png',
  organizationName: 'Rocicorp', // Usually your GitHub org/user name.
  projectName: 'replicache', // Usually your repo name.
  plugins: [
    [
      'docusaurus-plugin-typedoc',

      // Plugin / TypeDoc options
      {
        entryPoints: ['../src/mod.ts'],
        tsconfig: '../tsconfig.json',
        exclude: ['node_modules', 'src/*.test.ts'],
        excludePrivate: true,
        excludeProtected: true,
        excludeExternals: true,
        name: 'Replicache',
        readme: 'none',
      },
    ],
  ],
  themeConfig: {
    plugins: ['@docusaurus/plugin-google-analytics'],
    colorMode: {
      defaultMode: 'light',
      disableSwitch: true,
      respectPrefersColorScheme: true,
    },
    googleAnalytics: {
      trackingID: 'UA-166756598-1',
      // Optional fields.
      anonymizeIP: true, // Should IPs be anonymized?
    },
    navbar: {
      title: 'Replicache Documentation',
      logo: {
        alt: 'Shiny Replicache Logo',
        src: 'img/replicache.svg',
      },
      items: [
        {
          href: 'https://github.com/rocicorp/replicache',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    image: 'img/replicache.png',
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Connect',
          items: [
            {
              label: 'Email',
              href: 'mailto:hello@replicache.dev',
            },
            {
              label: 'Discord',
              href: 'https://discord.gg/nAxWsGj4X3',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/replicache',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Rocicorp, LLC.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/rocicorp/replicache/tree/main/doc',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
