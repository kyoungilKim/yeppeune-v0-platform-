import { collection, addDoc, updateDoc, getDocs, query, where, orderBy, limit, Timestamp } from "firebase/firestore"
import { db } from "./firebase"
import type { BeautyAnalysis, UserProfile, BeautyRecommendation } from "@/types/beauty"

export class BeautyService {
  // 사용자 프로필 관리
  static async createUserProfile(profile: Omit<UserProfile, "id" | "createdAt" | "updatedAt">) {
    try {
      const docRef = await addDoc(collection(db, "userProfiles"), {
        ...profile,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating user profile:", error)
      throw error
    }
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const q = query(collection(db, "userProfiles"), where("id", "==", userId))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) return null

      const doc = querySnapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
        lastAnalysisDate: doc.data().lastAnalysisDate?.toDate(),
      } as UserProfile
    } catch (error) {
      console.error("Error getting user profile:", error)
      return null
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    try {
      const q = query(collection(db, "userProfiles"), where("id", "==", userId))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref
        await updateDoc(docRef, {
          ...updates,
          updatedAt: Timestamp.now(),
        })
      }
    } catch (error) {
      console.error("Error updating user profile:", error)
      throw error
    }
  }

  // 뷰티 분석 히스토리 관리
  static async saveBeautyAnalysis(analysis: Omit<BeautyAnalysis, "id">) {
    try {
      const docRef = await addDoc(collection(db, "beautyAnalyses"), {
        ...analysis,
        timestamp: Timestamp.fromDate(analysis.timestamp),
      })

      // 사용자 프로필 업데이트
      await this.updateUserProfileStats(analysis.userId, analysis.skinScore)

      return docRef.id
    } catch (error) {
      console.error("Error saving beauty analysis:", error)
      throw error
    }
  }

  static async getUserAnalysisHistory(userId: string, limitCount = 10): Promise<BeautyAnalysis[]> {
    try {
      const q = query(
        collection(db, "beautyAnalyses"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(limitCount),
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as BeautyAnalysis[]
    } catch (error) {
      console.error("Error getting analysis history:", error)
      return []
    }
  }

  // 사용자 프로필 통계 업데이트
  private static async updateUserProfileStats(userId: string, newScore: number) {
    try {
      const profile = await this.getUserProfile(userId)
      if (!profile) return

      const totalAnalyses = profile.totalAnalyses + 1
      const averageSkinScore = (profile.averageSkinScore * profile.totalAnalyses + newScore) / totalAnalyses

      await this.updateUserProfile(userId, {
        totalAnalyses,
        averageSkinScore: Math.round(averageSkinScore * 10) / 10,
        lastAnalysisDate: new Date(),
      })
    } catch (error) {
      console.error("Error updating profile stats:", error)
    }
  }

  // AI 추천 시스템
  static async generatePersonalizedRecommendations(userId: string): Promise<BeautyRecommendation[]> {
    try {
      const profile = await this.getUserProfile(userId)
      const recentAnalyses = await this.getUserAnalysisHistory(userId, 5)

      if (!profile || recentAnalyses.length === 0) return []

      const recommendations: Omit<BeautyRecommendation, "id">[] = []

      // 최근 분석 결과 기반 추천
      const latestAnalysis = recentAnalyses[0]
      const avgHydration = recentAnalyses.reduce((sum, a) => sum + a.analysisData.hydration, 0) / recentAnalyses.length
      const avgOiliness = recentAnalyses.reduce((sum, a) => sum + a.analysisData.oiliness, 0) / recentAnalyses.length

      // 수분 부족 시 추천
      if (avgHydration < 40) {
        recommendations.push({
          userId,
          type: "routine",
          title: "수분 집중 케어 루틴",
          description: "피부 수분도가 낮습니다. 하이알루론산이 함유된 세럼과 수분 크림을 사용해보세요.",
          category: "hydration",
          priority: "high",
          basedOn: ["낮은 수분도", "최근 분석 결과"],
          createdAt: new Date(),
          isRead: false,
        })
      }

      // 과도한 유분 시 추천
      if (avgOiliness > 70) {
        recommendations.push({
          userId,
          type: "product",
          title: "오일 컨트롤 제품 추천",
          description: "피부 유분이 많습니다. 살리실산 성분의 토너와 논코메도제닉 제품을 추천합니다.",
          category: "oil-control",
          priority: "high",
          basedOn: ["높은 유분도", "지성 피부 타입"],
          createdAt: new Date(),
          isRead: false,
        })
      }

      // 피부 점수 개선 추천
      if (profile.averageSkinScore < 70) {
        recommendations.push({
          userId,
          type: "tip",
          title: "피부 점수 향상 팁",
          description: "규칙적인 세안과 충분한 수면, 자외선 차단제 사용으로 피부 건강을 개선할 수 있습니다.",
          category: "general",
          priority: "medium",
          basedOn: ["평균 피부 점수", "전반적 피부 상태"],
          createdAt: new Date(),
          isRead: false,
        })
      }

      // 계절별 추천 (현재 월 기준)
      const currentMonth = new Date().getMonth()
      if (currentMonth >= 11 || currentMonth <= 2) {
        // 겨울
        recommendations.push({
          userId,
          type: "routine",
          title: "겨울철 피부 관리",
          description: "건조한 겨울철에는 더욱 진한 보습제와 오일 제품을 사용하여 피부 장벽을 강화하세요.",
          category: "seasonal",
          priority: "medium",
          basedOn: ["계절적 요인", "겨울철 건조함"],
          createdAt: new Date(),
          isRead: false,
        })
      }

      // 추천사항 저장
      for (const rec of recommendations) {
        await addDoc(collection(db, "beautyRecommendations"), {
          ...rec,
          createdAt: Timestamp.fromDate(rec.createdAt),
        })
      }

      return recommendations.map((rec, index) => ({
        id: `temp_${index}`,
        ...rec,
      }))
    } catch (error) {
      console.error("Error generating recommendations:", error)
      return []
    }
  }

  static async getUserRecommendations(userId: string): Promise<BeautyRecommendation[]> {
    try {
      const q = query(
        collection(db, "beautyRecommendations"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(20),
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as BeautyRecommendation[]
    } catch (error) {
      console.error("Error getting recommendations:", error)
      return []
    }
  }
}
