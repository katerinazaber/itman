(() => {
  const targets = [
    ".diagnostics__text",
    ".chaos",
    ".tile",
    ".day",
    ".final__content",
    ".clinic",
  ];

  document.querySelectorAll(targets.join(",")).forEach((el) => {
    el.classList.add("reveal");
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
  );

  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
})();
