export function withBase(pathname: string) {
	const base = import.meta.env.BASE_URL ?? '/';
	const p = pathname.startsWith('/') ? pathname.slice(1) : pathname;
	const b = base.endsWith('/') ? base : `${base}/`;
	return `${b}${p}`;
}

