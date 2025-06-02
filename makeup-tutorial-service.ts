import { collection, addDoc, getDocs, query, where, orderBy, limit, doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "./firebase"
import type { MakeupTutorial, TutorialStep, TutorialProgress, ARFilter, UserSkillLevel } from "@/types/makeup-tutorial"

export class MakeupTutorialService {
  // 튜토리얼 목록 가져오기
  static async getTutorials(filters?: {
    category?: string
    difficulty?: string
    featured?: boolean
    limit?: number
  }): Promise<MakeupTutorial[]> {
    try {
      let q = collection(db, "makeupTutorials")

      // 필터 적용
      if (filters?.category) {
        q = query(q, where("category", "==", filters.category))
      }

      if (filters?.difficulty) {
        q = query(q, where("difficulty", "==", filters.difficulty))
      }

      if (filters?.featured !== undefined) {
        q = query(q, where("featured", "==", filters.featured))
      }

      // 정렬 및 제한
      q = query(q, orderBy("createdAt", "desc"))

      if (filters?.limit) {
        q = query(q, limit(filters.limit))
      }

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as MakeupTutorial[]
    } catch (error) {
      console.error("Error getting tutorials:", error)
      return this.getDefaultTutorials()
    }
  }

  // 튜토리얼 상세 정보 가져오기
  static async getTutorialById(id: string): Promise<MakeupTutorial | null> {
    try {
      const docRef = doc(db, "makeupTutorials", id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as MakeupTutorial
      }

      return null
    } catch (error) {
      console.error("Error getting tutorial:", error)
      return null
    }
  }

  // 튜토리얼 단계 가져오기
  static async getTutorialSteps(tutorialId: string): Promise<TutorialStep[]> {
    try {
      const q = query(collection(db, "tutorialSteps"), where("tutorialId", "==", tutorialId), orderBy("order", "asc"))

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TutorialStep[]
    } catch (error) {
      console.error("Error getting tutorial steps:", error)
      return this.getDefaultTutorialSteps(tutorialId)
    }
  }

  // AR 필터 가져오기
  static async getARFilters(category?: string): Promise<ARFilter[]> {
    try {
      let q = collection(db, "arFilters")

      if (category) {
        q = query(q, where("category", "==", category))
      }

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ARFilter[]
    } catch (error) {
      console.error("Error getting AR filters:", error)
      return this.getDefaultARFilters()
    }
  }

  // 튜토리얼 진행 상황 저장
  static async saveTutorialProgress(progress: TutorialProgress): Promise<string> {
    try {
      // 기존 진행 상황 확인
      const q = query(
        collection(db, "tutorialProgress"),
        where("userId", "==", progress.userId),
        where("tutorialId", "==", progress.tutorialId),
      )

      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        // 기존 진행 상황 업데이트
        const docRef = doc(db, "tutorialProgress", querySnapshot.docs[0].id)
        await updateDoc(docRef, {
          currentStep: progress.currentStep,
          completed: progress.completed,
          completedAt: progress.completed ? new Date() : null,
          timeSpent: progress.timeSpent,
          rating: progress.rating,
          feedback: progress.feedback,
        })

        return querySnapshot.docs[0].id
      } else {
        // 새 진행 상황 생성
        const docRef = await addDoc(collection(db, "tutorialProgress"), {
          ...progress,
          startedAt: new Date(),
        })

        return docRef.id
      }
    } catch (error) {
      console.error("Error saving tutorial progress:", error)
      throw error
    }
  }

  // 사용자 스킬 레벨 가져오기
  static async getUserSkillLevel(userId: string): Promise<UserSkillLevel | null> {
    try {
      const q = query(collection(db, "userSkillLevels"), where("userId", "==", userId))

      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data()
        return {
          ...data,
          lastAssessment: data.lastAssessment?.toDate(),
        } as UserSkillLevel
      }

      // 기본 초보자 레벨 반환
      return {
        userId,
        skillLevel: "beginner",
        completedTutorials: 0,
        lastAssessment: new Date(),
      }
    } catch (error) {
      console.error("Error getting user skill level:", error)
      return null
    }
  }

  // 튜토리얼 추천 받기
  static async getRecommendedTutorials(userId: string, limit = 5): Promise<MakeupTutorial[]> {
    try {
      // 사용자 스킬 레벨 가져오기
      const userSkill = await this.getUserSkillLevel(userId)

      if (!userSkill) {
        // 기본 추천 (인기 튜토리얼)
        return this.getTutorials({ featured: true, limit })
      }

      // 사용자 레벨에 맞는 튜토리얼 추천
      const q = query(
        collection(db, "makeupTutorials"),
        where("difficulty", "==", userSkill.skillLevel),
        orderBy("rating", "desc"),
        limit(limit),
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as MakeupTutorial[]
    } catch (error) {
      console.error("Error getting recommended tutorials:", error)
      return this.getDefaultTutorials()
    }
  }

  // 기본 튜토리얼 데이터 (Firebase 연결 실패 시 폴백)
  static getDefaultTutorials(): MakeupTutorial[] {
    return [
      {
        id: "natural-daily-makeup",
        title: "자연스러운 데일리 메이크업",
        description: "출근, 등교 등 일상생활에 어울리는 자연스러운 메이크업을 배워보세요.",
        difficulty: "beginner",
        duration: 15,
        category: "daily",
        thumbnail: "/placeholder.svg?height=300&width=400",
        authorId: "makeup-artist-1",
        authorName: "김미영",
        authorAvatar: "/placeholder.svg?height=100&width=100",
        rating: 4.8,
        ratingCount: 245,
        viewCount: 12500,
        createdAt: new Date("2023-01-15"),
        updatedAt: new Date("2023-01-15"),
        tags: ["내추럴", "데일리", "직장인", "학생"],
        featured: true,
      },
      {
        id: "glam-party-makeup",
        title: "화려한 파티 메이크업",
        description: "특별한 날을 위한 글램 메이크업으로 시선을 사로잡아보세요.",
        difficulty: "intermediate",
        duration: 25,
        category: "party",
        thumbnail: "/placeholder.svg?height=300&width=400",
        authorId: "makeup-artist-2",
        authorName: "박지현",
        authorAvatar: "/placeholder.svg?height=100&width=100",
        rating: 4.7,
        ratingCount: 189,
        viewCount: 9800,
        createdAt: new Date("2023-02-20"),
        updatedAt: new Date("2023-02-20"),
        tags: ["글램", "파티", "스모키", "반짝이"],
        featured: true,
      },
      {
        id: "korean-gradient-lips",
        title: "한국식 그라데이션 립 메이크업",
        description: "K-뷰티의 대표적인 그라데이션 립 테크닉을 마스터해보세요.",
        difficulty: "beginner",
        duration: 10,
        category: "daily",
        thumbnail: "/placeholder.svg?height=300&width=400",
        authorId: "makeup-artist-3",
        authorName: "이수진",
        authorAvatar: "/placeholder.svg?height=100&width=100",
        rating: 4.9,
        ratingCount: 320,
        viewCount: 18700,
        createdAt: new Date("2023-03-05"),
        updatedAt: new Date("2023-03-05"),
        tags: ["그라데이션 립", "K-뷰티", "립메이크업"],
        featured: true,
      },
      {
        id: "summer-glow-makeup",
        title: "여름 글로우 메이크업",
        description: "더운 여름에도 무너지지 않는 글로우 메이크업 비법을 알아보세요.",
        difficulty: "intermediate",
        duration: 20,
        category: "seasonal",
        thumbnail: "/placeholder.svg?height=300&width=400",
        authorId: "makeup-artist-4",
        authorName: "최다은",
        authorAvatar: "/placeholder.svg?height=100&width=100",
        rating: 4.6,
        ratingCount: 175,
        viewCount: 8900,
        createdAt: new Date("2023-06-10"),
        updatedAt: new Date("2023-06-10"),
        tags: ["여름", "글로우", "워터프루프", "땀에 강한"],
        featured: false,
      },
      {
        id: "monolid-eye-makeup",
        title: "홑꺼풀 눈 메이크업",
        description: "홑꺼풀 눈을 더욱 매력적으로 보이게 하는 아이 메이크업 기법",
        difficulty: "intermediate",
        duration: 18,
        category: "daily",
        thumbnail: "/placeholder.svg?height=300&width=400",
        authorId: "makeup-artist-5",
        authorName: "정유진",
        authorAvatar: "/placeholder.svg?height=100&width=100",
        rating: 4.8,
        ratingCount: 210,
        viewCount: 11200,
        createdAt: new Date("2023-04-15"),
        updatedAt: new Date("2023-04-15"),
        tags: ["홑꺼풀", "아이메이크업", "음영", "아이라인"],
        featured: false,
      },
    ]
  }

  // 기본 튜토리얼 단계 데이터 (Firebase 연결 실패 시 폴백)
  static getDefaultTutorialSteps(tutorialId: string): TutorialStep[] {
    switch (tutorialId) {
      case "natural-daily-makeup":
        return [
          {
            id: "step-1",
            tutorialId: "natural-daily-makeup",
            order: 1,
            title: "스킨케어 & 프라이머",
            description: "메이크업의 지속력을 높이기 위해 스킨케어 후 프라이머를 얼굴 전체에 얇게 발라줍니다.",
            duration: 60,
            productCategory: "primer",
            productName: "수분 프라이머",
            productImage: "/placeholder.svg?height=200&width=200",
            imageUrl: "/placeholder.svg?height=400&width=600",
            tipText: "T존과 볼 부위에 집중적으로 발라주세요.",
          },
          {
            id: "step-2",
            tutorialId: "natural-daily-makeup",
            order: 2,
            title: "베이스 메이크업",
            description: "파운데이션이나 BB크림을 얼굴에 고르게 펴발라 피부톤을 균일하게 만들어줍니다.",
            duration: 90,
            productCategory: "foundation",
            productName: "라이트 커버리지 파운데이션",
            productImage: "/placeholder.svg?height=200&width=200",
            arFilterId: "base-filter-1",
            imageUrl: "/placeholder.svg?height=400&width=600",
            tipText: "뷰티 블렌더를 이용해 두드리듯 발라주면 더 자연스러워요.",
          },
          {
            id: "step-3",
            tutorialId: "natural-daily-makeup",
            order: 3,
            title: "컨실러",
            description: "다크서클과 잡티 부위에 컨실러를 사용해 커버해줍니다.",
            duration: 60,
            productCategory: "concealer",
            productName: "크리미 컨실러",
            productImage: "/placeholder.svg?height=200&width=200",
            arFilterId: "concealer-filter-1",
            imageUrl: "/placeholder.svg?height=400&width=600",
            tipText: "눈 밑은 삼각형 모양으로 컨실러를 발라 자연스럽게 커버하세요.",
          },
          {
            id: "step-4",
            tutorialId: "natural-daily-makeup",
            order: 4,
            title: "아이 메이크업",
            description: "자연스러운 음영을 주는 아이섀도우를 발라줍니다.",
            duration: 120,
            productCategory: "eyeshadow",
            productName: "내추럴 아이섀도우 팔레트",
            productImage: "/placeholder.svg?height=200&width=200",
            arFilterId: "eye-filter-1",
            imageUrl: "/placeholder.svg?height=400&width=600",
            tipText: "브라운 계열 섀도우로 자연스러운 음영을 만들어주세요.",
          },
          {
            id: "step-5",
            tutorialId: "natural-daily-makeup",
            order: 5,
            title: "마스카라",
            description: "속눈썹을 컬링한 후 마스카라를 발라 눈매를 또렷하게 만들어줍니다.",
            duration: 60,
            productCategory: "mascara",
            productName: "볼륨 마스카라",
            productImage: "/placeholder.svg?height=200&width=200",
            arFilterId: "mascara-filter-1",
            imageUrl: "/placeholder.svg?height=400&width=600",
            tipText: "뿌리부터 끝까지 지그재그로 발라주면 더 풍성해 보여요.",
          },
          {
            id: "step-6",
            tutorialId: "natural-daily-makeup",
            order: 6,
            title: "블러셔",
            description: "볼 부위에 자연스러운 혈색을 더해줍니다.",
            duration: 45,
            productCategory: "blush",
            productName: "코랄 블러셔",
            productImage: "/placeholder.svg?height=200&width=200",
            arFilterId: "blush-filter-1",
            imageUrl: "/placeholder.svg?height=400&width=600",
            tipText: "미소 지었을 때 올라오는 부위에 블러셔를 발라주세요.",
          },
          {
            id: "step-7",
            tutorialId: "natural-daily-makeup",
            order: 7,
            title: "립 메이크업",
            description: "MLBB(My Lips But Better) 컬러로 자연스러운 입술을 완성합니다.",
            duration: 45,
            productCategory: "lipstick",
            productName: "MLBB 립스틱",
            productImage: "/placeholder.svg?height=200&width=200",
            arFilterId: "lip-filter-1",
            imageUrl: "/placeholder.svg?height=400&width=600",
            tipText: "입술 안쪽부터 바깥쪽으로 그라데이션처럼 발라주세요.",
          },
        ]
      default:
        return []
    }
  }

  // 기본 AR 필터 데이터 (Firebase 연결 실패 시 폴백)
  static getDefaultARFilters(): ARFilter[] {
    return [
      {
        id: "base-filter-1",
        name: "내추럴 베이스",
        category: "foundation",
        previewUrl: "/placeholder.svg?height=200&width=200",
        filterUrl: "/ar-filters/base-filter-1.json",
        parameters: {
          coverage: "light",
          finish: "natural",
          shade: "medium",
        },
      },
      {
        id: "concealer-filter-1",
        name: "다크서클 커버",
        category: "concealer",
        previewUrl: "/placeholder.svg?height=200&width=200",
        filterUrl: "/ar-filters/concealer-filter-1.json",
        parameters: {
          coverage: "medium",
          brightness: 0.2,
          area: "undereye",
        },
      },
      {
        id: "eye-filter-1",
        name: "내추럴 아이",
        category: "eyeshadow",
        previewUrl: "/placeholder.svg?height=200&width=200",
        filterUrl: "/ar-filters/eye-filter-1.json",
        parameters: {
          colors: ["#F5D5C0", "#C8A18E", "#8D5B4C"],
          intensity: 0.7,
          shimmer: 0.3,
        },
      },
      {
        id: "mascara-filter-1",
        name: "내추럴 래쉬",
        category: "mascara",
        previewUrl: "/placeholder.svg?height=200&width=200",
        filterUrl: "/ar-filters/mascara-filter-1.json",
        parameters: {
          volume: 0.6,
          length: 0.7,
          curl: 0.5,
        },
      },
      {
        id: "blush-filter-1",
        name: "코랄 블러쉬",
        category: "blush",
        previewUrl: "/placeholder.svg?height=200&width=200",
        filterUrl: "/ar-filters/blush-filter-1.json",
        parameters: {
          color: "#FF6B6B",
          intensity: 0.4,
          placement: "apples",
        },
      },
      {
        id: "lip-filter-1",
        name: "MLBB 립",
        category: "lipstick",
        previewUrl: "/placeholder.svg?height=200&width=200",
        filterUrl: "/ar-filters/lip-filter-1.json",
        parameters: {
          color: "#CC6666",
          opacity: 0.7,
          finish: "cream",
          gradient: true,
        },
      },
    ]
  }
}
