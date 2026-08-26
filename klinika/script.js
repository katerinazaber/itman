(() => {
  const revealSelectors = [
    ".about__content",
    ".data-visual",
    ".learn-card",
    ".day-card",
    ".join-card",
    ".program__heading",
  ];

  document.querySelectorAll(revealSelectors.join(",")).forEach((el) => {
    el.classList.add("reveal");
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
})();
