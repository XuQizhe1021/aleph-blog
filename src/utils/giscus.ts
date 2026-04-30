import type { SiteSettings } from '../config/site-settings';

export function shouldEnableGiscus(
	settings: SiteSettings,
	pageType: 'post' | 'page'
) {
	const enabledByFeature = settings.site_features.social.giscus;
	if (!enabledByFeature) return false;

	const config = settings.site_integrations.giscus;
	if (!config.repo || !config.repoId || !config.categoryId) return false;
	if (pageType === 'post') return Boolean(config.enableOnPosts);
	return Boolean(config.enableOnPages);
}

