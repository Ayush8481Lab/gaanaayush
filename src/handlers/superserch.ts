import { Context } from 'hono'

// Function to generate a random Indian IP address to spoof the WAF
const getRandomIndianIp = () => {
  const prefixes =['14.96.', '27.54.', '43.224.', '49.14.', '103.27.']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  return `${prefix}${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
}

export const handleSuperserch = async (c: Context) => {
  const reqUrl = new URL(c.req.url)
  const match = reqUrl.pathname.match(/\/api\/superserch\/?(.*)/i)
  const endpointPath = match ? match[1] : ''

  try {
    const targetUrl = `https://gaana.com/apiv2?country=IN&page=0&secType=track&type=search&keyword=${endpointPath}${reqUrl.search}`
    const spoofedIp = getRandomIndianIp()

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en-IN;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Origin': 'https://gaana.com',
        'Referer': 'https://gaana.com/',
        'X-Forwarded-For': spoofedIp,
        'X-Real-IP': spoofedIp,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })

    const rawText = await response.text()

    if (!response.ok) {
      return c.json({ success: false, error: `Blocked: ${response.status}`, details: rawText }, response.status as any)
    }

    if (!rawText || rawText.trim() === '') {
      return c.json({ success: false, error: 'Empty response (Still blocked by Gaana WAF)' }, 500)
    }

    return c.json({
      success: true,
      data: JSON.parse(rawText)
    })

  } catch (error: any) {
    return c.json({ success: false, error: 'Internal Server Error', message: error.message }, 500)
  }
}
