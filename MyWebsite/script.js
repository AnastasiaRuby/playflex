let token = null;
let isAdmin = false;

// ------------------ AUTH ------------------
async function signup() {
  const email = document.getElementById("email").value;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/.netlify/functions/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password })
  });
  const data = await res.json();
  document.getElementById("auth-message").innerText = data.message;
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/.netlify/functions/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.token) {
    token = data.token;
    isAdmin = data.isAdmin;
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("username-display").innerText = data.username;

    if (isAdmin) document.getElementById("admin-section").style.display = "block";

    loadSeries();
  } else {
    document.getElementById("auth-message").innerText = data.message;
  }
}

function logout() {
  token = null;
  isAdmin = false;
  document.getElementById("auth-section").style.display = "block";
  document.getElementById("admin-section").style.display = "none";
  document.getElementById("username-display").innerText = "";
}

// ------------------ SERIES ------------------
async function loadSeries() {
  const res = await fetch("/.netlify/functions/getSeries");
  const series = await res.json();
  const container = document.querySelector(".movie-row");
  container.innerHTML = "";
  series.forEach(s => {
    const div = document.createElement("div");
    div.classList.add("movie-item");
    div.innerHTML = `
      <img src="${s.image}" alt="${s.title}">
      <h3>${s.title}</h3>
      <p>${s.description}</p>
      ${s.premiumOnly ? "<b>Premium</b>" : ""}
      <video src="${s.videoUrl}" controls></video>
    `;
    container.appendChild(div);
  });
}

// ------------------ ADMIN ------------------
async function addSeries() {
  if (!token) return alert("Unauthorized");

  const title = document.getElementById("admin-title").value;
  const description = document.getElementById("admin-description").value;
  const image = document.getElementById("admin-image").value;
  const videoUrl = document.getElementById("admin-video").value;
  const premiumOnly = document.getElementById("admin-premium").checked;

  const res = await fetch("/.netlify/functions/addSeries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, title, description, image, videoUrl, premiumOnly })
  });
  const data = await res.json();
  document.getElementById("admin-message").innerText = data.message;
  loadSeries();
}
