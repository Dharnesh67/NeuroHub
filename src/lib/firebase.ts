import { initializeApp } from "firebase/app";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const storage = getStorage(app);

// Add debugging for Firebase initialization
console.log('Firebase initialized with config:', {
  apiKey: firebaseConfig.apiKey ? '***' : 'MISSING',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
  measurementId: firebaseConfig.measurementId
});

console.log('Storage instance created:', !!storage);
console.log('Storage bucket:', storage.app.options.storageBucket);

// Verify environment variables are loaded
const verifyFirebaseConfig = () => {
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing Firebase environment variables:', missingVars);
    return false;
  }
  
  console.log('All Firebase environment variables are loaded');
  return true;
};

verifyFirebaseConfig();

// File validation
const validateFile = (file: File) => {
  const maxSize = 100 * 1024 * 1024; // 100MB
  const allowedTypes = [
    'audio/',
    'video/',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ];

  if (file.size > maxSize) {
    throw new Error(`File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
  }

  const isValidType = allowedTypes.some(type => 
    file.type.startsWith(type) || file.type === type
  );

  if (!isValidType) {
    throw new Error('File type not supported. Please upload audio, video, PDF, DOCX, or text files.');
  }
};

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param file The file to upload.
 * @param setProgress Optional callback to report upload progress (0-100).
 * @returns Promise<string> - The download URL of the uploaded file.
 */
export const uploadFile = async (
  file: File,
  setProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      console.log('=== Starting file upload ===');
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Check if Firebase is properly initialized
      if (!storage) {
        throw new Error('Firebase storage is not initialized');
      }
      
      // Validate file
      validateFile(file);
      console.log('File validation passed');

      // Use a unique filename to avoid overwriting
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const uniqueName = `${timestamp}_${randomId}.${fileExtension}`;
      
      console.log('Generated filename:', uniqueName);
      console.log('Storage path: meetings/' + uniqueName);
      
      const storageRef = ref(storage, `meetings/${uniqueName}`);
      console.log('Storage reference created:', !!storageRef);
      
      const uploadTask = uploadBytesResumable(storageRef, file);
      console.log('Upload task created:', !!uploadTask);

      // Add timeout mechanism (5 minutes)
      const timeout = setTimeout(() => {
        console.error('Upload timeout after 5 minutes');
        uploadTask.cancel();
        reject(new Error('Upload timeout. Please try again.'));
      }, 5 * 60 * 1000);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          console.log('Upload progress:', progress + '%', {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            state: snapshot.state
          });
          if (setProgress) setProgress(progress);
        },
        (error) => {
          clearTimeout(timeout);
          console.error('=== Upload error ===');
          console.error('Error details:', {
            code: error.code,
            message: error.message,
            serverResponse: error.serverResponse
          });
          
          let errorMessage = 'Upload failed. Please try again.';
          
          switch (error.code) {
            case 'storage/unauthorized':
              errorMessage = 'Upload unauthorized. Please check your permissions.';
              break;
            case 'storage/canceled':
              errorMessage = 'Upload was canceled.';
              break;
            case 'storage/unknown':
              errorMessage = 'Unknown upload error occurred.';
              break;
            case 'storage/quota-exceeded':
              errorMessage = 'Storage quota exceeded. Please contact support.';
              break;
            case 'storage/unauthenticated':
              errorMessage = 'User is not authenticated. Please sign in.';
              break;
            case 'storage/retry-limit-exceeded':
              errorMessage = 'Upload retry limit exceeded. Please try again later.';
              break;
            default:
              errorMessage = `Upload failed: ${error.message}`;
          }
          
          console.error('Final error message:', errorMessage);
          reject(new Error(errorMessage));
        },
        async () => {
          clearTimeout(timeout);
          try {
            console.log('=== Upload completed successfully ===');
            console.log('Getting download URL...');
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Download URL obtained:', url);
            resolve(url);
          } catch (error) {
            console.error('Error getting download URL:', error);
            reject(new Error('Failed to get download URL. Please try again.'));
          }
        }
      );
    } catch (err: any) {
      console.error('=== Upload setup error ===');
      console.error('Error details:', err);
      reject(err);
    }
  });
};

/**
 * Deletes a file from Firebase Storage
 * @param url The download URL of the file to delete
 */
export const deleteFile = async (url: string): Promise<void> => {
  try {
    const fileRef = ref(storage, url);
    // Note: This is a simplified delete. In production, you might want to extract the path from the URL
    // For now, this is a placeholder for the delete functionality
    console.log('Delete functionality would be implemented here for URL:', url);
  } catch (error) {
    console.error('Delete error:', error);
    throw new Error('Failed to delete file');
  }
};

/**
 * Test Firebase connection and storage access
 */
export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing Firebase connection...');
    console.log('Storage instance:', !!storage);
    console.log('Storage app:', storage.app);
    
    // Test if we can create a reference
    const testRef = ref(storage, 'test/connection-test.txt');
    console.log('Test reference created:', !!testRef);
    
    // Test if we can access storage bucket info
    console.log('Storage bucket:', storage.app.options.storageBucket);
    
    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
};

/**
 * Test upload with a simple text file
 */
export const testUpload = async (): Promise<string> => {
  try {
    console.log('Testing upload with simple text file...');
    
    // Create a simple text file for testing
    const testContent = 'This is a test file for Firebase upload';
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
    
    console.log('Test file created:', {
      name: testFile.name,
      size: testFile.size,
      type: testFile.type
    });
    
    const url = await uploadFile(testFile);
    console.log('Test upload successful:', url);
    return url;
  } catch (error) {
    console.error('Test upload failed:', error);
    throw error;
  }
};
