import type { FilterEffect, BeautyAdjustment, FilterPreset } from "@/types/beauty-filters"

export class BeautyFilterEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private animationFrame: number | null = null
  private particles: Particle[] = []

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext("2d")!
  }

  // 뷰티 조정 적용
  applyBeautyAdjustments(imageData: ImageData, adjustments: BeautyAdjustment): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    const width = imageData.width
    const height = imageData.height

    // 피부 보정 (스무딩)
    if (adjustments.smoothing > 0) {
      this.applySkinSmoothing(data, width, height, adjustments.smoothing)
    }

    // 화이트닝
    if (adjustments.whitening > 0) {
      this.applyWhitening(data, adjustments.whitening)
    }

    // 밝기, 대비, 채도 조정
    this.applyColorAdjustments(data, {
      brightness: adjustments.brightness,
      contrast: adjustments.contrast,
      saturation: adjustments.saturation,
      warmth: adjustments.warmth,
    })

    return new ImageData(data, width, height)
  }

  private applySkinSmoothing(data: Uint8ClampedArray, width: number, height: number, intensity: number): void {
    const factor = intensity / 100
    const radius = Math.max(1, Math.floor(factor * 3))

    // 간단한 가우시안 블러 적용 (피부 영역에만)
    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const idx = (y * width + x) * 4

        // 피부색 감지 (간단한 휴리스틱)
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]

        if (this.isSkinColor(r, g, b)) {
          let totalR = 0,
            totalG = 0,
            totalB = 0,
            count = 0

          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const neighborIdx = ((y + dy) * width + (x + dx)) * 4
              totalR += data[neighborIdx]
              totalG += data[neighborIdx + 1]
              totalB += data[neighborIdx + 2]
              count++
            }
          }

          const avgR = totalR / count
          const avgG = totalG / count
          const avgB = totalB / count

          data[idx] = r + (avgR - r) * factor * 0.3
          data[idx + 1] = g + (avgG - g) * factor * 0.3
          data[idx + 2] = b + (avgB - b) * factor * 0.3
        }
      }
    }
  }

  private applyWhitening(data: Uint8ClampedArray, intensity: number): void {
    const factor = (intensity / 100) * 0.3

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      if (this.isSkinColor(r, g, b)) {
        data[i] = Math.min(255, r + (255 - r) * factor)
        data[i + 1] = Math.min(255, g + (255 - g) * factor)
        data[i + 2] = Math.min(255, b + (255 - b) * factor)
      }
    }
  }

  private applyColorAdjustments(
    data: Uint8ClampedArray,
    adjustments: {
      brightness: number
      contrast: number
      saturation: number
      warmth: number
    },
  ): void {
    const brightnessFactor = adjustments.brightness / 100
    const contrastFactor = (adjustments.contrast + 100) / 100
    const saturationFactor = (adjustments.saturation + 100) / 100
    const warmthFactor = adjustments.warmth / 100

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]

      // 밝기 조정
      r += brightnessFactor * 50
      g += brightnessFactor * 50
      b += brightnessFactor * 50

      // 대비 조정
      r = (r - 128) * contrastFactor + 128
      g = (g - 128) * contrastFactor + 128
      b = (b - 128) * contrastFactor + 128

      // 색온도 조정
      if (warmthFactor > 0) {
        r += warmthFactor * 20
        b -= warmthFactor * 10
      } else {
        r += warmthFactor * 10
        b -= warmthFactor * 20
      }

      // 채도 조정
      const gray = 0.299 * r + 0.587 * g + 0.114 * b
      r = gray + (r - gray) * saturationFactor
      g = gray + (g - gray) * saturationFactor
      b = gray + (b - gray) * saturationFactor

      data[i] = Math.max(0, Math.min(255, r))
      data[i + 1] = Math.max(0, Math.min(255, g))
      data[i + 2] = Math.max(0, Math.min(255, b))
    }
  }

  private isSkinColor(r: number, g: number, b: number): boolean {
    // 간단한 피부색 감지 알고리즘
    return (
      r > 95 && g > 40 && b > 20 && Math.max(r, g, b) - Math.min(r, g, b) > 15 && Math.abs(r - g) > 15 && r > g && r > b
    )
  }

  // 파티클 이펙트 적용
  applyParticleEffect(effect: FilterEffect): void {
    if (effect.type !== "particles" || !effect.particles) return

    // 새 파티클 생성
    if (this.particles.length < effect.particles.count) {
      for (let i = this.particles.length; i < effect.particles.count; i++) {
        this.particles.push(
          new Particle(Math.random() * this.canvas.width, Math.random() * this.canvas.height, effect.particles),
        )
      }
    }

    // 파티클 업데이트 및 렌더링
    this.ctx.save()
    this.particles.forEach((particle) => {
      particle.update()
      particle.render(this.ctx)
    })
    this.ctx.restore()

    // 죽은 파티클 제거
    this.particles = this.particles.filter((p) => p.isAlive())
  }

  // 글로우 이펙트 적용
  applyGlowEffect(intensity: number, color: string): void {
    this.ctx.save()
    this.ctx.globalCompositeOperation = "screen"
    this.ctx.shadowColor = color
    this.ctx.shadowBlur = intensity
    this.ctx.globalAlpha = 0.3
    this.ctx.drawImage(this.canvas, 0, 0)
    this.ctx.restore()
  }

  // 비네팅 이펙트
  applyVignette(intensity: number): void {
    const centerX = this.canvas.width / 2
    const centerY = this.canvas.height / 2
    const radius = Math.max(centerX, centerY)

    const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
    gradient.addColorStop(0, `rgba(0,0,0,0)`)
    gradient.addColorStop(1, `rgba(0,0,0,${intensity / 100})`)

    this.ctx.save()
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.restore()
  }

  // 기본 필터 프리셋들
  static getDefaultPresets(): FilterPreset[] {
    return [
      {
        id: "natural",
        name: "내추럴",
        description: "자연스러운 피부 보정",
        thumbnail: "/placeholder.svg?height=100&width=100",
        filters: [],
        adjustments: {
          smoothing: 20,
          whitening: 10,
          brightness: 5,
          saturation: 10,
        },
        effects: [],
        likes: 1250,
        downloads: 5600,
        tags: ["natural", "daily", "soft"],
      },
      {
        id: "glam",
        name: "글램",
        description: "화려하고 드라마틱한 룩",
        thumbnail: "/placeholder.svg?height=100&width=100",
        filters: [],
        adjustments: {
          smoothing: 40,
          whitening: 25,
          eyeEnlarge: 15,
          contrast: 20,
          saturation: 30,
        },
        effects: [
          {
            id: "sparkle",
            name: "반짝임",
            type: "particles",
            particles: {
              count: 20,
              size: 3,
              speed: 1,
              color: "#FFD700",
              shape: "sparkle",
            },
          },
        ],
        likes: 2890,
        downloads: 12400,
        tags: ["glam", "party", "dramatic"],
      },
      {
        id: "vintage",
        name: "빈티지",
        description: "레트로 감성의 필름 느낌",
        thumbnail: "/placeholder.svg?height=100&width=100",
        filters: [],
        adjustments: {
          brightness: -10,
          contrast: 15,
          saturation: -20,
          warmth: 30,
          vignette: 40,
        },
        effects: [],
        likes: 1680,
        downloads: 7200,
        tags: ["vintage", "retro", "film"],
      },
      {
        id: "kawaii",
        name: "카와이",
        description: "귀여운 애니메이션 스타일",
        thumbnail: "/placeholder.svg?height=100&width=100",
        filters: [],
        adjustments: {
          smoothing: 60,
          whitening: 40,
          eyeEnlarge: 30,
          brightness: 15,
          saturation: 25,
        },
        effects: [
          {
            id: "hearts",
            name: "하트",
            type: "particles",
            particles: {
              count: 15,
              size: 8,
              speed: 0.5,
              color: "#FF69B4",
              shape: "heart",
            },
          },
        ],
        likes: 3450,
        downloads: 18900,
        tags: ["kawaii", "cute", "anime"],
      },
      {
        id: "sunset",
        name: "선셋",
        description: "따뜻한 석양 분위기",
        thumbnail: "/placeholder.svg?height=100&width=100",
        filters: [],
        adjustments: {
          smoothing: 25,
          brightness: 10,
          warmth: 50,
          saturation: 20,
          vignette: 20,
        },
        effects: [],
        likes: 2100,
        downloads: 9800,
        tags: ["sunset", "warm", "golden"],
      },
    ]
  }
}

// 파티클 클래스
class Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  shape: string

  constructor(x: number, y: number, config: any) {
    this.x = x
    this.y = y
    this.vx = (Math.random() - 0.5) * config.speed
    this.vy = (Math.random() - 0.5) * config.speed
    this.life = 1
    this.maxLife = 60 + Math.random() * 60
    this.size = config.size + Math.random() * config.size
    this.color = config.color
    this.shape = config.shape
  }

  update(): void {
    this.x += this.vx
    this.y += this.vy
    this.life--

    // 중력 효과
    this.vy += 0.01

    // 화면 경계에서 반사
    if (this.x < 0 || this.x > 640) this.vx *= -1
    if (this.y < 0 || this.y > 480) this.vy *= -1
  }

  render(ctx: CanvasRenderingContext2D): void {
    const alpha = this.life / this.maxLife
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = this.color

    switch (this.shape) {
      case "circle":
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
        break
      case "heart":
        this.drawHeart(ctx)
        break
      case "star":
        this.drawStar(ctx)
        break
      case "sparkle":
        this.drawSparkle(ctx)
        break
    }
    ctx.restore()
  }

  private drawHeart(ctx: CanvasRenderingContext2D): void {
    const size = this.size
    ctx.beginPath()
    ctx.moveTo(this.x, this.y + size / 4)
    ctx.bezierCurveTo(this.x, this.y, this.x - size / 2, this.y, this.x - size / 2, this.y + size / 4)
    ctx.bezierCurveTo(this.x - size / 2, this.y + size / 2, this.x, this.y + size, this.x, this.y + size)
    ctx.bezierCurveTo(this.x, this.y + size, this.x + size / 2, this.y + size / 2, this.x + size / 2, this.y + size / 4)
    ctx.bezierCurveTo(this.x + size / 2, this.y, this.x, this.y, this.x, this.y + size / 4)
    ctx.fill()
  }

  private drawStar(ctx: CanvasRenderingContext2D): void {
    const size = this.size
    const spikes = 5
    const outerRadius = size
    const innerRadius = size / 2

    ctx.beginPath()
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius
      const angle = (i * Math.PI) / spikes
      const x = this.x + Math.cos(angle) * radius
      const y = this.y + Math.sin(angle) * radius
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fill()
  }

  private drawSparkle(ctx: CanvasRenderingContext2D): void {
    const size = this.size
    ctx.beginPath()
    ctx.moveTo(this.x, this.y - size)
    ctx.lineTo(this.x, this.y + size)
    ctx.moveTo(this.x - size, this.y)
    ctx.lineTo(this.x + size, this.y)
    ctx.moveTo(this.x - size * 0.7, this.y - size * 0.7)
    ctx.lineTo(this.x + size * 0.7, this.y + size * 0.7)
    ctx.moveTo(this.x + size * 0.7, this.y - size * 0.7)
    ctx.lineTo(this.x - size * 0.7, this.y + size * 0.7)
    ctx.stroke()
  }

  isAlive(): boolean {
    return this.life > 0
  }
}
