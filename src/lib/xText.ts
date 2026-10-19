/** X counts every web address as 23 characters, however long it is. */
export const X_LINK_LENGTH = 23;
export const X_MAX = 280;

export function xLength(text: string): number {
  return text.replace(/https?:\/\/\S+/g, 'x'.repeat(X_LINK_LENGTH)).length;
}
