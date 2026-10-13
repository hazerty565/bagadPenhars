import type { ParamMatcher } from '@sveltejs/kit';

const supportedLanguages = new Set(['fr', 'en', 'br']);

export const match: ParamMatcher = (param) => supportedLanguages.has(param);