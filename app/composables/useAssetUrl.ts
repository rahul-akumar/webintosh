/**
 * Helper composable to handle asset URLs with proper base path
 * Works both in development (localhost) and production (GitHub Pages)
 */
export function useAssetUrl(path?: string): string | undefined {
  if (!path) return undefined
  
  const { $config } = useNuxtApp()
  const baseURL = $config.app.baseURL || '/'
  
  // If path already starts with http or is a data URL, return as-is
  if (path.startsWith('http') || path.startsWith('data:')) {
    return path
  }
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  // Combine base URL with path
  return `${baseURL}${cleanPath}`
}
