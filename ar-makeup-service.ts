import { collection, addDoc, getDocs, query, where, orderBy, limit } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "./firebase"
import type { MakeupFilter, ARMakeupSession, FaceLandmarks } from "@/types/ar-makeup"

export class ARMakeupService {
  // 얼굴 랜드마크 감지 (시뮬레이션)
  static async detectFaceLandmarks(imageData: ImageData): Promise<FaceLandmarks | null> {
    try {
      // 실제로는 MediaPipe나 TensorFlow.js를 사용하여 얼굴 랜드마크를 감지
      // 여기서는 시뮬레이션된 랜드마크를 반환

      const width = imageData.width
      const height = imageData.height

      // 얼굴이 중앙에 있다고 가정하고 랜드마크 위치 계산
      const centerX = width / 2
      const centerY = height / 2

      const landmarks: FaceLandmarks = {
        leftEye: { x: centerX - 60, y: centerY - 40 },
        rightEye: { x: centerX + 60, y: centerY - 40 },
        nose: { x: centerX, y: centerY },
        mouth: { x: centerX, y: centerY + 60 },
        leftCheek: { x: centerX - 80, y: centerY + 20 },
        rightCheek: { x: centerX + 80, y: centerY + 20 },
        forehead: { x: centerX, y: centerY - 80 },
        chin: { x: centerX, y: centerY + 100 },
      }

      return landmarks
    } catch (error) {
      console.error("Error detecting face landmarks:", error)
      return null
    }
  }

  // 메이크업 필터 적용
  static applyMakeupFilter(canvas: HTMLCanvasElement, filter: MakeupFilter, landmarks: FaceLandmarks): void {
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.save()

    // 필터 강도에 따른 투명도 설정
    ctx.globalAlpha = filter.intensity / 100

    switch (filter.category) {
      case "foundation":
        this.applyFoundation(ctx, landmarks, filter)
        break
      case "lipstick":
        this.applyLipstick(ctx, landmarks, filter)
        break
      case "eyeshadow":
        this.applyEyeshadow(ctx, landmarks, filter)
        break
      case "blush":
        this.applyBlush(ctx, landmarks, filter)
        break
      case "eyeliner":
        this.applyEyeliner(ctx, landmarks, filter)
        break
      case "eyebrow":
        this.applyEyebrow(ctx, landmarks, filter)
        break
    }

    ctx.restore()
  }

  private static applyFoundation(ctx: CanvasRenderingContext2D, landmarks: FaceLandmarks, filter: MakeupFilter): void {
    const gradient = ctx.createRadialGradient(
      landmarks.nose.x,
      landmarks.nose.y,
      0,
      landmarks.nose.x,
      landmarks.nose.y,
      120,
    )
    gradient.addColorStop(0, filter.color + "80")
    gradient.addColorStop(1, filter.color + "20")

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.ellipse(landmarks.nose.x, landmarks.nose.y, 100, 120, 0, 0, 2 * Math.PI)
    ctx.fill()
  }

  private static applyLipstick(ctx: CanvasRenderingContext2D, landmarks: FaceLandmarks, filter: MakeupFilter): void {
    ctx.fillStyle = filter.color
    ctx.beginPath()
    ctx.ellipse(landmarks.mouth.x, landmarks.mouth.y, 25, 12, 0, 0, 2 * Math.PI)
    ctx.fill()
  }

  private static applyEyeshadow(ctx: CanvasRenderingContext2D, landmarks: FaceLandmarks, filter: MakeupFilter): void {
    // 왼쪽 눈
    const leftGradient = ctx.createRadialGradient(
      landmarks.leftEye.x,
      landmarks.leftEye.y,
      0,
      landmarks.leftEye.x,
      landmarks.leftEye.y,
      30,
    )
    leftGradient.addColorStop(0, filter.color + "60")
    leftGradient.addColorStop(1, filter.color + "10")

    ctx.fillStyle = leftGradient
    ctx.beginPath()
    ctx.ellipse(landmarks.leftEye.x, landmarks.leftEye.y - 10, 35, 20, 0, 0, 2 * Math.PI)
    ctx.fill()

    // 오른쪽 눈
    const rightGradient = ctx.createRadialGradient(
      landmarks.rightEye.x,
      landmarks.rightEye.y,
      0,
      landmarks.rightEye.x,
      landmarks.rightEye.y,
      30,
    )
    rightGradient.addColorStop(0, filter.color + "60")
    rightGradient.addColorStop(1, filter.color + "10")

    ctx.fillStyle = rightGradient
    ctx.beginPath()
    ctx.ellipse(landmarks.rightEye.x, landmarks.rightEye.y - 10, 35, 20, 0, 0, 2 * Math.PI)
    ctx.fill()
  }

  private static applyBlush(ctx: CanvasRenderingContext2D, landmarks: FaceLandmarks, filter: MakeupFilter): void {
    // 왼쪽 볼
    const leftGradient = ctx.createRadialGradient(
      landmarks.leftCheek.x,
      landmarks.leftCheek.y,
      0,
      landmarks.leftCheek.x,
      landmarks.leftCheek.y,
      40,
    )
    leftGradient.addColorStop(0, filter.color + "40")
    leftGradient.addColorStop(1, filter.color + "00")

    ctx.fillStyle = leftGradient
    ctx.beginPath()
    ctx.ellipse(landmarks.leftCheek.x, landmarks.leftCheek.y, 30, 25, 0, 0, 2 * Math.PI)
    ctx.fill()

    // 오른쪽 볼
    const rightGradient = ctx.createRadialGradient(
      landmarks.rightCheek.x,
      landmarks.rightCheek.y,
      0,
      landmarks.rightCheek.x,
      landmarks.rightCheek.y,
      40,
    )
    rightGradient.addColorStop(0, filter.color + "40")
    rightGradient.addColorStop(1, filter.color + "00")

    ctx.fillStyle = rightGradient
    ctx.beginPath()
    ctx.ellipse(landmarks.rightCheek.x, landmarks.rightCheek.y, 30, 25, 0, 0, 2 * Math.PI)
    ctx.fill()
  }

  private static applyEyeliner(ctx: CanvasRenderingContext2D, landmarks: FaceLandmarks, filter: MakeupFilter): void {
    ctx.strokeStyle = filter.color
    ctx.lineWidth = 3
    ctx.lineCap = "round"

    // 왼쪽 아이라이너
    ctx.beginPath()
    ctx.moveTo(landmarks.leftEye.x - 25, landmarks.leftEye.y)
    ctx.lineTo(landmarks.leftEye.x + 25, landmarks.leftEye.y)
    ctx.stroke()

    // 오른쪽 아이라이너
    ctx.beginPath()
    ctx.moveTo(landmarks.rightEye.x - 25, landmarks.rightEye.y)
    ctx.lineTo(landmarks.rightEye.x + 25, landmarks.rightEye.y)
    ctx.stroke()
  }

  private static applyEyebrow(ctx: CanvasRenderingContext2D, landmarks: FaceLandmarks, filter: MakeupFilter): void {
    ctx.strokeStyle = filter.color
    ctx.lineWidth = 2
    ctx.lineCap = "round"

    // 왼쪽 눈썹
    ctx.beginPath()
    ctx.moveTo(landmarks.leftEye.x - 30, landmarks.leftEye.y - 25)
    ctx.lineTo(landmarks.leftEye.x + 30, landmarks.leftEye.y - 30)
    ctx.stroke()

    // 오른쪽 눈썹
    ctx.beginPath()
    ctx.moveTo(landmarks.rightEye.x - 30, landmarks.rightEye.y - 30)
    ctx.lineTo(landmarks.rightEye.x + 30, landmarks.rightEye.y - 25)
    ctx.stroke()
  }

  // 기본 메이크업 필터들
  static getDefaultFilters(): MakeupFilter[] {
    return [
      {
        id: "foundation-1",
        name: "내추럴 파운데이션",
        category: "foundation",
        color: "#F5DEB3",
        intensity: 30,
        imageUrl: "/placeholder.svg?height=100&width=100",
      },
      {
        id: "lipstick-1",
        name: "코랄 립스틱",
        category: "lipstick",
        color: "#FF7F7F",
        intensity: 70,
        imageUrl: "/placeholder.svg?height=100&width=100",
      },
      {
        id: "lipstick-2",
        name: "레드 립스틱",
        category: "lipstick",
        color: "#DC143C",
        intensity: 80,
        imageUrl: "/placeholder.svg?height=100&width=100",
      },
      {
        id: "eyeshadow-1",
        name: "브라운 아이섀도우",
        category: "eyeshadow",
        color: "#8B4513",
        intensity: 50,
        imageUrl: "/placeholder.svg?height=100&width=100",
      },
      {
        id: "eyeshadow-2",
        name: "핑크 아이섀도우",
        category: "eyeshadow",
        color: "#FFB6C1",
        intensity: 60,
        imageUrl: "/placeholder.svg?height=100&width=100",
      },
      {
        id: "blush-1",
        name: "피치 블러셔",
        category: "blush",
        color: "#FFCBA4",
        intensity: 40,
        imageUrl: "/placeholder.svg?height=100&width=100",
      },
      {
        id: "eyeliner-1",
        name: "블랙 아이라이너",
        category: "eyeliner",
        color: "#000000",
        intensity: 90,
        imageUrl: "/placeholder.svg?height=100&width=100",
      },
      {
        id: "eyebrow-1",
        name: "브라운 아이브로우",
        category: "eyebrow",
        color: "#654321",
        intensity: 70,
        imageUrl: "/placeholder.svg?height=100&width=100",
      },
    ]
  }

  // AR 세션 저장
  static async saveARSession(session: Omit<ARMakeupSession, "id">): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "arMakeupSessions"), {
        ...session,
        timestamp: new Date(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error saving AR session:", error)
      throw error
    }
  }

  // 캡처된 이미지 업로드
  static async uploadCapturedImage(userId: string, imageBlob: Blob): Promise<string> {
    try {
      const storageRef = ref(storage, `users/${userId}/ar-captures/${Date.now()}.jpg`)
      await uploadBytes(storageRef, imageBlob)
      return await getDownloadURL(storageRef)
    } catch (error) {
      console.error("Error uploading captured image:", error)
      throw error
    }
  }

  // 사용자의 AR 세션 기록 가져오기
  static async getUserARSessions(userId: string): Promise<ARMakeupSession[]> {
    try {
      const q = query(
        collection(db, "arMakeupSessions"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(20),
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as ARMakeupSession[]
    } catch (error) {
      console.error("Error getting AR sessions:", error)
      return []
    }
  }
}
