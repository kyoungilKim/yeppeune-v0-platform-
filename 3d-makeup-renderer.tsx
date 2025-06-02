"use client"

import { useRef, useEffect, useState, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Environment, OrbitControls, PerspectiveCamera } from "@react-three/drei"
import * as THREE from "three"
import { Face3DTracker } from "@/lib/face-3d-tracker"
import type { Face3DLandmarks, Advanced3DMakeup } from "@/types/face-3d"

interface Face3DMeshProps {
  landmarks: Face3DLandmarks | null
  appliedMakeup: Advanced3DMakeup[]
  videoTexture: THREE.VideoTexture | null
}

function Face3DMesh({ landmarks, appliedMakeup, videoTexture }: Face3DMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { scene } = useThree()

  // 얼굴 메쉬 생성
  const faceGeometry = useMemo(() => {
    if (!landmarks) return new THREE.PlaneGeometry(2, 2)

    const tracker = Face3DTracker.getInstance()
    return tracker.createFaceMesh(landmarks)
  }, [landmarks])

  // 기본 얼굴 재질
  const baseMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: videoTexture,
      transparent: true,
      side: THREE.DoubleSide,
    })
  }, [videoTexture])

  // 메이크업 레이어들
  const makeupLayers = useMemo(() => {
    return appliedMakeup.map((makeup, index) => {
      const material = new THREE.MeshStandardMaterial({
        color: makeup.material.color,
        transparent: true,
        opacity: makeup.material.opacity,
        roughness: makeup.material.roughness,
        metalness: makeup.material.metallic,
        emissive: new THREE.Color(makeup.material.emissive),
      })

      // 텍스처 로딩
      if (makeup.texture.diffuseMap) {
        const textureLoader = new THREE.TextureLoader()
        material.map = textureLoader.load(makeup.texture.diffuseMap)
      }

      return {
        id: makeup.id,
        material,
        geometry: faceGeometry.clone(),
        category: makeup.category,
        blendMode: makeup.application.blendMode,
      }
    })
  }, [appliedMakeup, faceGeometry])

  // 얼굴 방향 업데이트
  useFrame(() => {
    if (meshRef.current && landmarks) {
      const tracker = Face3DTracker.getInstance()
      const orientation = tracker.calculateFaceOrientation(landmarks)
      meshRef.current.rotation.copy(orientation)
    }
  })

  return (
    <group>
      {/* 기본 얼굴 메쉬 */}
      <mesh ref={meshRef} geometry={faceGeometry} material={baseMaterial} />

      {/* 메이크업 레이어들 */}
      {makeupLayers.map((layer, index) => (
        <mesh
          key={layer.id}
          geometry={layer.geometry}
          material={layer.material}
          position={[0, 0, 0.001 * (index + 1)]} // 레이어 순서
        />
      ))}
    </group>
  )
}

interface Makeup3DRendererProps {
  videoElement: HTMLVideoElement | null
  appliedMakeup: Advanced3DMakeup[]
  onFaceTracking?: (tracking: any) => void
}

export default function Makeup3DRenderer({ videoElement, appliedMakeup, onFaceTracking }: Makeup3DRendererProps) {
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

  return (
    <div className="w-full h-full relative">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />

        {/* 조명 설정 */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-5, 5, 5]} intensity={0.4} />

        {/* 환경 맵 */}
        <Environment preset="studio" />

        {/* 3D 얼굴 메쉬 */}
        <Face3DMesh landmarks={landmarks} appliedMakeup={appliedMakeup} videoTexture={videoTexture} />

        {/* 카메라 컨트롤 */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
      </Canvas>

      {/* 추적 상태 표시 */}
      <div className="absolute top-4 left-4 z-10">
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            isTracking ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          {isTracking ? "3D 얼굴 추적 중" : "얼굴을 찾는 중..."}
        </div>
      </div>

      {/* 랜드마크 정보 */}
      {landmarks && (
        <div className="absolute bottom-4 left-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded text-xs">
          <div>랜드마크: {landmarks.landmarks.length}개</div>
          <div>
            각도: P{landmarks.pose.pitch.toFixed(1)}° Y{landmarks.pose.yaw.toFixed(1)}° R
            {landmarks.pose.roll.toFixed(1)}°
          </div>
        </div>
      )}
    </div>
  )
}
