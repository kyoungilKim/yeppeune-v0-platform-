"use client"

import { useRef, useEffect, useState, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Environment, OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei"
import * as THREE from "three"
import { Face3DTracker } from "@/lib/face-3d-tracker"
import type { Face3DLandmarks } from "@/types/face-3d"
import type { HairModel, HairColor, HairStylingParams, HairSimulationSettings } from "@/types/hair-styling"

interface Hair3DModelProps {
  hairModel: HairModel
  hairColor: HairColor
  stylingParams: HairStylingParams
  landmarks: Face3DLandmarks | null
  simulationSettings: HairSimulationSettings
}

function Hair3DModel({ hairModel, hairColor, stylingParams, landmarks, simulationSettings }: Hair3DModelProps) {
  const { scene } = useThree()
  const modelRef = useRef<THREE.Group>(null)
  const { scene: modelScene } = useGLTF(hairModel.modelUrl)

  // 헤어 모델 복제
  const hairModelScene = useMemo(() => {
    return modelScene.clone()
  }, [modelScene])

  // 헤어 컬러 적용
  useEffect(() => {
    if (hairModelScene) {
      hairModelScene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          // 기존 재질 복제
          const material = child.material.clone()

          // 헤어 컬러 적용
          if (material instanceof THREE.MeshStandardMaterial) {
            material.color.set(hairColor.hexColor)

            // 스타일링 파라미터에 따른 재질 조정
            material.roughness = 1 - stylingParams.curl / 200 // 컬이 많을수록 광택이 증가
            material.metalness = 0.1 + stylingParams.volume / 500 // 볼륨에 따른 미세 조정

            // 하이라이트 적용
            if (stylingParams.highlights) {
              // 실제로는 여기서 셰이더나 텍스처를 사용하여 하이라이트 구현
              // 간단한 구현을 위해 생략
            }

            child.material = material
          }
        }
      })
    }
  }, [hairModelScene, hairColor, stylingParams])

  // 헤어 스타일링 파라미터 적용
  useEffect(() => {
    if (modelRef.current && hairModelScene) {
      // 볼륨 적용
      const volumeScale = 1 + stylingParams.volume / 200
      modelRef.current.scale.set(volumeScale, 1, volumeScale)

      // 길이 적용
      const lengthScale = 0.7 + stylingParams.length / 100
      modelRef.current.scale.y = lengthScale

      // 레이어링 및 기타 스타일링 파라미터는
      // 실제로는 모델의 버텍스를 조작하거나 모핑을 통해 구현
    }
  }, [stylingParams, hairModelScene])

  // 얼굴 방향에 따른 헤어 위치 조정
  useFrame(() => {
    if (modelRef.current && landmarks) {
      const tracker = Face3DTracker.getInstance()
      const orientation = tracker.calculateFaceOrientation(landmarks)

      // 얼굴 방향에 맞춰 헤어 회전
      modelRef.current.rotation.copy(orientation)

      // 얼굴 위치에 맞춰 헤어 위치 조정
      if (landmarks.position) {
        modelRef.current.position.set(
          landmarks.position.x,
          landmarks.position.y + 0.1, // 약간 위로 조정
          landmarks.position.z,
        )
      }
    }
  })

  // 물리 시뮬레이션 (바람, 중력 등에 반응)
  useFrame((state) => {
    if (modelRef.current && simulationSettings.physics.wind > 0) {
      // 시간에 따른 바람 효과 시뮬레이션
      const time = state.clock.getElapsedTime()
      const windForce = (Math.sin(time) * simulationSettings.physics.wind) / 100

      // 실제로는 여기서 헤어 물리 시뮬레이션 구현
      // 간단한 구현을 위해 미세한 회전으로 시뮬레이션
      modelRef.current.rotation.z += windForce * 0.001
    }
  })

  return (
    <group ref={modelRef}>
      <primitive object={hairModelScene} />
    </group>
  )
}

interface Hair3DRendererProps {
  videoElement: HTMLVideoElement | null
  hairModel: HairModel
  hairColor: HairColor
  stylingParams: HairStylingParams
  simulationSettings: HairSimulationSettings
  onFaceTracking?: (tracking: any) => void
}

export default function Hair3DRenderer({
  videoElement,
  hairModel,
  hairColor,
  stylingParams,
  simulationSettings,
  onFaceTracking,
}: Hair3DRendererProps) {
  const [landmarks, setLandmarks] = useState<Face3DLandmarks | null>(null)
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null)
  const [isTracking, setIsTracking] = useState(false)

  // 비디오 텍스처 생성
  useEffect(() => {
    if (videoElement) {
      const texture = new THREE.VideoTexture(videoElement)
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.format = THREE.RGBFormat
      setVideoTexture(texture)
    }
  }, [videoElement])

  // 얼굴 추적 루프
  useEffect(() => {
    if (!videoElement) return

    const tracker = Face3DTracker.getInstance()
    let animationId: number

    const trackFace = async () => {
      try {
        const tracking = await tracker.detectFace3D(videoElement)

        if (tracking.isTracking && tracking.landmarks) {
          setLandmarks(tracking.landmarks)
          setIsTracking(true)
        } else {
          setIsTracking(false)
        }

        onFaceTracking?.(tracking)
      } catch (error) {
        console.error("Face tracking error:", error)
        setIsTracking(false)
      }

      animationId = requestAnimationFrame(trackFace)
    }

    trackFace()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [videoElement, onFaceTracking])

  // 환경 프리셋 설정
  const environmentPreset = useMemo(() => {
    // 렌더링 품질에 따라 환경 프리셋 조정
    switch (simulationSettings.quality) {
      case "ultra":
        return "apartment"
      case "high":
        return "studio"
      case "medium":
        return "lobby"
      case "low":
        return "warehouse"
      default:
        return "studio"
    }
  }, [simulationSettings.quality])

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows={simulationSettings.renderSettings.shadows}
        dpr={[1, simulationSettings.quality === "ultra" ? 2 : 1.5]}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />

        {/* 조명 설정 */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={0.8}
          castShadow={simulationSettings.renderSettings.shadows}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-5, 5, 5]} intensity={0.4} />

        {/* 환경 맵 */}
        <Environment preset={environmentPreset} />

        {/* 얼굴 비디오 텍스처 */}
        {videoTexture && landmarks && (
          <mesh position={[0, 0, -0.1]}>
            <planeGeometry args={[5, 5]} />
            <meshBasicMaterial map={videoTexture} transparent opacity={0.9} />
          </mesh>
        )}

        {/* 3D 헤어 모델 */}
        <Hair3DModel
          hairModel={hairModel}
          hairColor={hairColor}
          stylingParams={stylingParams}
          landmarks={landmarks}
          simulationSettings={simulationSettings}
        />

        {/* 카메라 컨트롤 */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>

      {/* 추적 상태 표시 */}
      <div className="absolute top-4 left-4 z-10">
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            isTracking ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          {isTracking ? "얼굴 추적 중" : "얼굴을 찾는 중..."}
        </div>
      </div>
    </div>
  )
}
