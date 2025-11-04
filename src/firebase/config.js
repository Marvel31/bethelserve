// Firebase 설정 파일
// 사용자가 자신의 Firebase 프로젝트 설정을 추가해야 합니다
import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getAuth } from 'firebase/auth'

// TODO: 여기에 Firebase 프로젝트 설정을 추가하세요
// Firebase Console에서 프로젝트 설정을 복사해 넣으세요
const firebaseConfig = {
  apiKey: "AIzaSyBKHbn5l_0-5HxMWtK2jCKLFhFyzYADerY",
  authDomain: "bethelserve-14680.firebaseapp.com",
  projectId: "bethelserve-14680",
  storageBucket: "bethelserve-14680.firebasestorage.app",
  messagingSenderId: "664129633065",
  appId: "1:664129633065:web:ddf1b8f1bc0cd366e89538",
  databaseURL: "https://bethelserve-14680-default-rtdb.asia-southeast1.firebasedatabase.app/"
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
export const auth = getAuth(app)


