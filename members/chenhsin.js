"use strict";

const STATUS_LABELS = {
  in_progress: "進行中",
  completed: "已完成"
};

let projects = [
  {
    id: "proj-1",
    name: "個人介紹網站",
    description: "陳歆的個人自我介紹頁面，採用語意化 HTML5 與現代化 CSS3 建立良好排版，展現個人背景、專長與作品。",
    technologies: "HTML、CSS",
    status: "completed",
    url: "https://github.com/arielchen0807/train-web"
  },
  {
    id: "proj-2",
    name: "作品紀錄管理系統",
    description: "以原生 JavaScript 開發的作品紀錄管理介面，支援作品新增、編輯、刪除、即時關鍵字搜尋與狀態篩選功能。",
    technologies: "HTML、CSS、JavaScript",
    status: "in_progress",
    url: "https://github.com/arielchen0807/train-web"
  },
  {
    id: "proj-3",
    name: "選課系統",
    description: "利用自訂資料結構管理課程資料，實作課表碰撞偵測演算法與快速篩選查詢功能。",
    technologies: "C++",
    status: "completed",
    url: ""
  }
];

let editingId = null;
let idCounter = Date.now();

const form = document.getElementById("project-form");
const formTitle = document.getElementById("form-title");
const btnSubmit = document.getElementById("btn-submit");
const btnCancel = document.getElementById("btn-cancel");

const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("status-filter");
const projectGrid = document.getElementById("project-grid");
const projectStats = document.getElementById("project-stats");
const projectEmpty = document.getElementById("project-empty");
const emptyMessage = document.getElementById("empty-message");
const projectBanner = document.getElementById("project-banner");

const formFields = {
  name: {
    input: document.getElementById("input-name"),
    error: document.getElementById("error-name")
  },
  description: {
    input: document.getElementById("input-desc"),
    error: document.getElementById("error-desc")
  },
  technologies: {
    input: document.getElementById("input-tech"),
    error: document.getElementById("error-tech")
  },
  status: {
    input: document.getElementById("select-status"),
    error: document.getElementById("error-status")
  },
  url: {
    input: document.getElementById("input-url"),
    error: document.getElementById("error-url")
  }
};

function showNotification(text, type = "info") {
  if (!projectBanner) return;
  projectBanner.textContent = text;
  projectBanner.dataset.type = type;
  projectBanner.hidden = false;
}

function hideNotification() {
  if (!projectBanner) return;
  projectBanner.hidden = true;
  projectBanner.textContent = "";
}

function isValidUrl(value) {
  if (!value) return true;
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed) || /\s/.test(trimmed)) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function clearValidationErrors() {
  Object.values(formFields).forEach(({ input, error }) => {
    input.removeAttribute("aria-invalid");
    error.textContent = "";
    error.hidden = true;
  });
}

function validateForm() {
  clearValidationErrors();

  const nameValue = formFields.name.input.value.trim();
  const descValue = formFields.description.input.value;
  const techValue = formFields.technologies.input.value;
  const statusValue = formFields.status.input.value;
  const urlValue = formFields.url.input.value.trim();

  const errors = {};

  if (!nameValue) {
    errors.name = "請輸入作品名稱";
  } else if (nameValue.length > 80) {
    errors.name = "作品名稱最多 80 字";
  }

  if (descValue.length > 500) {
    errors.description = "作品介紹最多 500 字";
  }

  if (techValue.length > 100) {
    errors.technologies = "使用技術最多 100 字";
  }

  if (statusValue !== "in_progress" && statusValue !== "completed") {
    errors.status = "作品狀態只能選擇「進行中」或「已完成」";
  }

  if (urlValue && !isValidUrl(urlValue)) {
    errors.url = "作品連結格式錯誤，請輸入有效的 http:// 或 https:// 網址";
  }

  const errorKeys = Object.keys(errors);

  if (errorKeys.length > 0) {
    errorKeys.forEach((key) => {
      const { input, error } = formFields[key];
      input.setAttribute("aria-invalid", "true");
      error.textContent = errors[key] || "";
      error.hidden = false;
    });

    formFields[errorKeys[0]].input.focus();
    showNotification("表單驗證未通過，請檢查並修正標示的錯誤欄位。", "error");
    return null;
  }

  return {
    name: nameValue,
    description: descValue.trim(),
    technologies: techValue.trim(),
    status: statusValue,
    url: urlValue
  };
}

function resetFormToAddMode() {
  editingId = null;
  form.reset();
  formFields.status.input.value = "in_progress";
  clearValidationErrors();

  formTitle.textContent = "新增作品";
  btnSubmit.textContent = "新增作品";
  btnCancel.hidden = true;
}

function createProjectCardElement(project) {
  const card = document.createElement("article");
  card.className = "project-card";
  card.dataset.id = project.id;

  const header = document.createElement("div");
  header.className = "project-card-header";

  const title = document.createElement("h3");
  title.className = "project-title";
  title.textContent = project.name;

  const badge = document.createElement("span");
  badge.className = "project-badge";
  badge.dataset.status = project.status;
  badge.textContent = STATUS_LABELS[project.status] || project.status;

  header.appendChild(title);
  header.appendChild(badge);
  card.appendChild(header);

  const desc = document.createElement("p");
  desc.className = "project-desc";
  desc.textContent = project.description || "尚未填寫作品介紹。";
  card.appendChild(desc);

  const techGroup = document.createElement("div");
  techGroup.className = "project-tech-group";

  const techLabel = document.createElement("span");
  techLabel.className = "project-tech-label";
  techLabel.textContent = "使用技術";
  techGroup.appendChild(techLabel);

  const chipsWrapper = document.createElement("div");
  chipsWrapper.className = "project-chips-wrapper";

  if (project.technologies && project.technologies.trim()) {
    const tags = project.technologies
      .split(/[,，、;；]/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (tags.length > 0) {
      tags.forEach((tag) => {
        const chip = document.createElement("span");
        chip.className = "tech-chip";
        chip.textContent = tag;
        chipsWrapper.appendChild(chip);
      });
    } else {
      const noChip = document.createElement("span");
      noChip.className = "tech-chip tech-chip-none";
      noChip.textContent = "尚未指定";
      chipsWrapper.appendChild(noChip);
    }
  } else {
    const noChip = document.createElement("span");
    noChip.className = "tech-chip tech-chip-none";
    noChip.textContent = "尚未指定";
    chipsWrapper.appendChild(noChip);
  }

  techGroup.appendChild(chipsWrapper);
  card.appendChild(techGroup);

  const footer = document.createElement("div");
  footer.className = "project-card-footer";

  if (project.url && project.url.trim()) {
    const link = document.createElement("a");
    link.className = "project-link";
    link.href = project.url.trim();
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "查看作品 ";

    const iconSpan = document.createElement("span");
    iconSpan.setAttribute("aria-hidden", "true");
    iconSpan.textContent = "↗";
    link.appendChild(iconSpan);

    const srSpan = document.createElement("span");
    srSpan.className = "sr-only";
    srSpan.textContent = "（在新分頁開啟）";
    link.appendChild(srSpan);

    footer.appendChild(link);
  } else {
    const spacer = document.createElement("span");
    spacer.className = "project-footer-spacer";
    footer.appendChild(spacer);
  }

  const actions = document.createElement("div");
  actions.className = "project-actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "btn-project btn-project-edit";
  editBtn.textContent = "編輯";
  editBtn.setAttribute("aria-label", `編輯「${project.name}」`);
  editBtn.addEventListener("click", () => handleStartEdit(project.id));

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "btn-project btn-project-delete";
  deleteBtn.textContent = "刪除";
  deleteBtn.setAttribute("aria-label", `刪除「${project.name}」`);
  deleteBtn.addEventListener("click", () => handleDeleteProject(project.id));

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);
  footer.appendChild(actions);

  card.appendChild(footer);

  return card;
}

function renderProjects() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;

  const filtered = projects.filter((project) => {
    const matchesName = project.name.toLowerCase().includes(query);
    const matchesStatus = selectedStatus === "all" || project.status === selectedStatus;
    return matchesName && matchesStatus;
  });

  projectStats.textContent = `共 ${projects.length} 筆作品，目前顯示 ${filtered.length} 筆`;

  projectGrid.replaceChildren();

  if (projects.length === 0) {
    projectEmpty.hidden = false;
    emptyMessage.textContent = "尚未新增作品";
  } else if (filtered.length === 0) {
    projectEmpty.hidden = false;
    emptyMessage.textContent = "找不到符合條件的作品";
  } else {
    projectEmpty.hidden = true;
    filtered.forEach((project) => {
      projectGrid.appendChild(createProjectCardElement(project));
    });
  }
}

function handleStartEdit(id) {
  const target = projects.find((p) => p.id === id);
  if (!target) return;

  clearValidationErrors();
  editingId = target.id;

  formFields.name.input.value = target.name;
  formFields.description.input.value = target.description;
  formFields.technologies.input.value = target.technologies;
  formFields.status.input.value = target.status;
  formFields.url.input.value = target.url;

  formTitle.textContent = "編輯作品";
  btnSubmit.textContent = "儲存修改";
  btnCancel.hidden = false;

  showNotification(`正在編輯「${target.name}」。`, "info");

  form.scrollIntoView({ behavior: "smooth", block: "nearest" });
  formFields.name.input.focus();
}

function handleCancelEdit() {
  resetFormToAddMode();
  showNotification("已取消編輯，作品資料維持不變。", "info");
  formFields.name.input.focus();
}

function handleDeleteProject(id) {
  const target = projects.find((p) => p.id === id);
  if (!target) return;

  const confirmed = window.confirm(`確定要刪除「${target.name}」嗎？`);
  if (!confirmed) {
    return;
  }

  projects = projects.filter((p) => p.id !== id);

  if (editingId === id) {
    resetFormToAddMode();
  }

  renderProjects();
  showNotification(`已成功刪除「${target.name}」。`, "success");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const validatedData = validateForm();
  if (!validatedData) {
    return;
  }

  if (editingId !== null) {
    const targetIndex = projects.findIndex((p) => p.id === editingId);
    if (targetIndex !== -1) {
      projects[targetIndex] = {
        id: editingId,
        ...validatedData
      };
      showNotification(`已成功儲存作品「${validatedData.name}」的修改！`, "success");
    }
  } else {
    const newProject = {
      id: `proj-${++idCounter}`,
      ...validatedData
    };
    projects.unshift(newProject);
    showNotification(`已成功新增作品「${validatedData.name}」！`, "success");
  }

  resetFormToAddMode();
  renderProjects();
});

btnCancel.addEventListener("click", handleCancelEdit);

searchInput.addEventListener("input", renderProjects);
statusFilter.addEventListener("change", renderProjects);

renderProjects();

