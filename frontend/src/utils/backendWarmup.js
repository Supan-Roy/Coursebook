let hasWarmedUp = false;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

export function buildHealthUrl(apiUrl) {
  if (!apiUrl || typeof apiUrl !== 'string') {
    return null;
  }

  const normalized = trimTrailingSlash(apiUrl.trim());
  if (!normalized) {
    return null;
  }

  const baseUrl = normalized.replace(/\/api$/i, '');
  return `${trimTrailingSlash(baseUrl)}/health/`;
}

export async function warmUpBackend(options = {}) {
  const {
    retries = 2,
    initialDelayMs = 500,
    apiUrl = import.meta.env.VITE_API_URL,
  } = options;

  if (hasWarmedUp) {
    return;
  }

  const healthUrl = buildHealthUrl(apiUrl);
  if (!healthUrl) {
    return;
  }

  hasWarmedUp = true;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      await fetch(healthUrl, {
        method: 'GET',
        credentials: 'omit',
        keepalive: true,
      });
      return;
    } catch {
      if (attempt === retries) {
        return;
      }

      await sleep(initialDelayMs * (attempt + 1));
    }
  }
}
