// Test script to verify Firebase configuration
// Run with: node test-firebase.js

import { config } from 'dotenv';
config();

console.log('🔍 Testing Firebase Configuration...\n');

// Check environment variables
const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

console.log('📋 Environment Variables Check:');
let allVarsPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const displayValue = value ? `${value.substring(0, 10)}...` : 'MISSING';
  console.log(`${status} ${varName}: ${displayValue}`);
  
  if (!value) {
    allVarsPresent = false;
  }
});

console.log('\n📊 Configuration Summary:');
if (allVarsPresent) {
  console.log('✅ All required Firebase environment variables are present');
  console.log('✅ You can now test file uploads in the application');
} else {
  console.log('❌ Some Firebase environment variables are missing');
  console.log('❌ Please check your .env file and ensure all variables are set');
  console.log('❌ File uploads will not work until all variables are configured');
}

console.log('\n🔧 Next Steps:');
if (allVarsPresent) {
  console.log('1. ✅ Environment variables are configured');
  console.log('2. 🔄 Start your development server: npm run dev');
  console.log('3. 🌐 Open the application and test file uploads');
  console.log('4. 📁 Check browser console for any Firebase errors');
} else {
  console.log('1. ❌ Fix missing environment variables in .env file');
  console.log('2. 🔄 Copy values from Firebase Console Project Settings');
  console.log('3. 🌐 Ensure no extra spaces in configuration values');
  console.log('4. 🔄 Restart your development server after fixing');
}

console.log('\n📖 For more help, see the Firebase Setup section in README.md'); 