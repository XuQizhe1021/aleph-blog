export type TocHeadingPosition = {
	id: string;
	top: number;
};

/**
 * 根据标题相对视口顶部的位置，计算当前应高亮的目录项。
 * positions 需按文档顺序传入。
 */
export function pickActiveTocHeading(
	positions: TocHeadingPosition[],
	offset = 96
) {
	if (!positions.length) return '';
	let active = positions[0].id;
	for (const item of positions) {
		if (item.top - offset <= 0) active = item.id;
		else break;
	}
	return active;
}

