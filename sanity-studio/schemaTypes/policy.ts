const RESERVED_PUBLIC_PREFIXES = ['/api', '/cdn-cgi', '/.well-known', '/en']

function hasReservedPrefix(pathname: string) {
  return RESERVED_PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function validatePublicPath(value: unknown): true | string {
  if (typeof value !== 'string' || !value) return 'A public path is required.'
  if (!/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/.test(value)) {
    return 'Use a canonical Romanian path such as /security or /products/compliance.'
  }
  if (hasReservedPrefix(value)) {
    return 'This path is reserved by the ZebraByte runtime or localization layer.'
  }
  return true
}

export function validateCanonicalPath(value: unknown): true | string {
  if (value === undefined || value === null || value === '') return true
  return validatePublicPath(value)
}

export function validateCmsHref(value: unknown): true | string {
  if (typeof value !== 'string' || !value.trim()) return 'A destination is required.'
  const href = value.trim()

  if (href.startsWith('#')) {
    return /^#[a-z0-9-]+$/.test(href) || 'Use an anchor such as #security-overview.'
  }

  if (href.startsWith('/')) {
    let url: URL
    try {
      url = new URL(href, 'https://www.zebrabyte.ro')
    } catch {
      return 'Use a valid internal ZebraByte path.'
    }
    if (url.origin !== 'https://www.zebrabyte.ro') return 'Internal links must remain on the ZebraByte origin.'
    if (hasReservedPrefix(url.pathname)) {
      return 'This destination is reserved by the ZebraByte runtime or localization layer.'
    }
    return true
  }

  let url: URL
  try {
    url = new URL(href)
  } catch {
    return 'Use an internal path, https URL, mailto address, or telephone link.'
  }

  if (url.protocol === 'https:') return true
  if (url.protocol === 'mailto:' || url.protocol === 'tel:') return true
  return 'Only https, mailto and tel external destinations are allowed.'
}

export function validateHttpsUrl(value: unknown): true | string {
  if (value === undefined || value === null || value === '') return true
  if (typeof value !== 'string') return 'Use a valid HTTPS URL.'
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || 'Only HTTPS URLs are allowed.'
  } catch {
    return 'Use a valid HTTPS URL.'
  }
}
