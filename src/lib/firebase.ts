// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAbh8zNiaXgdjwuTT_prby4LJKcEa0JA40",
  authDomain: "neurohub-716ac.firebaseapp.com",
  projectId: "neurohub-716ac",
  storageBucket: "neurohub-716ac.firebasestorage.app",
  messagingSenderId: "1096322556635",
  appId: "1:1096322556635:web:b9a31a6917ada2b5d362fe",
  measurementId: "G-GLZJSX20MN",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

export const uploadFile = (
  file: File,
  setProgress?: (progress: number) => void,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, `files/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setProgress?.(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};
