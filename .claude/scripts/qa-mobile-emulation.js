const nativeMatchMedia = window.matchMedia.bind(window)
const coarsePointerQuery = /\(\s*(?:any-)?pointer\s*:\s*coarse\s*\)/
const isMobileViewport = () => window.innerWidth <= 500

// agent-browser 0.27's device preset changes viewport and user agent but does
// not expose a coarse pointer. Mirror the browser signals the app uses so QA
// exercises its phone controls. Desktop checks remain available above 500px.
window.matchMedia = (query) => {
  const mediaQuery = nativeMatchMedia(query)

  if (!coarsePointerQuery.test(query)) return mediaQuery

  return new Proxy(mediaQuery, {
    get(target, property) {
      if (property === 'matches') return isMobileViewport()

      const value = Reflect.get(target, property, target)
      return typeof value === 'function' ? value.bind(target) : value
    },
  })
}

Object.defineProperty(navigator, 'maxTouchPoints', {
  configurable: true,
  get: () => (isMobileViewport() ? 5 : 0),
})

if (!('ontouchstart' in window)) {
  Object.defineProperty(window, 'ontouchstart', {
    configurable: true,
    value: null,
  })
}
