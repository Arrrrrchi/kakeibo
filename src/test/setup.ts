import "@testing-library/jest-dom/vitest";

// Recharts の ResponsiveContainer が使う ResizeObserver のモック
if (typeof globalThis.ResizeObserver === "undefined") {
	globalThis.ResizeObserver = class ResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
}
