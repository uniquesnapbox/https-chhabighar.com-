(function () {
  const API = Object.assign(
    {
      baseUrl: "https://zestixe.in/api/v1/sync",
      username: "chahbighar",
      apiKey: ""
    },
    window.CG_API || {}
  );

  function getApiHeaders() {
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json"
    };
    if (API.apiKey && API.apiKey !== "YOUR_SYNC_API_KEY") {
      headers["X-Sync-Key"] = API.apiKey;
    }
    return headers;
  }

  function setCheckoutMessage(node, text, type) {
    if (!node) {
      return;
    }
    node.textContent = text;
    node.className = "api-status" + (type ? " " + type : "");
  }

  function renderCartPage() {
    if (!window.CGCart) {
      return;
    }

    const cartItemsNode = document.getElementById("cartItems");
    const subtotalNode = document.getElementById("cartSubtotal");
    const shippingNode = document.getElementById("shipping");
    const totalNode = document.getElementById("cartTotal");
    const clearBtn = document.getElementById("clearCart");
    const checkoutBtn = document.getElementById("checkoutBtn");
    const checkoutMessageNode = document.getElementById("checkoutMessage");

    if (
      !cartItemsNode ||
      !subtotalNode ||
      !totalNode ||
      !clearBtn ||
      !shippingNode ||
      !checkoutBtn ||
      !checkoutMessageNode
    ) {
      return;
    }

    function refresh() {
      const cart = window.CGCart.getCart();
      let subtotal = 0;
      cartItemsNode.innerHTML = "";

      if (!cart.length) {
        cartItemsNode.innerHTML =
          "<p class='list-muted'>Your cart is empty. Go to Home and add products.</p>";
      }

      cart.forEach(function (item, index) {
        subtotal += item.price * item.qty;

        const card = document.createElement("div");
        card.className = "cart-item";
        card.innerHTML =
          "<div class='cart-item-head'>" +
          "<strong>" +
          item.name +
          "</strong>" +
          "<button class='qty-btn' data-remove='" +
          index +
          "' aria-label='Remove item'>x</button>" +
          "</div>" +
          "<div>Price: Rs." +
          item.price +
          "</div>" +
          "<div class='qty-row'>" +
          "<button class='qty-btn' data-dec='" +
          index +
          "'>-</button>" +
          "<strong>" +
          item.qty +
          "</strong>" +
          "<button class='qty-btn' data-inc='" +
          index +
          "'>+</button>" +
          "</div>";
        cartItemsNode.appendChild(card);
      });

      const shipping = subtotal > 0 ? 49 : 0;
      const total = subtotal + shipping;

      subtotalNode.textContent = Math.round(subtotal);
      shippingNode.textContent = Math.round(shipping);
      totalNode.textContent = Math.round(total);
      window.CGCart.updateCartCount();
    }

    async function submitOrder() {
      const cart = window.CGCart.getCart();
      if (!cart.length) {
        setCheckoutMessage(checkoutMessageNode, "Cart is empty.", "warn");
        return;
      }

      const missingProduct = cart.find(function (item) {
        return !item.productId || item.productId <= 0;
      });
      if (missingProduct) {
        setCheckoutMessage(
          checkoutMessageNode,
          "Some cart items are invalid for API checkout. Add products again from live products list.",
          "error"
        );
        return;
      }

      if (!API.apiKey || API.apiKey === "YOUR_SYNC_API_KEY") {
        setCheckoutMessage(
          checkoutMessageNode,
          "Set `apiKey` in api-config.js before placing order.",
          "warn"
        );
        return;
      }

      const customerName = document.getElementById("checkoutName").value.trim();
      const customerPhone = document.getElementById("checkoutPhone").value.trim();
      const customerEmail = document.getElementById("checkoutEmail").value.trim();
      const customerAddress = document.getElementById("checkoutAddress").value.trim();
      const customerCity = document.getElementById("checkoutCity").value.trim();

      if (!customerName || !customerPhone) {
        setCheckoutMessage(
          checkoutMessageNode,
          "Please fill name and phone before checkout.",
          "warn"
        );
        return;
      }

      const subtotal = cart.reduce(function (sum, item) {
        return sum + item.price * item.qty;
      }, 0);
      const shipping = subtotal > 0 ? 49 : 0;

      const payload = {
        customer: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail || null,
          country_code: "+91"
        },
        billing: {
          address: customerAddress || null,
          city: customerCity || null,
          country: "India"
        },
        items: cart.map(function (item) {
          return {
            product_id: Number(item.productId),
            qty: Number(item.qty),
            unit_price: Number(item.price),
            title: item.name,
            image: item.image
          };
        }),
        shipping_charge: shipping,
        tax: 0,
        coupon: 0,
        method: "ONLINE",
        payment_status: "Pending",
        order_status: "pending",
        serving_method: "home_delivery",
        order_notes: "Order from ChhabiGhar static website"
      };

      const endpoint =
        API.baseUrl + "/" + encodeURIComponent(API.username) + "/orders";

      checkoutBtn.disabled = true;
      setCheckoutMessage(checkoutMessageNode, "Placing order...", "");

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: getApiHeaders(),
          body: JSON.stringify(payload)
        });

        let body = null;
        try {
          body = await response.json();
        } catch (err) {
          body = null;
        }

        if (!response.ok) {
          throw new Error((body && body.message) || "Checkout failed.");
        }

        const orderNumber = body && body.data ? body.data.order_number : null;
        setCheckoutMessage(
          checkoutMessageNode,
          "Order placed successfully" + (orderNumber ? " (Order #" + orderNumber + ")" : "") + ".",
          "success"
        );
        window.CGCart.saveCart([]);
        refresh();
      } catch (error) {
        setCheckoutMessage(checkoutMessageNode, error.message, "error");
      } finally {
        checkoutBtn.disabled = false;
      }
    }

    cartItemsNode.addEventListener("click", function (event) {
      const cart = window.CGCart.getCart();
      const removeIndex = event.target.getAttribute("data-remove");
      const decIndex = event.target.getAttribute("data-dec");
      const incIndex = event.target.getAttribute("data-inc");

      if (removeIndex !== null) {
        cart.splice(Number(removeIndex), 1);
      }

      if (decIndex !== null) {
        const i = Number(decIndex);
        cart[i].qty -= 1;
        if (cart[i].qty <= 0) {
          cart.splice(i, 1);
        }
      }

      if (incIndex !== null) {
        const i = Number(incIndex);
        cart[i].qty += 1;
      }

      window.CGCart.saveCart(cart);
      refresh();
    });

    clearBtn.addEventListener("click", function () {
      window.CGCart.saveCart([]);
      refresh();
      setCheckoutMessage(checkoutMessageNode, "", "");
    });

    checkoutBtn.addEventListener("click", submitOrder);

    refresh();
  }

  document.addEventListener("DOMContentLoaded", renderCartPage);
})();
