// admin.js
let adminToken = localStorage.getItem("token"); // must log in as admin

async function addSeries() {
  const title = document.getElementById("admin-title").value;
  const description = document.getElementById("admin-description").value;
  const image = document.getElementById("admin-image").value;
  const videoUrl = document.getElementById("admin-video").value;
  const premiumOnly = document.getElementById("admin-premium").checked;

  const res = await fetch("/api/series", {
    method:"POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ token: adminToken, title, description, image, videoUrl, premiumOnly })
  });
  const data = await res.json();
  document.getElementById("admin-message").innerText = data.message;
}