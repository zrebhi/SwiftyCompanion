/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last time it was invoked.
 *
 * This is useful for limiting the rate at which a function can fire, for example:
 * - Preventing excessive API calls during rapid user input
 * - Delaying search until the user stops typing
 * - Handling window resize or scroll events efficiently
 *
 * @template T - A function type that extends any function with any arguments and any return type
 * @param {T} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {(...args: Parameters<T>) => void} A debounced version of the provided function
 *
 * @example
 * ```typescript
 * // Basic usage - search only after user stops typing for 500ms
 * const debouncedSearch = debounce((text: string) => {
 *   searchApi(text);
 * }, 500);
 *
 * // Usage in an input change handler
 * const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 *   debouncedSearch(e.target.value);
 * };
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
