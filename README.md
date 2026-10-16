# Riva website (static, RTL Persian)

Structure:
- index.html, products.html, catalogue.html
- css/style.css, css/features.css
- js/products.js (PRODUCTS + CATEGORIES data), js/site.js (nav indicator + side cart),
  js/catalogue-config.js (catalogue PDF path), js/catalogue.js (PDF viewer)
- assets/img/ (images), assets/catalogue/ (catalogue PDF), assets/vendor/pdfjs/ (pdf.js, Apache-2.0, vendored)

## Side cart
Cart icon in the header opens a right-side drawer. State lives in localStorage (`riva_cart_v1`); header badge,
product cards and drawer all use the same state. Checkout/payment and order history need a backend (not implemented).

## Catalogue (catalogue.html)
The PDF path is defined in ONE place: `js/catalogue-config.js` (`pdf`).
To use the real catalogue: put your PDF in `assets/catalogue/` and either
1. overwrite `assets/catalogue/riva-catalogue-sample.pdf` (same name, no code change), or
2. change `pdf` in `js/catalogue-config.js` to the new file name.
The viewer must be served over http(s) (GitHub Pages or `python -m http.server`), not opened with file://.

Publish on GitHub Pages:
1. Upload these files at the repo root.
2. Settings → Pages → Source: "Deploy from a branch" → main / (root) → Save.
3. Site URL: https://USERNAME.github.io/ (or /riva/). All paths are relative, so both work.

By Sepideh Talebi
