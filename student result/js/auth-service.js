// Replace this demo adapter with API calls when the backend is ready.
(function () {
    const accountsKey = 'niyd-demo-accounts';
    const sessionKey = 'niyd-demo-session';
    const roles = ['admin', 'teacher', 'student'];

    function readAccounts() {
        const savedAccounts = localStorage.getItem(accountsKey);
        if (!savedAccounts) return [];
        const accounts = JSON.parse(savedAccounts);
        if (!Array.isArray(accounts)) throw new Error('Saved account data is invalid.');
        return accounts;
    }

    function createPasswordSalt() {
        if (!window.crypto || !window.crypto.getRandomValues) {
            throw new Error('Secure credential hashing is not available in this browser. Open the app using a local web server.');
        }
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        return Array.from(salt, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    async function hashPassword(password, salt) {
        if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) {
            throw new Error('Secure credential hashing is not available in this browser. Open the app using a local web server.');
        }
        if (!/^[0-9a-f]{32}$/i.test(salt)) throw new Error('Saved account data is invalid.');

        const passwordKey = await window.crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(password),
            'PBKDF2',
            false,
            ['deriveBits']
        );
        const saltBytes = new Uint8Array(salt.match(/.{2}/g).map(byte => parseInt(byte, 16)));
        const digest = await window.crypto.subtle.deriveBits({
            name: 'PBKDF2',
            salt: saltBytes,
            iterations: 120000,
            hash: 'SHA-256'
        }, passwordKey, 256);
        return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    }

    function saveSession(account) {
        const user = { name: account.name, email: account.email, role: account.role };
        localStorage.setItem(sessionKey, JSON.stringify(user));
        return user;
    }

    async function signUp({ name, email, password, role }) {
        if (!roles.includes(role)) throw new Error('Choose a valid account role.');
        if (!name.trim()) throw new Error('Enter your full name.');

        const accounts = readAccounts();
        const normalizedEmail = email.trim().toLowerCase();
        if (accounts.some(account => account.email === normalizedEmail)) {
            throw new Error('An account with this email already exists. Please log in instead.');
        }

        const passwordSalt = createPasswordSalt();
        const account = {
            name: name.trim(),
            email: normalizedEmail,
            role,
            passwordSalt,
            passwordHash: await hashPassword(password, passwordSalt)
        };
        accounts.push(account);
        localStorage.setItem(accountsKey, JSON.stringify(accounts));
        return saveSession(account);
    }

    async function signIn({ email, password, role }) {
        if (!roles.includes(role)) throw new Error('Choose a valid account role.');

        const normalizedEmail = email.trim().toLowerCase();
        const account = readAccounts().find(savedAccount => savedAccount.email === normalizedEmail);
        if (!account || !account.passwordSalt
            || account.passwordHash !== await hashPassword(password, account.passwordSalt)) {
            throw new Error('Email or password is incorrect.');
        }
        if (account.role !== role) {
            throw new Error(`This account is registered as ${account.role}. Select that role to continue.`);
        }
        return saveSession(account);
    }

    async function getCurrentUser() {
        const savedSession = localStorage.getItem(sessionKey);
        if (!savedSession) return null;

        const session = JSON.parse(savedSession);
        if (!session || !roles.includes(session.role) || !session.name) {
            throw new Error('Saved session data is invalid.');
        }
        return session;
    }

    async function signOut() {
        localStorage.removeItem(sessionKey);
    }

    window.authService = { signUp, signIn, getCurrentUser, signOut };
})();
