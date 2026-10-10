const TOKEN_KEY = 'wc_token'
const REFRESH_KEY = 'wc_refresh'
const USER_KEY = 'wc_user'
const PERSIST_KEY = 'wc_persist'

function storageFor(persist) {
  return persist ? window.localStorage : window.sessionStorage
}

// Removes the session keys from BOTH stores, so a switch between
// "remember me" on and off can never leave a stale token behind.
function clearStores() {
  for (const store of [window.localStorage, window.sessionStorage]) {
    store.removeItem(TOKEN_KEY)
    store.removeItem(REFRESH_KEY)
    store.removeItem(USER_KEY)
  }
}

export const authStorage = {
  get() {
    const persist = window.localStorage.getItem(PERSIST_KEY) === 'true'
    const store = persist ? window.localStorage : window.sessionStorage
    const rawUser = store.getItem(USER_KEY)
    let user = null
    try {
      user = rawUser ? JSON.parse(rawUser) : null
    } catch {
      user = null
    }
    return {
      token: store.getItem(TOKEN_KEY),
      refreshToken: store.getItem(REFRESH_KEY),
      user,
      persist,
    }
  },

  set({ token, refreshToken, user, persist }) {
    const store = storageFor(persist)
    store.setItem(TOKEN_KEY, token)
    // Older sessions (or a backend without refresh tokens) simply store null.
    if (refreshToken) store.setItem(REFRESH_KEY, refreshToken)
    else store.removeItem(REFRESH_KEY)
    store.setItem(USER_KEY, JSON.stringify(user))

    const other = persist ? window.sessionStorage : window.localStorage
    other.removeItem(TOKEN_KEY)
    other.removeItem(REFRESH_KEY)
    other.removeItem(USER_KEY)

    if (persist) window.localStorage.setItem(PERSIST_KEY, 'true')
    else window.localStorage.removeItem(PERSIST_KEY)
  },

  getToken() {
    return authStorage.get().token
  },

  getRefreshToken() {
    return authStorage.get().refreshToken
  },

  clear() {
    window.localStorage.removeItem(PERSIST_KEY)
    clearStores()
  },
}
