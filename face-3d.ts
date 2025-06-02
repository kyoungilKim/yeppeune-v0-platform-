export interface Face3DLandmarks {
  // 468개의 3D 랜드마크 포인트 (MediaPipe Face Mesh 기준)
  landmarks: Array<{
    x: number
    y: number
    z: number
    visibility?: number
  }>

  // 얼굴 영역별 인덱스
  regions: {
    face: number[]
    leftEye: number[]
    rightEye: number[]
    leftEyebrow: number[]
    rightEyebrow: number[]
    nose: number[]
    lips: number[]
    leftCheek: number[]
    rightCheek: number[]
    forehead: number[]
    chin: number[]
  }

  // 얼굴 방향과 각도
  pose: {
    pitch: number // 위아래 각도
    yaw: number // 좌우 각도
    roll: number // 기울기 각도
  }

  // 얼굴 크기와 위치
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface Advanced3DMakeup {
  id: string
  name: string
  category: "foundation" | "lipstick" | "eyeshadow" | "blush" | "eyeliner" | "eyebrow" | "highlighter" | "contour"

  // 3D 텍스처 정보
  texture: {
    diffuseMap: string // 기본 색상 텍스처
    normalMap?: string // 노멀 맵 (굴곡 표현)
    roughnessMap?: string // 거칠기 맵
    metallicMap?: string // 메탈릭 맵
    opacityMap?: string // 투명도 맵
  }

  // 재질 속성
  material: {
    color: string
    opacity: number
    roughness: number
    metallic: number
    emissive: string
    shininess: number
  }

  // 적용 영역과 블렌딩
  application: {
    targetRegions: string[]
    blendMode: "normal" | "multiply" | "overlay" | "soft-light" | "color-dodge"
    featherRadius: number
    intensity: number
  }

  // 조명 반응
  lighting: {
    receiveShadows: boolean
    castShadows: boolean
    subsurfaceScattering: number
  }
}

export interface Face3DTracking {
  isTracking: boolean
  confidence: number
  landmarks: Face3DLandmarks | null
  faceCount: number
  processingTime: number
}
