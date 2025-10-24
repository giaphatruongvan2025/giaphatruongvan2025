// PASS
const ADMIN_PASS = "123456";
let isAdmin = false;

// Check pass
function checkPass() {
  if (document.getElementById("pass").value === ADMIN_PASS) {
    isAdmin = true;
    unlockAdmin();
    document.getElementById("loginBox").style.display = "none";
  } else {
    alert("Sai mật khẩu!");
  }
}

// Unlock admin buttons
function unlockAdmin() {
  document.getElementById("btnAddPerson").disabled = false;
  document.getElementById("btnUpload").disabled = false;
}

// Google Drive Upload
const CLIENT_ID = "95651825411-5o3uf0pkvd1abe8s6m04i7fcuaj7kvs4.apps.googleusercontent.com";
const API_KEY = "";
const SCOPE = "https://www.googleapis.com/auth/drive.file";

function handleClientLoad() {
  gapi.load("client:auth2", initClient);
}

function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    scope: SCOPE
  });
}

// Upload
document.getElementById("btnUpload").addEventListener("click", () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*,video/*";
  fileInput.click();

  fileInput.onchange = () => {
    const file = fileInput.files[0];
    gapi.auth2.getAuthInstance().signIn().then(() => {
      const metadata = { name: file.name };
      const form = new FormData();
      form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      form.append("file", file);

      fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        headers: new Headers({ Authorization: "Bearer " + gapi.auth.getToken().access_token }),
        body: form
      }).then(res => res.json()).then(v => {
        alert("Upload thành công lên Drive!");
      });
    });
  };
});
