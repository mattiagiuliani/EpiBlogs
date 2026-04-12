export const parseCookies = (cookieHeader) => {
    if (typeof cookieHeader !== 'string' || !cookieHeader.trim()) {
        return {};
    }

    return cookieHeader.split(';').reduce((cookies, part) => {
        const [rawName, ...rawValueParts] = part.split('=');
        const name = rawName?.trim();

        if (!name) {
            return cookies;
        }

        const rawValue = rawValueParts.join('=').trim();

        try {
            cookies[name] = decodeURIComponent(rawValue);
        } catch {
            cookies[name] = rawValue;
        }

        return cookies;
    }, {});
};
