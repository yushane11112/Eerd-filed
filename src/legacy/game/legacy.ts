export const LEGACY_ARCHIPELAGO_PARAM = 'legacy-islands'
export const LEGACY_ARCHIPELAGO_QA_PARAM = 'qa-static'

export function isLegacyArchipelagoEnabled(params: URLSearchParams): boolean {
  return params.has(LEGACY_ARCHIPELAGO_PARAM) || params.has(LEGACY_ARCHIPELAGO_QA_PARAM)
}

export function isLegacyArchipelagoStaticQa(params: URLSearchParams): boolean {
  return params.has(LEGACY_ARCHIPELAGO_QA_PARAM)
}

