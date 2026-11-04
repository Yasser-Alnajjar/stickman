import type { ReactElement } from 'react';
import { DEVELOPER, DEVELOPER_LINKS, type DeveloperLink } from '@/config/developer';
import { t } from '@/i18n';

const ICONS: Record<DeveloperLink['id'], ReactElement> = {
  portfolio: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2c.9 1.2 1.6 2.9 1.9 5H10.1c.3-2.1 1-3.8 1.9-5Zm-2.5.5A11.6 11.6 0 0 0 8.1 9H4.6a8 8 0 0 1 4.9-4.5ZM4.1 11h3.9c-.1.7-.1 1.3-.1 2s0 1.3.1 2H4.1a8 8 0 0 1 0-4Zm.5 6h3.5c.3 1.7.8 3.2 1.4 4.5A8 8 0 0 1 4.6 17Zm5.5 0h3.8c-.3 2.1-1 3.8-1.9 5-.9-1.2-1.6-2.9-1.9-5Zm0-2a17 17 0 0 1 0-4h3.8a17 17 0 0 1 0 4h-3.8Zm5.9 2h3.4a8 8 0 0 1-4.8 4.5c.6-1.3 1.1-2.800 1.400-4.500Zm.1-2c.1-.7.1-1.300.1-2s0-1.300-.1-2h3.900a8 8 0 0 1 0 4h-3.900Zm-.1-6c-.3-1.700-.8-3.200-1.400-4.500A8 8 0 0 1 19.400 9H16Z" />,
  github: <path d="M12 .5a11.500 11.500 0 0 0-3.640 22.410c.58.110.79-.25.79-.56v-2c-3.200.700-3.880-1.360-3.880-1.360-.52-1.330-1.280-1.690-1.280-1.690-1.050-.72.080-.7.080-.7 1.150.08 1.760 1.190 1.760 1.190 1.030 1.760 2.700 1.250 3.360.96.100-.75.400-1.250.730-1.540-2.560-.29-5.250-1.280-5.250-5.700 0-1.260.450-2.290 1.190-3.100-.12-.29-.52-1.470.110-3.060 0 0 .97-.31 3.170 1.180a11 11 0 0 1 5.780 0c2.200-1.490 3.170-1.180 3.170-1.180.63 1.590.23 2.770.11 3.060.74.810 1.190 1.840 1.190 3.100 0 4.430-2.700 5.400-5.270 5.680.41.360.78 1.060.78 2.140v3.170c0 .31.210.68.800.56A11.500 11.500 0 0 0 12 .5Z" />,
  linkedin: <path d="M20.450 20.450h-3.560v-5.570c0-1.330-.02-3.040-1.850-3.040-1.850 0-2.140 1.450-2.140 2.940v5.670H9.350V9h3.410v1.560h.05c.48-.9 1.640-1.850 3.370-1.850 3.600 0 4.270 2.370 4.270 5.460v6.280ZM5.340 7.430a2.060 2.060 0 1 1 0-4.130 2.060 2.060 0 0 1 0 4.130ZM7.120 20.450H3.560V9h3.560v11.450ZM22.220 0H1.770C.79 0 0 .77 0 1.730v20.540C0 23.230.79 24 1.770 24h20.450c.98 0 1.780-.77 1.780-1.730V1.730C24 .77 23.200 0 22.220 0Z" />,
  email: <path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm1 2.500V17h16V7.500l-8 5.500-8-5.500ZM5.500 7 12 11.400 18.500 7h-13Z" />,
};

function Icon({ id }: { id: DeveloperLink['id'] }): ReactElement {
  return <svg className="dev-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">{ICONS[id]}</svg>;
}

/** Developer profile card. All data comes from `src/config/developer.ts`. */
export function DeveloperCard(): ReactElement {
  const [primary, ...rest] = DEVELOPER_LINKS;
  const external = (l: DeveloperLink): { target?: string; rel?: string } =>
    l.id === 'email' ? {} : { target: '_blank', rel: 'noopener noreferrer' };
  return (
    <section className="dev-card" aria-label={t('Developer')}>
      <div className="dev-head">
        <div className="dev-avatar" aria-hidden="true">{DEVELOPER.name.split(' ').map((w) => w[0]).join('')}</div>
        <div>
          <p className="dev-kicker">{t('Developed by')}</p>
          <h3 className="dev-name">{DEVELOPER.name}</h3>
          <p className="dev-role">{t(DEVELOPER.role)}</p>
        </div>
      </div>
      <a className="dev-link primary" href={primary.href} {...external(primary)}>
        <Icon id={primary.id} />
        <span className="dev-link-text"><strong>{t(primary.label)}</strong><small dir="ltr">{primary.display}</small></span>
        <span className="dev-arrow" aria-hidden="true">↗</span>
      </a>
      <div className="dev-links">
        {rest.map((l) => (
          <a key={l.id} className="dev-link" href={l.href} {...external(l)} aria-label={`${t(l.label)}: ${l.display}`}>
            <Icon id={l.id} />
            <span className="dev-link-text"><strong>{t(l.label)}</strong><small dir="ltr">{l.display}</small></span>
          </a>
        ))}
      </div>
    </section>
  );
}

export function AboutScreen(): ReactElement {
  return (
    <div className="about">
      <DeveloperCard />
      <div className="credits">
        <p><strong>{t('STICKMAN')}: {t('OPEN WORLD FIGHTER')}</strong></p>
        <p>{t('Design, code, animation and audio: all original and procedural. No third-party assets.')}</p>
        <p className="muted">{t('Built with Phaser 3, React, TypeScript, Vite and Zustand.')}</p>
        <p className="muted">{t('Inspired by the feel of side-scrolling stickman action games.')}</p>
      </div>
    </div>
  );
}
