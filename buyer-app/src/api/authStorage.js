const TOKEN_KEY = 'wc_token'
const USER_KEY = 'wc_user'
const PERSIST_KEY = 'wc_persist'

function storageFor(persist) {
  return persist ? window.localStorage : window.sessionStorage
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
      user,
      persist,
    }
  },

  set({ token, user, persist }) {
    const store = storageFor(persist)
    store.setItem(TOKEN_KEY, token)
    store.setItem(USER_KEY, JSON.stringify(user))
    if (persist) {
      window.localStorage.setItem(PERSIST_KEY, 'true')
      window.sessionStorage.removeItem(TOKEN_KEY)
      window.sessionStorage.removeItem(USER_KEY)
    } else {
      window.localStorage.removeItem(PERSIST_KEY)
      window.localStorage.removeItem(TOKEN_KEY)
      window.localStorage.removeItem(USER_KEY)
    }
  },

  getToken() {
    return authStorage.get().token
  },

  clear() {
    window.localStorage.removeItem(TOKEN_KEY)
    window.localStorage.removeItem(USER_KEY)
    window.localStorage.removeItem(PERSIST_KEY)
    window.sessionStorage.removeItem(TOKEN_KEY)
    window.sessionStorage.removeItem(USER_KEY)
  },
}
