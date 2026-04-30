import test from 'node:test';
import assert from 'node:assert/strict';
import { pickActiveTocHeading } from '../src/utils/toc-active';

test('TOC 高亮: 根据偏移选中当前章节', () => {
	const active = pickActiveTocHeading(
		[
			{ id: 'a', top: -120 },
			{ id: 'b', top: -20 },
			{ id: 'c', top: 200 },
		],
		96
	);
	assert.equal(active, 'b');
});

test('TOC 高亮: 无标题时返回空字符串', () => {
	assert.equal(pickActiveTocHeading([], 96), '');
});

