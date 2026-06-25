/**
 * URL query-string helpers shared by the filter sidebar, sort select,
 * pagination, and active-filter chips. Centralized here so every shop
 * control builds URLs the same way — toggling a size filter and
 * changing the sort both go through `withParam`/`toggleArrayParam`,
 * rather than each component hand-rolling its own `URLSearchParams`
 * logic and risking subtly different behavior (e.g. one resetting
 * `page` on change and another forgetting to).
 */

export type SearchParamsInit =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function toSearchParams(params: SearchParamsInit): URLSearchParams {
  if (params instanceof URLSearchParams) {
    return new URLSearchParams(params);
  }

  const result = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) result.append(key, v);
    } else {
      result.set(key, value);
    }
  }
  return result;
}

/** Sets (or removes, if `value` is null/empty) a single query param.
 * Any change other than to `page` itself resets `page` to 1, since a
 * new filter/sort invalidates the previous page's meaning. */
export function withParam(
  current: SearchParamsInit,
  key: string,
  value: string | null,
): string {
  const params = toSearchParams(current);

  if (value === null || value === "") {
    params.delete(key);
  } else {
    params.set(key, value);
  }

  if (key !== "page") {
    params.delete("page");
  }

  const query = params.toString();
  return query ? `?${query}` : "?";
}

/** Toggles a value within a comma-separated multi-value param (used by
 * the size and color checkbox filters: `?size=M,L`). */
export function toggleArrayParam(
  current: SearchParamsInit,
  key: string,
  value: string,
): string {
  const params = toSearchParams(current);
  const existing = (params.get(key) ?? "").split(",").filter(Boolean);

  const next = existing.includes(value)
    ? existing.filter((v) => v !== value)
    : [...existing, value];

  return withParam(params, key, next.length > 0 ? next.join(",") : null);
}

/** Reads the current values of a comma-separated multi-value param. */
export function readArrayParam(
  current: SearchParamsInit,
  key: string,
): string[] {
  const params = toSearchParams(current);
  return (params.get(key) ?? "").split(",").filter(Boolean);
}

/** Removes every shop filter param, keeping sort and page untouched —
 * used by "Clear all filters". */
export function clearAllFilters(current: SearchParamsInit): string {
  const params = toSearchParams(current);
  for (const key of ["category", "size", "color", "minPrice", "maxPrice"]) {
    params.delete(key);
  }
  params.delete("page");
  const query = params.toString();
  return query ? `?${query}` : "?";
}
