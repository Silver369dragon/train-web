// @ts-check
"use strict";

(() => {
  const API_BASE = "/api/projects";

  /** @type {Record<string, string>} */
  const statusToBackend = { in_progress: "進行中", completed: "已完成" };
  /** @type {Record<string, string>} */
  const statusToFrontend = { "進行中": "in_progress", "已完成": "completed" };
  /** @type {Record<string, string>} */
  const statusLabels = { in_progress: "進行中", completed: "已完成" };

  /**
   * @typedef {Object} ProjectItem
   * @property {number} id
   * @property {string} name
   * @property {string} description
   * @property {string} technologies
   * @property {string} status
   * @property {string} url
   */

  /** @type {ProjectItem[]} */
  let projects = [];
  /** @type {number | null} */
  let editingId = null;

  // DOM 元素選取
  const form = /** @type {HTMLFormElement | null} */ (document.getElementById("project-form"));
  const formTitle = /** @type {HTMLElement | null} */ (document.getElementById("project-form-title"));
  const submitButton = /** @type {HTMLButtonElement | null} */ (document.getElementById("project-submit"));
  const cancelButton = /** @type {HTMLButtonElement | null} */ (document.getElementById("project-cancel"));
  const searchInput = /** @type {HTMLInputElement | null} */ (document.getElementById("project-search"));
  const filterSelect = /** @type {HTMLSelectElement | null} */ (document.getElementById("project-filter"));
  const list = /** @type {HTMLUListElement | null} */ (document.getElementById("project-list"));
  const count = /** @type {HTMLElement | null} */ (document.getElementById("project-count"));
  const empty = /** @type {HTMLElement | null} */ (document.getElementById("project-empty"));
  const message = /** @type {HTMLElement | null} */ (document.getElementById("project-message"));
  const template = /** @type {HTMLTemplateElement | null} */ (document.getElementById("project-template"));

  const fields = {
    name: /** @type {HTMLInputElement | null} */ (document.getElementById("project-name")),
    description: /** @type {HTMLTextAreaElement | null} */ (document.getElementById("project-description")),
    technologies: /** @type {HTMLInputElement | null} */ (document.getElementById("project-technologies")),
    status: /** @type {HTMLSelectElement | null} */ (document.getElementById("project-status")),
    url: /** @type {HTMLInputElement | null} */ (document.getElementById("project-url")),
  };

  /**
   * 顯示提示訊息
   * @param {string} text
   * @param {boolean} [isError]
   */
  function showMessage(text, isError = false) {
    if (!message) return;
    message.textContent = text;
    message.dataset.error = String(isError);
  }

  function clearErrors() {
    for (const field of Object.values(fields)) {
      if (!field) continue;
      field.removeAttribute("aria-invalid");
      const error = document.getElementById(`${field.id}-error`);
      if (error) {
        error.textContent = "";
        error.hidden = true;
      }
    }
  }

  /**
   * 驗證網址格式
   * @param {string} value
   */
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
      name: fields.name ? fields.name.value.trim() : "",
      description: fields.description ? fields.description.value.trim() : "",
      technologies: fields.technologies ? fields.technologies.value.trim() : "",
      status: fields.status ? fields.status.value : "in_progress",
      url: fields.url ? fields.url.value.trim() : "",
    };

    /** @type {Record<string, string>} */
    const errors = {};
    if (!data.name) errors.name = "請輸入作品名稱";
    if (data.name.length > 80) errors.name = "作品名稱最多 80 字";
    if (data.description.length > 500) errors.description = "作品介紹最多 500 字";
    if (data.technologies.length > 100) errors.technologies = "使用技術最多 100 字";
    if (data.status !== "in_progress" && data.status !== "completed") errors.status = "請選擇進行中或已完成";
    if (data.url && !isValidProjectUrl(data.url)) errors.url = "請輸入有效的 http:// 或 https:// 網址";

    const errorKeys = Object.keys(errors);
    if (errorKeys.length === 0) return data;

    for (const key of errorKeys) {
      const field = fields[/** @type {keyof typeof fields} */ (key)];
      if (field) {
        field.setAttribute("aria-invalid", "true");
        const error = document.getElementById(`${field.id}-error`);
        if (error) {
          error.textContent = errors[key];
          error.hidden = false;
        }
      }
    }
    showMessage("尚未儲存，請修正標示的欄位。", true);
    const firstField = fields[/** @type {keyof typeof fields} */ (errorKeys[0])];
    if (firstField) firstField.focus();
    return null;
  }

  function resetForm() {
    editingId = null;
    if (form) form.reset();
    clearErrors();
    if (formTitle) formTitle.textContent = "新增作品";
    if (submitButton) submitButton.textContent = "新增作品";
    if (cancelButton) cancelButton.hidden = true;
  }

  // ==================== 1. API: 讀取所有作品 (GET) ====================
  async function fetchProjects() {
    try {
      const response = await fetch(API_BASE);
      const resData = await response.json();

      if (response.ok && resData.status === "success") {
        projects = resData.data.map((/** @type {any} */ item) => ({
          id: item.id,
          name: item.title,
          description: item.description || "",
          technologies: item.tech_stack || "",
          status: statusToFrontend[item.status] || "in_progress",
          url: item.link_url || ""
        }));
        renderProjects();
      } else {
        showMessage(`載入作品失敗：${resData.message || "未知錯誤"}`, true);
      }
    } catch (err) {
      console.error(err);
      showMessage("無法連線至伺服器，請確認 Flask 服務是否正常運行。", true);
    }
  }

  /**
   * 使用 HTML 中的 Template 樣板複製產生節點
   * @param {ProjectItem} project
   */
  function createProjectItem(project) {
    if (!template) return document.createElement("li");
    const source = /** @type {HTMLLIElement} */ (template.content.firstElementChild);
    const item = /** @type {HTMLLIElement} */ (source.cloneNode(true));
    item.dataset.id = String(project.id);

    const name = /** @type {HTMLElement | null} */ (item.querySelector(".project-name"));
    const description = /** @type {HTMLElement | null} */ (item.querySelector(".project-description"));
    const technologies = /** @type {HTMLElement | null} */ (item.querySelector(".project-technologies span"));
    const badge = /** @type {HTMLElement | null} */ (item.querySelector(".project-badge"));
    const link = /** @type {HTMLAnchorElement | null} */ (item.querySelector(".project-link"));
    const editButton = /** @type {HTMLButtonElement | null} */ (item.querySelector('[data-action="edit"]'));
    const deleteButton = /** @type {HTMLButtonElement | null} */ (item.querySelector('[data-action="delete"]'));

    if (name) name.textContent = project.name;
    if (description) description.textContent = project.description || "尚未填寫作品介紹";
    if (technologies) technologies.textContent = project.technologies || "尚未填寫";
    if (badge) {
      badge.textContent = project.status === "completed" ? statusLabels.completed : statusLabels.in_progress;
      badge.dataset.status = project.status;
    }

    if (link) {
      link.hidden = !project.url;
      if (project.url) link.href = project.url;
    }

    if (editButton) editButton.setAttribute("aria-label", `編輯「${project.name}」`);
    if (deleteButton) deleteButton.setAttribute("aria-label", `刪除「${project.name}」`);

    return item;
  }

  // 渲染清單、即時搜尋、狀態篩選與筆數統計
  function renderProjects() {
    if (!list) return;
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const filterVal = filterSelect ? filterSelect.value : "all";

    const filtered = projects.filter((project) => {
      const matchesName = project.name.toLowerCase().includes(query);
      const matchesStatus = filterVal === "all" || project.status === filterVal;
      return matchesName && matchesStatus;
    });

    list.replaceChildren(...filtered.map(createProjectItem));

    if (count) {
      count.textContent = `共 ${projects.length} 筆作品，目前顯示 ${filtered.length} 筆`;
    }
    if (empty) {
      empty.hidden = filtered.length > 0;
      empty.textContent = projects.length === 0 ? "尚未新增作品" : "找不到符合條件的作品";
    }
  }

  /**
   * 進入編輯模式，將原資料帶入表單
   * @param {number} id
   */
  function editProject(id) {
    const project = projects.find((item) => item.id === id);
    if (!project) return;

    clearErrors();
    editingId = id;

    if (fields.name) fields.name.value = project.name;
    if (fields.description) fields.description.value = project.description;
    if (fields.technologies) fields.technologies.value = project.technologies;
    if (fields.status) fields.status.value = project.status;
    if (fields.url) fields.url.value = project.url;

    if (formTitle) formTitle.textContent = "編輯作品";
    if (submitButton) submitButton.textContent = "儲存修改";
    if (cancelButton) cancelButton.hidden = false;

    showMessage(`正在編輯「${project.name}」。`);
    if (fields.name) fields.name.focus();
  }

  /**
   * API 刪除作品 (DELETE)
   * @param {number} id
   */
  async function deleteProject(id) {
    const project = projects.find((item) => item.id === id);
    if (!project) return;

    // 依規定訊息包含作品名稱
    if (!window.confirm(`確定要刪除「${project.name}」嗎？`)) return;

    try {
      const response = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      const resData = await response.json();

      if (response.ok && resData.status === "success") {
        if (editingId === id) resetForm();
        showMessage(`已刪除「${project.name}」。`);
        await fetchProjects();
      } else {
        showMessage(`刪除失敗：${resData.message || "未知錯誤"}`, true);
      }
    } catch (err) {
      console.error(err);
      showMessage("刪除請求失敗，請檢查伺服器連線。", true);
    }
    if (fields.name) fields.name.focus();
  }

  // ==================== 2. API 新增 (POST) / 編輯修改 (PUT) ====================
  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = readProject();
      if (!data) return;

      const payload = {
        title: data.name,
        description: data.description || null,
        tech_stack: data.technologies || null,
        status: statusToBackend[data.status] || "進行中",
        link_url: data.url || null
      };

      const wasEditing = editingId !== null;
      const targetUrl = wasEditing ? `${API_BASE}/${editingId}` : API_BASE;
      const targetMethod = wasEditing ? "PUT" : "POST";

      try {
        const response = await fetch(targetUrl, {
          method: targetMethod,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const resData = await response.json();

        if (response.ok && resData.status === "success") {
          resetForm();
          showMessage(`已${wasEditing ? "儲存" : "新增"}「${data.name}」。`);
          await fetchProjects();
        } else {
          showMessage(`儲存失敗：${resData.message || "未知錯誤"}`, true);
        }
      } catch (err) {
        console.error(err);
        showMessage("送出請求失敗，請檢查伺服器連線。", true);
      }
    });
  }

  // 取消編輯按鈕
  if (cancelButton) {
    cancelButton.addEventListener("click", () => {
      resetForm();
      showMessage("已取消編輯，作品資料未變更。");
      if (fields.name) fields.name.focus();
    });
  }

  // 列表事件委派
  if (list) {
    list.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const item = button.closest("li[data-id]");
      if (!(item instanceof HTMLElement)) return;
      const idStr = item.dataset.id;
      if (!idStr) return;
      const id = parseInt(idStr, 10);

      if (button.getAttribute("data-action") === "edit") editProject(id);
      if (button.getAttribute("data-action") === "delete") deleteProject(id);
    });
  }

  // 搜尋與篩選監聽
  if (searchInput) searchInput.addEventListener("input", renderProjects);
  if (filterSelect) filterSelect.addEventListener("change", renderProjects);

  // 初始載入
  fetchProjects();
})();