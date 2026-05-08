(function () {
  const CART_KEY = "cgprints_cart";
  const DEFAULT_PRODUCT_IMAGE = "banner/d1e43480-092e-4eba-93ea-4674bd090c20.png";
  const API = Object.assign(
    {
      baseUrl: "https://zestixe.in/api/v1/sync",
      username: "chahbighar",
      apiKey: ""
    },
    window.CG_API || {}
  );

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function toNumber(value, fallback) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  function normalizeCartItem(item) {
    return {
      productId: item && item.productId != null ? Number(item.productId) : null,
      name: item && item.name ? String(item.name) : "Untitled",
      price: toNumber(item && item.price, 0),
      qty: Math.max(1, toNumber(item && item.qty, 1)),
      image: item && item.image ? String(item.image) : DEFAULT_PRODUCT_IMAGE
    };
  }

  function getCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY)) || [];
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map(normalizeCartItem);
    } catch (err) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart.map(normalizeCartItem)));
    updateCartCount();
  }

  function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce(function (sum, item) {
      return sum + item.qty;
    }, 0);
    document.querySelectorAll(".js-cart-count").forEach(function (node) {
      node.textContent = count;
    });
  }

  function addToCart(item) {
    const nextItem = normalizeCartItem(item);
    const cart = getCart();
    const found = cart.find(function (existing) {
      if (nextItem.productId != null && existing.productId != null) {
        return existing.productId === nextItem.productId;
      }
      return existing.name === nextItem.name;
    });
    if (found) {
      found.qty += nextItem.qty;
    } else {
      cart.push(nextItem);
    }
    saveCart(cart);
  }

  function buildProductImage(featureImage) {
    if (!featureImage) {
      return DEFAULT_PRODUCT_IMAGE;
    }
    if (/^https?:\/\//i.test(featureImage)) {
      return featureImage;
    }
    return "https://zestixe.in/assets/front/img/user/items/feature/" + featureImage;
  }

  function getApiHeaders() {
    const headers = {
      Accept: "application/json"
    };
    if (API.apiKey && API.apiKey !== "YOUR_SYNC_API_KEY") {
      headers["X-Sync-Key"] = API.apiKey;
    }
    return headers;
  }

  async function fetchJson(url) {
    const response = await fetch(url, {
      method: "GET",
      headers: getApiHeaders()
    });

    let body = null;
    try {
      body = await response.json();
    } catch (err) {
      body = null;
    }

    if (!response.ok) {
      const message = (body && body.message) || ("Request failed with status " + response.status);
      throw new Error(message);
    }
    return body;
  }

  function setStatus(node, text, type) {
    if (!node) {
      return;
    }
    node.textContent = text;
    node.className = "api-status" + (type ? " " + type : "");
  }

  function renderProducts(products) {
    const grid = document.getElementById("featuredProducts");
    if (!grid) {
      return;
    }

    grid.innerHTML = products
      .map(function (product) {
        const title = escapeHtml(product.title || "Untitled Product");
        const image = escapeHtml(buildProductImage(product.feature_image));
        const price = toNumber(product.current_price, 0);
        const previousPrice = toNumber(product.previous_price, 0);
        const badge = product.is_feature ? "Featured" : "Top Pick";
        const oldPriceMarkup =
          previousPrice > price
            ? "<span class=\"old-price\">Rs." + Math.round(previousPrice) + "</span>"
            : "";

        return (
          "<article class=\"product-card\">" +
          "<img src=\"" +
          image +
          "\" alt=\"" +
          title +
          "\" onerror=\"this.src='" +
          DEFAULT_PRODUCT_IMAGE +
          "'\" />" +
          "<div class=\"product-info\">" +
          "<span class=\"chip\">" +
          badge +
          "</span>" +
          "<h3 class=\"product-title\">" +
          title +
          "</h3>" +
          "<div class=\"price-row\"><span class=\"price\">Rs." +
          Math.round(price) +
          "</span>" +
          oldPriceMarkup +
          "</div>" +
          "<button class=\"btn btn-primary js-add-to-cart\" data-id=\"" +
          Number(product.product_id || 0) +
          "\" data-name=\"" +
          title +
          "\" data-price=\"" +
          price +
          "\" data-image=\"" +
          image +
          "\">Add to Cart</button>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderBlogs(blogs) {
    const grid = document.getElementById("blogsGrid");
    if (!grid) {
      return;
    }

    grid.innerHTML = blogs
      .map(function (blog) {
        const title = escapeHtml(blog.title || "Untitled Blog");
        const image = escapeHtml(buildProductImage(blog.image));
        const content = String(blog.content || "")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        const summary = escapeHtml(content.slice(0, 135) + (content.length > 135 ? "..." : ""));

        return (
          "<article class=\"blog-card\">" +
          "<img src=\"" +
          image +
          "\" alt=\"" +
          title +
          "\" onerror=\"this.src='" +
          DEFAULT_PRODUCT_IMAGE +
          "'\" />" +
          "<div class=\"blog-body\">" +
          "<h3>" +
          title +
          "</h3>" +
          "<p>" +
          summary +
          "</p>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  async function loadProducts() {
    const grid = document.getElementById("featuredProducts");
    const status = document.getElementById("productsStatus");
    if (!grid) {
      return;
    }

    setStatus(status, "Loading products...", "");

    try {
      const url =
        API.baseUrl +
        "/" +
        encodeURIComponent(API.username) +
        "/products?per_page=12";
      const payload = await fetchJson(url);
      const products = Array.isArray(payload && payload.data) ? payload.data : [];
      if (!products.length) {
        grid.innerHTML = "";
        setStatus(status, "No products found for this store.", "warn");
        return;
      }
      renderProducts(products);
      setStatus(status, "Live products loaded successfully.", "success");
    } catch (error) {
      grid.innerHTML = "";
      setStatus(status, "Could not load products: " + error.message, "error");
    }
  }

  async function loadBlogs() {
    const grid = document.getElementById("blogsGrid");
    const status = document.getElementById("blogsStatus");
    if (!grid) {
      return;
    }

    setStatus(status, "Loading blogs...", "");

    try {
      const url =
        API.baseUrl +
        "/" +
        encodeURIComponent(API.username) +
        "/blogs?per_page=9";
      const payload = await fetchJson(url);
      const blogs = Array.isArray(payload && payload.data) ? payload.data : [];
      if (!blogs.length) {
        grid.innerHTML = "";
        setStatus(status, "No blog posts found for this store.", "warn");
        return;
      }
      renderBlogs(blogs);
      setStatus(status, "Live blogs loaded successfully.", "success");
    } catch (error) {
      grid.innerHTML = "";
      setStatus(status, "Could not load blogs: " + error.message, "error");
    }
  }

  function initBannerSlider() {
    const slider = document.querySelector(".js-banner-slider");
    if (!slider) {
      return;
    }

    const slides = Array.from(slider.querySelectorAll(".banner-slide"));
    const prevBtn = slider.querySelector(".js-banner-prev");
    const nextBtn = slider.querySelector(".js-banner-next");
    const dotsWrap = slider.querySelector(".js-banner-dots");
    if (!slides.length || !prevBtn || !nextBtn || !dotsWrap) {
      return;
    }
    let activeIndex = 0;
    let timer;

    function renderDots() {
      dotsWrap.innerHTML = "";
      slides.forEach(function (_, index) {
        const dot = document.createElement("span");
        dot.className = "banner-dot" + (index === activeIndex ? " is-active" : "");
        dot.addEventListener("click", function () {
          goTo(index);
        });
        dotsWrap.appendChild(dot);
      });
    }

    function goTo(index) {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === activeIndex);
      });
      renderDots();
    }

    function startAuto() {
      timer = setInterval(function () {
        goTo(activeIndex + 1);
      }, 3500);
    }

    function resetAuto() {
      clearInterval(timer);
      startAuto();
    }

    prevBtn.addEventListener("click", function () {
      goTo(activeIndex - 1);
      resetAuto();
    });

    nextBtn.addEventListener("click", function () {
      goTo(activeIndex + 1);
      resetAuto();
    });

    goTo(0);
    startAuto();
  }

  document.addEventListener("DOMContentLoaded", function () {
    updateCartCount();
    initBannerSlider();
    loadProducts();
    loadBlogs();

    document.querySelectorAll(".js-menu-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const open = document.body.classList.toggle("menu-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });

    document.querySelectorAll("nav a").forEach(function (link) {
      link.addEventListener("click", function () {
        document.body.classList.remove("menu-open");
        document.querySelectorAll(".js-menu-toggle").forEach(function (btn) {
          btn.setAttribute("aria-expanded", "false");
        });
      });
    });

    document.addEventListener("click", function (event) {
      const btn = event.target.closest(".js-add-to-cart");
      if (!btn) {
        return;
      }
      addToCart({
        productId: Number(btn.dataset.id || 0),
        name: btn.dataset.name || "Product",
        price: Number(btn.dataset.price || 0),
        image: btn.dataset.image || DEFAULT_PRODUCT_IMAGE,
        qty: 1
      });
      btn.textContent = "Added";
      setTimeout(function () {
        btn.textContent = "Add to Cart";
      }, 1000);
    });

    document.querySelectorAll("form").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        alert("Thanks! We received your message.");
        form.reset();
      });
    });
  });

  window.CGCart = {
    key: CART_KEY,
    getCart: getCart,
    saveCart: saveCart,
    updateCartCount: updateCartCount,
    addToCart: addToCart
  };
})();
