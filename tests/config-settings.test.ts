import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSiteSettings } from '../src/config/site-settings';

test('配置归一化: 缺省字段回填默认值', () => {
	const out = normalizeSiteSettings({});
	assert.equal(out.site_features.visual.viewTransitions, false);
	assert.equal(out.site_texts.copyCode, '复制');
});

test('配置归一化: 数值字段限制在安全范围内', () => {
	const out = normalizeSiteSettings({
		site_theme_tweaks: {
			viewTransitionDurationMs: 99999,
			tocActiveOffset: -100,
		},
	});
	assert.equal(out.site_theme_tweaks.viewTransitionDurationMs, 1200);
	assert.equal(out.site_theme_tweaks.tocActiveOffset, 40);
});

