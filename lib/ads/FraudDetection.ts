export interface FraudSignals {
  userAgent: string
  screenResolution: string
  colorDepth: number
  timezone: string
  language: string
  platform: string
  cookiesEnabled: boolean
  canvasFingerprint: string
  webglFingerprint: string
  webglVendor: string
  webglRenderer: string
  mouseMovements: number
  clicksOnAd: number
  tabSwitches: number
  windowBlurs: number
  timeToCompletion: number
  playbackSpeed: number
  isDevToolsOpen: boolean
  isHeadless: boolean
  hasAdBlocker: boolean
  isPrivateMode: boolean
  isVirtualMachine: boolean
  ipAddress: string
  vpnDetected: boolean
  proxyDetected: boolean
  torDetected: boolean
  datacenterIp: boolean
  expectedDuration: number
  actualDuration: number
}

export interface FraudFlag {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
}

export interface FraudScore {
  score: number
  flags: FraudFlag[]
  recommendation: 'allow' | 'challenge' | 'block'
}

class FraudDetectionService {
  private mouseMoves = 0
  private adClicks = 0
  private tabSwitches = 0
  private windowBlurs = 0
  private startTime = 0
  private listeners: (() => void)[] = []
  private adBlockerDetected = false

  startTracking(): void {
    this.mouseMoves = 0
    this.adClicks = 0
    this.tabSwitches = 0
    this.windowBlurs = 0
    this.startTime = Date.now()
    this.listeners = []

    const mouseHandler = () => { this.mouseMoves++ }
    document.addEventListener('mousemove', mouseHandler)
    this.listeners.push(() => document.removeEventListener('mousemove', mouseHandler))

    const clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('iframe') || target.closest('[data-ad-container]')) {
        this.adClicks++
      }
    }
    document.addEventListener('click', clickHandler)
    this.listeners.push(() => document.removeEventListener('click', clickHandler))

    const visibilityHandler = () => { if (document.hidden) this.tabSwitches++ }
    document.addEventListener('visibilitychange', visibilityHandler)
    this.listeners.push(() => document.removeEventListener('visibilitychange', visibilityHandler))

    const blurHandler = () => { this.windowBlurs++ }
    window.addEventListener('blur', blurHandler)
    this.listeners.push(() => window.removeEventListener('blur', blurHandler))
  }

  stopTracking(): void {
    this.listeners.forEach(remove => remove())
    this.listeners = []
  }

  private async getCanvasFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return 'unsupported'
      canvas.width = 200
      canvas.height = 50
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillStyle = '#f60'
      ctx.fillRect(0, 0, 200, 50)
      ctx.fillStyle = '#069'
      ctx.fillText('Supay v2.1 ' + Math.random().toString(36), 2, 15)
      return canvas.toDataURL().slice(-50)
    } catch { return 'blocked' }
  }

  private getWebGLFingerprint(): { fingerprint: string; vendor: string; renderer: string } {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') as WebGLRenderingContext | null
      if (!gl) return { fingerprint: 'unsupported', vendor: 'none', renderer: 'none' }
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown'
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown'
      let hash = 0
      const params = [vendor, renderer, gl.getParameter(gl.VERSION)].join('|')
      for (let i = 0; i < params.length; i++) {
        hash = ((hash << 5) - hash) + params.charCodeAt(i)
        hash = hash & hash
      }
      return { fingerprint: hash.toString(16), vendor, renderer }
    } catch { return { fingerprint: 'blocked', vendor: 'blocked', renderer: 'blocked' } }
  }

  private detectHeadless(): boolean {
    const checks = [
      navigator.webdriver === true,
      /HeadlessChrome/.test(navigator.userAgent),
      /Chrome\/\d+/.test(navigator.userAgent) && navigator.plugins.length === 0,
      window.outerWidth === 0 && window.outerHeight === 0,
      !navigator.mimeTypes || navigator.mimeTypes.length === 0,
      !!window.Cypress,
      !!window.__playwright,
    ]
    return checks.filter(Boolean).length >= 3
  }

  private detectDevTools(): boolean {
    const threshold = 160
    return (window.outerWidth - window.innerWidth > threshold) ||
           (window.outerHeight - window.innerHeight > threshold)
  }

  private async detectAdBlocker(): Promise<boolean> {
    return new Promise((resolve) => {
      const testAd = document.createElement('div')
      testAd.className = 'adsbox pub_300x250 text-ad textAd text_ad text_ads'
      testAd.style.cssText = 'position:absolute;left:-9999px;'
      document.body.appendChild(testAd)
      setTimeout(() => {
        const blocked = testAd.offsetHeight === 0 || testAd.offsetParent === null
        document.body.removeChild(testAd)
        this.adBlockerDetected = blocked
        resolve(blocked)
      }, 100)
    })
  }

  private async detectPrivateMode(): Promise<boolean> {
    try {
      localStorage.setItem('supay_test', '1')
      localStorage.removeItem('supay_test')
      return false
    } catch { return true }
  }

  private detectVM(): boolean {
    return [
      /VMware|VirtualBox|Parallels|QEMU/.test(navigator.userAgent),
      navigator.hardwareConcurrency <= 2,
    ].filter(Boolean).length >= 2
  }

  private async getIPInfo(): Promise<any> {
    try {
      const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) })
      const data = await res.json()
      return {
        ip: data.ip,
        vpn: data.security?.vpn || false,
        proxy: data.security?.proxy || false,
        tor: data.security?.tor || false,
        datacenter: data.type === 'hosting',
      }
    } catch {
      return { ip: 'unknown', vpn: false, proxy: false, tor: false, datacenter: false }
    }
  }

  async collectSignals(expectedDuration: number): Promise<FraudSignals> {
    const webgl = this.getWebGLFingerprint()
    const ipInfo = await this.getIPInfo()

    return {
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookiesEnabled: navigator.cookieEnabled,
      canvasFingerprint: await this.getCanvasFingerprint(),
      webglFingerprint: webgl.fingerprint,
      webglVendor: webgl.vendor,
      webglRenderer: webgl.renderer,
      mouseMovements: this.mouseMoves,
      clicksOnAd: this.adClicks,
      tabSwitches: this.tabSwitches,
      windowBlurs: this.windowBlurs,
      timeToCompletion: Date.now() - this.startTime,
      playbackSpeed: expectedDuration / ((Date.now() - this.startTime) / 1000),
      isDevToolsOpen: this.detectDevTools(),
      isHeadless: this.detectHeadless(),
      hasAdBlocker: this.adBlockerDetected,
      isPrivateMode: await this.detectPrivateMode(),
      isVirtualMachine: this.detectVM(),
      ipAddress: ipInfo.ip,
      vpnDetected: ipInfo.vpn,
      proxyDetected: ipInfo.proxy,
      torDetected: ipInfo.tor,
      datacenterIp: ipInfo.datacenter,
      expectedDuration,
      actualDuration: (Date.now() - this.startTime) / 1000,
    }
  }

  calculateScore(signals: FraudSignals): FraudScore {
    const flags: FraudFlag[] = []
    let score = 0

    if (signals.isHeadless) { score += 40; flags.push({ type: 'headless', severity: 'critical', message: 'Headless browser' }) }
    if (signals.hasAdBlocker) { score += 35; flags.push({ type: 'adblock', severity: 'critical', message: 'Ad blocker active' }) }
    if (signals.isDevToolsOpen) { score += 25; flags.push({ type: 'devtools', severity: 'critical', message: 'DevTools open' }) }
    if (signals.vpnDetected) { score += 20; flags.push({ type: 'vpn', severity: 'high', message: 'VPN detected' }) }
    if (signals.proxyDetected) { score += 20; flags.push({ type: 'proxy', severity: 'high', message: 'Proxy detected' }) }
    if (signals.torDetected) { score += 30; flags.push({ type: 'tor', severity: 'high', message: 'Tor network' }) }
    if (signals.datacenterIp) { score += 15; flags.push({ type: 'datacenter', severity: 'high', message: 'Datacenter IP' }) }

    const speed = signals.playbackSpeed
    if (speed > 1.5) { score += 25; flags.push({ type: 'speed', severity: 'high', message: `Too fast (${speed.toFixed(2)}x)` }) }
    if (signals.mouseMovements < 5 && signals.clicksOnAd === 0) { score += 20; flags.push({ type: 'nointeract', severity: 'high', message: 'No human interaction' }) }
    if (signals.tabSwitches > 2) { score += 15; flags.push({ type: 'tabswitch', severity: 'medium', message: `Tab switches: ${signals.tabSwitches}` }) }
    if (signals.windowBlurs > 3) { score += 10; flags.push({ type: 'blur', severity: 'medium', message: `Window blurs: ${signals.windowBlurs}` }) }
    if (signals.isVirtualMachine) { score += 15; flags.push({ type: 'vm', severity: 'medium', message: 'Virtual machine' }) }
    if (signals.isPrivateMode) { score += 10; flags.push({ type: 'private', severity: 'low', message: 'Private mode' }) }

    return {
      score: Math.min(100, score),
      flags,
      recommendation: score >= 60 ? 'block' : score >= 30 ? 'challenge' : 'allow',
    }
  }
}

export const fraudDetection = new FraudDetectionService()
