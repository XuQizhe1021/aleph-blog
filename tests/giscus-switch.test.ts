import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldEnableGiscus } from '../src/utils/giscus';
import { DEFAULT_SITE_SETTINGS } from '../src/config/site-settings';

test('评论开关: 总开关关闭时应禁用', () => {
	const settings = {
		...DEFAULT_SITE_SETTINGS,
		site_features: {
			...DEFAULT_SITE_SETTINGS.site_features,
			social: { ...DEFAULT_SITE_SETTINGS.site_features.social, giscus: false },
		},
	};
	assert.equal(shouldEnableGiscus(settings, 'post'), false);
});

test('评论开关: 配置完整且文章页启用时应开启', () => {
	const settings = {
		...DEFAULT_SITE_SETTINGS,
		site_features: {
			...DEFAULT_SITE_SETTINGS.site_features,
			social: { ...DEFAULT_SITE_SETTINGS.site_features.social, giscus: true },
		},
		site_integrations: {
			...DEFAULT_SITE_SETTINGS.site_integrations,
			giscus: {
				...DEFAULT_SITE_SETTINGS.site_integrations.giscus,
				repo: 'x/y',
				repoId: 'R_123',
				categoryId: 'DIC_456',
				enableOnPosts: true,
			},
		},
	};
	assert.equal(shouldEnableGiscus(settings, 'post'), true);
});

