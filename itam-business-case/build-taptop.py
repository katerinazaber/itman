#!/usr/bin/env python3
"""Собирает Taptop-версию из index.html / styles.css / app.js.

Выход:
  taptop-embed.html — вставить в Embed на странице Taptop
  taptop-embed.js   — подключить в Custom Code через jsDelivr
"""
import re
from pathlib import Path

HERE = Path(__file__).parent
ROOT = "#itamBc"
ID_PREFIX = "ibc-"
JS_COMMIT = "d0139c1"
LOGO_URL = "https://katerinazaber.github.io/itman/itam-business-case/assets/brand.svg"


def scope_selector(sel):
    sel = sel.strip()
    if sel in (":root", "body"):
        return ROOT
    if sel == "html":
        return None
    if sel == "*":
        return ROOT + " *"
    return ROOT + " " + sel


def scope_block(css):
    out = []
    i = 0
    while i < len(css):
        brace = css.find("{", i)
        if brace == -1:
            break
        head = css[i:brace].strip()
        if head.startswith("@media"):
            depth, j = 1, brace + 1
            while depth:
                if css[j] == "{":
                    depth += 1
                elif css[j] == "}":
                    depth -= 1
                j += 1
            inner = scope_block(css[brace + 1:j - 1])
            out.append(head + " {\n" + inner + "}\n")
            i = j
            continue
        end = css.find("}", brace)
        body = css[brace + 1:end].strip()
        sels = [s for s in (scope_selector(x) for x in head.split(",")) if s]
        if sels:
            out.append(",".join(sels) + " { " + body + " }\n")
        i = end + 1
    return "".join(out)


def build_css():
    css = (HERE / "styles.css").read_text(encoding="utf-8")
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    scoped = scope_block(css)
    tags = ["h1", "h2", "h3", "h4", "p", "li", "label", "span", "strong", "small", "a", "ol", "ul"]
    guard = (
        ",".join(ROOT + " " + t for t in tags)
        + " { color: inherit; font-family: inherit; letter-spacing: inherit; text-shadow: none; }\n"
    )
    scoped = guard + scoped
    overrides = (
        ROOT + " { min-height: 0; width: 100%; line-height: normal; text-align: left;"
        " box-shadow: 0 0 0 100vmax var(--paper); clip-path: inset(0 -100vmax); }\n"
        "html.itam-bc-full, html.itam-bc-full body { overflow: hidden !important; }\n"
        "html.itam-bc-full " + ROOT + " { position: fixed !important; inset: 0; z-index: 2147483000;"
        " min-height: 100vh; overflow-y: auto; -webkit-overflow-scrolling: touch;"
        " box-shadow: none; clip-path: none; }\n"
    )
    return scoped + overrides


def build_html():
    src = (HERE / "index.html").read_text(encoding="utf-8")
    main = re.search(r"<main>.*?</main>", src, flags=re.S).group(0)
    main = re.sub(r'\bid="([^"]+)"', r'id="%s\1"' % ID_PREFIX, main)
    main = re.sub(r'\bfor="([^"]+)"', r'for="%s\1"' % ID_PREFIX, main)
    header = re.search(r"<header class=\"topbar\">.*?</header>", src, flags=re.S).group(0)
    header = header.replace('src="assets/brand.svg"', 'src="%s"' % LOGO_URL)
    fonts = re.search(r'<link href="https://fonts\.googleapis\.com[^>]+>', src).group(0)
    return (
        fonts + "\n"
        + "<style>\n" + build_css() + "</style>\n"
        + '<div id="itamBc" class="itam-bc">\n<div class="page">\n'
        + header + "\n" + main + "\n</div>\n</div>\n"
        + '<script src="https://cdn.jsdelivr.net/gh/katerinazaber/itman@%s/itam-business-case/taptop-embed.js"></script>\n'
        % JS_COMMIT
    )


def build_js():
    js = (HERE / "app.js").read_text(encoding="utf-8")
    js = js.replace(
        'function $(id) { return document.getElementById(id); }',
        'function $(id) { return root ? root.querySelector("#%s" + id) : null; }' % ID_PREFIX,
    )
    js = js.replace("document.querySelectorAll(", "root.querySelectorAll(")
    js = js.replace(
        'window.scrollTo({ top: 0, behavior: "smooth" });',
        'if (document.documentElement.classList.contains("itam-bc-full")) {\n'
        '      root.scrollTo({ top: 0, behavior: "smooth" });\n'
        '    } else {\n'
        '      var top = root.getBoundingClientRect().top;\n'
        '      if (top < 0) window.scrollTo({ top: window.pageYOffset + top - 80, behavior: "smooth" });\n'
        '    }',
    )
    js = js.replace(
        '(function () {\n  "use strict";\n',
        '(function () {\n  "use strict";\n\n  var root = null;\n',
        1,
    )
    boot = (
        "  function boot(attempt) {\n"
        '    root = document.getElementById("itamBc");\n'
        "    if (!root) {\n"
        "      if (attempt < 80) setTimeout(function () { boot(attempt + 1); }, 150);\n"
        "      return;\n"
        "    }\n"
        "    if (root.dataset.ready === \"1\") return;\n"
        "    root.dataset.ready = \"1\";\n"
        "    if (window.self === window.top) {\n"
        "      document.body.appendChild(root);\n"
        '      document.documentElement.classList.add("itam-bc-full");\n'
        "    }\n"
        "    bind();\n"
        "  }\n\n"
        '  if (document.readyState === "loading") {\n'
        '    document.addEventListener("DOMContentLoaded", function () { boot(0); });\n'
        "  } else {\n"
        "    boot(0);\n"
        "  }\n"
    )
    js = js.replace('  document.addEventListener("DOMContentLoaded", bind);\n', boot)
    assert "document.getElementById(id)" not in js
    assert "document.querySelectorAll(" not in js
    assert "function boot" in js
    return js


if __name__ == "__main__":
    (HERE / "taptop-embed.html").write_text(build_html(), encoding="utf-8")
    (HERE / "taptop-embed.js").write_text(build_js(), encoding="utf-8")
    print("ok")
