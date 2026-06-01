/* HostelMart - frontend only (localStorage)
   Features:
   - 20 products
   - Search + filters
   - Cart system + checkout
   - Order history + transactions
   - Login/Register (demo, localStorage)
   - Dark mode
*/

const LS = {
  theme: "hm_theme",
  user: "hm_user",
  users: "hm_users",
  cart: "hm_cart",
  orders: "hm_orders",
  transactions: "hm_transactions",
};

const state = {
  products: Array.isArray(window.HOSTEL_PRODUCTS) ? window.HOSTEL_PRODUCTS : [],
  cart: loadJSON(LS.cart, []),
  user: loadJSON(LS.user, { username: "Guest" }),
  orders: loadJSON(LS.orders, []),
  transactions: loadJSON(LS.transactions, []),
  filters: {
    q: "",
    category: "all",
    availability: "all",
    priceSort: "relevance",
  },
};

// ---- Helpers ----
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function money(n) {
  return `₹${Math.round(n)}`;
}
function uid(prefix = "ORD") {
  return `${prefix}-${Math.random().toString(16).slice(2, 6).toUpperCase()}-${Date.now().toString().slice(-6)}`;
}
function byId(id) {
  return document.getElementById(id);
}
function fmtDate(d) {
  const dt = new Date(d);
  return dt.toLocaleString();
}

// ---- DOM refs ----
const productsGrid = byId("productsGrid");
const searchInput = byId("searchInput");
const categoryFilter = byId("categoryFilter");
const availabilityFilter = byId("availabilityFilter");
const priceSort = byId("priceSort");

const cartCount = byId("cartCount");
const cartItems = byId("cartItems");
const cartEmpty = byId("cartEmpty");
const subtotalText = byId("subtotalText");
const taxText = byId("taxText");
const totalText = byId("totalText");
const paymentMethod = byId("paymentMethod");
const checkoutBtn = byId("checkoutBtn");
const clearCartBtn = byId("clearCartBtn");

const ordersList = byId("ordersList");
const noOrders = byId("noOrders");
const clearOrdersBtn = byId("clearOrdersBtn");

const transactionsTbody = byId("transactionsTbody");
const noTx = byId("noTx");

const currentUserBadge = byId("currentUserBadge");
const darkModeBtn = byId("darkModeBtn");

const usernameInput = byId("usernameInput");
const passwordInput = byId("passwordInput");
const doLoginBtn = byId("doLoginBtn");
const doRegisterBtn = byId("doRegisterBtn");
const loginBtnText = byId("loginBtnText");
const logoutBtn = byId("logoutBtn");
const authHint = byId("authHint");

// ---- Init ----
initTheme();
initCategories();
initAuthUI();
wireEvents();
renderAll();

function wireEvents() {
  searchInput.addEventListener("input", (e) => {
    state.filters.q = e.target.value.trim().toLowerCase();
    renderProducts();
  });
  categoryFilter.addEventListener("change", (e) => {
    state.filters.category = e.target.value;
    renderProducts();
  });
  availabilityFilter.addEventListener("change", (e) => {
    state.filters.availability = e.target.value;
    renderProducts();
  });
  priceSort.addEventListener("change", (e) => {
    state.filters.priceSort = e.target.value;
    renderProducts();
  });

  darkModeBtn.addEventListener("click", toggleTheme);

  clearCartBtn.addEventListener("click", () => {
    state.cart = [];
    persistCart();
    renderCart();
  });

  checkoutBtn.addEventListener("click", checkout);

  clearOrdersBtn.addEventListener("click", () => {
    if (!confirm("Clear all orders and transactions?")) return;
    state.orders = [];
    state.transactions = [];
    saveJSON(LS.orders, state.orders);
    saveJSON(LS.transactions, state.transactions);
    renderOrders();
    renderTransactions();
  });

  doRegisterBtn.addEventListener("click", registerUser);
  doLoginBtn.addEventListener("click", loginUser);
  logoutBtn.addEventListener("click", logoutUser);
}

function renderAll() {
  renderProducts();
  renderCart();
  renderOrders();
  renderTransactions();
  renderUserBadge();
}

// ---- Theme ----
function initTheme() {
  const theme = localStorage.getItem(LS.theme) || "light";
  if (theme === "dark") document.body.classList.add("hm-dark");
}
function toggleTheme() {
  document.body.classList.toggle("hm-dark");
  localStorage.setItem(LS.theme, document.body.classList.contains("hm-dark") ? "dark" : "light");
}

// ---- Auth (demo) ----
function initAuthUI() {
  if (!state.user || !state.user.username) {
    state.user = { username: "Guest" };
    saveJSON(LS.user, state.user);
  }
  updateAuthHint();
}
function getUsers() {
  return loadJSON(LS.users, []);
}
function setUsers(users) {
  saveJSON(LS.users, users);
}
function updateAuthHint() {
  const users = getUsers();
  authHint.textContent = users.length
    ? "Tip: Use your registered credentials to login."
    : "No users registered yet. Register to enable login/logout.";
  const isGuest = state.user.username === "Guest";
  logoutBtn.classList.toggle("d-none", isGuest);
  loginBtnText.textContent = isGuest ? "Login" : state.user.username;
}
function registerUser() {
  const u = (usernameInput.value || "").trim();
  const p = (passwordInput.value || "").trim();
  if (!u || !p) return alert("Enter username and password.");
  if (u.toLowerCase() === "guest") return alert("Username 'Guest' is reserved.");

  const users = getUsers();
  if (users.some((x) => x.username.toLowerCase() === u.toLowerCase())) {
    return alert("Username already exists. Try a different one.");
  }
  users.push({ username: u, password: p });
  setUsers(users);
  alert("Registered! Now login.");
  updateAuthHint();
}
function loginUser() {
  const u = (usernameInput.value || "").trim();
  const p = (passwordInput.value || "").trim();
  if (!u || !p) return alert("Enter username and password.");

  const users = getUsers();
  const ok = users.find((x) => x.username.toLowerCase() === u.toLowerCase() && x.password === p);
  if (!ok) return alert("Invalid credentials.");

  state.user = { username: ok.username };
  saveJSON(LS.user, state.user);
  updateAuthHint();
  renderUserBadge();
  alert(`Welcome, ${ok.username}!`);
}
function logoutUser() {
  state.user = { username: "Guest" };
  saveJSON(LS.user, state.user);
  updateAuthHint();
  renderUserBadge();
  alert("Logged out.");
}

function renderUserBadge() {
  currentUserBadge.textContent = state.user.username || "Guest";
  currentUserBadge.className = state.user.username === "Guest"
    ? "badge text-bg-secondary"
    : "badge text-bg-success";
}

// ---- Products ----
function initCategories() {
  const cats = Array.from(new Set(state.products.map((p) => p.category))).sort();
  categoryFilter.innerHTML = `<option value="all">All categories</option>` + cats
    .map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
    .join("");
}

function getFilteredProducts() {
  const { q, category, availability, priceSort } = state.filters;
  let list = [...state.products];

  if (q) {
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }
  if (category !== "all") list = list.filter((p) => p.category === category);
  if (availability === "inStock") list = list.filter((p) => p.inStock);

  if (priceSort === "lowToHigh") list.sort((a, b) => a.price - b.price);
  if (priceSort === "highToLow") list.sort((a, b) => b.price - a.price);
  return list;
}

function renderProducts() {
  const list = getFilteredProducts();
  if (!list.length) {
    productsGrid.innerHTML = `
      <div class="col-12">
        <div class="alert alert-secondary mb-0">No products found. Try changing search/filters.</div>
      </div>
    `;
    return;
  }
  productsGrid.innerHTML = list.map(productCardHTML).join("");

  // wire add-to-cart buttons
  productsGrid.querySelectorAll("[data-add]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.getAttribute("data-add"));
      addToCart(id);
    });
  });
}

function productCardHTML(p) {
  const stockBadge = p.inStock
    ? `<span class="badge text-bg-success">In stock</span>`
    : `<span class="badge text-bg-danger">Out of stock</span>`;
  return `
    <div class="col-12 col-sm-6 col-lg-4 col-xl-3">
      <div class="card product-card hm-card shadow-sm">
        <img class="card-img-top" src="${escapeAttr(p.img)}" alt="${escapeAttr(p.name)}" loading="lazy" />
        <div class="card-body d-flex flex-column gap-2">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <div class="fw-semibold">${escapeHtml(p.name)}</div>
            ${stockBadge}
          </div>
          <div class="d-flex align-items-center justify-content-between">
            <span class="badge cat-badge">${escapeHtml(p.category)}</span>
            <span class="price">${money(p.price)}</span>
          </div>
          <button class="btn btn-warning w-100 mt-auto" ${p.inStock ? "" : "disabled"} data-add="${p.id}">
            <i class="bi bi-cart-plus"></i> Add to cart
          </button>
        </div>
      </div>
    </div>
  `;
}

// ---- Cart ----
function persistCart() {
  saveJSON(LS.cart, state.cart);
  updateCartBadge();
}
function updateCartBadge() {
  const count = state.cart.reduce((sum, x) => sum + x.qty, 0);
  cartCount.textContent = String(count);
}
function addToCart(productId) {
  const p = state.products.find((x) => x.id === productId);
  if (!p || !p.inStock) return;
  const found = state.cart.find((x) => x.id === productId);
  if (found) found.qty += 1;
  else state.cart.push({ id: p.id, qty: 1 });
  persistCart();
  renderCart();
}
function changeQty(productId, delta) {
  const item = state.cart.find((x) => x.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) state.cart = state.cart.filter((x) => x.id !== productId);
  persistCart();
  renderCart();
}
function removeFromCart(productId) {
  state.cart = state.cart.filter((x) => x.id !== productId);
  persistCart();
  renderCart();
}
function calcTotals() {
  const subtotal = state.cart.reduce((sum, x) => {
    const p = state.products.find((p) => p.id === x.id);
    return sum + (p ? p.price * x.qty : 0);
  }, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}
function renderCart() {
  updateCartBadge();
  if (!state.cart.length) {
    cartItems.innerHTML = "";
    cartEmpty.classList.remove("d-none");
    checkoutBtn.disabled = true;
  } else {
    cartEmpty.classList.add("d-none");
    checkoutBtn.disabled = false;
  }

  cartItems.innerHTML = state.cart.map(cartItemHTML).join("");
  cartItems.querySelectorAll("[data-inc]").forEach((b) => b.addEventListener("click", () => changeQty(Number(b.dataset.inc), +1)));
  cartItems.querySelectorAll("[data-dec]").forEach((b) => b.addEventListener("click", () => changeQty(Number(b.dataset.dec), -1)));
  cartItems.querySelectorAll("[data-rm]").forEach((b) => b.addEventListener("click", () => removeFromCart(Number(b.dataset.rm))));

  const { subtotal, tax, total } = calcTotals();
  subtotalText.textContent = money(subtotal);
  taxText.textContent = money(tax);
  totalText.textContent = money(total);
}

function cartItemHTML(ci) {
  const p = state.products.find((x) => x.id === ci.id);
  if (!p) return "";
  return `
    <div class="cart-item">
      <div class="d-flex gap-2">
        <img src="${escapeAttr(p.img)}" alt="${escapeAttr(p.name)}" width="64" height="64" style="object-fit:cover;border-radius:8px;background:#f3f4f6;" />
        <div class="flex-grow-1">
          <div class="title">${escapeHtml(p.name)}</div>
          <div class="hm-muted small">${escapeHtml(p.category)} • ${money(p.price)} each</div>
          <div class="d-flex align-items-center gap-2 mt-2">
            <div class="btn-group btn-group-sm" role="group" aria-label="Qty">
              <button class="btn btn-outline-secondary" data-dec="${p.id}">-</button>
              <button class="btn btn-outline-secondary disabled">${ci.qty}</button>
              <button class="btn btn-outline-secondary" data-inc="${p.id}">+</button>
            </div>
            <div class="ms-auto fw-semibold">${money(p.price * ci.qty)}</div>
          </div>
          <button class="btn btn-link text-danger p-0 mt-1 small" data-rm="${p.id}">
            Remove
          </button>
        </div>
      </div>
    </div>
  `;
}

// ---- Checkout -> Orders + Transactions ----
function checkout() {
  if (!state.cart.length) return;
  if (state.user.username === "Guest") {
    const proceed = confirm("You are in Guest mode. Continue checkout as Guest?");
    if (!proceed) return;
  }

  const { subtotal, tax, total } = calcTotals();
  const items = state.cart.map((x) => {
    const p = state.products.find((p) => p.id === x.id);
    return {
      id: x.id,
      name: p ? p.name : "Unknown",
      price: p ? p.price : 0,
      qty: x.qty,
      lineTotal: p ? p.price * x.qty : 0,
    };
  });

  const orderId = uid("ORD");
  const now = new Date().toISOString();
  const method = paymentMethod.value || "UPI";

  const order = {
    orderId,
    user: state.user.username || "Guest",
    date: now,
    items,
    subtotal,
    tax,
    total,
    paymentMethod: method,
    status: "PAID",
  };

  state.orders.unshift(order);
  saveJSON(LS.orders, state.orders);

  state.transactions.unshift({
    txId: uid("TX"),
    date: now,
    orderId,
    amount: total,
    method,
    status: "SUCCESS",
  });
  saveJSON(LS.transactions, state.transactions);

  state.cart = [];
  persistCart();
  renderCart();
  renderOrders();
  renderTransactions();

  alert(`Order placed! (${orderId})`);
}

function renderOrders() {
  if (!state.orders.length) {
    ordersList.innerHTML = "";
    noOrders.classList.remove("d-none");
    return;
  }
  noOrders.classList.add("d-none");
  ordersList.innerHTML = state.orders.map(orderAccordionHTML).join("");
}

function orderAccordionHTML(o, idx) {
  const itemsHTML = o.items
    .map(
      (it) => `
      <div class="d-flex justify-content-between small">
        <span>${escapeHtml(it.name)} × ${it.qty}</span>
        <span class="fw-semibold">${money(it.lineTotal)}</span>
      </div>
    `
    )
    .join("");

  const headingId = `ordHead${idx}`;
  const collapseId = `ordCol${idx}`;
  return `
    <div class="accordion-item hm-card">
      <h2 class="accordion-header" id="${headingId}">
        <button class="accordion-button ${idx === 0 ? "" : "collapsed"}" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="${idx === 0 ? "true" : "false"}" aria-controls="${collapseId}">
          <div class="d-flex flex-column flex-sm-row w-100 justify-content-between gap-1">
            <div class="fw-semibold">${escapeHtml(o.orderId)} <span class="badge text-bg-success ms-1">${escapeHtml(o.status)}</span></div>
            <div class="hm-muted small">${escapeHtml(o.user)} • ${fmtDate(o.date)} • Total: ${money(o.total)}</div>
          </div>
        </button>
      </h2>
      <div id="${collapseId}" class="accordion-collapse collapse ${idx === 0 ? "show" : ""}" aria-labelledby="${headingId}">
        <div class="accordion-body">
          <div class="mb-2">
            <div class="hm-muted small mb-1">Items</div>
            <div class="d-flex flex-column gap-1">${itemsHTML}</div>
          </div>
          <hr class="my-2"/>
          <div class="d-flex justify-content-between">
            <span class="hm-muted">Subtotal</span><span class="fw-semibold">${money(o.subtotal)}</span>
          </div>
          <div class="d-flex justify-content-between">
            <span class="hm-muted">Tax</span><span class="fw-semibold">${money(o.tax)}</span>
          </div>
          <div class="d-flex justify-content-between">
            <span class="fw-semibold">Total</span><span class="fw-bold">${money(o.total)}</span>
          </div>
          <div class="mt-2 hm-muted small">
            Payment: <span class="fw-semibold">${escapeHtml(o.paymentMethod)}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderTransactions() {
  if (!state.transactions.length) {
    transactionsTbody.innerHTML = "";
    noTx.classList.remove("d-none");
    return;
  }
  noTx.classList.add("d-none");
  transactionsTbody.innerHTML = state.transactions
    .map(
      (t) => `
      <tr>
        <td class="small">${fmtDate(t.date)}</td>
        <td class="small">${escapeHtml(t.orderId)}</td>
        <td class="text-end fw-semibold">${money(t.amount)}</td>
        <td class="small">${escapeHtml(t.method)}</td>
        <td><span class="badge text-bg-success">${escapeHtml(t.status)}</span></td>
      </tr>
    `
    )
    .join("");
}

// ---- basic escaping (for safety) ----
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function escapeAttr(s) {
  return escapeHtml(s).replaceAll("`", "&#096;");
}

