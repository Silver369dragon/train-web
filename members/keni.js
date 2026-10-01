"use strict";

const statusLabels = {
  in_progress: "進行中",
  completed: "已完成",
};

let projects = [
  {
    id: "project-1",
    name: "個人介紹網站",
    description: "整理自己的背景、技術專長與開發方向，練習響應式網頁排版。",
    technologies: "HTML、CSS",
    status: "completed",
    url: "https://example.com/portfolio",
  },
  {
    id: "project-2",
    name: "課程點名系統",
    description: "提供老師新增點名紀錄、輸入日期及管理學生出缺席狀況。學生可以被記錄為出席、遲到或缺席，並能查看過去的點名紀錄與統計結果。",
    technologies: "HTML、CSS、JavaScript",
    status: "completed",
    url: "https://cornelia261610-afk.github.io/attendance-system/",
  },
  {
    id: "project-3",
    name: "課程資料整理工具",
    description: "使用程式整理課程資訊，將資料分類並建立簡單的查詢功能。",
    technologies: "Python、CSV",
    status: "in_progress",
    url: "",
  },
];

let nextProjectId = 4;
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
    if (error) {
      error.textContent = "";
      error.hidden = true;
    }
  });
}

function isValidProjectUrl(value) {
  if (!/^https?:\/\//i.test(value) || /\s/.test(value)) {
    return false;
  }

  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch (error) {
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

  if (!data.name) {
    errors.name = "請輸入作品名稱";
  } else if (data.name.length > 80) {
    errors.name = "作品名稱最多 80 字";
  }

  if (data.description.length > 500) {
    errors.description = "作品介紹最多 500 字";
  }

  if (data.technologies.length > 100) {
    errors.technologies = "使用技術最多 100 字";
  }

  if (data.status !== "in_progress" && data.status !== "completed") {
    errors.status = "請選擇進行中或已完成";
  }

  if (data.url && !isValidProjectUrl(data.url)) {
    errors.url = "請輸入有效的 http:// 或 https:// 網址";
  }

  const errorKeys = Object.keys(errors);
  if (errorKeys.length === 0) {
    return data;
  }

  errorKeys.forEach((key) => {
    const field = fields[key];
    if (!field) return;

    field.setAttribute("aria-invalid", "true");
    const error = document.getElementById(`${field.id}-error`);
    if (error) {
      error.textContent = errors[key];
      error.hidden = false;
    }
  });

  showMessage("尚未儲存，請修正標示的欄位。", true);
  const firstErrorField = fields[errorKeys[0]];
  if (firstErrorField) {
    firstErrorField.focus();
  }

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

function createProjectItem(project) {
  const source = template.content.firstElementChild;
  const item = source.cloneNode(true);
  item.dataset.id = project.id;

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

  badge.textContent = statusLabels[project.status] || "進行中";
  badge.dataset.status = project.status;

  if (project.url) {
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
  const query = searchInput.value.trim().toLowerCase();
  const filtered = projects.filter((project) => {
    const matchesName = project.name.toLowerCase().includes(query);
    const matchesStatus = filterSelect.value === "all" || project.status === filterSelect.value;
    return matchesName && matchesStatus;
  });

  list.replaceChildren(...filtered.map(createProjectItem));
  count.textContent = `共 ${projects.length} 筆作品，目前顯示 ${filtered.length} 筆`;

  if (projects.length === 0) {
    empty.hidden = false;
    empty.textContent = "尚未新增作品";
  } else if (filtered.length === 0) {
    empty.hidden = false;
    empty.textContent = "找不到符合條件的作品";
  } else {
    empty.hidden = true;
    empty.textContent = "";
  }
}

function editProject(id) {
  const project = projects.find((item) => item.id === id);
  if (!project) return;

  clearErrors();
  editingId = id;

  Object.keys(fields).forEach((key) => {
    fields[key].value = project[key] || "";
  });

  formTitle.textContent = "編輯作品";
  submitButton.textContent = "儲存修改";
  cancelButton.hidden = false;
  showMessage(`正在編輯「${project.name}」。`);
  fields.name.focus();
}

function deleteProject(id) {
  const project = projects.find((item) => item.id === id);
  if (!project) return;

  const confirmed = window.confirm(`確定要刪除「${project.name}」嗎？`);
  if (!confirmed) return;

  projects = projects.filter((item) => item.id !== id);

  if (editingId === id) {
    resetForm();
  }

  renderProjects();
  showMessage(`已刪除「${project.name}」。`);
  fields.name.focus();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = readProject();
  if (!data) return;

  const wasEditing = editingId !== null;

  if (wasEditing) {
    projects = projects.map((project) =>
      project.id === editingId ? { ...project, ...data } : project
    );
  } else {
    projects.unshift({
      id: `project-${nextProjectId++}`,
      ...data,
    });
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
  const target = event.target;
  if (!(target instanceof Element)) return;

  const button = target.closest("button[data-action]");
  if (!button) return;

  const item = button.closest("li[data-id]");
  if (!(item instanceof HTMLElement)) return;

  const id = item.dataset.id;
  if (!id) return;

  const action = button.getAttribute("data-action");
  if (action === "edit") {
    editProject(id);
  }

  if (action === "delete") {
    deleteProject(id);
  }
});

searchInput.addEventListener("input", renderProjects);
filterSelect.addEventListener("change", renderProjects);

renderProjects();
