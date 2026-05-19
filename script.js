const sidebar = document.getElementById("sidebar");
const openSidebar = document.getElementById("openSidebar");
const closeSidebar = document.getElementById("closeSidebar");

if (openSidebar && sidebar) {
  openSidebar.addEventListener("click", () => {
    sidebar.classList.add("open");
  });
}

if (closeSidebar && sidebar) {
  closeSidebar.addEventListener("click", () => {
    sidebar.classList.remove("open");
  });
}

document.addEventListener("click", (e) => {
  if (!sidebar || !openSidebar) return;

  const clickedInsideSidebar = sidebar.contains(e.target);
  const clickedMenuButton = openSidebar.contains(e.target);

  if (!clickedInsideSidebar && !clickedMenuButton) {
    sidebar.classList.remove("open");
  }
});

const slides = document.querySelectorAll(".home-slide");
const nextButtons = document.querySelectorAll("[data-next]");

function showSlide(id) {
  slides.forEach((slide) => slide.classList.remove("active"));
  const target = document.getElementById(id);
  if (target) target.classList.add("active");
}

nextButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const next = button.getAttribute("data-next");
    showSlide(next);
  });
});