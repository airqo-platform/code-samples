// This method is used to remove trailing slash from the url.
export const removeTrailingSlash = (url: string): string => {
  return url.endsWith("/") ? url.slice(0, -1) : url;
};
