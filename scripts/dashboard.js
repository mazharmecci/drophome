import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { app } from "../firebase.js";

const db = getFirestore(app);

async function loadData() {
  const selectedCollection = document.getElementById("collectionSelect").value;
  const filter = document.getElementById("filterInput").value.toLowerCase();
  const snapshot = await getDocs(collection(db, selectedCollection));
  const tbody = document.querySelector("#dataTable tbody");
  tbody.innerHTML = "";

  snapshot.forEach(doc => {
    const data = doc.data();
    const match = Object.values(data).some(val =>
      typeof val === "string" && val.toLowerCase().includes(filter)
    );
    if (match || filter === "") {
      for (const key in data) {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${key}</td><td>${data[key]}</td>`;
        tbody.appendChild(row);
      }
      const spacer = document.createElement("tr");
      spacer.innerHTML = `<td colspan="2"><hr/></td>`;
      tbody.appendChild(spacer);
    }
  });
}
