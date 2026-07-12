// lib/ads/FraudDetection.ts

export interface FraudSignals {
  // Browser integrity
  userAgent: string
  screenResolution: string
  colorDepth: number
  timezone: string
  language: string
  platform: string
  cookiesEnabled: boolean
  doNotTrack: string | null
  
  // Canvas/WebGL fingerprinting
  canvasFingerprint: string
  webglFingerprint: string
  webglVendor: string
  webglRenderer: string
  
  // Behavioral signals
  mouseMovements: number
  clicksOnAd: number
  tabSwitches: number
  windowBlurs: number
  timeBeforePlay: number
  timeToCompletion: number
  playbackSpeed: number
  
  // Environment checks
  isDevToolsOpen: boolean
  isHeadless: boolean
  hasAdBlocker: boolean
  isPrivateMode: boolean
  isVirtualMachine: boolean
  isEmulator: boolean
  
  // Network signals
  ipAddress: string
  vpnDetected: boolean
  proxyDetected: boolean
  torDetected: boolean
  datacenterIp: boolean
  
  // Consistency checks
  expectedDuration: number
  actualDuration: number
  timestampDrift: number
  geoLocation?: { lat: number; lng: number }
}

export interface FraudScore {
  score: number        // 0-100, higher = more suspicious
  confidence: number   // 0-1
  flags: FraudFlag[]
  recommendation: 'allow' | 'challenge' | 'block'
}

export interface FraudFlag {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  rawValue?: any
}

class FraudDetectionService {
  private mouseMoves: number = 0
  private adClicks: number = 0
  private tabSwitches: number = 0
  private windowBlurs: number = 0
  private startTime: number = 0
  private playTime: number = 0
  private listeners: (() => void)[] = []
  private adBlockerDetected: boolean = false

  // ==================== BROWSER FINGERPRINTING ====================

  async getCanvasFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return 'unsupported'
      
      canvas.width = 200
      canvas.height = 50
      
      // Draw complex pattern
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillStyle = '#f60'
      ctx.fillRect(0, 0, 200, 50)
      ctx.fillStyle = '#069'
      ctx.fillText('Supay Anti-Fraud 🛡️ ' + Math.random().toString(36), 2, 15)
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
      ctx.fillText('Fingerprint v2.1', 4, 35)
      
      // Add noise
      for (let i = 0; i < 50; i++) {
        ctx.fillStyle = `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},0.1)`
        ctx.fillRect(Math.random()*200, Math.random()*50, 2, 2)
      }
      
      return canvas.toDataURL().slice(-50) // Hash tail
    } catch {
      return 'blocked'
    }
  }

  getWebGLFingerprint(): { fingerprint: string; vendor: string; renderer: string } {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
      
      if (!gl) return { fingerprint: 'unsupported', vendor: 'none', renderer: 'none' }
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown'
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown'
      
      // Create fingerprint from capabilities
      const params = [
        gl.getParameter(gl.MAX_TEXTURE_SIZE),
        gl.getParameter(gl.MAX_VIEWPORT_DIMS),
        gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        gl.getParameter(gl.VERSION),
        vendor,
        renderer,
      ].join('|')
      
      // Simple hash
      let hash = 0
      for (let i = 0; i < params.length; i++) {
        const char = params.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      
      return { fingerprint: hash.toString(16), vendor, renderer }
    } catch {
      return { fingerprint: 'blocked', vendor: 'blocked', renderer: 'blocked' }
    }
  }

  // ==================== ENVIRONMENT DETECTION ====================

  detectHeadlessBrowser(): boolean {
    const checks = [
      // Navigator properties
      navigator.webdriver === true,
      !!window.document.documentElement?.getAttribute('webdriver'),
      !!window.callPhantom,
      !!window._phantom,
      !!window.__nightmare,
      
      // Chrome headless indicators
      /HeadlessChrome/.test(navigator.userAgent),
      /Chrome\/\d+/.test(navigator.userAgent) && navigator.plugins.length === 0,
      
      // Screen anomalies
      window.outerWidth === 0 && window.outerHeight === 0,
      screen.width < 100 || screen.height < 100,
      
      // Missing features
      !navigator.mimeTypes || navigator.mimeTypes.length === 0,
      !window.chrome || !window.chrome.runtime,
      
      // Automation frameworks
      !!window.Cypress,
      !!window.__playwright,
      !!window.__pw_manual,
    ]
    
    return checks.filter(Boolean).length >= 3
  }

  detectDevTools(): boolean {
    const threshold = 160
    const widthThreshold = window.outerWidth - window.innerWidth > threshold
    const heightThreshold = window.outerHeight - window.innerHeight > threshold
    
    // Also check via debugger trick
    let devtoolsOpen = false
    const start = performance.now()
    debugger
    const end = performance.now()
    if (end - start > 100) devtoolsOpen = true
    
    return widthThreshold || heightThreshold || devtoolsOpen
  }

  async detectAdBlocker(): Promise<boolean> {
    return new Promise((resolve) => {
      const testAd = document.createElement('div')
      testAd.innerHTML = '&nbsp;'
      testAd.className = 'adsbox pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links'
      testAd.style.position = 'absolute'
      testAd.style.left = '-9999px'
      document.body.appendChild(testAd)
      
      setTimeout(() => {
        const blocked = testAd.offsetHeight === 0 || 
                       testAd.offsetParent === null ||
                       getComputedStyle(testAd).display === 'none'
        document.body.removeChild(testAd)
        this.adBlockerDetected = blocked
        resolve(blocked)
      }, 100)
    })
  }

  detectPrivateMode(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const testKey = 'supay_fraud_test'
        localStorage.setItem(testKey, '1')
        localStorage.removeItem(testKey)
        resolve(false)
      } catch {
        resolve(true)
      }
    })
  }

  detectVirtualMachine(): boolean {
    const vmIndicators = [
      /VMware|VirtualBox|Parallels|QEMU|KVM|Xen|Hyper-V/.test(navigator.userAgent),
      /Virtual/.test(navigator.platform),
      screen.colorDepth === 32 && screen.width === 1024 && screen.height === 768, // Common VM resolution
      navigator.hardwareConcurrency <= 2,
      navigator.deviceMemory !== undefined && (navigator as any).deviceMemory < 4,
    ]
    return vmIndicators.filter(Boolean).length >= 2
  }

  detectEmulator(): boolean {
    const emuIndicators = [
      /Android.*Build\/EMULATOR/.test(navigator.userAgent),
      /iPhone.*Simulator/.test(navigator.userAgent),
      !navigator.platform && /Mobile/.test(navigator.userAgent),
      'ontouchstart' in window && navigator.maxTouchPoints === 0,
    ]
    return emuIndicators.filter(Boolean).length >= 2
  }

  // ==================== BEHAVIORAL TRACKING ====================

  startTracking(): void {
    this.mouseMoves = 0
    this.adClicks = 0
    this.tabSwitches = 0
    this.windowBlurs = 0
    this.startTime = Date.now()
    this.playTime = 0

    // Mouse movement tracking
    const mouseHandler = () => { this.mouseMoves++ }
    document.addEventListener('mousemove', mouseHandler)
    this.listeners.push(() => document.removeEventListener('mousemove', mouseHandler))

    // Click tracking on ad iframe
    const clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('iframe') || target.closest('[data-ad-container]')) {
        this.adClicks++
      }
    }
    document.addEventListener('click', clickHandler)
    this.listeners.push(() => document.removeEventListener('click', clickHandler))

    // Tab visibility changes
    const visibilityHandler = () => {
      if (document.hidden) this.tabSwitches++
    }
    document.addEventListener('visibilitychange', visibilityHandler)
    this.listeners.push(() => document.removeEventListener('visibilitychange', visibilityHandler))

    // Window blur/focus
    const blurHandler = () => { this.windowBlurs++ }
    window.addEventListener('blur', blurHandler)
    this.listeners.push(() => window.removeEventListener('blur', blurHandler))

    // Playback speed detection
    const speedCheck = setInterval(() => {
      this.playTime += 100
    }, 100)
    this.listeners.push(() => clearInterval(speedCheck))
  }

  stopTracking(): void {
    this.listeners.forEach(remove => remove())
    this.listeners = []
  }

  getPlaybackSpeed(expectedDuration: number): number {
    const actualTime = Date.now() - this.startTime
    return actualTime > 0 ? expectedDuration / (actualTime / 1000) : 1
  }

  // ==================== IP & NETWORK DETECTION ====================

  async getIPInfo(): Promise<{
    ip: string
    vpn: boolean
    proxy: boolean
    tor: boolean
    datacenter: boolean
  }> {
    try {
      // Use ipapi.co for detection
      const response = await fetch('https://ipapi.co/json/', {
        signal: AbortSignal.timeout(5000)
      })
      const data = await response.json()
      
      return {
        ip: data.ip,
        vpn: data.security?.vpn || false,
        proxy: data.security?.proxy || false,
        tor: data.security?.tor || false,
        datacenter: data.type === 'hosting' || data.type === 'business',
      }
    } catch {
      return { ip: 'unknown', vpn: false, proxy: false, tor: false, datacenter: false }
    }
  }

  // ==================== FRAUD SCORING ====================

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
      doNotTrack: navigator.doNotTrack,
      
      canvasFingerprint: await this.getCanvasFingerprint(),
      webglFingerprint: webgl.fingerprint,
      webglVendor: webgl.vendor,
      webglRenderer: webgl.renderer,
      
      mouseMovements: this.mouseMoves,
      clicksOnAd: this.adClicks,
      tabSwitches: this.tabSwitches,
      windowBlurs: this.windowBlurs,
      timeBeforePlay: this.playTime,
      timeToCompletion: Date.now() - this.startTime,
      playbackSpeed: this.getPlaybackSpeed(expectedDuration),
      
      isDevToolsOpen: this.detectDevTools(),
      isHeadless: this.detectHeadlessBrowser(),
      hasAdBlocker: this.adBlockerDetected,
      isPrivateMode: await this.detectPrivateMode(),
      isVirtualMachine: this.detectVirtualMachine(),
      isEmulator: this.detectEmulator(),
      
      ipAddress: ipInfo.ip,
      vpnDetected: ipInfo.vpn,
      proxyDetected: ipInfo.proxy,
      torDetected: ipInfo.tor,
      datacenterIp: ipInfo.datacenter,
      
      expectedDuration,
      actualDuration: (Date.now() - this.startTime) / 1000,
      timestampDrift: Math.abs(Date.now() - performance.now()),
    }
  }

  calculateFraudScore(signals: FraudSignals): FraudScore {
    const flags: FraudFlag[] = []
    let score = 0

    // Critical: Headless browser
    if (signals.isHeadless) {
      score += 40
      flags.push({
        type: 'headless_browser',
        severity: 'critical',
        message: 'Headless browser detected (automation tool)',
        rawValue: signals.userAgent,
      })
    }

    // Critical: Ad blocker
    if (signals.hasAdBlocker) {
      score += 35
      flags.push({
        type: 'ad_blocker',
        severity: 'critical',
        message: 'Ad blocker detected - cannot verify ad view',
      })
    }

    // Critical: Dev tools open during watch
    if (signals.isDevToolsOpen) {
      score += 25
      flags.push({
        type: 'dev_tools',
        severity: 'critical',
        message: 'Developer tools open during ad watch',
      })
    }

    // High: VPN/Proxy/Tor
    if (signals.vpnDetected) {
      score += 20
      flags.push({ type: 'vpn', severity: 'high', message: 'VPN detected' })
    }
    if (signals.proxyDetected) {
      score += 20
      flags.push({ type: 'proxy', severity: 'high', message: 'Proxy detected' })
    }
    if (signals.torDetected) {
      score += 30
      flags.push({ type: 'tor', severity: 'high', message: 'Tor network detected' })
    }
    if (signals.datacenterIp) {
      score += 15
      flags.push({ type: 'datacenter', severity: 'high', message: 'Datacenter IP detected' })
    }

    // High: Playback manipulation
    const speed = signals.playbackSpeed
    if (speed > 1.5) {
      score += 25
      flags.push({
        type: 'speed_manipulation',
        severity: 'high',
        message: `Ad completed too fast (${speed.toFixed(2)}x speed)`,
        rawValue: speed,
      })
    } else if (speed < 0.5) {
      score += 15
      flags.push({
        type: 'slow_playback',
        severity: 'medium',
        message: `Suspiciously slow completion (${speed.toFixed(2)}x speed)`,
        rawValue: speed,
      })
    }

    // High: No human interaction
    if (signals.mouseMovements < 5 && signals.clicksOnAd === 0) {
      score += 20
      flags.push({
        type: 'no_interaction',
        severity: 'high',
        message: `No mouse movement (${signals.mouseMovements}) or ad clicks (${signals.clicksOnAd})`,
      })
    }

    // Medium: Tab switching
    if (signals.tabSwitches > 2) {
      score += 15
      flags.push({
        type: 'tab_switching',
        severity: 'medium',
        message: `Switched tabs ${signals.tabSwitches} times during ad`,
      })
    }

    // Medium: Window blur
    if (signals.windowBlurs > 3) {
      score += 10
      flags.push({
        type: 'window_blur',
        severity: 'medium',
        message: `Window lost focus ${signals.windowBlurs} times`,
      })
    }

    // Medium: VM/Emulator
    if (signals.isVirtualMachine) {
      score += 15
      flags.push({ type: 'virtual_machine', severity: 'medium', message: 'Virtual machine detected' })
    }
    if (signals.isEmulator) {
      score += 15
      flags.push({ type: 'emulator', severity: 'medium', message: 'Mobile emulator detected' })
    }

    // Low: Private mode
    if (signals.isPrivateMode) {
      score += 10
      flags.push({ type: 'private_mode', severity: 'low', message: 'Private/incognito mode detected' })
    }

    // Low: Canvas fingerprint blocked
    if (signals.canvasFingerprint === 'blocked') {
      score += 5
      flags.push({ type: 'canvas_blocked', severity: 'low', message: 'Canvas fingerprinting blocked' })
    }

    // Determine recommendation
    let recommendation: 'allow' | 'challenge' | 'block'
    if (score >= 60) recommendation = 'block'
    else if (score >= 30) recommendation = 'challenge'
    else recommendation = 'allow'

    return {
      score: Math.min(100, score),
      confidence: Math.min(1, flags.length / 10 + 0.3),
      flags,
      recommendation,
    }
  }
}

export const fraudDetection = new FraudDetectionService()
