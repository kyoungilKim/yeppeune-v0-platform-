import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "./firebase"
import type {
  HairModel,
  HairColor,
  HairStylePreset,
  HairSimulationSettings,
  HairStylingSession,
  HairRecommendation,
} from "@/types/hair-styling"

export class HairStylingService {
  // 기본 헤어 모델 가져오기
  static async getHairModels(filters?: { category?: string; gender?: "female" | "male" | "unisex" }): Promise<
    HairModel[]
  > {
    try {
      let q = collection(db, "hairModels")

      // 필터링 적용
      if (filters?.category) {
        q = query(q, where("category", "==", filters.category))
      }

      if (filters?.gender) {
        q = query(q, where("supportedGenders", "array-contains", filters.gender))
      }

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as HairModel[]
    } catch (error) {
      console.error("Error getting hair models:", error)
      return this.getDefaultHairModels()
    }
  }

  // 기본 헤어 컬러 가져오기
  static async getHairColors(category?: string): Promise<HairColor[]> {
    try {
      let q = collection(db, "hairColors")

      if (category) {
        q = query(q, where("category", "==", category))
      }

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as HairColor[]
    } catch (error) {
      console.error("Error getting hair colors:", error)
      return this.getDefaultHairColors()
    }
  }

  // 인기 헤어 스타일 프리셋 가져오기
  static async getPopularHairPresets(limit = 10): Promise<HairStylePreset[]> {
    try {
      const q = query(collection(db, "hairPresets"), orderBy("popularity", "desc"), limit(limit))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as HairStylePreset[]
    } catch (error) {
      console.error("Error getting hair presets:", error)
      return this.getDefaultHairPresets()
    }
  }

  // 헤어 스타일링 세션 저장
  static async saveHairStylingSession(session: Omit<HairStylingSession, "id">): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "hairStylingSessions"), {
        ...session,
        timestamp: new Date(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error saving hair styling session:", error)
      throw error
    }
  }

  // 캡처된 이미지 업로드
  static async uploadCapturedImage(userId: string, imageBlob: Blob): Promise<string> {
    try {
      const storageRef = ref(storage, `users/${userId}/hair-styling/${Date.now()}.jpg`)
      await uploadBytes(storageRef, imageBlob)
      return await getDownloadURL(storageRef)
    } catch (error) {
      console.error("Error uploading captured image:", error)
      throw error
    }
  }

  // 얼굴형에 맞는 헤어 스타일 추천
  static async getHairRecommendations(
    faceShape: string,
    preferences?: { length?: string; style?: string },
  ): Promise<HairRecommendation[]> {
    try {
      // 실제로는 AI 모델이나 규칙 기반 시스템을 사용하여 추천
      // 여기서는 간단한 시뮬레이션 구현
      const recommendations: HairRecommendation[] = []

      const models = await this.getHairModels()
      const colors = await this.getHairColors()

      // 얼굴형에 따른 추천 로직 (간단한 예시)
      const recommendedStyles = this.getRecommendedStylesForFaceShape(faceShape, preferences)

      for (const style of recommendedStyles) {
        const model = models.find((m) => m.category === style.category)
        const color = colors.find((c) => c.category === "natural")

        if (model && color) {
          recommendations.push({
            hairStyle: model,
            color: color,
            confidence: style.confidence,
            reason: style.reason,
            faceShape: faceShape,
          })
        }
      }

      return recommendations
    } catch (error) {
      console.error("Error getting hair recommendations:", error)
      return []
    }
  }

  // 얼굴형에 따른 추천 스타일 (간단한 규칙 기반 시스템)
  private static getRecommendedStylesForFaceShape(
    faceShape: string,
    preferences?: { length?: string; style?: string },
  ): { category: string; confidence: number; reason: string }[] {
    switch (faceShape.toLowerCase()) {
      case "oval":
        return [
          {
            category: "medium",
            confidence: 0.9,
            reason:
              "타원형 얼굴은 대부분의 헤어스타일과 잘 어울립니다. 중간 길이의 레이어드 컷이 자연스러운 볼륨감을 줍니다.",
          },
          {
            category: "long",
            confidence: 0.85,
            reason: "긴 웨이브 스타일은 타원형 얼굴의 균형잡힌 비율을 더욱 돋보이게 합니다.",
          },
        ]
      case "round":
        return [
          {
            category: "long",
            confidence: 0.9,
            reason: "긴 레이어드 스타일은 둥근 얼굴을 시각적으로 길어 보이게 하는 효과가 있습니다.",
          },
          {
            category: "wavy",
            confidence: 0.85,
            reason: "웨이브가 있는 스타일은 얼굴 윤곽을 부드럽게 하면서도 길어 보이게 합니다.",
          },
        ]
      case "square":
        return [
          {
            category: "wavy",
            confidence: 0.9,
            reason: "부드러운 웨이브는 각진 얼굴형의 날카로운 윤곽을 부드럽게 만들어줍니다.",
          },
          {
            category: "medium",
            confidence: 0.85,
            reason: "어깨 길이의 레이어드 컷은 각진 턱선을 부드럽게 만들어줍니다.",
          },
        ]
      case "heart":
        return [
          {
            category: "short",
            confidence: 0.9,
            reason: "짧은 밥 컷은 하트형 얼굴의 넓은 이마와 좁은 턱선의 균형을 맞춰줍니다.",
          },
          {
            category: "medium",
            confidence: 0.85,
            reason: "턱선 길이의 컷은 얼굴형의 균형을 잡아주고 부드러운 느낌을 줍니다.",
          },
        ]
      case "diamond":
        return [
          {
            category: "medium",
            confidence: 0.9,
            reason: "중간 길이의 레이어드 컷은 다이아몬드형 얼굴의 광대뼈를 부드럽게 만들어줍니다.",
          },
          {
            category: "curly",
            confidence: 0.85,
            reason: "볼륨감 있는 컬은 좁은 이마와 턱을 보완해줍니다.",
          },
        ]
      default:
        return [
          {
            category: "medium",
            confidence: 0.8,
            reason: "중간 길이의 레이어드 컷은 대부분의 얼굴형에 잘 어울립니다.",
          },
          {
            category: "wavy",
            confidence: 0.75,
            reason: "자연스러운 웨이브는 부드러운 인상을 주며 다양한 얼굴형에 적합합니다.",
          },
        ]
    }
  }

  // 기본 헤어 모델 (Firebase 연결 실패 시 폴백)
  static getDefaultHairModels(): HairModel[] {
    return [
      {
        id: "short-bob",
        name: "숏 보브",
        category: "short",
        thumbnail: "/placeholder.svg?height=200&width=200",
        modelUrl: "/models/hair/short-bob.glb",
        supportedGenders: ["female", "unisex"],
        defaultColor: "#5E3719",
        description: "턱선 길이의 클래식한 보브 스타일",
      },
      {
        id: "medium-layered",
        name: "미디엄 레이어드",
        category: "medium",
        thumbnail: "/placeholder.svg?height=200&width=200",
        modelUrl: "/models/hair/medium-layered.glb",
        supportedGenders: ["female", "unisex"],
        defaultColor: "#3B2314",
        description: "어깨 길이의 자연스러운 레이어드 컷",
      },
      {
        id: "long-straight",
        name: "롱 스트레이트",
        category: "long",
        thumbnail: "/placeholder.svg?height=200&width=200",
        modelUrl: "/models/hair/long-straight.glb",
        supportedGenders: ["female", "unisex"],
        defaultColor: "#1C1008",
        description: "등 아래까지 내려오는 긴 생머리",
      },
      {
        id: "curly-medium",
        name: "컬리 미디엄",
        category: "curly",
        thumbnail: "/placeholder.svg?height=200&width=200",
        modelUrl: "/models/hair/curly-medium.glb",
        supportedGenders: ["female", "unisex"],
        defaultColor: "#4A3520",
        description: "자연스러운 웨이브가 있는 중간 길이 스타일",
      },
      {
        id: "pixie-cut",
        name: "픽시 컷",
        category: "short",
        thumbnail: "/placeholder.svg?height=200&width=200",
        modelUrl: "/models/hair/pixie-cut.glb",
        supportedGenders: ["female", "unisex"],
        defaultColor: "#2C1A0E",
        description: "짧고 경쾌한 픽시 컷 스타일",
      },
      {
        id: "undercut",
        name: "언더컷",
        category: "short",
        thumbnail: "/placeholder.svg?height=200&width=200",
        modelUrl: "/models/hair/undercut.glb",
        supportedGenders: ["male", "unisex"],
        defaultColor: "#1C1008",
        description: "양옆은 짧고 윗부분은 긴 모던한 스타일",
      },
      {
        id: "pompadour",
        name: "포마드",
        category: "medium",
        thumbnail: "/placeholder.svg?height=200&width=200",
        modelUrl: "/models/hair/pompadour.glb",
        supportedGenders: ["male", "unisex"],
        defaultColor: "#2C1A0E",
        description: "앞머리를 높게 올린 클래식한 스타일",
      },
    ]
  }

  // 기본 헤어 컬러 (Firebase 연결 실패 시 폴백)
  static getDefaultHairColors(): HairColor[] {
    return [
      {
        id: "natural-black",
        name: "내추럴 블랙",
        hexColor: "#0A0A0A",
        category: "natural",
        thumbnail: "/placeholder.svg?height=100&width=100",
      },
      {
        id: "dark-brown",
        name: "다크 브라운",
        hexColor: "#2C1A0E",
        category: "natural",
        thumbnail: "/placeholder.svg?height=100&width=100",
      },
      {
        id: "medium-brown",
        name: "미디엄 브라운",
        hexColor: "#4A3520",
        category: "natural",
        thumbnail: "/placeholder.svg?height=100&width=100",
      },
      {
        id: "light-brown",
        name: "라이트 브라운",
        hexColor: "#7B5C3F",
        category: "natural",
        thumbnail: "/placeholder.svg?height=100&width=100",
      },
      {
        id: "blonde",
        name: "블론드",
        hexColor: "#D7B740",
        category: "natural",
        thumbnail: "/placeholder.svg?height=100&width=100",
      },
      {
        id: "red",
        name: "레드",
        hexColor: "#8C3A2D",
        category: "natural",
        thumbnail: "/placeholder.svg?height=100&width=100",
      },
      {
        id: "pink",
        name: "핑크",
        hexColor: "#FF9EBF",
        category: "fantasy",
        thumbnail: "/placeholder.svg?height=100&width=100",
      },
      {
        id: "blue",
        name: "블루",
        hexColor: "#5B92E5",
        category: "fantasy",
        thumbnail: "/placeholder.svg?height=100&width=100",
      },
      {
        id: "purple",
        name: "퍼플",
        hexColor: "#8A56E5",
        category: "fantasy",
        thumbnail: "/placeholder.svg?height=100&width=100",
      },
      {
        id: "silver",
        name: "실버",
        hexColor: "#C0C0C0",
        category: "fantasy",
        thumbnail: "/placeholder.svg?height=100&width=100",
      },
      {
        id: "ombre-brown",
        name: "옴브레 브라운",
        hexColor: "#7B5C3F",
        category: "ombre",
        thumbnail: "/placeholder.svg?height=100&width=100",
      },
      {
        id: "balayage-caramel",
        name: "발레아쥬 카라멜",
        hexColor: "#AD8A60",
        category: "balayage",
        thumbnail: "/placeholder.svg?height=100&width=100",
      },
    ]
  }

  // 기본 헤어 스타일 프리셋 (Firebase 연결 실패 시 폴백)
  static getDefaultHairPresets(): HairStylePreset[] {
    return [
      {
        id: "trendy-bob",
        name: "트렌디 보브",
        modelId: "short-bob",
        colorId: "dark-brown",
        styling: {
          volume: 60,
          curl: 20,
          length: 40,
          layering: 70,
          bangs: 80,
          parting: "side",
        },
        thumbnail: "/placeholder.svg?height=200&width=200",
        popularity: 95,
      },
      {
        id: "wavy-long",
        name: "웨이비 롱",
        modelId: "long-straight",
        colorId: "medium-brown",
        styling: {
          volume: 70,
          curl: 60,
          length: 90,
          layering: 60,
          bangs: 40,
          parting: "center",
        },
        thumbnail: "/placeholder.svg?height=200&width=200",
        popularity: 90,
      },
      {
        id: "pink-pixie",
        name: "핑크 픽시",
        modelId: "pixie-cut",
        colorId: "pink",
        styling: {
          volume: 80,
          curl: 10,
          length: 20,
          layering: 50,
          bangs: 70,
          parting: "side",
        },
        thumbnail: "/placeholder.svg?height=200&width=200",
        popularity: 85,
      },
      {
        id: "classic-undercut",
        name: "클래식 언더컷",
        modelId: "undercut",
        colorId: "natural-black",
        styling: {
          volume: 70,
          curl: 0,
          length: 40,
          layering: 20,
          bangs: 60,
          parting: "side",
        },
        thumbnail: "/placeholder.svg?height=200&width=200",
        popularity: 88,
      },
    ]
  }

  // 기본 시뮬레이션 설정
  static getDefaultSimulationSettings(): HairSimulationSettings {
    return {
      physics: {
        gravity: 9.8,
        stiffness: 50,
        damping: 30,
        wind: 0,
      },
      quality: "medium",
      renderSettings: {
        shadows: true,
        reflection: true,
        subsurfaceScattering: true,
        antiAliasing: true,
      },
    }
  }
}
