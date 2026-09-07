import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  db,
  auth
} from "./config.js";


// =========================================================
// CONFIGURATION
// =========================================================

const CLOUDINARY_CLOUD_NAME = "dzbsqcoy7";

const CLOUDINARY_UPLOAD_PRESET = "Likestar";

const CLOUDINARY_UPLOAD_URL =
  `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const COLLECTION_NAME = "trustedOrganizations";

const PAGE_SIZE = 9;

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/svg+xml",
  "image/png",
  "image/jpeg",
  "image/webp"
];


// =========================================================
// MANAGEMENT CONFIG
// =========================================================

const MANAGEMENT_CONFIG = {

  developmentRole: "owner",

  developmentUser: {
    name: "Admin User",
    email: "",
    role: "owner"
  }

};


// =========================================================
// STATE
// =========================================================

const state = {

  organizations: [],

  filteredOrganizations: [],

  currentPage: 1,

  pageSize: PAGE_SIZE,

  editingOrganizationId: null,

  archiveOrganizationId: null,

  existingLogoUrl: "",

  existingLogoPublicId: "",

  currentUser: null

};


// =========================================================
// DOM REFERENCES
// =========================================================

const sidebar =
  document.getElementById("sidebar");

const sidebarOverlay =
  document.getElementById("sidebarOverlay");

const mobileMenuToggle =
  document.getElementById("mobileMenuToggle");

const organizationGrid =
  document.getElementById("organizationGrid");

const organizationCount =
  document.getElementById("organizationCount");

const pagination =
  document.getElementById("pagination");

const paginationInfo =
  document.getElementById("paginationInfo");

const searchInput =
  document.getElementById("searchInput");

const statusFilter =
  document.getElementById("statusFilter");

const resetFiltersBtn =
  document.getElementById("resetFiltersBtn");

const refreshBtn =
  document.getElementById("refreshBtn");

const addOrganizationBtn =
  document.getElementById("addOrganizationBtn");

const organizationModal =
  document.getElementById("organizationModal");

const archiveModal =
  document.getElementById("archiveModal");

const closeOrganizationModal =
  document.getElementById("closeOrganizationModal");

const cancelOrganizationBtn =
  document.getElementById("cancelOrganizationBtn");

const cancelArchiveBtn =
  document.getElementById("cancelArchiveBtn");

const confirmArchiveBtn =
  document.getElementById("confirmArchiveBtn");

const organizationForm =
  document.getElementById("organizationForm");

const organizationName =
  document.getElementById("organizationName");

const organizationLogo =
  document.getElementById("organizationLogo");

const organizationStatus =
  document.getElementById("organizationStatus");

const organizationActive =
  document.getElementById("organizationActive");

const displayOrder =
  document.getElementById("displayOrder");

const logoPreview =
  document.getElementById("logoPreview");

const logoPreviewImage =
  document.getElementById("logoPreviewImage");

const existingLogoHelp =
  document.getElementById("existingLogoHelp");

const organizationModalHeading =
  document.getElementById("organizationModalHeading");

const saveOrganizationBtn =
  document.getElementById("saveOrganizationBtn");

const archiveModalText =
  document.getElementById("archiveModalText");


// =========================================================
// HELPERS
// =========================================================

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function normalizeStatus(status) {

  const value =
    String(status || "draft").toLowerCase();

  if (
    value === "published" ||
    value === "archived"
  ) {

    return value;

  }

  return "draft";

}


function formatDate(timestamp) {

  if (!timestamp) {
    return "—";
  }

  try {

    const date =
      typeof timestamp.toDate === "function"
        ? timestamp.toDate()
        : new Date(timestamp);

    return date.toLocaleDateString(
      "en-GH",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );

  } catch {

    return "—";

  }

}


function getInitials(name) {

  const parts =
    String(name || "Admin User")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (!parts.length) {
    return "AU";
  }

  if (parts.length === 1) {

    return parts[0]
      .slice(0, 2)
      .toUpperCase();

  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();

}


function showError(message) {

  console.error(message);

  alert(message);

}


function showSuccess(message) {

  alert(message);

}


// =========================================================
// EMPLOYEE
// =========================================================

function initializeEmployee() {

  const user =
    MANAGEMENT_CONFIG.developmentUser;

  const name =
    user.name || "Admin User";

  const role =
    user.role || "owner";

  document.getElementById(
    "employeeName"
  ).textContent = name;

  document.getElementById(
    "employeeRole"
  ).textContent = role;

  document.getElementById(
    "employeeAvatar"
  ).textContent = getInitials(name);

  document.body.className =
    "role-" + role;

}


// =========================================================
// MOBILE SIDEBAR
// =========================================================

function openSidebar() {

  sidebar.classList.add("open");

  sidebarOverlay.classList.add("open");

  mobileMenuToggle.setAttribute(
    "aria-expanded",
    "true"
  );

}


function closeSidebar() {

  sidebar.classList.remove("open");

  sidebarOverlay.classList.remove("open");

  mobileMenuToggle.setAttribute(
    "aria-expanded",
    "false"
  );

}


mobileMenuToggle.addEventListener(
  "click",
  () => {

    if (sidebar.classList.contains("open")) {

      closeSidebar();

    } else {

      openSidebar();

    }

  }
);


sidebarOverlay.addEventListener(
  "click",
  closeSidebar
);


window.addEventListener(
  "resize",
  () => {

    if (window.innerWidth > 900) {
      closeSidebar();
    }

  }
);


// =========================================================
// FIRESTORE — LOAD
// =========================================================

async function loadOrganizations() {

  organizationGrid.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      Loading organizations...
    </div>
  `;

  try {

    const organizationsRef =
      collection(
        db,
        COLLECTION_NAME
      );

    const organizationsQuery =
      query(
        organizationsRef,
        orderBy("displayOrder", "asc")
      );

    const snapshot =
      await getDocs(
        organizationsQuery
      );

    state.organizations =
      snapshot.docs.map(
        snapshotDoc => ({

          id: snapshotDoc.id,

          ...snapshotDoc.data()

        })
      );

    state.currentPage = 1;

    applyFilters();

  } catch (error) {

    console.error(
      "Failed to load organizations:",
      error
    );

    organizationGrid.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">
          !
        </div>

        <div class="empty-title">
          Could not load organizations
        </div>

        <p class="empty-text">
          ${escapeHTML(error.message)}
        </p>

      </div>
    `;

  }

}


// =========================================================
// STATISTICS
// =========================================================

function renderStatistics() {

  const total =
    state.organizations.length;

  const published =
    state.organizations.filter(
      organization =>
        normalizeStatus(
          organization.status
        ) === "published"
    ).length;

  const drafts =
    state.organizations.filter(
      organization =>
        normalizeStatus(
          organization.status
        ) === "draft"
    ).length;

  const archived =
    state.organizations.filter(
      organization =>
        normalizeStatus(
          organization.status
        ) === "archived"
    ).length;


  document.getElementById(
    "totalOrganizations"
  ).textContent = total;

  document.getElementById(
    "publishedOrganizations"
  ).textContent = published;

  document.getElementById(
    "draftOrganizations"
  ).textContent = drafts;

  document.getElementById(
    "archivedOrganizations"
  ).textContent = archived;

}


// =========================================================
// FILTERS
// =========================================================

function applyFilters() {

  const search =
    searchInput.value
      .trim()
      .toLowerCase();

  const status =
    statusFilter.value;


  state.filteredOrganizations =
    state.organizations.filter(
      organization => {

        const name =
          String(
            organization.name || ""
          ).toLowerCase();

        const organizationStatus =
          normalizeStatus(
            organization.status
          );


        const matchesSearch =
          !search ||
          name.includes(search);


        const matchesStatus =
          status === "all" ||
          organizationStatus === status;


        return (
          matchesSearch &&
          matchesStatus
        );

      }
    );


  state.currentPage = Math.min(
    state.currentPage,
    Math.max(
      1,
      Math.ceil(
        state.filteredOrganizations.length /
        state.pageSize
      )
    )
  );


  renderOrganizations();

}


// =========================================================
// RENDER ORGANIZATIONS
// =========================================================

function renderOrganizations() {

  renderStatistics();


  const organizations =
    state.filteredOrganizations;

  organizationCount.textContent =
    `${organizations.length} organization${
      organizations.length === 1
        ? ""
        : "s"
    }`;


  if (!organizations.length) {

    organizationGrid.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">
          ◈
        </div>

        <div class="empty-title">
          No organizations found
        </div>

        <p class="empty-text">
          Add an organization or change your
          search and filter settings.
        </p>

      </div>
    `;

    pagination.innerHTML = "";

    paginationInfo.textContent =
      "Showing 0 organizations";

    return;

  }


  const start =
    (
      state.currentPage - 1
    ) * state.pageSize;


  const end =
    start + state.pageSize;


  const pageOrganizations =
    organizations.slice(
      start,
      end
    );


  organizationGrid.innerHTML =
    pageOrganizations
      .map(renderOrganizationCard)
      .join("");


  const showingStart =
    start + 1;

  const showingEnd =
    Math.min(
      end,
      organizations.length
    );


  paginationInfo.textContent =
    `Showing ${showingStart}–${showingEnd} of ${organizations.length}`;


  renderPagination();

}


// =========================================================
// ORGANIZATION CARD
// =========================================================

function renderOrganizationCard(
  organization
) {

  const status =
    normalizeStatus(
      organization.status
    );

  const name =
    organization.name ||
    "Unnamed Organization";

  const logo =
    organization.logoUrl || "";


  const active =
    organization.active === true;


  return `

    <article
      class="project-card organization-card"
      data-id="${escapeHTML(organization.id)}"
    >

      <div class="project-image">

        ${
          logo
            ? `
              <img
                src="${escapeHTML(logo)}"
                alt="${escapeHTML(name)} logo"
                loading="lazy"
              >
            `
            : `
              <div class="project-image-placeholder">
                ${escapeHTML(name)}
              </div>
            `
        }


        <span
          class="project-status ${status}"
        >
          ${escapeHTML(status)}
        </span>

      </div>


      <div class="project-content">

        <div class="project-category">
          ${active ? "Visible on website" : "Hidden from website"}
        </div>


        <h3 class="project-title">
          ${escapeHTML(name)}
        </h3>


        <p class="project-description">

          Display order:
          ${Number(organization.displayOrder) || 0}

          ·

          Added:
          ${escapeHTML(
            formatDate(
              organization.createdAt
            )
          )}

        </p>


        <div class="project-meta">

          <span class="project-date">

            ${
              active
                ? "Website: Visible"
                : "Website: Hidden"
            }

          </span>


          <div class="project-actions">

            <button
              type="button"
              class="icon-btn edit-organization"
              data-id="${escapeHTML(organization.id)}"
              title="Edit organization"
              aria-label="Edit organization"
            >
              ✎
            </button>


            ${
              status !== "archived"
                ? `
                  <button
                    type="button"
                    class="icon-btn archive-organization"
                    data-id="${escapeHTML(organization.id)}"
                    title="Archive organization"
                    aria-label="Archive organization"
                  >
                    ▱
                  </button>
                `
                : ""
            }

          </div>

        </div>

      </div>

    </article>

  `;

}


// =========================================================
// PAGINATION
// =========================================================

function renderPagination() {

  pagination.innerHTML = "";

  const totalPages =
    Math.ceil(
      state.filteredOrganizations.length /
      state.pageSize
    );


  if (totalPages <= 1) {
    return;
  }


  const previous =
    document.createElement("button");

  previous.type = "button";

  previous.className = "page-btn";

  previous.textContent = "‹";

  previous.disabled =
    state.currentPage === 1;


  previous.addEventListener(
    "click",
    () => {

      if (
        state.currentPage > 1
      ) {

        state.currentPage--;

        renderOrganizations();

      }

    }
  );


  pagination.appendChild(
    previous
  );


  for (
    let page = 1;
    page <= totalPages;
    page++
  ) {

    const button =
      document.createElement("button");

    button.type = "button";

    button.className =
      "page-btn" +
      (
        page === state.currentPage
          ? " active"
          : ""
      );

    button.textContent =
      page;


    button.addEventListener(
      "click",
      () => {

        state.currentPage =
          page;

        renderOrganizations();

      }
    );


    pagination.appendChild(
      button
    );

  }


  const next =
    document.createElement("button");

  next.type = "button";

  next.className = "page-btn";

  next.textContent = "›";

  next.disabled =
    state.currentPage === totalPages;


  next.addEventListener(
    "click",
    () => {

      if (
        state.currentPage < totalPages
      ) {

        state.currentPage++;

        renderOrganizations();

      }

    }
  );


  pagination.appendChild(
    next
  );

}


// =========================================================
// OPEN ADD MODAL
// =========================================================

function openAddModal() {

  state.editingOrganizationId = null;

  state.existingLogoUrl = "";

  state.existingLogoPublicId = "";


  organizationForm.reset();


  organizationModalHeading.textContent =
    "Add Organization";


  saveOrganizationBtn.textContent =
    "Save Organization";


  organizationStatus.value =
    "draft";


  organizationActive.checked =
    false;


  displayOrder.value =
    Math.max(
      1,
      state.organizations.length + 1
    );


  logoPreview.classList.remove(
    "show"
  );

  logoPreviewImage.src = "";

  existingLogoHelp.hidden = true;

  organizationLogo.value = "";


  openModal(
    organizationModal
  );

}


// =========================================================
// OPEN EDIT MODAL
// =========================================================

function openEditModal(id) {

  const organization =
    state.organizations.find(
      item => item.id === id
    );


  if (!organization) {
    return;
  }


  state.editingOrganizationId =
    id;

  state.existingLogoUrl =
    organization.logoUrl || "";

  state.existingLogoPublicId =
    organization.logoPublicId || "";


  organizationModalHeading.textContent =
    "Edit Organization";


  saveOrganizationBtn.textContent =
    "Update Organization";


  organizationName.value =
    organization.name || "";


  organizationStatus.value =
    normalizeStatus(
      organization.status
    ) === "archived"
      ? "draft"
      : normalizeStatus(
          organization.status
        );


  organizationActive.checked =
    organization.active === true;


  displayOrder.value =
    Number(
      organization.displayOrder
    ) || 1;


  organizationLogo.value =
    "";


  if (organization.logoUrl) {

    logoPreviewImage.src =
      organization.logoUrl;

    logoPreview.classList.add(
      "show"
    );

    existingLogoHelp.hidden =
      false;

  } else {

    logoPreview.classList.remove(
      "show"
    );

    existingLogoHelp.hidden =
      true;

  }


  openModal(
    organizationModal
  );

}


// =========================================================
// MODAL HELPERS
// =========================================================

function openModal(modal) {

  modal.classList.add("open");

  modal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow =
    "hidden";

}


function closeModal(modal) {

  modal.classList.remove("open");

  modal.setAttribute(
    "aria-hidden",
    "true"
  );

  if (
    !organizationModal.classList.contains(
      "open"
    ) &&
    !archiveModal.classList.contains(
      "open"
    )
  ) {

    document.body.style.overflow =
      "";

  }

}


// =========================================================
// IMAGE VALIDATION
// =========================================================

function validateImage(file) {

  if (!file) {
    return true;
  }


  if (
    !ALLOWED_TYPES.includes(
      file.type
    )
  ) {

    showError(
      "Please upload an SVG, PNG, JPG or WebP logo."
    );

    return false;

  }


  if (
    file.size > MAX_FILE_SIZE
  ) {

    showError(
      "The logo must be 5MB or smaller."
    );

    return false;

  }


  return true;

}


// =========================================================
// IMAGE PREVIEW
// =========================================================

organizationLogo.addEventListener(
  "change",
  () => {

    const file =
      organizationLogo.files[0];


    if (!file) {
      return;
    }


    if (
      !validateImage(file)
    ) {

      organizationLogo.value =
        "";

      return;

    }


    const reader =
      new FileReader();


    reader.onload =
      event => {

        logoPreviewImage.src =
          event.target.result;

        logoPreview.classList.add(
          "show"
        );

      };


    reader.readAsDataURL(
      file
    );

  }
);


// =========================================================
// CLOUDINARY UPLOAD
// =========================================================

async function uploadLogo(file) {

  if (!file) {
    return null;
  }


  if (
    !validateImage(file)
  ) {

    throw new Error(
      "Invalid logo file."
    );

  }


  const formData =
    new FormData();


  formData.append(
    "file",
    file
  );


  formData.append(
    "upload_preset",
    CLOUDINARY_UPLOAD_PRESET
  );


  const response =
    await fetch(
      CLOUDINARY_UPLOAD_URL,
      {
        method: "POST",
        body: formData
      }
    );


  if (!response.ok) {

    const errorText =
      await response.text();

    console.error(
      "Cloudinary upload error:",
      errorText
    );

    throw new Error(
      "Logo upload failed."
    );

  }


  const data =
    await response.json();


  if (!data.secure_url) {

    throw new Error(
      "Cloudinary did not return a logo URL."
    );

  }


  return {

    url: data.secure_url,

    publicId:
      data.public_id || "",

    resourceType:
      data.resource_type || "image",

    format:
      data.format || "",

    width:
      data.width || null,

    height:
      data.height || null,

    bytes:
      data.bytes || file.size

  };

}


// =========================================================
// SAVE ORGANIZATION
// =========================================================

organizationForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    const name =
      organizationName.value.trim();


    if (!name) {

      showError(
        "Organization name is required."
      );

      return;

    }


    const file =
      organizationLogo.files[0];


    if (
      !state.editingOrganizationId &&
      !file
    ) {

      showError(
        "Please upload the organization logo."
      );

      return;

    }


    if (
      file &&
      !validateImage(file)
    ) {

      return;

    }


    const status =
      organizationStatus.value;


    const active =
      organizationActive.checked;


    const order =
      Math.max(
        1,
        Number(
          displayOrder.value
        ) || 1
      );


    saveOrganizationBtn.disabled =
      true;


    saveOrganizationBtn.textContent =
      file
        ? "Uploading logo..."
        : "Saving...";


    try {

      let logoUrl =
        state.existingLogoUrl;

      let logoPublicId =
        state.existingLogoPublicId;


      // ---------------------------------------------
      // CLOUDINARY
      // ---------------------------------------------

      if (file) {

        const uploaded =
          await uploadLogo(file);


        logoUrl =
          uploaded.url;


        logoPublicId =
          uploaded.publicId;

      }


      // ---------------------------------------------
      // FIRESTORE DATA
      // ---------------------------------------------

      const user =
        auth.currentUser;


      if (!user) {

        throw new Error(
          "You must be signed in to manage organizations."
        );

      }


      const organizationData = {

        name,

        logoUrl,

        logoPublicId,

        status,

        active:
          status === "published"
            ? active
            : false,

        displayOrder: order,

        updatedAt:
          serverTimestamp(),

        updatedBy:
          user.uid

      };


      // ---------------------------------------------
      // CREATE
      // ---------------------------------------------

      if (
        !state.editingOrganizationId
      ) {

        organizationData.createdAt =
          serverTimestamp();

        organizationData.createdBy =
          user.uid;


        await addDoc(
          collection(
            db,
            COLLECTION_NAME
          ),
          organizationData
        );


        showSuccess(
          `${name} has been added.`
        );

      }


      // ---------------------------------------------
      // UPDATE
      // ---------------------------------------------

      else {

        await updateDoc(
          doc(
            db,
            COLLECTION_NAME,
            state.editingOrganizationId
          ),
          organizationData
        );


        showSuccess(
          `${name} has been updated.`
        );

      }


      closeModal(
        organizationModal
      );


      await loadOrganizations();


    } catch (error) {

      console.error(
        "Failed to save organization:",
        error
      );


      showError(
        error.message ||
        "Could not save organization."
      );


    } finally {

      saveOrganizationBtn.disabled =
        false;

      saveOrganizationBtn.textContent =
        state.editingOrganizationId
          ? "Update Organization"
          : "Save Organization";

    }

  }
);


// =========================================================
// ARCHIVE
// =========================================================

function openArchiveModal(id) {

  const organization =
    state.organizations.find(
      item => item.id === id
    );


  if (!organization) {
    return;
  }


  state.archiveOrganizationId =
    id;


  archiveModalText.textContent =
    `"${organization.name}" will be removed from the public website. The record will remain in the system.`;
  

  openModal(
    archiveModal
  );

}


confirmArchiveBtn.addEventListener(
  "click",
  async () => {

    if (
      !state.archiveOrganizationId
    ) {

      return;

    }


    const id =
      state.archiveOrganizationId;


    const user =
      auth.currentUser;


    if (!user) {

      showError(
        "You must be signed in."
      );

      return;

    }


    confirmArchiveBtn.disabled =
      true;

    confirmArchiveBtn.textContent =
      "Archiving...";


    try {

      await updateDoc(
        doc(
          db,
          COLLECTION_NAME,
          id
        ),
        {

          status: "archived",

          active: false,

          updatedAt:
            serverTimestamp(),

          updatedBy:
            user.uid

        }
      );


      closeModal(
        archiveModal
      );


      state.archiveOrganizationId =
        null;


      await loadOrganizations();


    } catch (error) {

      console.error(
        "Archive failed:",
        error
      );


      showError(
        error.message ||
        "Could not archive organization."
      );


    } finally {

      confirmArchiveBtn.disabled =
        false;

      confirmArchiveBtn.textContent =
        "Archive Organization";

    }

  }
);


// =========================================================
// EVENT DELEGATION
// =========================================================

organizationGrid.addEventListener(
  "click",
  event => {

    const editButton =
      event.target.closest(
        ".edit-organization"
      );


    if (editButton) {

      openEditModal(
        editButton.dataset.id
      );

      return;

    }


    const archiveButton =
      event.target.closest(
        ".archive-organization"
      );


    if (archiveButton) {

      openArchiveModal(
        archiveButton.dataset.id
      );

    }

  }
);


// =========================================================
// SEARCH
// =========================================================

searchInput.addEventListener(
  "input",
  () => {

    state.currentPage = 1;

    applyFilters();

  }
);


// =========================================================
// STATUS FILTER
// =========================================================

statusFilter.addEventListener(
  "change",
  () => {

    state.currentPage = 1;

    applyFilters();

  }
);


// =========================================================
// RESET
// =========================================================

resetFiltersBtn.addEventListener(
  "click",
  () => {

    searchInput.value =
      "";

    statusFilter.value =
      "all";

    state.currentPage =
      1;

    applyFilters();

  }
);


// =========================================================
// REFRESH
// =========================================================

refreshBtn.addEventListener(
  "click",
  async () => {

    refreshBtn.disabled =
      true;

    refreshBtn.textContent =
      "↻ Loading...";


    try {

      await loadOrganizations();

    } finally {

      refreshBtn.disabled =
        false;

      refreshBtn.textContent =
        "↻ Refresh";

    }

  }
);


// =========================================================
// ADD
// =========================================================

addOrganizationBtn.addEventListener(
  "click",
  openAddModal
);


// =========================================================
// CLOSE MODALS
// =========================================================

closeOrganizationModal.addEventListener(
  "click",
  () => {

    closeModal(
      organizationModal
    );

  }
);


cancelOrganizationBtn.addEventListener(
  "click",
  () => {

    closeModal(
      organizationModal
    );

  }
);


cancelArchiveBtn.addEventListener(
  "click",
  () => {

    closeModal(
      archiveModal
    );

  }
);


// =========================================================
// BACKDROP CLICK
// =========================================================

organizationModal.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      organizationModal
    ) {

      closeModal(
        organizationModal
      );

    }

  }
);


archiveModal.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      archiveModal
    ) {

      closeModal(
        archiveModal
      );

    }

  }
);


// =========================================================
// ESCAPE
// =========================================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key !== "Escape"
    ) {

      return;

    }


    if (
      organizationModal.classList.contains(
        "open"
      )
    ) {

      closeModal(
        organizationModal
      );

    }


    if (
      archiveModal.classList.contains(
        "open"
      )
    ) {

      closeModal(
        archiveModal
      );

    }


    if (
      sidebar.classList.contains(
        "open"
      )
    ) {

      closeSidebar();

    }

  }
);


// =========================================================
// AUTH
// =========================================================

onAuthStateChanged(
  auth,
  async user => {

    state.currentUser =
      user || null;


    if (!user) {

      console.warn(
        "No authenticated management user."
      );

      return;

    }


    try {

      await loadOrganizations();

    } catch (error) {

      console.error(
        "Initialization failed:",
        error
      );

    }

  }
);


// =========================================================
// INITIALIZE
// =========================================================

initializeEmployee();