document.addEventListener("DOMContentLoaded", () => {

  /* =========================================================
     MOBILE NAVIGATION
  ========================================================= */

  const menuToggle =
    document.getElementById("menuToggle");

  const navMenu =
    document.getElementById("navMenu");

  const navLinks =
    document.querySelectorAll(".nav-link");


  if (menuToggle && navMenu) {

    menuToggle.addEventListener("click", () => {

      const isOpen =
        navMenu.classList.toggle("open");

      menuToggle.classList.toggle(
        "active",
        isOpen
      );

      menuToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

    });


    navLinks.forEach((link) => {

      link.addEventListener("click", () => {

        navMenu.classList.remove("open");

        menuToggle.classList.remove("active");

        menuToggle.setAttribute(
          "aria-expanded",
          "false"
        );

      });

    });

  }


  /* =========================================================
     PORTFOLIO FILTER
  ========================================================= */

  const filterButtons =
    document.querySelectorAll(".filter-btn");

  const portfolioCards =
    document.querySelectorAll(".portfolio-card");

  const portfolioEmpty =
    document.getElementById("portfolioEmpty");


  filterButtons.forEach((button) => {

    button.addEventListener("click", () => {

      const filter =
        button.dataset.filter;


      /* Remove active state */

      filterButtons.forEach((btn) => {

        btn.classList.remove("active");

      });


      /* Add active state */

      button.classList.add("active");


      let visibleCount = 0;


      portfolioCards.forEach((card) => {

        const categories =
          card.dataset.category
            ?.toLowerCase()
            .split(" ") || [];


        const shouldShow =
          filter === "all" ||
          categories.includes(
            filter.toLowerCase()
          );


        if (shouldShow) {

          card.classList.remove("hidden");

          visibleCount++;

          /*
           * Restart animation
           */

          card.style.animation = "none";

          card.offsetHeight;

          card.style.animation =
            "portfolioIn 0.45s ease both";

        } else {

          card.classList.add("hidden");

        }

      });


      /* Empty state */

      if (portfolioEmpty) {

        portfolioEmpty.classList.toggle(
          "show",
          visibleCount === 0
        );

      }

    });

  });


  /* =========================================================
     PROJECT MODAL
  ========================================================= */

  const modal =
    document.getElementById("projectModal");

  const modalBackdrop =
    document.getElementById("modalBackdrop");

  const modalClose =
    document.getElementById("modalClose");

  const modalImage =
    document.getElementById("modalImage");

  const modalTitle =
    document.getElementById("modalTitle");

  const modalCategory =
    document.getElementById("modalCategory");

  const modalDescription =
    document.getElementById(
      "modalDescription"
    );

  const projectButtons =
    document.querySelectorAll(
      ".view-project"
    );


  const openModal = (button) => {

    if (!modal) return;


    const title =
      button.dataset.title || "Project";

    const category =
      button.dataset.category || "LikeStar";

    const image =
      button.dataset.image || "";

    const description =
      button.dataset.description ||
      "A creative project delivered by LikeStar.";


    if (modalTitle) {

      modalTitle.textContent =
        title;

    }


    if (modalCategory) {

      modalCategory.textContent =
        category;

    }


    if (modalDescription) {

      modalDescription.textContent =
        description;

    }


    if (modalImage) {

      modalImage.src = image;

      modalImage.alt =
        title;

    }


    modal.classList.add("open");

    modal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.style.overflow =
      "hidden";


    modalClose?.focus();

  };


  const closeModal = () => {

    if (!modal) return;

    modal.classList.remove("open");

    modal.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.style.overflow =
      "";

  };


  projectButtons.forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        openModal(button);

      }
    );

  });


  modalClose?.addEventListener(
    "click",
    closeModal
  );


  modalBackdrop?.addEventListener(
    "click",
    closeModal
  );


  /* =========================================================
     ESCAPE KEY
  ========================================================= */

  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Escape"
      ) {

        if (
          modal?.classList.contains(
            "open"
          )
        ) {

          closeModal();

          return;

        }


        if (
          navMenu?.classList.contains(
            "open"
          )
        ) {

          navMenu.classList.remove(
            "open"
          );

          menuToggle?.classList.remove(
            "active"
          );

          menuToggle?.setAttribute(
            "aria-expanded",
            "false"
          );

        }

      }

    }
  );


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

});