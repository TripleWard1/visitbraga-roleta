/**
 * CONFIGURAÇÃO DO FIREBASE
 * ------------------------
 * Este é um projeto NOVO - cria um projeto Firebase próprio para as feiras
 * (não reutilizes o do Braga Day, para os dados não se misturarem):
 *
 * 1. console.firebase.google.com → Adicionar projeto (ex.: "roleta-feiras")
 * 2. Build → Firestore Database → Criar base de dados
 * 3. Adicionar app Web (ícone </>) → copia o objeto firebaseConfig para baixo
 * 4. Aplicar as regras de segurança do README.md
 * 5. Muda firebaseAtivo para true
 *
 * Enquanto firebaseAtivo = false, tudo funciona em MODO LOCAL:
 * o stock vive só na memória deste dispositivo (ideal para testar,
 * e é também o fallback automático se o wi-fi da feira falhar).
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "COLA_AQUI",
  authDomain: "COLA_AQUI.firebaseapp.com",
  projectId: "COLA_AQUI",
  storageBucket: "COLA_AQUI.firebasestorage.app",
  messagingSenderId: "COLA_AQUI",
  appId: "COLA_AQUI",
};

/** ⚙️ muda para true depois de colares a configuração acima */
export const firebaseAtivo = false;

export const db: Firestore | null = firebaseAtivo
  ? getFirestore(getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;
