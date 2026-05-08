(function () {
  function renderCartPage() {
    if (!window.CGCart) {
      return;
    }

    const cartItemsNode = document.getElementById("cartItems");
    const subtotalNode = document.getElementById("cartSubtotal");
    const shippingNode = document.getElementById("shipping");
    const totalNode = document.getElementById("cartTotal");
    const clearBtn = document.getElementById("clearCart");

    if (!cartItemsNode || !subtotalNode || !totalNode || !clearBtn || !shippingNode) {
      return;
    }

    function refresh() {
      const cart = window.CGCart.getCart();
      let subtotal = 0;
      cartItemsNode.innerHTML = "";

      if (!cart.length) {
        cartItemsNode.innerHTML = "<p class='list-muted'>Your cart is empty. Go to Home and add products.</p>";
      }

      cart.forEach(function (item, index) {
        subtotal += item.price * item.qty;

        const card = document.createElement("div");
        card.className = "cart-item";
        card.innerHTML = `
          <div class="cart-item-head">
            <strong>${item.name}</strong>
            <button class="qty-btn" data-remove="${index}" aria-label="Remove item">x</button>
          </div>
          <div>Price: Rs.${item.price}</div>
          <div class="qty-row">
            <button class="qty-btn" data-dec="${index}">-</button>
            <strong>${item.qty}</strong>
            <button class="qty-btn" data-inc="${index}">+</button>
          </div>
        `;
        cartItemsNode.appendChild(card);
      });

      const shipping = subtotal > 0 ? 49 : 0;
      const total = subtotal + shipping;

      subtotalNode.textContent = subtotal;
      shippingNode.textContent = shipping;
      totalNode.textContent = total;
      window.CGCart.updateCartCount();
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
    });

    refresh();
  }

  document.addEventListener("DOMContentLoaded", renderCartPage);
})();
