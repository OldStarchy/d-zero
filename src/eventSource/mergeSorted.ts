export function mergeSorted<T>(left: T[], right: T[], compare: (a: T, b: T) => number): T[] {
	let i = 0, j = 0;
	const result: T[] = [];

	while (i < left.length && j < right.length) {
		if (compare(left[i]!, right[j]!) <= 0) result.push(left[i++]!);
		else result.push(right[j++]!);
	}

	return result.concat(left.slice(i), right.slice(j));
}
