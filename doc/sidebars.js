module.exports = {
  docs: [
    'getting-started',
    {
      'API Reference': require('./typedoc-sidebar.js'),
    },
    {
      'Integration Guide': [
        'guide-intro',
        'guide-arch',
        'guide-design-client-view',
        'guide-install-replicache',
        'guide-render-ui',
        'guide-local-mutations',
        'guide-database-setup',
        'guide-remote-mutations',
        'guide-dynamic-pull',
        'guide-poke',
        'guide-conclusion',
      ],
    },
    'launch-checklist',
    'design',
    'faq',
  ],
};
