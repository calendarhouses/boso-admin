/**
 * BOSO Admin — Google Sign-In (один раз) + довгострокова sessionToken з бекенду
 */
(function (global) {
    const GOOGLE_CLIENT_ID = '82812907783-5rfrkc0bedpnkbnprumg8s7l7qn9tbnl.apps.googleusercontent.com';
    const STORAGE_KEY = 'boso_admin_auth';
    const ALLOWED_EMAILS = [
        'bosoclubresort@gmail.com',
        'bo9dantkach@gmail.com',
        'tkach.iurii@gmail.com',
        'nazar.duzhik02222@gmail.com'
    ].map(function (e) { return e.toLowerCase(); });
    const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbx1RYoMJySplZ18Wv54PQjxzHnZqIb3Wsw63oG-PAOKMvuXEym8Y7aFS-L_pxvfX6o4DQ/exec';

    let session = null;
    let onReadyCallback = null;
    let gsiReady = false;
    let loginInProgress = false;

    function getApiUrl() {
        return global.BOSO_API_URL || DEFAULT_API_URL;
    }

    function parseJwt(credential) {
        try {
            var payload = credential.split('.')[1];
            var json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
            return JSON.parse(json);
        } catch (e) {
            return null;
        }
    }

    function isEmailAllowed(email) {
        return ALLOWED_EMAILS.indexOf(String(email || '').toLowerCase().trim()) !== -1;
    }

    function loadSession() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            var data = JSON.parse(raw);
            if (!data || !data.email || !data.sessionToken) return null;
            if (!isEmailAllowed(data.email)) return null;
            return data;
        } catch (e) {
            return null;
        }
    }

    function saveSession(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            email: data.email,
            sessionToken: data.sessionToken,
            name: data.name || data.email,
            picture: data.picture || ''
        }));
        session = loadSession();
    }

    function clearSession() {
        localStorage.removeItem(STORAGE_KEY);
        session = null;
    }

    function showLoginError(msg) {
        var el = document.getElementById('auth-login-error');
        if (el) {
            el.textContent = msg || '';
            el.style.display = msg ? 'block' : 'none';
        }
    }

    function showLoginScreen() {
        var login = document.getElementById('auth-login-screen');
        var app = document.getElementById('admin-app');
        if (login) login.style.display = 'flex';
        if (app) app.style.display = 'none';
    }

    function showAdminApp() {
        var login = document.getElementById('auth-login-screen');
        var app = document.getElementById('admin-app');
        if (login) login.style.display = 'none';
        if (app) {
            app.style.display = 'flex';
            app.style.flex = '1';
            app.style.width = '100%';
            app.style.height = '100vh';
            app.style.height = '100dvh';
            app.style.overflow = 'hidden';
            if (document.body && getComputedStyle(document.body).flexDirection === 'column') {
                app.style.flexDirection = 'column';
            }
        }
        showLoginError('');
    }

    function exchangeGoogleCredentialForSession(credential, claims, email) {
        var apiUrl = getApiUrl();
        if (!apiUrl) {
            showLoginError('Помилка конфігурації API');
            loginInProgress = false;
            return Promise.reject(new Error('API_URL missing'));
        }
        return fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'adminLogin',
                adminEmail: email,
                idToken: credential
            })
        }).then(function (res) { return res.json(); }).then(function (data) {
            if (!data || !data.success || !data.sessionToken) {
                showLoginError((data && data.message) || 'У доступі відмовлено');
                if (global.google && global.google.accounts && global.google.accounts.id) {
                    global.google.accounts.id.disableAutoSelect();
                }
                throw new Error('LOGIN_FAILED');
            }
            saveSession({
                email: data.email || email,
                sessionToken: data.sessionToken,
                name: claims.name || email,
                picture: claims.picture || ''
            });
            showAdminApp();
            if (typeof onReadyCallback === 'function') {
                onReadyCallback();
            }
        }).catch(function () {
            var errEl = document.getElementById('auth-login-error');
            if (!errEl || !errEl.textContent) {
                showLoginError('Не вдалося увійти. Спробуйте ще раз.');
            }
        }).finally(function () {
            loginInProgress = false;
        });
    }

    function handleCredentialResponse(response) {
        if (loginInProgress) return;
        if (!response || !response.credential) {
            showLoginError('У доступі відмовлено');
            return;
        }
        var claims = parseJwt(response.credential);
        if (!claims || !claims.email) {
            showLoginError('У доступі відмовлено');
            return;
        }
        var email = String(claims.email).toLowerCase().trim();
        if (!isEmailAllowed(email)) {
            showLoginError('У доступі відмовлено');
            if (global.google && global.google.accounts && global.google.accounts.id) {
                global.google.accounts.id.disableAutoSelect();
            }
            return;
        }
        loginInProgress = true;
        showLoginError('');
        exchangeGoogleCredentialForSession(response.credential, claims, email);
    }

    function renderGoogleButton() {
        var container = document.getElementById('googleSignInBtn');
        if (!container || !global.google || !global.google.accounts || !global.google.accounts.id) return;
        container.innerHTML = '';
        global.google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'pill',
            locale: 'uk',
            width: 280
        });
    }

    function initGsi() {
        if (!global.google || !global.google.accounts || !global.google.accounts.id) return false;
        global.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: false
        });
        renderGoogleButton();
        gsiReady = true;
        return true;
    }

    function waitForGsi(cb) {
        if (initGsi()) {
            cb();
            return;
        }
        var attempts = 0;
        var timer = setInterval(function () {
            attempts++;
            if (initGsi() || attempts > 80) {
                clearInterval(timer);
                cb();
            }
        }, 100);
    }

    function getSession() {
        if (session) return session;
        session = loadSession();
        return session;
    }

    function isAuthenticated() {
        var s = getSession();
        return !!(s && s.email && s.sessionToken);
    }

    /** Сесія недійсна на сервері — лише локально, без reload і без adminLogout */
    function sessionExpired(message) {
        clearSession();
        showLoginScreen();
        showLoginError(message || 'Сесію завершено. Увійдіть через Google.');
        waitForGsi(function () {
            if (gsiReady) renderGoogleButton();
        });
    }

    function logout() {
        var s = getSession();
        var apiUrl = getApiUrl();
        function finishLogout() {
            clearSession();
            showLoginScreen();
            showLoginError('');
            if (global.google && global.google.accounts && global.google.accounts.id) {
                global.google.accounts.id.disableAutoSelect();
            }
            window.location.reload();
        }
        if (s && s.sessionToken && apiUrl) {
            fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: 'adminLogout',
                    adminEmail: s.email,
                    sessionToken: s.sessionToken
                })
            }).finally(finishLogout);
        } else {
            finishLogout();
        }
    }

    function appendAuthToUrl(url) {
        var s = getSession();
        if (!s) return url;
        var sep = url.indexOf('?') >= 0 ? '&' : '?';
        return url + sep +
            'adminEmail=' + encodeURIComponent(s.email) +
            '&sessionToken=' + encodeURIComponent(s.sessionToken);
    }

    function apiFetch(url, options) {
        options = options || {};
        var s = getSession();
        if (!s) {
            return Promise.reject(new Error('Not authenticated'));
        }
        var method = (options.method || 'GET').toUpperCase();
        var opts = Object.assign({}, options);

        if (method === 'GET') {
            url = appendAuthToUrl(url);
        } else if (opts.body && typeof opts.body === 'string') {
            try {
                var body = JSON.parse(opts.body);
                body.adminEmail = s.email;
                body.sessionToken = s.sessionToken;
                opts.body = JSON.stringify(body);
            } catch (e) {
                /* leave body as-is */
            }
        }

        return fetch(url, opts).then(function (res) {
            return res;
        });
    }

    function parseApiJson(res) {
        return res.text().then(function (text) {
            try {
                return JSON.parse(text);
            } catch (e) {
                return { error: 'PARSE_ERROR', raw: text };
            }
        });
    }

    function handleApiAuthError(data) {
        if (data && data.error === 'UNAUTHORIZED') {
            sessionExpired('Сесію завершено. Увійдіть через Google ще раз.');
            return true;
        }
        return false;
    }

    function bootstrap(onReady) {
        onReadyCallback = onReady;
        session = loadSession();

        if (isAuthenticated()) {
            showAdminApp();
            if (typeof onReady === 'function') onReady();
        } else {
            clearSession();
            showLoginScreen();
        }

        waitForGsi(function () {
            if (!gsiReady) return;
            if (!isAuthenticated()) {
                renderGoogleButton();
            }
        });
    }

    global.BosoAuth = {
        CLIENT_ID: GOOGLE_CLIENT_ID,
        bootstrap: bootstrap,
        isAuthenticated: isAuthenticated,
        getSession: getSession,
        getEmail: function () {
            var s = getSession();
            return s ? s.email : '';
        },
        apiFetch: apiFetch,
        parseApiJson: parseApiJson,
        handleApiAuthError: handleApiAuthError,
        sessionExpired: sessionExpired,
        logout: logout,
        appendAuthToUrl: appendAuthToUrl
    };
})(window);
