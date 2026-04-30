import test from 'node:test';
import assert from 'node:assert/strict';
import { pickRandomPost } from '../src/utils/random-post';

test('随机文章: 空数组返回 null', () => {
	assert.equal(pickRandomPost([]), null);
});

test('随机文章: 使用固定随机函数可稳定复现', () => {
	const picked = pickRandomPost(
		[
			{ slug: 'a', title: 'A' },
			{ slug: 'b', title: 'B' },
		],
		() => 0.99
	);
	assert.equal(picked?.slug, 'b');
});

