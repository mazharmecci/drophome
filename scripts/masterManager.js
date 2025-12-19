import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  collection
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const PREFERRED_DOC_ID = "VwsEuQNJgfo5TXM6A0DA";
const preferredRef = doc(db, "masterList", PREFERRED_DOC_ID);

async function migrateMasterData() {
  const allDocs = await getDocs(collection(db, "masterList"));
  let sourceData = null;

  for (const d of allDocs.docs) {
    if (d.id === PREFERRED_DOC_ID) continue;
    const data = d.data();
    const hasContent = Object.values(data).some(arr => Array.isArray(arr) && arr.length > 0);
    if (hasContent) {
      sourceData = data;
      break;
    }
  }

  if (!sourceData) {
    console.log("No other master list found with data.");
    return;
  }

  const targetSnap = await getDoc(preferredRef);
  const targetData = targetSnap.exists() ? targetSnap.data() : {};

  const merged = {
    accounts: [...new Set([...(targetData.accounts || []), ...(sourceData.accounts || [])])],
    clients: [...new Set([...(targetData.clients || []), ...(sourceData.clients || [])])],
    locations: [...new Set([...(targetData.locations || []), ...(sourceData.locations || [])])],
    products: [...(targetData.products || []), ...(sourceData.products || [])]
  };

  await setDoc(preferredRef, merged);
  localStorage.setItem("masterDocId", PREFERRED_DOC_ID);
  console.log("✅ Master data migrated to preferred doc.");
}
