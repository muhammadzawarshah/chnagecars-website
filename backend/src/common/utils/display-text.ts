/** Title case human-readable text while preserving embedded contact links. */
export function titleCase(value: string): string {
  return value.split(/(https?:\/\/\S+|[\w.+-]+@[\w.-]+\.[a-z]{2,})/gi).map((part, i) => i % 2 ? part :
    part.toLocaleLowerCase('en-ZA').replace(/(^|[^\p{L}])(\p{L})/gu, (_m, prefix, letter) => prefix + letter.toLocaleUpperCase('en-ZA'))).join('');
}
