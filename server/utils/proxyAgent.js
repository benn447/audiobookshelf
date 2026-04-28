const HttpProxyAgent = require('http-proxy-agent')
const HttpsProxyAgent = require('https-proxy-agent')

function getNoProxyList() {
  const raw = process.env.no_proxy || process.env.NO_PROXY || ''
  return raw
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
}

function hostMatchesNoProxy(hostname, noProxyList) {
  if (!noProxyList.length) return false
  const host = hostname.toLowerCase()
  for (const entry of noProxyList) {
    if (entry === '*') return true
    const pattern = entry.startsWith('.') ? entry.slice(1) : entry
    if (host === pattern || host.endsWith('.' + pattern)) return true
  }
  return false
}

/**
 * Returns an http(s)-proxy-agent for the given URL based on HTTP(S)_PROXY / NO_PROXY env vars,
 * or null when no proxy applies. The returned agent issues a CONNECT tunnel for HTTPS targets,
 * which is what strict forward proxies (Squid, Privoxy, Tinyproxy) require.
 *
 * @param {string} targetUrl
 * @returns {import('http').Agent | null}
 */
module.exports.getProxyAgent = (targetUrl) => {
  let parsed
  try {
    parsed = new URL(targetUrl)
  } catch {
    return null
  }

  const isHttps = parsed.protocol === 'https:'
  const proxyUrl = isHttps ? process.env.https_proxy || process.env.HTTPS_PROXY : process.env.http_proxy || process.env.HTTP_PROXY

  if (!proxyUrl) return null
  if (hostMatchesNoProxy(parsed.hostname, getNoProxyList())) return null

  return isHttps ? new HttpsProxyAgent(proxyUrl) : new HttpProxyAgent(proxyUrl)
}
