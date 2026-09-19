import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Universal ScrollToTop component
 * Automatically resets scroll position to (0, 0) upon any route or search param navigation.
 */
export const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // 1. Reset standard window scroll
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });

    // 2. Reset document scroll
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }

    // 3. Reset any scrollable main container
    const mainElements = document.querySelectorAll('main, [data-scroll-container]');
    mainElements.forEach((el) => {
      if (el) el.scrollTop = 0;
    });
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
