/* One place for the things that change between environments.
   Stripe will not activate an account without a real contact address
   and a refund policy on the site, so `email` must be a real inbox. */
export const SITE = {
  url: 'https://theaskingcompany.com',
  name: 'Asking Company',
  domainLabel: 'theaskingcompany.com',
  email: 'hello@theaskingcompany.com',
  city: 'Toronto, Ontario, Canada',
  description:
    'I am not sick. I am not poor. Nothing is wrong. I want one dollar. From you. From everyone. That is the entire company.',
  goal: 1_000_000_000,
};

/* One spot ink per page — the only colour that moves. */
export const THEME = {
  home:       { spot: '#0e8a4f', soft: '#e3f2e9' }, // money green
  writing:    { spot: '#0f766e', soft: '#dcefed' }, // ink teal
  filings:    { spot: '#1d4ed8', soft: '#e4e9fb' }, // ledger blue
  prospectus: { spot: '#292524', soft: '#eae6dd' }, // printed in one colour
  careers:    { spot: '#c2185b', soft: '#fae3ec' }, // rose
  shop:       { spot: '#c2610c', soft: '#fbeade' }, // burnt orange
  legal:      { spot: '#6d28d9', soft: '#eee6fb' }, // violet
  contact:    { spot: '#7c2d12', soft: '#f5e7de' }, // rust
};

export const NAV_PRIMARY = [
  { p: 'home', href: '/', label: 'The Ask' },
  { p: 'writing', href: '/writing', label: 'The Library' },
  { p: 'prospectus', href: '/prospectus', label: 'Prospectus' },
];

export const NAV_COMPANY = [
  { p: 'filings', href: '/filings', label: 'Filings' },
  { p: 'careers', href: '/careers', label: 'Careers' },
  { p: 'shop', href: '/shop', label: 'Shop' },
  { p: 'legal', href: '/legal', label: 'Legal' },
  { p: 'contact', href: '/contact', label: 'Contact' },
];
