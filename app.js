(function () {
  let autoSyncTimer = null;
  const CART_KEY = "cgprints_cart";
  const SEARCH_KEY = "cgprints_search_term";
  const PRODUCT_CACHE_KEY = "cgprints_products_cache";
  const DEFAULT_PRODUCT_IMAGE = "banner/d1e43480-092e-4eba-93ea-4674bd090c20.png";
  const API = Object.assign(
    {
      baseUrl: "https://zestixe.in/api/v1/sync",
      username: "chhabighar",
      apiKey: "",
      allowFallbackWhenApiDown: false,
      fallbackProducts: [],
      fallbackCategories: []
    },
    window.CG_API || {}
  );
  const DEFAULT_CATEGORY_MENU = [
    { slug: "led-frame", label: "LED Frame", image: "CTEGORY/LED FRAME.png" },
    { slug: "mug", label: "Mug", image: "CTEGORY/MUG.png" },
    { slug: "photo-frame", label: "Photo Frame", image: "CTEGORY/PHOTO FRAME.png" },
    { slug: "pillow", label: "Pillow", image: "CTEGORY/PILLOW.png" },
    { slug: "t-shirt", label: "T Shirt", image: "CTEGORY/T SHIRT.png" }
  ];
  const CATEGORY_MENU = buildInitialCategoryMenu();
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

  function isProductsPage() {
    const path = String(window.location.pathname || "").toLowerCase();
    return path.endsWith("/products.html");
  }

  function getLiveBaseUrl() {
    if (API.liveBaseUrl) {
      return String(API.liveBaseUrl).replace(/\/+$/, "");
    }
    return "https://zestixe.in/" + encodeURIComponent(API.username);
  }

  function buildInitialCategoryMenu() {
    if (Array.isArray(API.fallbackCategories) && API.fallbackCategories.length) {
      return API.fallbackCategories
        .map(normalizeCategoryCard)
        .filter(function (item) {
          return item && item.slug && item.label;
        });
    }
    return DEFAULT_CATEGORY_MENU.slice();
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

  function saveProductCache(products) {
    try {
      localStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(products || []));
    } catch (err) {
      // ignore storage errors
    }
  }

  function getProductCache() {
    try {
      const parsed = JSON.parse(localStorage.getItem(PRODUCT_CACHE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function buildProductsErrorMessage(error) {
    const protocol = String(window.location.protocol || "").toLowerCase();
    const raw = String((error && error.message) || "");

    if (protocol === "file:") {
      return "file:// mode me CORS issue aa sakta hai. Is file ko localhost se open karein.";
    }

    if (/status\s*500/i.test(raw) || /internal server error/i.test(raw)) {
      return "Live product API server error (500). Zestixe backend response fail ho raha hai.";
    }

    return "Live product API unavailable right now. Please try again shortly.";
  }

  function getFallbackProducts() {
    if (Array.isArray(API.fallbackProducts) && API.fallbackProducts.length) {
      return API.fallbackProducts;
    }
    return [];
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
        const productId = Number(product.product_id || 0);
        const categorySlug = inferProductCategory(product);
        const detailUrl =
          "product.html?id=" +
          encodeURIComponent(String(productId || "")) +
          "&category=" +
          encodeURIComponent(categorySlug);
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
          "<article class=\"product-card js-product-card\" data-id=\"" +
          productId +
          "\" data-category=\"" +
          escapeHtml(categorySlug) +
          "\" data-detail-url=\"" +
          escapeHtml(detailUrl) +
          "\" tabindex=\"0\" role=\"link\" aria-label=\"Open " +
          title +
          " details\">" +
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
          "<a class=\"btn btn-light js-view-product\" href=\"" +
          detailUrl +
          "\">View Details</a>" +
          "<button class=\"btn btn-primary js-add-to-cart\" data-id=\"" +
          productId +
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

  async function getProductsCatalog() {
    try {
      const url =
        API.baseUrl +
        "/" +
        encodeURIComponent(API.username) +
        "/products?per_page=100";
      const payload = await fetchJson(url);
      const items = Array.isArray(payload && payload.data) ? payload.data : [];
      if (!items.length) {
        throw new Error("No products received from API.");
      }
      saveProductCache(items);
      return {
        products: items,
        isFallback: false,
        loadError: null
      };
    } catch (error) {
      const fallbackProducts = getFallbackProducts();
      if (API.allowFallbackWhenApiDown && fallbackProducts.length) {
        saveProductCache(fallbackProducts);
        return {
          products: fallbackProducts,
          isFallback: true,
          loadError: null
        };
      }

      return {
        products: [],
        isFallback: false,
        loadError: error || new Error("Unable to load live products.")
      };
    }
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
    const categoryFilter = getCategoryFilter();
    if (!grid) {
      return;
    }

    setStatus(status, "Loading products...", "");
    const catalog = await getProductsCatalog();
    const sourceProducts = catalog.products;
    const loadError = catalog.loadError;
    const isFallback = catalog.isFallback;
    const categoryFiltered = filterProductsByCategory(sourceProducts, categoryFilter);
    const filteredProducts = filterProductsByQuery(categoryFiltered, query);

    if (!filteredProducts.length) {
      grid.innerHTML = "";
      if (loadError) {
        setStatus(status, buildProductsErrorMessage(loadError), "error");
      } else if (query) {
        setStatus(status, "No products found for \"" + query + "\".", "warn");
      } else if (categoryFilter) {
        setStatus(
          status,
          "No products found in category \"" + prettifyCategory(categoryFilter) + "\".",
          "warn"
        );
      } else {
        setStatus(status, "No live products found for this store.", "warn");
      }
      return;
    }

    const productsToRender = isHomePage() ? filteredProducts.slice(0, 8) : filteredProducts;
    renderProducts(productsToRender);

    if (query) {
      setStatus(
        status,
        "Showing results for \"" + query + "\"" + (isFallback ? " (fallback mode)." : "."),
        isFallback ? "warn" : "success"
      );
    } else if (isFallback) {
      setStatus(
        status,
        "Live API down hai. Admin ke fallback products dikhaye ja rahe hain.",
        "warn"
      );
    } else if (categoryFilter) {
      setStatus(
        status,
        "Category: " + prettifyCategory(categoryFilter) + " (" + filteredProducts.length + " items)",
        "success"
      );
    } else if (isHomePage()) {
      setStatus(status, "Live products loaded. Tap Show All for full catalog.", "success");
    } else {
      setStatus(status, "Live products loaded successfully.", "success");
    }
  }

  function normalizeCategory(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function normalizeCategoryCard(raw) {
    const label = String(
      (raw && (raw.label || raw.name || raw.title || raw.category_name)) || ""
    ).trim();
    const slug = normalizeCategory(
      (raw && (raw.slug || raw.category_slug || raw.category)) || label
    );
    const image = String(
      (raw && (raw.image || raw.image_url || raw.feature_image || raw.photo)) || ""
    ).trim();
    return {
      slug: slug || "",
      label: label || "",
      image: image || DEFAULT_PRODUCT_IMAGE
    };
  }

  function buildCategoryCardsMarkup(items) {
    return (items || [])
      .map(function (item) {
        return (
          "<a class=\"category-card js-category-link\" data-category=\"" +
          escapeHtml(item.slug) +
          "\" href=\"products.html?category=" +
          encodeURIComponent(item.slug) +
          "\">" +
          "<div class=\"category-thumb\"><img src=\"" +
          escapeHtml(buildProductImage(item.image)) +
          "\" alt=\"" +
          escapeHtml(item.label) +
          " category\" /></div>" +
          "<h3>" +
          escapeHtml(item.label) +
          "</h3>" +
          "</a>"
        );
      })
      .join("");
  }

  function prettifyCategory(slug) {
    if (!slug) {
      return "";
    }
    return slug
      .split("-")
      .filter(Boolean)
      .map(function (part) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(" ");
  }

  function inferProductCategory(product) {
    const explicit =
      (product && (product.category_name || product.category || product.categoryName)) || "";
    const explicitSlug = normalizeCategory(explicit);
    if (explicitSlug) {
      return explicitSlug;
    }

    const title = String((product && product.title) || "").toLowerCase();
    const image = String((product && product.feature_image) || "").toLowerCase();
    const basis = title + " " + image;

    if (basis.indexOf("mug") !== -1 || basis.indexOf("caramel") !== -1) {
      return "mug";
    }
    if (basis.indexOf("pillow") !== -1) {
      return "pillow";
    }
    if (basis.indexOf("shirt") !== -1 || basis.indexOf("t-shirt") !== -1) {
      return "t-shirt";
    }
    if (basis.indexOf("led") !== -1 || basis.indexOf("lamp") !== -1 || basis.indexOf("mirror") !== -1) {
      return "led-frame";
    }
    if (basis.indexOf("frame") !== -1 || basis.indexOf("photo") !== -1) {
      return "photo-frame";
    }
    if (basis.indexOf("key") !== -1) {
      return "keychain";
    }
    return "others";
  }

  function getCategoryFilter() {
    try {
      const params = new URLSearchParams(window.location.search || "");
      return normalizeCategory(params.get("category"));
    } catch (err) {
      return "";
    }
  }

  function filterProductsByCategory(products, categoryFilter) {
    if (!categoryFilter) {
      return products;
    }
    return products.filter(function (product) {
      return inferProductCategory(product) === categoryFilter;
    });
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

  function initLiveBlogPanel() {
    const btn = document.getElementById("toggleLiveBlogsBtn");
    const wrap = document.getElementById("liveBlogsWrap");
    const frame = document.getElementById("liveBlogsFrame");
    const openBtn = document.getElementById("openLiveBlogsBtn");
    if (!btn || !wrap || !frame) {
      return;
    }

    const liveBlogUrl = getLiveBaseUrl() + "/blog";
    if (openBtn) {
      openBtn.setAttribute("href", liveBlogUrl);
    }

    btn.addEventListener("click", function () {
      const isOpen = wrap.style.display !== "none";
      if (isOpen) {
        wrap.style.display = "none";
        btn.textContent = "Show Live Blog Panel";
        return;
      }
      frame.src = liveBlogUrl;
      wrap.style.display = "block";
      btn.textContent = "Hide Live Blog Panel";
    });
  }

  function initLoginBridge() {
    const loginForm = document.querySelector(".js-login-form");
    if (!loginForm) {
      return;
    }

    const statusNode = document.getElementById("loginApiStatus");
    const liveFrame = document.getElementById("liveLoginFrame");
    const openBtn = document.getElementById("openLiveLoginBtn");
    const liveLoginUrl = getLiveBaseUrl() + "/customer/login";

    if (liveFrame) {
      liveFrame.src = liveLoginUrl;
    }
    if (openBtn) {
      openBtn.setAttribute("href", liveLoginUrl);
    }
    setStatus(statusNode, "Live login connected. Use panel below to sign in.", "success");

    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();
      setStatus(statusNode, "Opening live login...", "");
      window.location.href = liveLoginUrl;
    });
  }

  function initCategoryLinks() {
    document.querySelectorAll(".js-category-link").forEach(function (link) {
      const category = normalizeCategory(link.getAttribute("data-category"));
      if (!category) {
        return;
      }
      link.setAttribute("href", "products.html?category=" + encodeURIComponent(category));
    });
  }

  function renderCategoryCardsOnPage(categoryItems) {
    const cardsMarkup = buildCategoryCardsMarkup(categoryItems);
    document.querySelectorAll(".category-grid").forEach(function (grid) {
      if (!grid.closest(".categories")) {
        return;
      }
      grid.innerHTML = cardsMarkup || "";
    });
  }

  function setCategoryStatus(text, type) {
    const node = document.getElementById("categoriesStatus");
    setStatus(node, text, type);
  }

  async function loadCategoryMenu() {
    if (!document.querySelector(".categories-strip")) {
      return;
    }

    setCategoryStatus("Loading categories...", "");
    const endpoints = [
      API.baseUrl +
        "/" +
        encodeURIComponent(API.username) +
        "/categories?per_page=100",
      API.baseUrl +
        "/" +
        encodeURIComponent(API.username) +
        "/item-categories?per_page=100"
    ];

    for (let i = 0; i < endpoints.length; i += 1) {
      try {
        const payload = await fetchJson(endpoints[i]);
        const items = Array.isArray(payload && payload.data) ? payload.data : [];
        const cards = items.map(normalizeCategoryCard).filter(function (item) {
          return item.slug && item.label;
        });
        if (cards.length) {
          renderCategoryCardsOnPage(cards);
          initCategoryLinks();
          setCategoryStatus("Live categories loaded successfully.", "success");
          return;
        }
      } catch (err) {
        // try next endpoint
      }
    }
    if (API.allowFallbackWhenApiDown && CATEGORY_MENU.length) {
      renderCategoryCardsOnPage(CATEGORY_MENU);
      initCategoryLinks();
      setCategoryStatus(
        "Live category API unavailable. Showing fallback categories.",
        "warn"
      );
      return;
    }

    renderCategoryCardsOnPage([]);
    setCategoryStatus("Live category API unavailable right now. Please try again shortly.", "error");
  }

  function startAutoSync() {
    if (autoSyncTimer) {
      clearInterval(autoSyncTimer);
    }
    autoSyncTimer = setInterval(function () {
      loadCategoryMenu();
      loadProducts();
      loadProductDetailPage();
    }, 45000);
  }

  function ensureProductsCategoryStrip() {
    if (!isProductsPage()) {
      return;
    }
    if (document.querySelector(".categories-strip")) {
      return;
    }
    if (document.querySelector(".js-dynamic-category-strip")) {
      return;
    }

    const featuredSection = document.getElementById("featured");
    if (!featuredSection || !featuredSection.parentNode) {
      return;
    }

    const cardsMarkup = buildCategoryCardsMarkup(CATEGORY_MENU);

    const section = document.createElement("section");
    section.className = "categories categories-strip js-dynamic-category-strip";
    section.innerHTML =
      "<div class=\"container\">" +
      "<div class=\"section-head\"><h2>Shop By Categories</h2><p>Select a category to view matching products.</p></div>" +
      "<div class=\"category-grid\">" +
      cardsMarkup +
      "</div>" +
      "</div>";

    featuredSection.parentNode.insertBefore(section, featuredSection);
  }

  function openProductDetailFromCard(card) {
    if (!card) {
      return;
    }
    const detailUrl = card.getAttribute("data-detail-url");
    if (detailUrl) {
      window.location.href = detailUrl;
      return;
    }
    const id = Number(card.getAttribute("data-id") || 0);
    if (id > 0) {
      window.location.href = "product.html?id=" + encodeURIComponent(String(id));
    }
  }

  function findProductById(products, productId) {
    return (products || []).find(function (product) {
      return Number(product && product.product_id) === Number(productId);
    });
  }

  async function loadProductDetailPage() {
    const root = document.querySelector(".js-product-detail");
    if (!root) {
      return;
    }

    const status = document.getElementById("productDetailStatus");
    const titleNode = document.getElementById("productDetailTitle");
    const imageNode = document.getElementById("productDetailImage");
    const badgeNode = document.getElementById("productDetailBadge");
    const categoryNode = document.getElementById("productDetailCategory");
    const priceNode = document.getElementById("productDetailPrice");
    const oldPriceNode = document.getElementById("productDetailOldPrice");
    const addBtn = document.getElementById("productDetailAddToCart");

    let productId = 0;
    try {
      const params = new URLSearchParams(window.location.search || "");
      productId = Number(params.get("id") || 0);
    } catch (err) {
      productId = 0;
    }

    if (!productId) {
      setStatus(status, "Product not found. Please open from products page.", "error");
      return;
    }

    setStatus(status, "Loading product details...", "");
    const catalog = await getProductsCatalog();
    const product = findProductById(catalog.products, productId);

    if (!product) {
      setStatus(status, "This product is currently unavailable.", "error");
      return;
    }

    const title = String(product.title || "Untitled Product");
    const image = buildProductImage(product.feature_image);
    const price = toNumber(product.current_price, 0);
    const oldPrice = toNumber(product.previous_price, 0);
    const category = prettifyCategory(inferProductCategory(product));

    if (titleNode) {
      titleNode.textContent = title;
    }
    if (imageNode) {
      imageNode.src = image;
      imageNode.alt = title;
      imageNode.onerror = function () {
        imageNode.src = DEFAULT_PRODUCT_IMAGE;
      };
    }
    if (badgeNode) {
      badgeNode.textContent = product.is_feature ? "Featured" : "Top Pick";
    }
    if (categoryNode) {
      categoryNode.textContent = category || "General";
    }
    if (priceNode) {
      priceNode.textContent = "Rs." + Math.round(price);
    }
    if (oldPriceNode) {
      oldPriceNode.textContent = oldPrice > price ? "Rs." + Math.round(oldPrice) : "";
    }
    if (addBtn) {
      addBtn.setAttribute("data-id", String(Number(product.product_id || 0)));
      addBtn.setAttribute("data-name", title);
      addBtn.setAttribute("data-price", String(price));
      addBtn.setAttribute("data-image", image);
    }

    if (catalog.isFallback) {
      setStatus(
        status,
        "Live API unavailable. Backup product details shown.",
        "warn"
      );
    } else {
      setStatus(status, "Product details loaded successfully.", "success");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    updateCartCount();
    initBannerSlider();
    initBottomSearch();
    ensureProductsCategoryStrip();
    loadCategoryMenu();
    loadProducts();
    loadBlogs();
    loadProductDetailPage();
    startAutoSync();
    initLiveBlogPanel();
    initLoginBridge();

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
        const productLink = event.target.closest(".js-view-product");
        if (productLink) {
          return;
        }
        const card = event.target.closest(".js-product-card");
        if (!card) {
          return;
        }
        openProductDetailFromCard(card);
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

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      const card = event.target.closest(".js-product-card");
      if (!card) {
        return;
      }
      event.preventDefault();
      openProductDetailFromCard(card);
    });

    document.querySelectorAll("form.js-demo-form").forEach(function (form) {
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
