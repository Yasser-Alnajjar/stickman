/** Single source of truth for developer / About details. Components must read from here only. */
export interface DeveloperLink {
  id: 'portfolio' | 'github' | 'linkedin' | 'email';
  label: string;
  href: string;
  /** Short text shown under the label. */
  display: string;
}

export const DEVELOPER = {
  name: 'Yasser Alnajjar',
  role: 'Game Developer / Software Engineer',
  portfolio: 'https://yasseralnajjar.vercel.app/',
  email: 'yasseralnajjar72@gmail.com',
  github: 'https://github.com/Yasser-Alnajjar',
  linkedin: 'https://www.linkedin.com/in/yasser-alnajjar-dev',
} as const;

export const DEVELOPER_LINKS: DeveloperLink[] = [
  { id: 'portfolio', label: 'Portfolio', href: DEVELOPER.portfolio, display: 'yasseralnajjar.vercel.app' },
  { id: 'github', label: 'GitHub', href: DEVELOPER.github, display: 'Yasser-Alnajjar' },
  { id: 'linkedin', label: 'LinkedIn', href: DEVELOPER.linkedin, display: 'yasser-alnajjar-dev' },
  { id: 'email', label: 'Email', href: `mailto:${DEVELOPER.email}`, display: DEVELOPER.email },
];
