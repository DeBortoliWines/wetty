import { isUndefined } from 'lodash';

export default function loadOptions(): object {
  const defaultOptions = {
    fontSize: 16,
    fontFamily: '"DejaVu Sans Mono", "Everson Mono", FreeMono, "Andale Mono", Consolas, monospace',
    'cursorBlink': true
  };
  try {
    return isUndefined(localStorage.options)
      ? defaultOptions
      : JSON.parse(localStorage.options);
  } catch {
    return defaultOptions;
  }
}
