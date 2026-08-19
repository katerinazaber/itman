/* FAQ Accordion — single-open behavior */
(function () {
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.itm-faq__q');
    if (!btn) return;
    var item = btn.closest('.itm-faq__item');
    var wasOpen = item.classList.contains('open');
    item.closest('.itm-faq__list')
      .querySelectorAll('.itm-faq__item.open')
      .forEach(function (el) { el.classList.remove('open'); });
    if (!wasOpen) item.classList.add('open');
  });
})();
