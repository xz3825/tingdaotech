(function () {
  "use strict";

  var toggle = document.querySelector(".menu-toggle");
  var navList = document.querySelector(".nav-list");
  var navLinks = document.querySelectorAll(".nav-list a");
  var sections = document.querySelectorAll("section[id]");

  if (toggle && navList) {
    toggle.addEventListener("click", function () {
      navList.classList.toggle("open");
    });
  }

  function closeMenu() {
    if (navList) {
      navList.classList.remove("open");
    }
  }

  for (var i = 0; i < navLinks.length; i++) {
    navLinks[i].addEventListener("click", closeMenu);
  }

  function setActiveNav() {
    var scrollY = window.scrollY + 80;

    for (var j = 0; j < sections.length; j++) {
      var section = sections[j];
      var top = section.offsetTop;
      var height = section.offsetHeight;
      var id = section.getAttribute("id");

      if (scrollY >= top && scrollY < top + height) {
        for (var k = 0; k < navLinks.length; k++) {
          navLinks[k].classList.remove("active");
          if (navLinks[k].getAttribute("href") === "#" + id) {
            navLinks[k].classList.add("active");
          }
        }
      }
    }
  }

  window.addEventListener("scroll", setActiveNav);
  setActiveNav();

  var contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var success = document.getElementById("form-success");
      if (success) {
        success.style.display = "block";
        contactForm.reset();
      }
    });
  }
})();
