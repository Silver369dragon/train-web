// @ts-check
"use strict";

const statusLabels = { in_progress: "進行中", completed: "已完成" };

/** @typedef {{ id: string, name: string, description: string, technologies: string, status: string, url: string }} Project */
/** @type {Project[]} */
let projects = [
  { id: "project-1", name: "個人介紹網站", description: "整理自己的背景、技術專長與開發方向，練習響應式網頁排版。", technologies: "HTML、CSS", status: "completed", url: "https://github.com/Silver369dragon/train-web" },
  { id: "project-2", name: "作品紀錄管理", description: "把每一次練習記錄下來，透過表單與清單練習 JavaScript 的資料操作。", technologies: "HTML、CSS、JavaScript", status: "in_progress", url: "" },
  { id: "project-3", name: "AI Agent 學習筆記", description: "練習整理代理工具使用、需求分析與可靠性觀察，累積後續實作的想法。", technologies: "Python、Markdown", status: "in_progress", url: "" },
];

// A counter remains unique during this page session, including after deletions.
let nextProjectId = 4;
/** @type {string | null} */
let editingId = null;
const form = /** @type {HTMLFormElement} */ (document.getElementById("project-form"));
const formTitle = /** @type {HTMLElement} */ (document.getElementById("project-form-title"));
const submitButton = /** @type {HTMLButtonElement} */ (document.getElementById("project-submit"));
const cancelButton = /** @type {HTMLButtonElement} */ (document.getElementById("project-cancel"));
const searchInput = /** @type {HTMLInputElement} */ (document.getElementById("project-search"));
const filterSelect = /** @type {HTMLSelectElement} */ (document.getElementById("project-filter"));
const list = /** @type {HTMLUListElement} */ (document.getElementById("project-list"));
const count = /** @type {HTMLElement} */ (document.getElementById("project-count"));
const empty = /** @type {HTMLElement} */ (document.getElementById("project-empty"));
const message = /** @type {HTMLElement} */ (document.getElementById("project-message"));
const template = /** @type {HTMLTemplateElement} */ (document.getElementById("project-template"));
const fields = {
  name: /** @type {HTMLInputElement} */ (document.getElementById("project-name")),
  description: /** @type {HTMLTextAreaElement} */ (document.getElementById("project-description")),
  technologies: /** @type {HTMLInputElement} */ (document.getElementById("project-technologies")),
  status: /** @type {HTMLSelectElement} */ (document.getElementById("project-status")),
  url: /** @type {HTMLInputElement} */ (document.getElementById("project-url")),
};

/** @param {string} text @param {boolean} [isError] */
function showMessage(text, isError = false) {
  message.textContent = text;
  message.dataset.error = String(isError);
}

function clearErrors() {
  for (const field of Object.values(fields)) {
    field.removeAttribute("aria-invalid");
    const error = /** @type {HTMLElement} */ (document.getElementById(`${field.id}-error`));
    error.textContent = "";
    error.hidden = true;
  }
}

/** @param {string} value */
function isValidProjectUrl(value) {
  if (!/^https?:\/\//i.test(value) || /\s/.test(value)) return false;
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function readProject() {
  clearErrors();
  const data = {
    name: fields.name.value.trim(),
    description: fields.description.value,
    technologies: fields.technologies.value,
    status: fields.status.value,
    url: fields.url.value.trim(),
  };
  /** @type {Partial<Record<keyof typeof fields, string>>} */
  const errors = {};
  if (!data.name) errors.name = "請輸入作品名稱";
  if (data.name.length > 80) errors.name = "作品名稱最多 80 字";
  if (data.description.length > 500) errors.description = "作品介紹最多 500 字";
  if (data.technologies.length > 100) errors.technologies = "使用技術最多 100 字";
  if (data.status !== "in_progress" && data.status !== "completed") errors.status = "請選擇進行中或已完成";
  if (data.url && !isValidProjectUrl(data.url)) errors.url = "請輸入有效的 http:// 或 https:// 網址";

  const errorKeys = /** @type {(keyof typeof fields)[]} */ (Object.keys(errors));
  if (errorKeys.length === 0) return data;

  for (const key of errorKeys) {
    fields[key].setAttribute("aria-invalid", "true");
    const error = /** @type {HTMLElement} */ (document.getElementById(`${fields[key].id}-error`));
    error.textContent = errors[key] ?? "";
    error.hidden = false;
  }
  showMessage("尚未儲存，請修正標示的欄位。", true);
  fields[errorKeys[0]].focus();
  return null;
}

function resetForm() {
  editingId = null;
  form.reset();
  clearErrors();
  formTitle.textContent = "新增作品";
  submitButton.textContent = "新增作品";
  cancelButton.hidden = true;
}

/** @param {Project} project */
function createProjectItem(project) {
  const source = /** @type {HTMLLIElement} */ (template.content.firstElementChild);
  const item = /** @type {HTMLLIElement} */ (source.cloneNode(true));
  item.dataset.id = project.id;
  const name = /** @type {HTMLElement} */ (item.querySelector(".project-name"));
  const description = /** @type {HTMLElement} */ (item.querySelector(".project-description"));
  const technologies = /** @type {HTMLElement} */ (item.querySelector(".project-technologies span"));
  name.textContent = project.name;
  description.textContent = project.description || "尚未填寫作品介紹";
  technologies.textContent = project.technologies || "尚未填寫";
  const badge = /** @type {HTMLElement} */ (item.querySelector(".project-badge"));
  badge.textContent = project.status === "completed" ? statusLabels.completed : statusLabels.in_progress;
  badge.dataset.status = project.status;
  const link = /** @type {HTMLAnchorElement} */ (item.querySelector(".project-link"));
  link.hidden = !project.url;
  if (project.url) link.href = project.url;
  const editButton = /** @type {HTMLButtonElement} */ (item.querySelector('[data-action="edit"]'));
  const deleteButton = /** @type {HTMLButtonElement} */ (item.querySelector('[data-action="delete"]'));
  editButton.setAttribute("aria-label", `編輯「${project.name}」`);
  deleteButton.setAttribute("aria-label", `刪除「${project.name}」`);
  return item;
}

function renderProjects() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = projects.filter((project) => {
    const matchesName = project.name.toLowerCase().includes(query);
    const matchesStatus = filterSelect.value === "all" || project.status === filterSelect.value;
    return matchesName && matchesStatus;
  });
  list.replaceChildren(...filtered.map(createProjectItem));
  count.textContent = `共 ${projects.length} 筆作品，目前顯示 ${filtered.length} 筆`;
  empty.hidden = filtered.length > 0;
  empty.textContent = projects.length === 0 ? "尚未新增作品" : "找不到符合條件的作品";
}

/** @param {string} id */
function editProject(id) {
  const project = projects.find((item) => item.id === id);
  if (!project) return;
  clearErrors();
  editingId = id;
  for (const key of /** @type {(keyof typeof fields)[]} */ (Object.keys(fields))) {
    fields[key].value = project[key];
  }
  formTitle.textContent = "編輯作品";
  submitButton.textContent = "儲存修改";
  cancelButton.hidden = false;
  showMessage(`正在編輯「${project.name}」。`);
  fields.name.focus();
}

/** @param {string} id */
function deleteProject(id) {
  const project = projects.find((item) => item.id === id);
  if (!project || !window.confirm(`確定要刪除「${project.name}」嗎？`)) return;
  projects = projects.filter((item) => item.id !== id);
  if (editingId === id) resetForm();
  renderProjects();
  showMessage(`已刪除「${project.name}」。`);
  // The clicked button no longer exists; return focus to a usable control.
  fields.name.focus();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = readProject();
  if (!data) return;
  const wasEditing = editingId !== null;
  if (wasEditing) {
    projects = projects.map((project) => project.id === editingId ? { ...project, ...data } : project);
  } else {
    projects.unshift({ id: `project-${nextProjectId++}`, ...data });
  }
  resetForm();
  renderProjects();
  showMessage(`已${wasEditing ? "儲存" : "新增"}「${data.name}」。`);
});

cancelButton.addEventListener("click", () => {
  resetForm();
  showMessage("已取消編輯，作品資料未變更。");
  fields.name.focus();
});

list.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const item = button.closest("li[data-id]");
  if (!(item instanceof HTMLElement)) return;
  const id = item.dataset.id;
  if (!id) return;
  if (button.getAttribute("data-action") === "edit") editProject(id);
  if (button.getAttribute("data-action") === "delete") deleteProject(id);
});

searchInput.addEventListener("input", renderProjects);
filterSelect.addEventListener("change", renderProjects);
renderProjects();
