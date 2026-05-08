(function () {
  const CART_KEY = "cgprints_cart";

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (err) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
  }

  function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll(".js-cart-count").forEach((node) => {
      node.textContent = count;
    });
  }

  function addToCart(name, price) {
    const cart = getCart();
    const found = cart.find((item) => item.name === name);
    if (found) {
      found.qty += 1;
    } else {
      cart.push({ name: name, price: Number(price), qty: 1 });
    }
    saveCart(cart);
  }

  document.addEventListener("DOMContentLoaded", function () {
    updateCartCount();

    document.querySelectorAll(".js-add-to-cart").forEach((btn) => {
      btn.addEventListener("click", function () {
        addToCart(btn.dataset.name, btn.dataset.price);
        btn.textContent = "Added";
        setTimeout(function () {
          btn.textContent = "Add to Cart";
        }, 1000);
      });
    });

    document.querySelectorAll("form").forEach((form) => {
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
    updateCartCount: updateCartCount
  };
})();
