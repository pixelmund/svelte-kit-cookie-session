export const getCookieValue = (cookie: string) => {
	return cookie.split(';')[0].trim();
};

export const getCookieMaxage = (cookie: string) => {
	return cookie.split(';')[1].trim().replace('Max-Age=', '');
};

export const SECRET = 'SOME_SECRET_VALUE';

export const initialData = {
	username: 'patrick',
	email: 'patrick@patrick.com',
	theme: 'light',
	lang: 'de'
};
