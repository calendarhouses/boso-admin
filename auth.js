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
    let gsiWaitTimer = null;

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
        setTimeout(updateSignInUi, 0);
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

    function updateSignInUi() {
        var container = document.getElementById('googleSignInBtn');
        var fallback = document.getElementById('googleSignInFallback');
        if (!fallback) return;

        if (isTelegramWebApp()) {
            if (container) container.style.display = 'none';
            fallback.style.display = 'inline-flex';
            return;
        }

        var hasIframe = !!(container && container.querySelector('iframe'));
        fallback.style.display = hasIframe ? 'none' : 'inline-flex';
        
        if (isTelegramWebApp()) {
            fallback.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-18 8.021a2.25 2.25 0 0 0-.153 4.103l4.636 1.854L10 21l3.541-3.542 4.606 3.454a2.25 2.25 0 0 0 3.585-1.192l3-15a2.25 2.25 0 0 0-2.534-2.51l-1-1z"></path></svg> Увійти через Telegram';
            fallback.style.background = '#2AABEE';
            fallback.style.color = '#fff';
            fallback.style.borderColor = '#2AABEE';
        }

        if (container) container.style.display = hasIframe ? 'flex' : 'none';
    }

    function renderGoogleButton() {
        if (isTelegramWebApp()) {
            updateSignInUi();
            return false;
        }

        var container = document.getElementById('googleSignInBtn');
        if (!container || !global.google || !global.google.accounts || !global.google.accounts.id) {
            updateSignInUi();
            return false;
        }
        container.innerHTML = '';
        try {
            global.google.accounts.id.renderButton(container, {
                theme: 'outline',
                size: 'large',
                text: 'signin_with',
                shape: 'pill',
                locale: 'uk',
                width: 280
            });
        } catch (e) {
            updateSignInUi();
            return false;
        }
        setTimeout(updateSignInUi, 400);
        return true;
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

    function showGsiLoadError() {
        if (isAuthenticated()) return;
        showLoginError('Не вдалося завантажити Google. Оновіть сторінку, вимкніть блокувальник або вийдіть з приватного режиму Safari.');
        updateSignInUi();
    }

    function onGsiScriptLoad() {
        global.__bosoGsiLoaded = true;
        if (gsiWaitTimer) {
            clearInterval(gsiWaitTimer);
            gsiWaitTimer = null;
        }
        if (!isAuthenticated()) {
            initGsi();
        }
    }

    function waitForGsi(cb) {
        if (initGsi()) {
            cb();
            return;
        }
        if (global.__bosoGsiLoaded) {
            initGsi();
            cb();
            return;
        }
        var attempts = 0;
        if (gsiWaitTimer) clearInterval(gsiWaitTimer);
        gsiWaitTimer = setInterval(function () {
            attempts++;
            if (initGsi()) {
                clearInterval(gsiWaitTimer);
                gsiWaitTimer = null;
                cb();
                return;
            }
            if (attempts > 120) {
                clearInterval(gsiWaitTimer);
                gsiWaitTimer = null;
                showGsiLoadError();
                cb();
            }
        }, 100);
    }

    function isTelegramWebApp() {
        return !!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData);
    }

    function exchangeTelegramInitDataForSession() {
        var apiUrl = getApiUrl();
        if (!apiUrl) {
            showLoginError('Помилка конфігурації API');
            return;
        }

        var initData = window.Telegram.WebApp.initData;
        if (!initData) {
            showLoginError('Немає даних Telegram для входу');
            return;
        }

        loginInProgress = true;
        document.getElementById('googleSignInFallback').innerText = 'Заходимо через Telegram...';
        document.getElementById('googleSignInFallback').disabled = true;

        // POST запити до Google Apps Script з 'text/plain' не викликають OPTIONS preflight.
        // Це важливо для Telegram Web App
        
        var urlParams = new URLSearchParams(window.location.search);
        var forceError = urlParams.get('forceError');
        if (forceError) {
             showLoginError('Тестова помилка: ' + forceError);
             loginInProgress = false;
             document.getElementById('googleSignInFallback').innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-18 8.021a2.25 2.25 0 0 0-.153 4.103l4.636 1.854L10 21l3.541-3.542 4.606 3.454a2.25 2.25 0 0 0 3.585-1.192l3-15a2.25 2.25 0 0 0-2.534-2.51l-1-1z"></path></svg> Увійти через Telegram';
             document.getElementById('googleSignInFallback').disabled = false;
             return;
        }

        // Обхід проблеми з CORS в Telegram WebApp
        var jsonpUrl = apiUrl + "?action=adminTelegramLogin&initData=" + encodeURIComponent(initData) + "&callback=onTelegramLoginCallback";
        
        var script = document.createElement('script');
        script.src = jsonpUrl;
        
        global.onTelegramLoginCallback = function(data) {
             document.getElementById('googleSignInFallback').innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-18 8.021a2.25 2.25 0 0 0-.153 4.103l4.636 1.854L10 21l3.541-3.542 4.606 3.454a2.25 2.25 0 0 0 3.585-1.192l3-15a2.25 2.25 0 0 0-2.534-2.51l-1-1z"></path></svg> Увійти через Telegram';
             document.getElementById('googleSignInFallback').disabled = false;
             
             if (!data || (!data.success && !data.sessionToken)) {
                 showLoginError((data && data.message) || 'Немає доступу. Ви не адмін.');
                 loginInProgress = false;
                 return;
             }
             
             var name = window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user ? window.Telegram.WebApp.initDataUnsafe.user.first_name : 'Telegram User';
             saveSession({
                 email: data.email,
                 sessionToken: data.sessionToken,
                 name: name,
                 picture: ''
             });
             loginInProgress = false;
             showAdminApp();
             
             if (global.onAdminLoginSuccess) {
                 global.onAdminLoginSuccess(data.email);
             }
             
             delete global.onTelegramLoginCallback;
             document.body.removeChild(script);
        };
        
        script.onerror = function() {
            loginInProgress = false;
            document.getElementById('googleSignInFallback').innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-18 8.021a2.25 2.25 0 0 0-.153 4.103l4.636 1.854L10 21l3.541-3.542 4.606 3.454a2.25 2.25 0 0 0 3.585-1.192l3-15a2.25 2.25 0 0 0-2.534-2.51l-1-1z"></path></svg> Увійти через Telegram';
            document.getElementById('googleSignInFallback').disabled = false;
            showLoginError('Виникла помилка під час авторизації. Спробуйте оновити сторінку.');
            delete global.onTelegramLoginCallback;
            document.body.removeChild(script);
        };
        
        document.body.appendChild(script);
    }

    function triggerGoogleSignIn() {
        showLoginError('');

        // Якщо це Telegram Web App
        if (isTelegramWebApp()) {
            document.getElementById('googleSignInFallback').innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-18 8.021a2.25 2.25 0 0 0-.153 4.103l4.636 1.854L10 21l3.541-3.542 4.606 3.454a2.25 2.25 0 0 0 3.585-1.192l3-15a2.25 2.25 0 0 0-2.534-2.51l-1-1z"></path></svg> Увійти через Telegram';
            document.getElementById('googleSignInFallback').style.background = '#2AABEE';
            document.getElementById('googleSignInFallback').style.color = '#fff';
            document.getElementById('googleSignInFallback').style.borderColor = '#2AABEE';
            exchangeTelegramInitDataForSession();
            return;
        }

        if (!initGsi()) {
            waitForGsi(function () {
                if (!gsiReady) {
                    showGsiLoadError();
                    return;
                }
                triggerGoogleSignIn();
            });
            return;
        }
        renderGoogleButton();
        setTimeout(function () {
            if (document.querySelector('#googleSignInBtn iframe')) return;
            try {
                global.google.accounts.id.prompt(function (notification) {
                    if (!notification) return;
                    if (notification.isNotDisplayed && notification.isNotDisplayed()) {
                        showGsiLoadError();
                    } else if (notification.isSkippedMoment && notification.isSkippedMoment()) {
                        showGsiLoadError();
                    }
                });
            } catch (e) {
                showGsiLoadError();
            }
        }, 300);
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
            if (gsiReady) {
                renderGoogleButton();
            } else {
                updateSignInUi();
            }
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
            return parseApiJson(res.clone()).then(function (data) {
                if (handleApiAuthError(data)) {
                    throw new Error('UNAUTHORIZED');
                }
                return res;
            });
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
            if (!isAuthenticated()) {
                if (gsiReady) renderGoogleButton();
                else updateSignInUi();
            }
        });
    }

    global.__bosoGsiOnLoad = onGsiScriptLoad;
    if (global.__bosoGsiLoaded) onGsiScriptLoad();

    global.BosoAuth = {
        CLIENT_ID: GOOGLE_CLIENT_ID,
        bootstrap: bootstrap,
        triggerGoogleSignIn: triggerGoogleSignIn,
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
