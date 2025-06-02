import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from "firebase/firestore"
import { db } from "./firebase"
import type { BeautyPost, Comment, BeautyChallenge } from "@/types/social"

export class SocialService {
  // 게시물 관리
  static async createPost(post: Omit<BeautyPost, "id" | "createdAt" | "updatedAt">) {
    try {
      const docRef = await addDoc(collection(db, "beautyPosts"), {
        ...post,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating post:", error)
      throw error
    }
  }

  static async getPosts(limitCount = 20, filterType?: string): Promise<BeautyPost[]> {
    try {
      let q = query(
        collection(db, "beautyPosts"),
        where("isPublic", "==", true),
        orderBy("createdAt", "desc"),
        limit(limitCount),
      )

      if (filterType) {
        q = query(
          collection(db, "beautyPosts"),
          where("isPublic", "==", true),
          where("type", "==", filterType),
          orderBy("createdAt", "desc"),
          limit(limitCount),
        )
      }

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as BeautyPost[]
    } catch (error) {
      console.error("Error getting posts:", error)
      return []
    }
  }

  static async getUserPosts(userId: string): Promise<BeautyPost[]> {
    try {
      const q = query(collection(db, "beautyPosts"), where("userId", "==", userId), orderBy("createdAt", "desc"))

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as BeautyPost[]
    } catch (error) {
      console.error("Error getting user posts:", error)
      return []
    }
  }

  static async likePost(postId: string, userId: string) {
    try {
      const postRef = doc(db, "beautyPosts", postId)
      await updateDoc(postRef, {
        likes: increment(1),
        likedBy: arrayUnion(userId),
      })
    } catch (error) {
      console.error("Error liking post:", error)
      throw error
    }
  }

  static async unlikePost(postId: string, userId: string) {
    try {
      const postRef = doc(db, "beautyPosts", postId)
      await updateDoc(postRef, {
        likes: increment(-1),
        likedBy: arrayRemove(userId),
      })
    } catch (error) {
      console.error("Error unliking post:", error)
      throw error
    }
  }

  // 댓글 관리
  static async addComment(comment: Omit<Comment, "id" | "createdAt">) {
    try {
      const docRef = await addDoc(collection(db, "comments"), {
        ...comment,
        createdAt: Timestamp.now(),
      })

      // 게시물의 댓글 수 증가
      const postRef = doc(db, "beautyPosts", comment.postId)
      await updateDoc(postRef, {
        comments: increment(1),
      })

      return docRef.id
    } catch (error) {
      console.error("Error adding comment:", error)
      throw error
    }
  }

  static async getComments(postId: string): Promise<Comment[]> {
    try {
      const q = query(collection(db, "comments"), where("postId", "==", postId), orderBy("createdAt", "asc"))

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Comment[]
    } catch (error) {
      console.error("Error getting comments:", error)
      return []
    }
  }

  // 챌린지 관리
  static async getChallenges(): Promise<BeautyChallenge[]> {
    try {
      const q = query(collection(db, "beautyChallenges"), where("isActive", "==", true), orderBy("startDate", "desc"))

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate.toDate(),
        endDate: doc.data().endDate.toDate(),
      })) as BeautyChallenge[]
    } catch (error) {
      console.error("Error getting challenges:", error)
      return []
    }
  }

  static async createChallenge(challenge: Omit<BeautyChallenge, "id">) {
    try {
      const docRef = await addDoc(collection(db, "beautyChallenges"), {
        ...challenge,
        startDate: Timestamp.fromDate(challenge.startDate),
        endDate: Timestamp.fromDate(challenge.endDate),
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating challenge:", error)
      throw error
    }
  }

  // 팔로우 관리
  static async followUser(followerId: string, followingId: string) {
    try {
      await addDoc(collection(db, "userFollows"), {
        followerId,
        followingId,
        createdAt: Timestamp.now(),
      })
    } catch (error) {
      console.error("Error following user:", error)
      throw error
    }
  }

  static async unfollowUser(followerId: string, followingId: string) {
    try {
      const q = query(
        collection(db, "userFollows"),
        where("followerId", "==", followerId),
        where("followingId", "==", followingId),
      )

      const querySnapshot = await getDocs(q)
      querySnapshot.docs.forEach(async (document) => {
        await deleteDoc(doc(db, "userFollows", document.id))
      })
    } catch (error) {
      console.error("Error unfollowing user:", error)
      throw error
    }
  }

  static async getFollowing(userId: string): Promise<string[]> {
    try {
      const q = query(collection(db, "userFollows"), where("followerId", "==", userId))

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => doc.data().followingId)
    } catch (error) {
      console.error("Error getting following:", error)
      return []
    }
  }
}
