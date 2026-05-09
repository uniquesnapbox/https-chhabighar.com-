(function () {
  const CART_KEY = "cgprints_cart";
  const SEARCH_KEY = "cgprints_search_term";
  const DEFAULT_PRODUCT_IMAGE = "banner/d1e43480-092e-4eba-93ea-4674bd090c20.png";
  const API = Object.assign(
    {
      baseUrl: "https://zestixe.in/api/v1/sync",
      username: "chahbighar",
      apiKey: ""
    },
    window.CG_API || {}
  );
  const CUSTOM_PRODUCTS = [
    {
      product_id: 20001,
      title: "Customise Frame",
      current_price: 399,
      previous_price: 599,
      is_feature: 1,
      feature_image: "CTEGORY/PHOTO FRAME.png"
    },
    {
      product_id: 20002,
      title: "Keychain",
      current_price: 149,
      previous_price: 249,
      is_feature: 1,
      feature_image: "CTEGORY/KEYCHAIN.png"
    },
    {
      product_id: 20003,
      title: "Customise Coffee Mug",
      current_price: 299,
      previous_price: 449,
      is_feature: 1,
      feature_image: "CTEGORY/MUG.png"
    },
    {
      product_id: 20004,
      title: "T-Shirt Print",
      current_price: 499,
      previous_price: 699,
      is_feature: 1,
      feature_image: "CTEGORY/T SHIRT.png"
    },
    {
      product_id: 20005,
      title: "Customise Pillow Print",
      current_price: 349,
      previous_price: 499,
      is_feature: 1,
      feature_image: "CTEGORY/PILLOW.png"
    },
    {
      product_id: 20006,
      title: "Customise Wall Clock",
      current_price: 599,
      previous_price: 799,
      is_feature: 0,
      feature_image: "CTEGORY/WALL CLOCK.png"
    },
    {
      product_id: 20007,
      title: "LED Frame",
      current_price: 699,
      previous_price: 999,
      is_feature: 1,
      feature_image: "CTEGORY/LED FRAME.png"
    },
    {
      product_id: 20008,
      title: "Customise Rotating LED Lamp",
      current_price: 899,
      previous_price: 1199,
      is_feature: 1,
      feature_image: "CTEGORY/LED FRAME.png"
    },
    {
      product_id: 20009,
      title: "LED Night Lamp",
      current_price: 649,
      previous_price: 899,
      is_feature: 0,
      feature_image: "CTEGORY/LED FRAME.png"
    },
    {
      product_id: 20010,
      title: "LED Magic Mirror",
      current_price: 999,
      previous_price: 1399,
      is_feature: 1,
      feature_image: "CTEGORY/LED FRAME.png"
    },
    {
      product_id: 20011,
      title: "Visiting Card",
      current_price: 199,
      previous_price: 299,
      is_feature: 0,
      feature_image: "banner/d1e43480-092e-4eba-93ea-4674bd090c20.png"
    },
    {
      product_id: 20012,
      title: "Customise Sticker Print",
      current_price: 149,
      previous_price: 249,
      is_feature: 0,
      feature_image: "banner/d1e43480-092e-4eba-93ea-4674bd090c20.png"
    },
    {
      product_id: 20013,
      title: "Customise Stone Print",
      current_price: 549,
      previous_price: 749,
      is_feature: 0,
      feature_image: "CTEGORY/PHOTO FRAME.png"
    },
    {
      product_id: 20014,
      title: "Acrylic Magnetic Frame",
      current_price: 499,
      previous_price: 699,
      is_feature: 0,
      feature_image: "CTEGORY/PHOTO FRAME.png"
    },
    {
      product_id: 20015,
      title: "Customise Badge",
      current_price: 99,
      previous_price: 149,
      is_feature: 0,
      feature_image: "banner/d1e43480-092e-4eba-93ea-4674bd090c20.png"
    }
  ];
  const FALLBACK_BLOGS = [
    {
      title: "7 Personalized Gift Ideas for 2026",
      content:
        "Thoughtful products that work across birthdays, festivals, and office celebrations.",
      image: ""
    },
    {
      title: "How to Choose Durable School Name Labels",
      content:
        "Material, adhesive, and print options every parent should verify before ordering.",
      image: ""
    },
    {
      title: "Turning Family Photos Into Modern Wall Decor",
      content:
        "Frame sizes, layout logic, and finish selection for premium home styling.",
      image: ""
    }
  ];

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
    if (
      /^(?:\.{0,2}\/)?(?:banner|CTEGORY)\//i.test(featureImage) ||
      /^\/?(?:banner|CTEGORY)\//i.test(featureImage)
    ) {
      return featureImage.replace(/^\/+/, "");
    }
    return "https://zestixe.in/assets/front/img/user/items/feature/" + featureImage;
  }

  function isHomePage() {
    const path = String(window.location.pathname || "").toLowerCase();
    return path.endsWith("/index.html") || path.endsWith("/") || path === "";
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

  function getSearchQuery() {
    let fromUrl = "";
    try {
      const params = new URLSearchParams(window.location.search || "");
      fromUrl = String(params.get("q") || "").trim();
    } catch (err) {
      fromUrl = "";
    }

    if (fromUrl) {
      try {
        sessionStorage.setItem(SEARCH_KEY, fromUrl);
      } catch (err) {
        // ignore storage errors
      }
      return fromUrl;
    }

    try {
      return String(sessionStorage.getItem(SEARCH_KEY) || "").trim();
    } catch (err) {
      return "";
    }
  }

  function clearSearchQuery() {
    try {
      sessionStorage.removeItem(SEARCH_KEY);
    } catch (err) {
      // ignore storage errors
    }
  }

  function filterProductsByQuery(products, query) {
    if (!query) {
      return products;
    }
    const needle = query.toLowerCase();
    return products.filter(function (product) {
      const title = String((product && product.title) || "").toLowerCase();
      return title.indexOf(needle) !== -1;
    });
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
    const query = getSearchQuery();
    if (!grid) {
      return;
    }

    setStatus(status, "Loading products...", "");

    const filteredProducts = filterProductsByQuery(CUSTOM_PRODUCTS, query);
    if (query && !filteredProducts.length) {
      grid.innerHTML = "";
      setStatus(status, "No products found for \"" + query + "\".", "warn");
      return;
    }

    const productsToRender = isHomePage() ? filteredProducts.slice(0, 8) : filteredProducts;
    renderProducts(productsToRender);

    if (query) {
      setStatus(status, "Showing results for \"" + query + "\".", "success");
    } else if (isHomePage()) {
      setStatus(status, "Showing top products. Tap Show All for full catalog.", "success");
    } else {
      setStatus(status, "Products loaded successfully.", "success");
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
      renderBlogs(FALLBACK_BLOGS);
      setStatus(
        status,
        "Live API unavailable right now, showing backup blogs.",
        "warn"
      );
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

  function initBottomSearch() {
    document.querySelectorAll(".js-bottom-search").forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        const currentQuery = getSearchQuery();
        const input = window.prompt("Search products", currentQuery);

        if (input === null) {
          return;
        }

        const query = String(input).trim();
        if (!query) {
          clearSearchQuery();
          window.location.href = "products.html";
          return;
        }

        try {
          sessionStorage.setItem(SEARCH_KEY, query);
        } catch (err) {
          // ignore storage errors
        }

        window.location.href = "products.html?q=" + encodeURIComponent(query);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    updateCartCount();
    initBannerSlider();
    initBottomSearch();
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

    document.querySelectorAll("form.js-demo-form").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        alert("Thanks! We received your message.");
        form.reset();
      });
    });

    const loginForm = document.querySelector(".js-login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const emailInput = loginForm.querySelector('input[type="email"]');
        const email = emailInput ? String(emailInput.value || "").trim() : "";
        alert("Login request submitted for " + (email || "your account") + ".");
      });
    }
  });

  window.CGCart = {
    key: CART_KEY,
    getCart: getCart,
    saveCart: saveCart,
    updateCartCount: updateCartCount,
    addToCart: addToCart
  };
})();
