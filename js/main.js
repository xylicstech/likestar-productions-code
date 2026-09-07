import {
collection,
getDocs,
limit,
orderBy,
query,
where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { db } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
"use strict";

/* =========================================================
ELEMENTS
========================================================= */

const header =
document.querySelector(".site-header");

const menuToggle =
document.getElementById("menuToggle");

const navMenu =
document.getElementById("navMenu");

const navLinks =
document.querySelectorAll(".nav-link");

/* =========================================================
MOBILE NAVIGATION
========================================================= */

const closeMobileMenu = () => {


if (!navMenu || !menuToggle) {
  return;
}

navMenu.classList.remove("open");
menuToggle.classList.remove("active");

menuToggle.setAttribute(
  "aria-expanded",
  "false"
);


};

const openMobileMenu = () => {


if (!navMenu || !menuToggle) {
  return;
}

navMenu.classList.add("open");
menuToggle.classList.add("active");

menuToggle.setAttribute(
  "aria-expanded",
  "true"
);


};

if (menuToggle && navMenu) {


menuToggle.addEventListener(
  "click",
  () => {

    const isOpen =
      navMenu.classList.contains("open");

    if (isOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }

  }
);


/* Close menu when a navigation link is selected */

navLinks.forEach((link) => {

  link.addEventListener(
    "click",
    () => {
      closeMobileMenu();
    }
  );

});


/* Close menu when clicking outside */

document.addEventListener(
  "click",
  (event) => {

    if (
      !navMenu.classList.contains("open")
    ) {
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
      closeMobileMenu();
    }

  }
);


/* Close menu when returning to desktop */

window.addEventListener(
  "resize",
  () => {

    if (window.innerWidth > 900) {
      closeMobileMenu();
    }

  }
);


}

/* =========================================================
SMOOTH SCROLL
========================================================= */

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

      const headerOffset =
        header
          ? header.offsetHeight
          : 0;

      const targetPosition =
        target.getBoundingClientRect().top +
        window.scrollY -
        headerOffset -
        10;

      window.scrollTo({
        top: targetPosition,
        behavior: "smooth"
      });

    }
  );

});


/* =========================================================
SERVICE → QUOTE


 Works with:
   .service-item
   .service-quote

 Example:
   <a
     href="get-quote.html"
     class="service-item"
     data-service="T-Shirt Printing"
   >


========================================================= */

const serviceButtons =
document.querySelectorAll(
".service-item[data-service], .service-quote[data-service]"
);

const projectType =
document.getElementById("projectType");

serviceButtons.forEach((button) => {


button.addEventListener(
  "click",
  () => {

    const selectedService =
      button.dataset.service;

    if (!selectedService) {
      return;
    }


    /*
     * Store the selected service temporarily.
     */

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


    /*
     * If the quote form exists on the same page,
     * automatically select the service.
     */

    if (projectType) {

      const matchingOption =
        Array.from(
          projectType.options
        ).find((option) => {

          return (
            option.value ===
              selectedService ||
            option.textContent.trim() ===
              selectedService
          );

        });


      if (matchingOption) {

        projectType.value =
          matchingOption.value;

        projectType.dispatchEvent(
          new Event("change", {
            bubbles: true
          })
        );

      }

    }

  }
);


});

/* =========================================================
QUOTE PAGE — RESTORE SELECTED SERVICE
========================================================= */

if (projectType) {


try {

  const savedService =
    sessionStorage.getItem(
      "selectedService"
    );

  if (savedService) {

    const matchingOption =
      Array.from(
        projectType.options
      ).find((option) => {

        return (
          option.value === savedService ||
          option.textContent.trim() ===
            savedService
        );

      });


    if (matchingOption) {

      projectType.value =
        matchingOption.value;

      projectType.dispatchEvent(
        new Event("change", {
          bubbles: true
        })
      );

    }


    /*
     * Remove it after use.
     */

    sessionStorage.removeItem(
      "selectedService"
    );

  }

} catch (error) {

  console.warn(
    "Could not restore selected service.",
    error
  );

}


}

/* =========================================================
HEADER ON SCROLL
========================================================= */

let scrollTicking = false;

const updateHeader = () => {


if (!header) {
  return;
}

header.classList.toggle(
  "scrolled",
  window.scrollY > 20
);


};

const handleScroll = () => {


if (scrollTicking) {
  return;
}

scrollTicking = true;

window.requestAnimationFrame(
  () => {

    updateHeader();
    updateActiveLink();

    scrollTicking = false;

  }
);


};

window.addEventListener(
"scroll",
handleScroll,
{ passive: true }
);

updateHeader();

/* =========================================================
ACTIVE NAVIGATION
========================================================= */

const sections =
document.querySelectorAll(
"main section[id]"
);

const updateActiveLink = () => {


if (
  !sections.length ||
  !navLinks.length
) {
  return;
}


const scrollPosition =
  window.scrollY +
  (header
    ? header.offsetHeight
    : 0) +
  80;


let currentSection = "";


sections.forEach((section) => {

  const sectionTop =
    section.offsetTop;

  const sectionBottom =
    sectionTop +
    section.offsetHeight;


  if (
    scrollPosition >= sectionTop &&
    scrollPosition < sectionBottom
  ) {

    currentSection =
      section.id;

  }

});


navLinks.forEach((link) => {

  const href =
    link.getAttribute("href");

  link.classList.toggle(
    "active",
    href === `#${currentSection}`
  );

});


};

updateActiveLink();

/* =========================================================
TRUSTED ORGANIZATIONS


 Firestore collection:
   trustedOrganizations

 Expected document:
   {
     name: "Juaben Rural Bank",
     logoUrl: "https://res.cloudinary.com/...",
     active: true,
     order: 1
   }


========================================================= */

const trustedOrganizationsContainer =
document.getElementById(
"trustedOrganizations"
);

const trustedOrganizationsLoading =
document.getElementById(
"trustedOrganizationsLoading"
);

const trustedOrganizationsEmpty =
document.getElementById(
"trustedOrganizationsEmpty"
);

const createTrustedOrganizationLogo = (
organization
) => {


const logoWrapper =
  document.createElement("div");

logoWrapper.className =
  "trusted-logo";


const logo =
  document.createElement("img");


logo.src =
  organization.logoUrl;

logo.alt =
  organization.name ||
  "LikeStar Publications client";

logo.loading = "lazy";

logo.decoding = "async";


/*
 * Prevent a broken Cloudinary URL from leaving
 * an empty logo card on the page.
 */

logo.addEventListener(
  "error",
  () => {

    logoWrapper.remove();

  },
  { once: true }
);


logoWrapper.appendChild(logo);

return logoWrapper;


};

const loadTrustedOrganizations =
async () => {


  if (
    !trustedOrganizationsContainer
  ) {
    return;
  }


  try {

    /*
     * Only published/active organizations
     * are displayed publicly.
     *
     * Maximum 20 documents to keep reads bounded.
     */

    const organizationsQuery =
      query(
        collection(
          db,
          "trustedOrganizations"
        ),
        where(
          "active",
          "==",
          true
        ),
        orderBy(
          "order",
          "asc"
        ),
        limit(20)
      );


    const snapshot =
      await getDocs(
        organizationsQuery
      );


    /*
     * Remove loading state.
     */

    trustedOrganizationsLoading?.remove();


    if (snapshot.empty) {

      if (
        trustedOrganizationsEmpty
      ) {

        trustedOrganizationsEmpty.hidden =
          false;

      }

      return;

    }


    let renderedCount = 0;


    snapshot.forEach((documentSnapshot) => {

      const organization =
        documentSnapshot.data();


      /*
       * A public logo must have both
       * a name and usable Cloudinary URL.
       */

      if (
        !organization.name ||
        !organization.logoUrl
      ) {
        return;
      }


      const logoElement =
        createTrustedOrganizationLogo(
          organization
        );


      trustedOrganizationsContainer.appendChild(
        logoElement
      );

      renderedCount++;

    });


    /*
     * If documents existed but none had
     * usable public logo data.
     */

    if (renderedCount === 0) {

      if (
        trustedOrganizationsEmpty
      ) {

        trustedOrganizationsEmpty.hidden =
          false;

      }

    }

  } catch (error) {

    console.error(
      "Could not load trusted organizations:",
      error
    );


    /*
     * Remove loading state so the page
     * does not remain stuck on "Loading..."
     */

    trustedOrganizationsLoading?.remove();


    /*
     * Keep the public page clean if Firestore
     * is temporarily unavailable.
     *
     * We do not display fake organizations.
     */

    if (
      trustedOrganizationsEmpty
    ) {

      trustedOrganizationsEmpty.hidden =
        false;

      const message =
        trustedOrganizationsEmpty.querySelector(
          "p"
        );

      if (message) {

        message.textContent =
          "LikeStar Publications works with businesses and organizations across Ghana.";

      }

    }

  }

};


loadTrustedOrganizations();

/* =========================================================
SCROLL REVEAL


 Matches the landing page:
   .service-item
   .work-card
   .why-item
   .process-step
   .section-heading
   .cta-content


========================================================= */

const animatedElements =
document.querySelectorAll(
[
".service-item",
".work-card",
".why-item",
".process-step",
".section-heading",
".cta-content"
].join(", ")
);

if (
animatedElements.length &&
"IntersectionObserver" in window
) {


const observer =
  new IntersectionObserver(
    (
      entries,
      observerInstance
    ) => {

      entries.forEach((entry) => {

        if (
          !entry.isIntersecting
        ) {
          return;
        }

        entry.target.classList.add(
          "is-visible"
        );

        observerInstance.unobserve(
          entry.target
        );

      });

    },
    {
      threshold: 0.10,
      rootMargin:
        "0px 0px -50px 0px"
    }
  );


animatedElements.forEach(
  (element, index) => {

    element.classList.add(
      "scroll-reveal"
    );


    /*
     * Small stagger effect.
     */

    const delay =
      Math.min(
        index % 6,
        5
      ) * 50;


    element.style.setProperty(
      "--reveal-delay",
      `${delay}ms`
    );


    observer.observe(
      element
    );

  }
);


} else {


/*
 * Fallback for older browsers.
 */

animatedElements.forEach(
  (element) => {

    element.classList.add(
      "is-visible"
    );

  }
);


}

/* =========================================================
CURRENT YEAR
========================================================= */

const currentYear =
document.getElementById(
"currentYear"
);

if (currentYear) {


currentYear.textContent =
  new Date().getFullYear();


}

/* =========================================================
ESCAPE — CLOSE MENU
========================================================= */

document.addEventListener(
"keydown",
(event) => {


  if (
    event.key === "Escape" &&
    navMenu &&
    navMenu.classList.contains(
      "open"
    )
  ) {

    closeMobileMenu();

    /*
     * Return focus to the menu button
     * for keyboard accessibility.
     */

    menuToggle?.focus();

  }

}


);

/* =========================================================
ACCESSIBILITY — REDUCED MOTION
========================================================= */

const reducedMotion =
window.matchMedia(
"(prefers-reduced-motion: reduce)"
);

if (reducedMotion.matches) {


document.documentElement.classList.add(
  "reduced-motion"
);


}

/*

* Respond if the user changes the OS/browser
* reduced-motion preference while the page is open.
  */

reducedMotion.addEventListener?.(
"change",
(event) => {


  document.documentElement.classList.toggle(
    "reduced-motion",
    event.matches
  );

}


);

});
