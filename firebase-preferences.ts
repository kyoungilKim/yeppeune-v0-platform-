import { collection, addDoc, updateDoc, getDocs, doc, query, where, Timestamp } from "firebase/firestore"
import { db } from "./firebase"
import type { UserPreferences, StylePreference } from "@/types/preferences"

export class PreferencesService {
  // 사용자 선호도 관리
  static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const q = query(collection(db, "userPreferences"), where("userId", "==", userId))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) return null

      const doc = querySnapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      } as UserPreferences
    } catch (error) {
      console.error("Error getting user preferences:", error)
      return null
    }
  }

  static async createUserPreferences(preferences: Omit<UserPreferences, "id" | "createdAt" | "updatedAt">) {
    try {
      const now = Timestamp.now()
      const docRef = await addDoc(collection(db, "userPreferences"), {
        ...preferences,
        createdAt: now,
        updatedAt: now,
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating user preferences:", error)
      throw error
    }
  }

  static async updateUserPreferences(userId: string, updates: Partial<UserPreferences>) {
    try {
      const q = query(collection(db, "userPreferences"), where("userId", "==", userId))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        throw new Error("User preferences not found")
      }

      const docRef = doc(db, "userPreferences", querySnapshot.docs[0].id)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error("Error updating user preferences:", error)
      throw error
    }
  }

  // 스타일 선호도 관리
  static async getStylePreference(userId: string): Promise<StylePreference | null> {
    try {
      const q = query(collection(db, "stylePreferences"), where("userId", "==", userId))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) return null

      const doc = querySnapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
        updatedAt: doc.data().updatedAt.toDate(),
      } as StylePreference
    } catch (error) {
      console.error("Error getting style preference:", error)
      return null
    }
  }

  static async createStylePreference(preference: Omit<StylePreference, "id" | "updatedAt">) {
    try {
      const docRef = await addDoc(collection(db, "stylePreferences"), {
        ...preference,
        updatedAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating style preference:", error)
      throw error
    }
  }

  static async updateStylePreference(userId: string, updates: Partial<StylePreference>) {
    try {
      const q = query(collection(db, "stylePreferences"), where("userId", "==", userId))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        throw new Error("Style preference not found")
      }

      const docRef = doc(db, "stylePreferences", querySnapshot.docs[0].id)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error("Error updating style preference:", error)
      throw error
    }
  }
}
