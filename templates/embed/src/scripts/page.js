import { spectate as spectateConfig } from '../../package.json';

/**
 * Put all initializer scripts into this init() function
 */

function init() {
  // If an artboard is on the page, load the ai2html resizer
  if (document.querySelector('.g-artboard[data-min-width]')) {
    import('./ai2html-resizer').then(p => p.default());
  }
}

const isOnSpectatorPage = window.location.host === 'www.columbiaspectator.com';
const isOnContributorPage =
  window.location.pathname.indexOf('/contributors') === 0;

export default function () {
  // If IntersectionObserver and IntersectionObserverEntry are not natively
  // supported, load the polyfill.
  if (
    !('IntersectionObserver' in window) ||
    !('IntersectionObserverEntry' in window) ||
    !('isIntersecting' in window.IntersectionObserverEntry.prototype)
  ) {
    import('intersection-observer').then();
  }

  init();
}

/**
 * Disable stylesheets on contributor page. Stylesheets are included in the
 * server-side render and styles in files like news-ellipsis.css
 * still override the site.
 */

if (isOnSpectatorPage && isOnContributorPage) {
  // Disable stylesheets
  document
    .querySelectorAll('.story-summary > .twolines > link')
    .forEach(link => (link.disabled = true));

  // Add styles to hide content preview
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = '.story-summary > .twolines { display: none; }';
  document.head.appendChild(styleSheet);
}
