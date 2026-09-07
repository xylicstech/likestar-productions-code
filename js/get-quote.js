/* =========================================================
   LIKESTAR — GET QUOTE PAGE
   Production Firebase + Firestore + Form Behaviour
   ========================================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  getAnalytics,
  logEvent
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";


/* =========================================================
   FIREBASE CONFIGURATION
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyD0I7dUHN7VqckxjlO6lM4RXtYN411k2I",
  authDomain: "likestar-web.firebaseapp.com",
  projectId: "likestar-web",
  storageBucket: "likestar-web.firebasestorage.app",
  messagingSenderId: "371573025114",
  appId: "1:371573025114:web:31c910a8e39461e29e2b63",
  measurementId: "G-0MVMHQE6KL"
};


/* =========================================================
   FIREBASE INITIALIZATION
   ========================================================= */

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let analytics = null;

try {
  analytics = getAnalytics(app);
} catch (error) {
  console.warn(
    "Firebase Analytics could not be initialized.",
    error
  );
}


/* =========================================================
   CONSTANTS
   ========================================================= */

const CUSTOM_SERVICE_MAX_LENGTH = 200;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf"
];

const ALLOWED_FILE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".pdf"
];

const WHATSAPP_NUMBER = "233530543423";


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  initializeQuotePage
);


/* =========================================================
   MAIN INITIALIZER
   ========================================================= */

function initializeQuotePage() {
  initializeMobileNavigation();
  initializeSmoothScrolling();
  initializeHeaderScroll();
  initializeServiceSelection();
  initializeProjectFields();
  initializeCustomService();
  initializeDesignSelection();
  initializeFileUpload();
  initializeDeliveryLocation();
  initializeDateField();
  initializeQuoteForm();
  initializeWhatsApp();
  initializeYear();
  initializeScrollReveal();
  initializeEscapeKey();

  restoreSelectedService();
}


/* =========================================================
   MOBILE NAVIGATION
   ========================================================= */

function initializeMobileNavigation() {
  const menuToggle = document.getElementById("menuToggle");
  const navMenu = document.getElementById("navMenu");

  if (!menuToggle || !navMenu) {
    return;
  }

  const openMenu = () => {
    navMenu.classList.add("open");
    menuToggle.classList.add("active");

    menuToggle.setAttribute(
      "aria-expanded",
      "true"
    );

    menuToggle.setAttribute(
      "aria-label",
      "Close menu"
    );

    document.body.classList.add("menu-open");
  };

  const closeMenu = () => {
    navMenu.classList.remove("open");
    menuToggle.classList.remove("active");

    menuToggle.setAttribute(
      "aria-expanded",
      "false"
    );

    menuToggle.setAttribute(
      "aria-label",
      "Open menu"
    );

    document.body.classList.remove("menu-open");
  };

  menuToggle.addEventListener(
    "click",
    (event) => {
      event.stopPropagation();

      if (
        navMenu.classList.contains("open")
      ) {
        closeMenu();
      } else {
        openMenu();
      }
    }
  );

  navMenu
    .querySelectorAll("a")
    .forEach((link) => {
      link.addEventListener(
        "click",
        closeMenu
      );
    });

  document.addEventListener(
    "click",
    (event) => {
      if (!navMenu.classList.contains("open")) {
        return;
      }

      const clickedInsideMenu =
        navMenu.contains(event.target);

      const clickedToggle =
        menuToggle.contains(event.target);

      if (
        !clickedInsideMenu &&
        !clickedToggle
      ) {
        closeMenu();
      }
    }
  );

  window.addEventListener(
    "resize",
    () => {
      if (window.innerWidth > 900) {
        closeMenu();
      }
    }
  );
}


/* =========================================================
   SMOOTH SCROLLING
   ========================================================= */

function initializeSmoothScrolling() {
  document
    .querySelectorAll('a[href^="#"]')
    .forEach((link) => {
      link.addEventListener(
        "click",
        (event) => {
          const targetId =
            link.getAttribute("href");

          if (
            !targetId ||
            targetId === "#"
          ) {
            return;
          }

          const target =
            document.querySelector(targetId);

          if (!target) {
            return;
          }

          event.preventDefault();

          target.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      );
    });
}


/* =========================================================
   HEADER SCROLL EFFECT
   ========================================================= */

function initializeHeaderScroll() {
  const header =
    document.querySelector(".site-header");

  if (!header) {
    return;
  }

  const updateHeader = () => {
    if (window.scrollY > 20) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  };

  updateHeader();

  window.addEventListener(
    "scroll",
    updateHeader,
    {
      passive: true
    }
  );
}


/* =========================================================
   SERVICE SELECTION FROM OTHER PAGES
   ========================================================= */

function initializeServiceSelection() {
  const serviceButtons =
    document.querySelectorAll(
      ".service-item[data-service], .service-quote[data-service]"
    );

  serviceButtons.forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const selectedService =
          button.dataset.service;

        if (!selectedService) {
          return;
        }

        try {
          sessionStorage.setItem(
            "selectedService",
            selectedService
          );
        } catch (error) {
          console.warn(
            "Could not save selected service.",
            error
          );
        }

        const serviceType =
          document.getElementById(
            "serviceType"
          );

        if (!serviceType) {
          return;
        }

        const matchingOption =
          Array.from(
            serviceType.options
          ).find((option) => {
            return (
              option.value === selectedService ||
              option.textContent.trim() === selectedService
            );
          });

        if (matchingOption) {
          serviceType.value =
            matchingOption.value;

          serviceType.dispatchEvent(
            new Event(
              "change",
              {
                bubbles: true
              }
            )
          );
        }
      }
    );
  });
}


/* =========================================================
   RESTORE SELECTED SERVICE
   ========================================================= */

function restoreSelectedService() {
  const serviceType =
    document.getElementById(
      "serviceType"
    );

  if (!serviceType) {
    return;
  }

  let selectedService = null;

  try {
    selectedService =
      sessionStorage.getItem(
        "selectedService"
      );
  } catch (error) {
    console.warn(
      "Could not read selected service.",
      error
    );
  }

  if (!selectedService) {
    return;
  }

  const matchingOption =
    Array.from(
      serviceType.options
    ).find((option) => {
      return (
        option.value === selectedService ||
        option.textContent.trim() === selectedService
      );
    });

  if (!matchingOption) {
    return;
  }

  serviceType.value =
    matchingOption.value;

  serviceType.dispatchEvent(
    new Event(
      "change",
      {
        bubbles: true
      }
    )
  );
}


/* =========================================================
   PROJECT ELEMENTS
   ========================================================= */

function getProjectElements() {
  return {
    serviceType:
      document.getElementById(
        "serviceType"
      ),

    projectDetails:
      document.getElementById(
        "projectDetails"
      ),

    quantityField:
      document.getElementById(
        "quantityField"
      ),

    sizeField:
      document.getElementById(
        "sizeField"
      ),

    designChoice:
      document.getElementById(
        "designChoice"
      ),

    designUploadField:
      document.getElementById(
        "designUploadField"
      ),

    quantity:
      document.getElementById(
        "quantity"
      ),

    size:
      document.getElementById(
        "size"
      )
  };
}


/* =========================================================
   PROJECT FIELD LOGIC
   ========================================================= */

function initializeProjectFields() {
  const elements =
    getProjectElements();

  if (!elements.serviceType) {
    return;
  }

  const updateProjectFields = () => {
    const selectedOption =
      elements.serviceType
        .selectedOptions[0];

    if (
      !selectedOption ||
      !selectedOption.value
    ) {
      hideElement(
        elements.projectDetails
      );

      hideElement(
        elements.quantityField
      );

      hideElement(
        elements.sizeField
      );

      hideElement(
        elements.designChoice
      );

      hideElement(
        elements.designUploadField
      );

      clearDynamicRequirements();

      return;
    }

    const isCustom =
      selectedOption.value === "custom";

    /*
      Custom service uses its own description field.
      Standard project fields are not required.
    */

    if (isCustom) {
      hideElement(
        elements.projectDetails
      );

      hideElement(
        elements.quantityField
      );

      hideElement(
        elements.sizeField
      );

      hideElement(
        elements.designChoice
      );

      hideElement(
        elements.designUploadField
      );

      clearDynamicRequirements();

      return;
    }

    showElement(
      elements.projectDetails
    );

    const needsQuantity =
      selectedOption.dataset.quantity === "true";

    const needsSize =
      selectedOption.dataset.size === "true";

    const needsDesign =
      selectedOption.dataset.design === "true";


    /* Quantity */

    if (needsQuantity) {
      showElement(
        elements.quantityField
      );

      if (elements.quantity) {
        elements.quantity.required = true;
      }
    } else {
      hideElement(
        elements.quantityField
      );

      if (elements.quantity) {
        elements.quantity.required = false;
        elements.quantity.value = "";
      }
    }


    /* Size */

    if (needsSize) {
      showElement(
        elements.sizeField
      );

      if (elements.size) {
        elements.size.required = true;
      }
    } else {
      hideElement(
        elements.sizeField
      );

      if (elements.size) {
        elements.size.required = false;
        elements.size.value = "";
      }
    }


    /* Design */

    if (needsDesign) {
      showElement(
        elements.designChoice
      );

      setDesignChoiceRequired(true);
    } else {
      hideElement(
        elements.designChoice
      );

      hideElement(
        elements.designUploadField
      );

      setDesignChoiceRequired(false);
      clearDesignSelection();
    }
  };

  elements.serviceType.addEventListener(
    "change",
    updateProjectFields
  );

  updateProjectFields();
}


/* =========================================================
   CLEAR DYNAMIC REQUIREMENTS
   ========================================================= */

function clearDynamicRequirements() {
  const elements =
    getProjectElements();

  if (elements.quantity) {
    elements.quantity.required = false;
    elements.quantity.value = "";
  }

  if (elements.size) {
    elements.size.required = false;
    elements.size.value = "";
  }

  setDesignChoiceRequired(false);
  clearDesignSelection();
}


/* =========================================================
   CUSTOM SERVICE
   ========================================================= */

function initializeCustomService() {
  const serviceType =
    document.getElementById(
      "serviceType"
    );

  const customServiceField =
    document.getElementById(
      "customServiceField"
    );

  const customService =
    document.getElementById(
      "customService"
    );

  const counter =
    document.getElementById(
      "customServiceCounter"
    );

  if (
    !serviceType ||
    !customServiceField ||
    !customService
  ) {
    return;
  }

  customService.setAttribute(
    "maxlength",
    String(
      CUSTOM_SERVICE_MAX_LENGTH
    )
  );

  const updateCounter = () => {
    const length =
      customService.value.length;

    if (counter) {
      counter.textContent =
        `${length} / ${CUSTOM_SERVICE_MAX_LENGTH}`;

      counter.classList.toggle(
        "limit-reached",
        length >= CUSTOM_SERVICE_MAX_LENGTH
      );
    }
  };

  const updateCustomService = () => {
    const isCustom =
      serviceType.value === "custom";

    if (isCustom) {
      showElement(
        customServiceField
      );

      customService.required = true;
    } else {
      hideElement(
        customServiceField
      );

      customService.required = false;
      customService.value = "";

      clearFieldError(
        customService
      );
    }

    updateCounter();
  };

  customService.addEventListener(
    "input",
    updateCounter
  );

  serviceType.addEventListener(
    "change",
    updateCustomService
  );

  updateCustomService();
}


/* =========================================================
   DESIGN SELECTION
   ========================================================= */

function initializeDesignSelection() {
  const designChoice =
    document.getElementById(
      "designChoice"
    );

  const designUploadField =
    document.getElementById(
      "designUploadField"
    );

  const designFiles =
    document.getElementById(
      "designFiles"
    );

  if (
    !designChoice ||
    !designUploadField
  ) {
    return;
  }

  const designRadios =
    designChoice.querySelectorAll(
      'input[name="designOption"]'
    );

  designRadios.forEach((radio) => {
    radio.addEventListener(
      "change",
      () => {
        clearDesignChoiceError();

        if (
          radio.value ===
          "I have my own design"
        ) {
          showElement(
            designUploadField
          );

          if (designFiles) {
            designFiles.required = true;
          }
        } else {
          hideElement(
            designUploadField
          );

          if (designFiles) {
            designFiles.required = false;
            designFiles.value = "";
          }

          clearFileList();
          clearFieldError(
            designFiles
          );
        }
      }
    );
  });
}


/* =========================================================
   DESIGN RADIO REQUIREMENT
   ========================================================= */

function setDesignChoiceRequired(required) {
  const radios =
    document.querySelectorAll(
      'input[name="designOption"]'
    );

  radios.forEach((radio) => {
    radio.required = required;
  });
}


/* =========================================================
   CLEAR DESIGN SELECTION
   ========================================================= */

function clearDesignSelection() {
  const radios =
    document.querySelectorAll(
      'input[name="designOption"]'
    );

  const designFiles =
    document.getElementById(
      "designFiles"
    );

  radios.forEach((radio) => {
    radio.checked = false;
  });

  if (designFiles) {
    designFiles.required = false;
    designFiles.value = "";
  }

  clearFileList();
  clearDesignChoiceError();
}


/* =========================================================
   FILE UPLOAD
   ========================================================= */

function initializeFileUpload() {
  const designFiles =
    document.getElementById(
      "designFiles"
    );

  if (!designFiles) {
    return;
  }

  designFiles.addEventListener(
    "change",
    () => {
      clearFieldError(
        designFiles
      );

      const files =
        Array.from(
          designFiles.files
        );

      if (!files.length) {
        clearFileList();
        return;
      }

      const invalidFiles =
        files.filter((file) => {
          const lowerName =
            file.name.toLowerCase();

          const hasValidExtension =
            ALLOWED_FILE_EXTENSIONS.some(
              (extension) =>
                lowerName.endsWith(extension)
            );

          const hasValidType =
            ALLOWED_FILE_TYPES.includes(
              file.type
            );

          return (
            !hasValidExtension ||
            !hasValidType ||
            file.size > MAX_FILE_SIZE
          );
        });

      if (invalidFiles.length) {
        setFieldError(
          designFiles,
          "Please upload JPG, JPEG, PNG or PDF files under 10MB each."
        );

        designFiles.value = "";
        clearFileList();

        return;
      }

      renderFileList(files);
    }
  );
}


/* =========================================================
   RENDER FILE LIST
   ========================================================= */

function renderFileList(files) {
  const fileList =
    document.getElementById(
      "fileList"
    );

  if (!fileList) {
    return;
  }

  fileList.replaceChildren();

  files.forEach((file) => {
    const item =
      document.createElement(
        "div"
      );

    item.textContent =
      `${file.name} — ${formatFileSize(file.size)}`;

    fileList.appendChild(item);
  });
}


/* =========================================================
   CLEAR FILE LIST
   ========================================================= */

function clearFileList() {
  const fileList =
    document.getElementById(
      "fileList"
    );

  if (fileList) {
    fileList.replaceChildren();
  }
}


/* =========================================================
   FILE SIZE
   ========================================================= */

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}


/* =========================================================
   DELIVERY LOCATION
   ========================================================= */

function initializeDeliveryLocation() {
  const locationInput =
    document.getElementById(
      "location"
    );

  const locationLabel =
    document.getElementById(
      "locationLabel"
    );

  const locationNote =
    document.getElementById(
      "locationNote"
    );

  const deliveryOptions =
    document.querySelectorAll(
      'input[name="deliveryMethod"]'
    );

  if (
    !locationInput ||
    !locationLabel
  ) {
    return;
  }

  const updateLocationField = () => {
    const selectedDelivery =
      document.querySelector(
        'input[name="deliveryMethod"]:checked'
      );

    if (
      selectedDelivery &&
      selectedDelivery.value === "Delivery"
    ) {
      locationLabel.textContent =
        "Delivery Location / Address";

      const requiredSpan =
        document.createElement("span");

      requiredSpan.textContent = " *";

      locationLabel.appendChild(
        requiredSpan
      );

      locationInput.placeholder =
        "Enter your town, area and delivery address";

      locationInput.setAttribute(
        "autocomplete",
        "street-address"
      );

      if (locationNote) {
        locationNote.hidden = false;

        locationNote.textContent =
          "Use the same field to provide the location where LikeStar should deliver your order.";
      }
    } else {
      locationLabel.textContent =
        "Location";

      const requiredSpan =
        document.createElement("span");

      requiredSpan.textContent = " *";

      locationLabel.appendChild(
        requiredSpan
      );

      locationInput.placeholder =
        "Town / city / area";

      locationInput.setAttribute(
        "autocomplete",
        "address-level2"
      );

      if (locationNote) {
        locationNote.hidden = true;
      }
    }
  };

  deliveryOptions.forEach((option) => {
    option.addEventListener(
      "change",
      updateLocationField
    );
  });

  updateLocationField();
}


/* =========================================================
   DATE FIELD
   ========================================================= */

function initializeDateField() {
  const timeline =
    document.getElementById(
      "timeline"
    );

  if (!timeline) {
    return;
  }

  const today =
    new Date();

  const year =
    today.getFullYear();

  const month =
    String(
      today.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      today.getDate()
    ).padStart(2, "0");

  timeline.min =
    `${year}-${month}-${day}`;
}


/* =========================================================
   QUOTE FORM
   ========================================================= */

function initializeQuoteForm() {
  const form =
    document.getElementById(
      "quoteForm"
    );

  if (!form) {
    return;
  }

  form.addEventListener(
    "submit",
    handleQuoteSubmit
  );

  form
    .querySelectorAll(
      "input, select, textarea"
    )
    .forEach((field) => {
      field.addEventListener(
        "input",
        () => {
          clearFieldError(field);
          hideFormError();
        }
      );

      field.addEventListener(
        "change",
        () => {
          clearFieldError(field);
          hideFormError();
        }
      );
    });
}


/* =========================================================
   SUBMIT QUOTE
   ========================================================= */

async function handleQuoteSubmit(event) {
  event.preventDefault();

  const form =
    event.currentTarget;

  const submitButton =
    document.getElementById(
      "submitQuote"
    );

  hideFormError();
  removeSuccessMessage();
  clearAllFieldErrors();

  const validation =
    validateQuoteForm();

  if (!validation.valid) {
    showFormError(
      "Please check the highlighted fields and complete the required information."
    );

    focusFirstError();

    return;
  }

  if (
    submitButton &&
    submitButton.disabled
  ) {
    return;
  }

  if (submitButton) {
    submitButton.disabled = true;

    const buttonText =
      submitButton.querySelector(
        "span:first-child"
      );

    if (buttonText) {
      buttonText.textContent =
        "Sending request...";
    }
  }

  try {
    const quoteData =
      collectQuoteData();

    /*
      Production submission.
      The customer sees success ONLY after
      Firestore confirms the document was created.
    */

    const quoteReference =
      await addDoc(
        collection(
          db,
          "quotes"
        ),
        quoteData
      );

    /*
      Analytics is optional and must never
      cause the quote submission to fail.
    */

    if (analytics) {
      try {
        logEvent(
          analytics,
          "quote_submitted",
          {
            service:
              quoteData.serviceName ||
              "Unknown",

            delivery_method:
              quoteData.deliveryMethod ||
              "Unknown"
          }
        );
      } catch (analyticsError) {
        console.warn(
          "Analytics event could not be recorded.",
          analyticsError
        );
      }
    }

    /*
      Firestore succeeded.
      NOW the success message is created.
    */

    const successMessage =
      showSuccessMessage(
        "Request received.",
        "Thank you. We'll review your request and contact you shortly."
      );

    /*
      Reset only after successful submission.
    */

    form.reset();

    clearDynamicFormState();

    updateLocationAfterReset();

    const customServiceCounter =
      document.getElementById(
        "customServiceCounter"
      );

    if (customServiceCounter) {
      customServiceCounter.textContent =
        `0 / ${CUSTOM_SERVICE_MAX_LENGTH}`;

      customServiceCounter.classList.remove(
        "limit-reached"
      );
    }

    /*
      Remove the stored service so a previous
      selection does not automatically return.
    */

    try {
      sessionStorage.removeItem(
        "selectedService"
      );
    } catch (error) {
      console.warn(
        "Could not clear selected service.",
        error
      );
    }

    /*
      Scroll to the newly-created success message.
    */

    if (successMessage) {
      setTimeout(() => {
        successMessage.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }, 100);
    }

    /*
      Keep reference available for development
      without exposing customer data.
    */

    console.info(
      "LikeStar quote request created:",
      quoteReference.id
    );

  } catch (error) {
    console.error(
      "LikeStar quote submission failed.",
      error
    );

    removeSuccessMessage();

    showFormError(
      getSubmissionErrorMessage(
        error
      )
    );

  } finally {
    if (submitButton) {
      submitButton.disabled = false;

      const buttonText =
        submitButton.querySelector(
          "span:first-child"
        );

      if (buttonText) {
        buttonText.textContent =
          "Request a Quote";
      }
    }
  }
}


/* =========================================================
   COLLECT QUOTE DATA
   ========================================================= */

function collectQuoteData() {
  const selectedService =
    getValue(
      "serviceType"
    );

  const customServiceValue =
    getValue(
      "customService"
    );

  const finalService =
    selectedService === "custom"
      ? customServiceValue
      : selectedService;

  const deliveryMethod =
    document.querySelector(
      'input[name="deliveryMethod"]:checked'
    )?.value || "";

  const location =
    getValue(
      "location"
    );

  const designOption =
    document.querySelector(
      'input[name="designOption"]:checked'
    )?.value || null;

  const designFiles =
    document.getElementById(
      "designFiles"
    );

  /*
    IMPORTANT:
    Files are NOT uploaded to Cloudinary yet.
    Only filenames are stored for now.
  */

  const designFileNames =
    designFiles &&
    designFiles.files.length
      ? Array.from(
          designFiles.files
        ).map(
          (file) => file.name
        )
      : [];

  return {
    customerName:
      getValue("fullName"),

    businessName:
      getValue("businessName") ||
      null,

    phone:
      getValue("phone"),

    location:
      location,

    serviceName:
      finalService,

    customService:
      selectedService === "custom"
        ? customServiceValue
        : null,

    serviceId:
      selectedService === "custom"
        ? null
        : selectedService,

    /*
      Quantity remains part of the
      production quote record.
    */

    quantity:
      getValue("quantity") ||
      null,

    /*
      Size / specifications remains part
      of the production quote record.
    */

    size:
      getValue("size") ||
      null,

    /*
      Design preference remains part
      of the quote.
    */

    designOption:
      designOption,

    designFileNames:
      designFileNames,

    /*
      OPTIONAL FIELD.
      Empty = null.
      It never blocks submission.
    */

    additionalDetails:
      getValue("additionalDetails") ||
      null,

    deliveryMethod:
      deliveryMethod,

    deliveryAddress:
      deliveryMethod === "Delivery"
        ? location
        : null,

    timeline:
      getValue("timeline") ||
      null,

    referralSource:
      getValue("referralSource") ||
      null,

    /*
      Quote workflow fields.
    */

    status:
      "new",

    quotedAmount:
      null,

    grossSaleAmount:
      null,

    discount:
      null,

    netRevenue:
      null,

    currency:
      "GHS",

    assignedTo:
      null,

    assignedToName:
      null,

    createdAt:
      serverTimestamp(),

    contactedAt:
      null,

    quotedAt:
      null,

    wonAt:
      null,

    followUpAt:
      null,

    lastContactedAt:
      null,

    notes:
      "",

    source:
      "website"
  };
}


/* =========================================================
   VALIDATE FORM
   ========================================================= */

function validateQuoteForm() {
  let valid = true;

  const fullName =
    document.getElementById(
      "fullName"
    );

  const phone =
    document.getElementById(
      "phone"
    );

  const location =
    document.getElementById(
      "location"
    );

  const serviceType =
    document.getElementById(
      "serviceType"
    );

  const customService =
    document.getElementById(
      "customService"
    );

  const timeline =
    document.getElementById(
      "timeline"
    );

  const referralSource =
    document.getElementById(
      "referralSource"
    );

  const confirmation =
    document.getElementById(
      "confirmation"
    );


  /* =======================================================
     FULL NAME
     ======================================================= */

  const fullNameValue =
    getValue("fullName");

  if (
    !fullName ||
    !fullNameValue
  ) {
    setFieldError(
      fullName,
      "Please enter your full name."
    );

    valid = false;

  } else if (
    fullNameValue.length < 2
  ) {
    setFieldError(
      fullName,
      "Please enter your full name."
    );

    valid = false;
  }


  /* =======================================================
     PHONE
     ======================================================= */

  const phoneValue =
    getValue("phone");

  if (
    !phone ||
    !phoneValue
  ) {
    setFieldError(
      phone,
      "Please enter your phone or WhatsApp number."
    );

    valid = false;

  } else if (
    !isValidPhone(
      phoneValue
    )
  ) {
    setFieldError(
      phone,
      "Please enter a valid phone number."
    );

    valid = false;
  }


  /* =======================================================
     LOCATION
     ======================================================= */

  if (
    !location ||
    !getValue("location")
  ) {
    setFieldError(
      location,
      "Please enter your location."
    );

    valid = false;
  }


  /* =======================================================
     SERVICE
     ======================================================= */

  if (
    !serviceType ||
    !getValue("serviceType")
  ) {
    setFieldError(
      serviceType,
      "Please select a service."
    );

    valid = false;
  }


  /* =======================================================
     CUSTOM SERVICE
     ======================================================= */

  if (
    serviceType &&
    serviceType.value === "custom"
  ) {
    const customValue =
      getValue("customService");

    if (!customValue) {
      setFieldError(
        customService,
        "Please describe the service you need."
      );

      valid = false;

    } else if (
      customValue.length >
      CUSTOM_SERVICE_MAX_LENGTH
    ) {
      setFieldError(
        customService,
        "Your service description must be 200 characters or less."
      );

      valid = false;
    }
  }


  /* =======================================================
     QUANTITY
     ======================================================= */

  const quantityField =
    document.getElementById(
      "quantityField"
    );

  const quantity =
    document.getElementById(
      "quantity"
    );

  if (
    quantityField &&
    !quantityField.hidden &&
    quantity
  ) {
    const quantityValue =
      getValue("quantity");

    if (!quantityValue) {
      setFieldError(
        quantity,
        "Please enter the quantity."
      );

      valid = false;

    } else {
      const numericQuantity =
        Number(
          quantityValue
        );

      if (
        !Number.isInteger(
          numericQuantity
        ) ||
        numericQuantity < 1
      ) {
        setFieldError(
          quantity,
          "Please enter a valid quantity."
        );

        valid = false;
      }
    }
  }


  /* =======================================================
     SIZE / SPECIFICATIONS
     ======================================================= */

  const sizeField =
    document.getElementById(
      "sizeField"
    );

  const size =
    document.getElementById(
      "size"
    );

  if (
    sizeField &&
    !sizeField.hidden &&
    size
  ) {
    if (!getValue("size")) {
      setFieldError(
        size,
        "Please enter the size or specifications."
      );

      valid = false;
    }
  }


  /* =======================================================
     DESIGN
     ======================================================= */

  const designChoice =
    document.getElementById(
      "designChoice"
    );

  if (
    designChoice &&
    !designChoice.hidden
  ) {
    const selectedDesign =
      document.querySelector(
        'input[name="designOption"]:checked'
      );

    if (!selectedDesign) {
      showDesignChoiceError(
        "Please select a design option."
      );

      valid = false;

    } else if (
      selectedDesign.value ===
      "I have my own design"
    ) {
      const designFiles =
        document.getElementById(
          "designFiles"
        );

      if (
        !designFiles ||
        !designFiles.files.length
      ) {
        setFieldError(
          designFiles,
          "Please upload your design."
        );

        valid = false;
      }
    }
  }


  /* =======================================================
     DELIVERY METHOD
     ======================================================= */

  const deliveryMethod =
    document.querySelector(
      'input[name="deliveryMethod"]:checked'
    );

  const deliveryOptions =
    document.querySelector(
      ".delivery-options"
    );

  if (!deliveryMethod) {
    showDeliveryError(
      "Please choose Delivery or Pickup."
    );

    valid = false;

  } else {
    clearDeliveryError();
  }


  /* =======================================================
     TIMELINE
     ======================================================= */

  const timelineValue =
    getValue("timeline");

  if (
    !timeline ||
    !timelineValue
  ) {
    setFieldError(
      timeline,
      "Please select your preferred completion date."
    );

    valid = false;

  } else {
    const selectedDate =
      new Date(
        `${timelineValue}T00:00:00`
      );

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    if (
      Number.isNaN(
        selectedDate.getTime()
      ) ||
      selectedDate < today
    ) {
      setFieldError(
        timeline,
        "Please select today or a future date."
      );

      valid = false;
    }
  }


  /* =======================================================
     REFERRAL
     ======================================================= */

  if (
    !referralSource ||
    !getValue("referralSource")
  ) {
    setFieldError(
      referralSource,
      "Please select how you heard about LikeStar."
    );

    valid = false;
  }


  /* =======================================================
     CONFIRMATION
     ======================================================= */

  const confirmationError =
    document.getElementById(
      "confirmationError"
    );

  if (
    !confirmation ||
    !confirmation.checked
  ) {
    if (confirmationError) {
      confirmationError.textContent =
        "Please confirm that the information provided is accurate.";
    }

    valid = false;

  } else {
    if (confirmationError) {
      confirmationError.textContent =
        "";
    }
  }


  return {
    valid
  };
}


/* =========================================================
   PHONE VALIDATION
   ========================================================= */

function isValidPhone(phone) {
  const cleaned =
    phone.replace(
      /[\s\-().]/g,
      ""
    );

  /*
    Accept:
    0241234567
    233241234567
    +233241234567
    and common international formats.
  */

  return (
    /^\+?[0-9]{9,15}$/.test(
      cleaned
    )
  );
}


/* =========================================================
   WHATSAPP
   ========================================================= */

function initializeWhatsApp() {
  const whatsappButton =
    document.getElementById(
      "whatsappQuote"
    );

  if (!whatsappButton) {
    return;
  }

  whatsappButton.addEventListener(
    "click",
    () => {
      clearAllFieldErrors();
      hideFormError();

      const validation =
        validateQuoteForm();

      if (!validation.valid) {
        showFormError(
          "Please complete the required information before using WhatsApp."
        );

        focusFirstError();

        return;
      }

      const quote =
        collectQuoteData();

      const message =
        buildWhatsAppMessage(
          quote
        );

      const whatsappUrl =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

      window.open(
        whatsappUrl,
        "_blank",
        "noopener,noreferrer"
      );
    }
  );
}


/* =========================================================
   WHATSAPP MESSAGE
   ========================================================= */

function buildWhatsAppMessage(quote) {
  const lines = [
    "Hello LikeStar, I'd like to request a quote.",
    "",

    `Name: ${quote.customerName}`,

    quote.businessName
      ? `Business / Organization: ${quote.businessName}`
      : null,

    `Phone / WhatsApp: ${quote.phone}`,

    `Location: ${quote.location}`,

    `Service: ${quote.serviceName}`,

    quote.quantity
      ? `Quantity: ${quote.quantity}`
      : null,

    quote.size
      ? `Size / Specifications: ${quote.size}`
      : null,

    quote.designOption
      ? `Design: ${quote.designOption}`
      : null,

    quote.designOption ===
      "I have my own design" &&
    quote.designFileNames?.length
      ? `Design Files: ${quote.designFileNames.join(", ")}`
      : null,

    quote.additionalDetails
      ? `Additional Details: ${quote.additionalDetails}`
      : null,

    `Delivery Method: ${quote.deliveryMethod}`,

    `Preferred Completion Date: ${quote.timeline}`,

    `How I heard about LikeStar: ${quote.referralSource}`
  ];

  return lines
    .filter(Boolean)
    .join("\n");
}


/* =========================================================
   SUCCESS MESSAGE
   ========================================================= */

function showSuccessMessage(
  title,
  message
) {
  removeSuccessMessage();

  const form =
    document.getElementById(
      "quoteForm"
    );

  if (!form) {
    return null;
  }

  const successMessage =
    document.createElement(
      "div"
    );

  successMessage.className =
    "form-message success-message";

  successMessage.id =
    "successMessage";

  successMessage.setAttribute(
    "role",
    "status"
  );

  successMessage.setAttribute(
    "aria-live",
    "polite"
  );

  const strong =
    document.createElement(
      "strong"
    );

  strong.textContent =
    title;

  const span =
    document.createElement(
      "span"
    );

  span.textContent =
    message;

  successMessage.append(
    strong,
    span
  );

  /*
    Insert immediately after the form actions
    when possible, otherwise append to form.
  */

  const formActions =
    form.querySelector(
      ".form-actions"
    );

  if (formActions) {
    formActions.insertAdjacentElement(
      "afterend",
      successMessage
    );
  } else {
    form.appendChild(
      successMessage
    );
  }

  return successMessage;
}


/* =========================================================
   REMOVE SUCCESS MESSAGE
   ========================================================= */

function removeSuccessMessage() {
  const successMessage =
    document.getElementById(
      "successMessage"
    );

  if (successMessage) {
    successMessage.remove();
  }
}


/* =========================================================
   FORM ERROR
   ========================================================= */

function showFormError(message) {
  const formError =
    document.getElementById(
      "formError"
    );

  if (!formError) {
    return;
  }

  formError.textContent =
    message;

  formError.hidden = false;
}


function hideFormError() {
  const formError =
    document.getElementById(
      "formError"
    );

  if (formError) {
    formError.hidden = true;
    formError.textContent = "";
  }
}


/* =========================================================
   FIRESTORE ERROR MESSAGE
   ========================================================= */

function getSubmissionErrorMessage(error) {
  if (
    error &&
    error.code ===
      "permission-denied"
  ) {
    return (
      "We couldn't submit your request right now. Please contact LikeStar through WhatsApp."
    );
  }

  if (
    error &&
    (
      error.code === "unavailable" ||
      error.code === "failed-precondition"
    )
  ) {
    return (
      "The quote service is temporarily unavailable. Please check your internet connection and try again."
    );
  }

  if (
    error &&
    error.code ===
      "resource-exhausted"
  ) {
    return (
      "The quote service is temporarily busy. Please wait a moment and try again."
    );
  }

  return (
    "We couldn't submit your request right now. Please check your internet connection and try again, or contact LikeStar through WhatsApp."
  );
}


/* =========================================================
   FIELD VALUE
   ========================================================= */

function getValue(id) {
  const element =
    document.getElementById(
      id
    );

  if (!element) {
    return "";
  }

  return String(
    element.value || ""
  ).trim();
}


/* =========================================================
   SHOW ELEMENT
   ========================================================= */

function showElement(element) {
  if (!element) {
    return;
  }

  element.hidden = false;
}


/* =========================================================
   HIDE ELEMENT
   ========================================================= */

function hideElement(element) {
  if (!element) {
    return;
  }

  element.hidden = true;
}


/* =========================================================
   SET FIELD ERROR
   ========================================================= */

function setFieldError(
  field,
  message
) {
  if (!field) {
    return;
  }

  const parent =
    field.closest(
      ".form-group, .upload-field"
    );

  if (!parent) {
    return;
  }

  let error =
    parent.querySelector(
      ".field-error"
    );

  if (!error) {
    error =
      document.createElement(
        "small"
      );

    error.className =
      "field-error";

    parent.appendChild(
      error
    );
  }

  error.textContent =
    message;

  field.setAttribute(
    "aria-invalid",
    "true"
  );
}


/* =========================================================
   CLEAR FIELD ERROR
   ========================================================= */

function clearFieldError(field) {
  if (!field) {
    return;
  }

  const parent =
    field.closest(
      ".form-group, .upload-field"
    );

  if (!parent) {
    return;
  }

  const error =
    parent.querySelector(
      ".field-error"
    );

  if (error) {
    error.textContent = "";
  }

  field.removeAttribute(
    "aria-invalid"
  );
}


/* =========================================================
   CLEAR ALL FIELD ERRORS
   ========================================================= */

function clearAllFieldErrors() {
  document
    .querySelectorAll(
      ".field-error"
    )
    .forEach((error) => {
      error.textContent = "";
    });

  document
    .querySelectorAll(
      '[aria-invalid="true"]'
    )
    .forEach((field) => {
      field.removeAttribute(
        "aria-invalid"
      );
    });

  clearDesignChoiceError();
  clearDeliveryError();

  const confirmationError =
    document.getElementById(
      "confirmationError"
    );

  if (confirmationError) {
    confirmationError.textContent = "";
  }
}


/* =========================================================
   DESIGN ERROR
   ========================================================= */

function showDesignChoiceError(message) {
  const error =
    document.getElementById(
      "designChoiceError"
    );

  if (error) {
    error.textContent =
      message;
  }
}


/* =========================================================
   CLEAR DESIGN ERROR
   ========================================================= */

function clearDesignChoiceError() {
  const error =
    document.getElementById(
      "designChoiceError"
    );

  if (error) {
    error.textContent = "";
  }
}


/* =========================================================
   DELIVERY ERROR
   ========================================================= */

function showDeliveryError(message) {
  const deliveryOptions =
    document.querySelector(
      ".delivery-options"
    );

  if (!deliveryOptions) {
    return;
  }

  let error =
    deliveryOptions.querySelector(
      ".field-error"
    );

  if (!error) {
    error =
      document.createElement(
        "small"
      );

    error.className =
      "field-error";

    deliveryOptions.appendChild(
      error
    );
  }

  error.textContent =
    message;
}


/* =========================================================
   CLEAR DELIVERY ERROR
   ========================================================= */

function clearDeliveryError() {
  const deliveryOptions =
    document.querySelector(
      ".delivery-options"
    );

  if (!deliveryOptions) {
    return;
  }

  const error =
    deliveryOptions.querySelector(
      ".field-error"
    );

  if (error) {
    error.textContent = "";
  }
}


/* =========================================================
   FOCUS FIRST ERROR
   ========================================================= */

function focusFirstError() {
  const invalidField =
    document.querySelector(
      '[aria-invalid="true"]'
    );

  if (invalidField) {
    invalidField.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    setTimeout(() => {
      try {
        invalidField.focus({
          preventScroll: true
        });
      } catch {
        invalidField.focus();
      }
    }, 300);

    return;
  }

  const designError =
    document.getElementById(
      "designChoiceError"
    );

  if (
    designError &&
    designError.textContent.trim()
  ) {
    const designChoice =
      document.getElementById(
        "designChoice"
      );

    if (designChoice) {
      designChoice.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }

    return;
  }

  const deliveryError =
    document.querySelector(
      ".delivery-options .field-error"
    );

  if (
    deliveryError &&
    deliveryError.textContent.trim()
  ) {
    const deliveryOptions =
      document.querySelector(
        ".delivery-options"
      );

    if (deliveryOptions) {
      deliveryOptions.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  }
}


/* =========================================================
   CLEAR DYNAMIC FORM STATE
   ========================================================= */

function clearDynamicFormState() {
  const serviceType =
    document.getElementById(
      "serviceType"
    );

  const customService =
    document.getElementById(
      "customService"
    );

  const customServiceCounter =
    document.getElementById(
      "customServiceCounter"
    );

  const projectDetails =
    document.getElementById(
      "projectDetails"
    );

  const quantityField =
    document.getElementById(
      "quantityField"
    );

  const sizeField =
    document.getElementById(
      "sizeField"
    );

  const designChoice =
    document.getElementById(
      "designChoice"
    );

  const designUploadField =
    document.getElementById(
      "designUploadField"
    );

  const designFiles =
    document.getElementById(
      "designFiles"
    );

  if (serviceType) {
    serviceType.value = "";
  }

  if (customService) {
    customService.value = "";
    customService.required = false;
  }

  if (customServiceCounter) {
    customServiceCounter.textContent =
      `0 / ${CUSTOM_SERVICE_MAX_LENGTH}`;

    customServiceCounter.classList.remove(
      "limit-reached"
    );
  }

  hideElement(
    projectDetails
  );

  hideElement(
    quantityField
  );

  hideElement(
    sizeField
  );

  hideElement(
    designChoice
  );

  hideElement(
    designUploadField
  );

  if (designFiles) {
    designFiles.value = "";
    designFiles.required = false;
  }

  clearFileList();
  clearAllFieldErrors();
}


/* =========================================================
   LOCATION AFTER FORM RESET
   ========================================================= */

function updateLocationAfterReset() {
  const locationInput =
    document.getElementById(
      "location"
    );

  const locationLabel =
    document.getElementById(
      "locationLabel"
    );

  const locationNote =
    document.getElementById(
      "locationNote"
    );

  if (locationInput) {
    locationInput.placeholder =
      "Town / city / area";

    locationInput.setAttribute(
      "autocomplete",
      "address-level2"
    );
  }

  if (locationLabel) {
    locationLabel.textContent =
      "Location";

    const requiredSpan =
      document.createElement(
        "span"
      );

    requiredSpan.textContent =
      " *";

    locationLabel.appendChild(
      requiredSpan
    );
  }

  if (locationNote) {
    locationNote.hidden = true;
  }
}


/* =========================================================
   CURRENT YEAR
   ========================================================= */

function initializeYear() {
  const year =
    document.getElementById(
      "currentYear"
    );

  if (year) {
    year.textContent =
      new Date().getFullYear();
  }
}


/* =========================================================
   SCROLL REVEAL
   ========================================================= */

function initializeScrollReveal() {
  const elements =
    document.querySelectorAll(
      ".form-section, .sidebar-card"
    );

  if (
    !elements.length ||
    !("IntersectionObserver" in window)
  ) {
    return;
  }

  const prefersReducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

  if (prefersReducedMotion) {
    return;
  }

  elements.forEach((element) => {
    element.style.opacity = "0";
    element.style.transform =
      "translateY(15px)";

    element.style.transition =
      "opacity 0.55s ease, transform 0.55s ease";
  });

  const observer =
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.style.opacity =
            "1";

          entry.target.style.transform =
            "translateY(0)";

          observer.unobserve(
            entry.target
          );
        });
      },
      {
        threshold: 0.08
      }
    );

  elements.forEach((element) => {
    observer.observe(element);
  });
}


/* =========================================================
   ESCAPE KEY
   ========================================================= */

function initializeEscapeKey() {
  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key !== "Escape"
      ) {
        return;
      }

      const navMenu =
        document.getElementById(
          "navMenu"
        );

      const menuToggle =
        document.getElementById(
          "menuToggle"
        );

      if (
        !navMenu ||
        !menuToggle
      ) {
        return;
      }

      navMenu.classList.remove(
        "open"
      );

      menuToggle.classList.remove(
        "active"
      );

      menuToggle.setAttribute(
        "aria-expanded",
        "false"
      );

      menuToggle.setAttribute(
        "aria-label",
        "Open menu"
      );

      document.body.classList.remove(
        "menu-open"
      );
    }
  );
}


/* =========================================================
   END OF GET-QUOTE.JS
   ========================================================= */