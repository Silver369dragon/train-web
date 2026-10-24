"use strict";

const API_URL = "/api/projects";
const allowedStatuses = new Set(["進行中", "已完成"]);
let projects = [];
let projectsLoaded = false;
let editingId = null;

const form = document.getElementById("project-form");
const formTitle = document.getElementById("project-form-title");
const submitButton = document.getElementById("project-submit");
const cancelButton = document.getElementById("project-cancel");
const searchInput = document.getElementById("project-search");
const filterSelect = document.getElementById("project-filter");
const list = document.getElementById("project-list");
const count = document.getElementById("project-count");
const empty = document.getElementById("project-empty");
const message = document.getElementById("project-message");
const template = document.getElementById("project-template");

const fields = {
  name: document.getElementById("project-name"),
  description: document.getElementById("project-description"),
  technologies: document.getElementById("project-technologies"),
  status: document.getElementById("project-status"),
  url: document.getElementById("project-url"),
};

function showMessage(text, isError = false) {
  message.textContent = text;
  message.dataset.error = String(isError);
}

function clearErrors() {
  Object.values(fields).forEach((field) => {
    field.removeAttribute("aria-invalid");
    const error = document.getElementById(`${field.id}-error`);
    error.textContent = "";
    error.hidden = true;
  });
}

function isValidProjectUrl(value) {
  if (!/^https?:\/\//i.test(value) || /\s/.test(value)) return false;

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function readProject() {
  clearErrors();
  const data = {
    name: fields.name.value.trim(),
    description: fields.description.value.trim(),
    technologies: fields.technologies.value.trim(),
    status: fields.status.value,
    url: fields.url.value.trim(),
  };
  const errors = {};

  if (!data.name) errors.name = "請輸入作品名稱";
  else if (data.name.length > 80) errors.name = "作品名稱最多 80 字";
  if (data.description.length > 500) errors.description = "作品介紹最多 500 字";
  if (data.technologies.length > 100) errors.technologies = "使用技術最多 100 字";
  if (!allowedStatuses.has(data.status)) errors.status = "請選擇進行中或已完成";
  if (data.url && !isValidProjectUrl(data.url)) {
    errors.url = "請輸入有效的 http:// 或 https:// 網址";
  }

  const errorKeys = Object.keys(errors);
  if (errorKeys.length === 0) return data;

  errorKeys.forEach((key) => {
    const field = fields[key];
    field.setAttribute("aria-invalid", "true");
    const error = document.getElementById(`${field.id}-error`);
    error.textContent = errors[key];
    error.hidden = false;
  });
  showMessage("尚未儲存，請修正標示的欄位。", true);
  fields[errorKeys[0]].focus();
  return null;
}

async function requestProjects(url, options = {}) {
  const response = await fetch(url, options);
  if (response.status === 204) return null;

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.error || "伺服器目前無法完成要求。");
  }
  return result;
}

function setSubmitting(isSubmitting) {
  submitButton.disabled = isSubmitting;
  cancelButton.disabled = isSubmitting;
  Object.values(fields).forEach((field) => {
    field.disabled = isSubmitting;
  });
}

function resetForm() {
  editingId = null;
  form.reset();
  clearErrors();
  formTitle.textContent = "新增作品";
  submitButton.textContent = "新增作品";
  cancelButton.hidden = true;
}

function createProjectItem(project) {
  const item = template.content.firstElementChild.cloneNode(true);
  item.dataset.id = String(project.id);

  const name = item.querySelector(".project-name");
  const description = item.querySelector(".project-description");
  const technologies = item.querySelector(".project-technologies span");
  const badge = item.querySelector(".project-badge");
  const link = item.querySelector(".project-link");
  const editButton = item.querySelector('[data-action="edit"]');
  const deleteButton = item.querySelector('[data-action="delete"]');

  name.textContent = project.name;
  description.textContent = project.description || "尚未填寫作品介紹";
  technologies.textContent = project.technologies || "尚未填寫";
  badge.textContent = project.status;
  badge.dataset.status = project.status === "已完成" ? "completed" : "in_progress";

  if (project.url && isValidProjectUrl(project.url)) {
    link.href = project.url;
    link.hidden = false;
  } else {
    link.hidden = true;
  }

  editButton.setAttribute("aria-label", `編輯「${project.name}」`);
  deleteButton.setAttribute("aria-label", `刪除「${project.name}」`);
  return item;
}

function renderProjects() {
  if (!projectsLoaded) {
    list.replaceChildren();
    count.textContent = "作品清單尚未載入";
    empty.hidden = true;
    return;
  }

  const query = searchInput.value.trim().toLowerCase();
  const filtered = projects.filter((project) => {
    const matchesName = project.name.toLowerCase().includes(query);
    const matchesStatus = filterSelect.value === "all" || project.status === filterSelect.value;
    return matchesName && matchesStatus;
  });

  list.replaceChildren(...filtered.map(createProjectItem));
  count.textContent = `共 ${projects.length} 筆作品，目前顯示 ${filtered.length} 筆`;

  if (projects.length === 0) {
    empty.textContent = "尚未新增作品";
    empty.hidden = false;
  } else if (filtered.length === 0) {
    empty.textContent = "找不到符合條件的作品";
    empty.hidden = false;
  } else {
    empty.textContent = "";
    empty.hidden = true;
  }
}

async function loadProjects() {
  try {
    const result = await requestProjects(API_URL);
    if (!Array.isArray(result)) throw new Error("伺服器回傳的作品清單格式不正確。");
    projects = result;
    projectsLoaded = true;
    renderProjects();
  } catch (error) {
    projectsLoaded = false;
    renderProjects();
    showMessage(`載入作品失敗：${error.message}`, true);
  }
}

function editProject(id) {
  const project = projects.find((item) => String(item.id) === id);
  if (!project) return;

  clearErrors();
  editingId = project.id;
  Object.keys(fields).forEach((key) => {
    fields[key].value = project[key] || "";
  });

  formTitle.textContent = "編輯作品";
  submitButton.textContent = "儲存修改";
  cancelButton.hidden = false;
  showMessage(`正在編輯「${project.name}」。`);
  fields.name.focus();
}

async function deleteProject(id) {
  const project = projects.find((item) => String(item.id) === id);
  if (!project || !window.confirm(`確定要刪除「${project.name}」嗎？`)) return;

  try {
    await requestProjects(`${API_URL}/${encodeURIComponent(project.id)}`, {
      method: "DELETE",
    });
    projects = projects.filter((item) => item.id !== project.id);
    if (editingId === project.id) resetForm();
    renderProjects();
    showMessage(`已刪除「${project.name}」。`);
    fields.name.focus();
  } catch (error) {
    showMessage(`刪除失敗：${error.message}`, true);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = readProject();
  if (!data) return;

  const wasEditing = editingId !== null;
  const url = wasEditing
    ? `${API_URL}/${encodeURIComponent(editingId)}`
    : API_URL;
  const method = wasEditing ? "PUT" : "POST";
  setSubmitting(true);

  try {
    const savedProject = await requestProjects(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (wasEditing) {
      projects = projects.map((project) =>
        project.id === editingId ? savedProject : project
      );
    } else {
      projects.unshift(savedProject);
    }
    resetForm();
    renderProjects();
    showMessage(`已${wasEditing ? "儲存" : "新增"}「${savedProject.name}」。`);
  } catch (error) {
    showMessage(`${wasEditing ? "儲存修改" : "新增作品"}失敗：${error.message}`, true);
  } finally {
    setSubmitting(false);
  }
});

cancelButton.addEventListener("click", () => {
  resetForm();
  showMessage("已取消編輯，作品資料未變更。");
  fields.name.focus();
});

list.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;

  const button = event.target.closest("button[data-action]");
  const item = button?.closest("li[data-id]");
  const id = item?.dataset.id;
  if (!button || !id) return;

  if (button.dataset.action === "edit") editProject(id);
  if (button.dataset.action === "delete") deleteProject(id);
});

searchInput.addEventListener("input", renderProjects);
filterSelect.addEventListener("change", renderProjects);

loadProjects();
