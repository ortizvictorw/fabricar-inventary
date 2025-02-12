export const environment = {
  production: true,
  firebaseConfig: {
    apiKey: process.env.FIREBASE_API_KEY!,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.FIREBASE_PROJECT_ID!,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.FIREBASE_MESSAGING_ID!,
    appId: process.env.FIREBASE_APP_ID!
  },
  whitelist: process.env.WHITELIST?.split(',') ?? [] as string[] // ✅ Convierte el string en un array
};
