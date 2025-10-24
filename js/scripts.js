/* js/scripts.js - Gia Pha basic v3
   - admin pass = "123456"
   - stores data in localStorage keys: gp_data (array), gp_media (array)
*/

// --- Config
const ADMIN_PASS = "123456";
let isAdmin = false;
const LS_KEY = "gp_data_v3";
const LS_MEDIA = "gp_media_v3";
let family = []; // array of person objects
let mediaList = []; // { id, name, type, dataURL }

// --- sample initial data (3 đời) - will be used only if localStorage empty
const sample = [
  { id: 1, name: "Trương Văn Khởi", nick: "Khởi", birth: "1910", death: "1980", gender: "M", parent: null, spouseName: "Nguyễn Thị Nhung", mediaId: null },
  { id: 2, name: "Trương Văn A", nick: "A", birth: "1940", death: "", gender: "M", parent: 1, spouseName: "Vợ A", mediaId: null },
  { id: 3, name: "Trương Văn B", nick: "B", birth: "1945", death: "", gender: "M", parent: 1, spouseName: "Vợ B", mediaId: null },
  { id: 4, name: "Trương Văn A1", nick: "A1", birth: "1970", death: "", gender: "M", parent: 2, spouseName: "", mediaId: null },
  { id: 5, name: "Trương Văn A2", nick: "A2", birth: "1972", death: "", gender: "M", parent: 2, spouseName: "", mediaId: null },
  { id: 6, name: "Trương Văn B1", nick: "B1", birth: "1975", death: "", gender: "M", parent: 3, spouseName: "", mediaId: null },
  { id: 7, name: "Trương Văn B2", nick: "B2", birth: "1978", death: "", gender: "M", parent: 3, spouseName: "", mediaId: null }
];

// --- helpers
function $(sel){ return document.querySelector(sel); }
function $all(sel){ return Array.from(document.querySelectorAll(sel)); }
function saveData(){
  try{
    localStorage.setItem(LS_KEY, JSON.stringify(family));
    localStorage.setItem(LS_MEDIA, JSON.stringify(mediaList));
    showStatus("Đã lưu dữ liệu (local).");
  }catch(e){
    showStatus("Lưu thất bại: dung lượng localStorage có thể đầy.");
  }
}
function loadData(){
  const d = localStorage.getItem(LS_KEY);
  const m = localStorage.getItem(LS_MEDIA);
  if(d){
    try{ family = JSON.parse(d); }catch(e){ family = []; }
  } else {
    family = sample.slice();
    saveData();
  }
  if(m){
    try{ mediaList = JSON.parse(m); }catch(e){ mediaList = []; }
  } else { mediaList = []; }
}

// status
function showStatus(txt){
  const s = $("#statusText");
  if(s) s.textContent = txt;
}

// next id
function nextId(){
  const max = family.reduce((v,p)=> Math.max(v, p.id||0), 0);
  return max + 1;
}

// render tree: group by generation (calculate depth from root)
function buildTreeGroups(){
  // compute depth by climbing parent -> root
  const depth = {};
  const map = {};
  family.forEach(p=> map[p.id]=p);
  function depthOf(id){
    if(!id) return 1;
    if(depth[id]) return depth[id];
    const p = map[id];
    if(!p) return 1;
    depth[id] = 1 + depthOf(p.parent);
    return depth[id];
  }
  const groups = {};
  family.forEach(p=>{
    const d = depthOf(p.id);
    if(!groups[d]) groups[d]=[];
    groups[d].push(p);
  });
  // return sorted by generation ascending (1..n)
  const keys = Object.keys(groups).map(Number).sort((a,b)=>a-b);
  return keys.map(k=> groups[k]);
}

function renderTree(){
  const wrap = $("#treeWrap");
  wrap.innerHTML = "";
  if(!family || family.length===0){ showStatus("Chưa có thành viên."); return; }
  const groups = buildTreeGroups();
  groups.forEach((gen, index)=>{
    const col = document.createElement("div");
    col.className = "col";
    gen.forEach(person=>{
      const card = document.createElement("div");
      card.className = "card";
      // avatar
      let avatarHTML = `<div style="height:8px"></div>`;
      if(person.mediaId){
        const m = mediaList.find(x=>x.id===person.mediaId);
        if(m && m.type.startsWith("image")){
          avatarHTML = `<img class="avatar" src="${m.dataURL}" alt="avatar">`;
        }
      } else {
        avatarHTML = `<div style="display:flex;justify-content:center"><div style="width:72px;height:72px;background:#e6f0ff;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#336;border:3px solid var(--gold)">TG</div></div>`;
      }

      card.innerHTML = `
        ${avatarHTML}
        <div class="name">${person.name}</div>
        <div class="meta">${person.nick || ""} ${person.birth? ("• " + person.birth) : ""}</div>
        <div class="meta">${person.spouseName? "Vợ/Chồng: " + person.spouseName : ""}</div>
        <div style="margin-top:8px">
          <button class="btn viewBtn" data-id="${person.id}">Xem chi tiết</button>
          <button class="btn editBtn" data-id="${person.id}" ${isAdmin? "" : "disabled"}>Sửa</button>
          <button class="btn delBtn" data-id="${person.id}" ${isAdmin? "" : "disabled"}>Xóa</button>
        </div>
      `;
      col.appendChild(card);
    });
    wrap.appendChild(col);
  });

  // attach events
  $all(".viewBtn").forEach(b=> b.addEventListener("click", ev=>{
    const id = Number(ev.currentTarget.dataset.id);
    viewDetail(id);
  }));
  $all(".editBtn").forEach(b=> b.addEventListener("click", ev=>{
    const id = Number(ev.currentTarget.dataset.id);
    openMemberModal(true, id);
  }));
  $all(".delBtn").forEach(b=> b.addEventListener("click", ev=>{
    const id = Number(ev.currentTarget.dataset.id);
    if(confirm("Xóa thành viên ID="+id+"?")) {
      family = family.filter(p=>p.id!==id);
      saveData(); renderTree();
    }
  }));

  showStatus("Hiển thị cây gia phả tại đây...");
}

function viewDetail(id){
  const p = family.find(x=>x.id===id);
  if(!p) return alert("Không tìm thấy.");
  // show simple popup using memberModal
  openMemberModal(false, id); // open in view mode (fields filled but save disabled if not admin)
}

// --- Admin UI functions
function setModeAdmin(flag){
  isAdmin = !!flag;
  $("#userMode").textContent = isAdmin ? "Chế độ: Admin" : "Chế độ: Khách xem";
  $("#btnAdd").disabled = !isAdmin;
  $("#btnUpload").disabled = !isAdmin;
  $("#btnImport").disabled = !isAdmin;
  // toggle edit buttons
  $all(".editBtn").forEach(b=> b.disabled = !isAdmin);
  $all(".delBtn").forEach(b=> b.disabled = !isAdmin);
}

// login handlers
function openLogin(){
  $("#loginModal").classList.remove("hidden");
  $("#adminPass").value = "";
  $("#adminPass").focus();
}
function closeLogin(){
  $("#loginModal").classList.add("hidden");
}
function tryLogin(){
  const v = $("#adminPass").value.trim();
  if(v === ADMIN_PASS){
    setModeAdmin(true);
    closeLogin();
    showStatus("Admin đã đăng nhập.");
  } else {
    alert("Sai mật khẩu!");
  }
}

// member modal
let currentEditId = null;
function openMemberModal(edit=false, id=null){
  currentEditId = id || null;
  const modal = $("#memberModal");
  modal.classList.remove("hidden");
  // fill parent list
  const parentSel = $("#m_parent");
  parentSel.innerHTML = `<option value="">(Tổ / không)</option>`;
  family.forEach(p=>{
    parentSel.insertAdjacentHTML("beforeend", `<option value="${p.id}">${p.name}</option>`);
  });
  // fill media select
  updateMediaSelect();

  if(edit && id){
    const p = family.find(x=>x.id===id);
    $("#m_name").value = p.name || "";
    $("#m_nick").value = p.nick || "";
    $("#m_birth").value = p.birth || "";
    $("#m_death").value = p.death || "";
    $("#m_gender").value = p.gender || "";
    $("#m_parent").value = p.parent || "";
    $("#m_spouse").value = p.spouseName || "";
    $("#m_media").value = p.mediaId || "";
  } else {
    $("#m_name").value = "";
    $("#m_nick").value = "";
    $("#m_birth").value = "";
    $("#m_death").value = "";
    $("#m_gender").value = "";
    $("#m_parent").value = "";
    $("#m_spouse").value = "";
    $("#m_media").value = "";
  }
  // disable save if not admin
  $("#btnSaveMember").disabled = !isAdmin;
  $("#btnCancelMember").disabled = false;
}

function closeMemberModal(){
  $("#memberModal").classList.add("hidden");
  currentEditId = null;
}

function updateMediaSelect(){
  const sel = $("#m_media");
  sel.innerHTML = `<option value="">(không)</option>`;
  mediaList.forEach(m=>{
    sel.insertAdjacentHTML("beforeend", `<option value="${m.id}">${m.name}</option>`);
  });
}

// save member
function saveMember(){
  if(!isAdmin) return alert("Chỉ admin mới được lưu.");
  const name = $("#m_name").value.trim();
  if(!name) return alert("Nhập họ tên.");
  const rec = {
    id: currentEditId || nextId(),
    name,
    nick: $("#m_nick").value.trim(),
    birth: $("#m_birth").value.trim(),
    death: $("#m_death").value.trim(),
    gender: $("#m_gender").value,
    parent: $("#m_parent").value ? Number($("#m_parent").value) : null,
    spouseName: $("#m_spouse").value.trim(),
    mediaId: $("#m_media").value ? Number($("#m_media").value) : null
  };
  // update or insert
  const idx = family.findIndex(x=>x.id===rec.id);
  if(idx>=0) family[idx] = rec;
  else family.push(rec);
  saveData();
  closeMemberModal();
  renderTree();
}

// media upload
function openMediaModal(){
  $("#mediaModal").classList.remove("hidden");
  renderMediaPreview();
}
function closeMediaModal(){
  $("#mediaModal").classList.add("hidden");
}

function renderMediaPreview(){
  const wrap = $("#mediaPreview");
  wrap.innerHTML = "";
  if(mediaList.length===0){ wrap.textContent = "Chưa có media"; return; }
  mediaList.forEach(m=>{
    if(m.type.startsWith("image")){
      const img = document.createElement("img"); img.src = m.dataURL; img.alt = m.name;
      wrap.appendChild(img);
    } else {
      const v = document.createElement("video"); v.src = m.dataURL; v.controls = true;
      wrap.appendChild(v);
    }
  });
}

function handleFileInput(file){
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    const dataURL = e.target.result;
    const id = (mediaList.reduce((v,m)=>Math.max(v,m.id||0),0) || 0) + 1;
    mediaList.push({ id, name: file.name, type: file.type, dataURL });
    saveData();
    updateMediaSelect();
    renderMediaPreview();
    showStatus("Upload media thành công (lưu local).");
  };
  reader.readAsDataURL(file);
}

// import Excel stub (we added button earlier; for now show message)
function handleImport(){
  if(!isAdmin) return alert("Chỉ admin mới nhập Excel.");
  alert("Tính năng import Excel đã được chuẩn bị. (sẽ hoàn thiện khi cần)");
}

// wire up UI
function attachUI(){
  $("#btnLoginToggle").addEventListener("click", ()=> openLogin());
  $("#btnLogin").addEventListener("click", tryLogin);
  $("#btnCancelLogin").addEventListener("click", closeLogin);

  $("#btnAdd").addEventListener("click", ()=> openMemberModal(false, null));
  $("#btnCancelMember").addEventListener("click", closeMemberModal);
  $("#btnSaveMember").addEventListener("click", saveMember);

  $("#btnUpload").addEventListener("click", ()=> openMediaModal());
  $("#fileInput").addEventListener("change", (e)=> {
    const f = e.target.files[0];
    if(f) handleFileInput(f);
    e.target.value = "";
  });
  $("#btnCloseMedia").addEventListener("click", closeMediaModal);

  $("#btnImport").addEventListener("click", handleImport);
}

// init
function init(){
  loadData();
  attachUI();
  renderTree();
  setModeAdmin(false);

  // initial UI: clicking banner login text also can open
  $("#statusText").addEventListener("click", ()=> {
    if(!isAdmin) openLogin();
  });
}

// run on DOM loaded
document.addEventListener("DOMContentLoaded", init);
