(() => {
  "use strict";

  const products = [
    {
      id: 1,
      image: "./img/menu/1.jpg",
      name: "X-Salada Especial",
      category: "Lanches",
      price: 28.9,
      description: "Hambúrguer, queijo, salada e molho da casa.",
    },
    {
      id: 2,
      image: "./img/menu/2.jpg",
      name: "X-Bacon",
      category: "Lanches",
      price: 32.9,
      description: "Hambúrguer, queijo, bacon crocante e molho.",
    },
    {
      id: 3,
      image: "./img/menu/4.jpg",
      name: "Lanche Veggie",
      category: "Lanches",
      price: 27.5,
      description: "Burger vegetal, queijo, salada e maionese verde.",
    },
    {
      id: 4,
      image: "./img/menu/5.jpg",
      name: "Batata com cheddar",
      category: "Porções",
      price: 24.9,
      description: "Batatas crocantes com cheddar e bacon.",
    },
    {
      id: 5,
      image: "./img/menu/3.jpg",
      name: "Iscas de frango",
      category: "Porções",
      price: 29.9,
      description: "Frango empanado acompanhado de molho.",
    },
    {
      id: 6,
      image: "./img/menu/6.jpg",
      name: "Refrigerante lata",
      category: "Bebidas",
      price: 7,
      description: "Lata de 350 ml.",
    },
    {
      id: 7,
      image: "./img/menu/7.jpg",
      name: "Suco natural",
      category: "Bebidas",
      price: 10,
      description: "Copo de 400 ml.",
    },
    {
      id: 8,
      image: "./img/menu/8.jpg",
      name: "Água mineral",
      category: "Bebidas",
      price: 5,
      description: "Garrafa de 500 ml.",
    },
  ];

  const profileFields = [
    ["name", "Name"],
    ["phone", "Phone"],
    ["cep", "Cep"],
    ["street", "Street"],
    ["number", "Number"],
    ["complement", "Complement"],
    ["district", "District"],
    ["city", "City"],
    ["uf", "Uf"],
  ];
  const productById = new Map(products.map((product) => [product.id, product]));
  const cepLookupIds = new WeakMap();
  const lastCepLookups = new WeakMap();
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));
  const money = (value) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const state = {
    cart: loadCart(),
    category: "Todos",
    favorites: loadFavorites(),
    profile: loadProfile(),
    showFavorites: false,
    installPrompt: null,
    orderSummary: "",
    previousFocus: null,
  };

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(
      () => toast.classList.remove("show"),
      3000
    );
  }

  function readStoredValue(key, fallback, isValid) {
    try {
      const rawValue = localStorage.getItem(key);
      if (rawValue === null) return fallback;
      const value = JSON.parse(rawValue);
      if (!isValid(value)) throw new Error(`Formato inválido: ${key}`);
      return value;
    } catch (error) {
      console.error(`Não foi possível carregar "${key}".`, error);
      showToast("Alguns dados salvos não puderam ser carregados.");
      return fallback;
    }
  }

  function writeStoredValue(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Não foi possível salvar "${key}".`, error);
      showToast("Não foi possível salvar os dados neste dispositivo.");
      return false;
    }
  }

  function loadCart() {
    const storedCart = readStoredValue("cardapio-cart", {}, (value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
      }
      return Object.entries(value).every(
        ([id, quantity]) =>
          productById.has(Number(id)) &&
          Number.isInteger(quantity) &&
          quantity > 0
      );
    });
    return { ...storedCart };
  }

  function loadFavorites() {
    const storedFavorites = readStoredValue(
      "cardapio-favorites",
      [],
      (value) =>
        Array.isArray(value) &&
        value.every(
          (id) => Number.isInteger(id) && productById.has(id)
        )
    );
    return new Set(storedFavorites);
  }

  function loadProfile() {
    const storedProfile = readStoredValue(
      "cardapio-customer",
      {},
      (value) =>
        value !== null && typeof value === "object" && !Array.isArray(value)
    );
    return Object.fromEntries(
      profileFields.map(([field]) => [
        field,
        typeof storedProfile[field] === "string" ? storedProfile[field] : "",
      ])
    );
  }

  function getTotal(cart = state.cart) {
    return Object.entries(cart).reduce((sum, [id, quantity]) => {
      const product = productById.get(Number(id));
      return product ? sum + product.price * quantity : sum;
    }, 0);
  }

  function getCartCount() {
    return Object.values(state.cart).reduce(
      (sum, quantity) => sum + quantity,
      0
    );
  }

  function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function createProductCard(product) {
    const article = createElement("article", "product");
    const visual = createElement("div", "visual");
    const image = createElement("img");
    image.src = product.image;
    image.alt = product.name;
    image.loading = "lazy";

    const favoriteButton = createElement(
      "button",
      `favorite-btn${state.favorites.has(product.id) ? " is-favorite" : ""}`,
      state.favorites.has(product.id) ? "♥" : "♡"
    );
    favoriteButton.type = "button";
    favoriteButton.dataset.favorite = product.id;
    favoriteButton.setAttribute(
      "aria-label",
      `${state.favorites.has(product.id) ? "Remover" : "Adicionar"} ${
        product.name
      } ${state.favorites.has(product.id) ? "dos" : "aos"} favoritos`
    );
    favoriteButton.setAttribute(
      "aria-pressed",
      String(state.favorites.has(product.id))
    );
    visual.append(image, favoriteButton);

    const body = createElement("div", "body");
    body.append(
      createElement("span", "product-category", product.category),
      createElement("h2", "", product.name),
      createElement("p", "", product.description)
    );

    const productBottom = createElement("div", "product-bottom");
    productBottom.append(createElement("strong", "", money(product.price)));

    const addButton = createElement("button", "add");
    addButton.type = "button";
    addButton.dataset.add = product.id;
    addButton.setAttribute("aria-label", `Adicionar ${product.name}`);
    addButton.append(
      createElement("span", "", "+"),
      document.createTextNode(" Adicionar")
    );
    productBottom.append(addButton);
    body.append(productBottom);
    article.append(visual, body);
    return article;
  }

  function renderProducts() {
    const visibleProducts = products.filter(
      (product) =>
        (state.category === "Todos" ||
          product.category === state.category) &&
        (!state.showFavorites || state.favorites.has(product.id))
    );
    const container = $("#products");
    container.replaceChildren();

    if (visibleProducts.length === 0) {
      container.append(
        createElement(
          "p",
          "empty-favorites",
          "Você ainda não tem favoritos. Toque no coração de um prato para salvá-lo aqui."
        )
      );
      return;
    }

    container.append(...visibleProducts.map(createProductCard));
  }

  function renderCart() {
    const entries = Object.entries(state.cart).filter(
      ([, quantity]) => quantity > 0
    );
    const cartItems = $("#cartItems");
    cartItems.replaceChildren();

    if (entries.length === 0) {
      cartItems.append(createElement("p", "", "Seu carrinho está vazio."));
    } else {
      entries.forEach(([id, quantity]) => {
        const product = productById.get(Number(id));
        const item = createElement("div", "cartItem");
        const details = createElement("div");
        details.append(
          createElement("b", "", product.name),
          document.createElement("br"),
          createElement("small", "", money(product.price * quantity))
        );

        const controls = createElement("div", "qty");
        const decrease = createElement("button", "", "−");
        decrease.type = "button";
        decrease.dataset.minus = id;
        decrease.setAttribute("aria-label", `Remover uma unidade de ${product.name}`);

        const count = createElement("span", "", String(quantity));
        count.setAttribute("aria-label", `${quantity} unidades`);

        const increase = createElement("button", "", "+");
        increase.type = "button";
        increase.dataset.plus = id;
        increase.setAttribute("aria-label", `Adicionar uma unidade de ${product.name}`);
        controls.append(decrease, count, increase);
        item.append(details, controls);
        cartItems.append(item);
      });
    }

    $("#cartCount").textContent = String(getCartCount());
    const itemCount = getCartCount();
    $("#cartBtn").setAttribute(
      "aria-label",
      `Abrir pedido com ${itemCount} ${itemCount === 1 ? "item" : "itens"}`
    );
    $("#cartTotal").textContent = money(getTotal());
    $("#checkoutBtn").disabled = entries.length === 0;
  }

  function render() {
    renderProducts();
    renderCart();
    $("#favoritesBtn").setAttribute(
      "aria-pressed",
      String(state.showFavorites)
    );
    $$("#filters [data-cat]").forEach((button) => {
      button.classList.toggle(
        "active",
        !state.showFavorites && button.dataset.cat === state.category
      );
    });
  }

  function updateCart(nextCart) {
    if (!writeStoredValue("cardapio-cart", nextCart)) return false;
    state.cart = nextCart;
    render();
    return true;
  }

  function updateFavorites(nextFavorites) {
    if (
      !writeStoredValue("cardapio-favorites", [...nextFavorites])
    ) {
      return;
    }
    state.favorites = nextFavorites;
    render();
  }

  function getProfileInputId(field, prefix = "") {
    const [, suffix] = profileFields.find(([name]) => name === field);
    return prefix ? `${prefix}${suffix}` : field;
  }

  function fillProfileFields(prefix, profile) {
    profileFields.forEach(([field]) => {
      const input = $(`#${getProfileInputId(field, prefix)}`);
      input.value = profile[field] || "";
    });
  }

  function collectProfileFields(prefix) {
    return Object.fromEntries(
      profileFields.map(([field]) => [
        field,
        $(`#${getProfileInputId(field, prefix)}`).value.trim(),
      ])
    );
  }

  function setDrawerView(title, eyebrow, view) {
    if ($("#overlay").classList.contains("hidden")) {
      state.previousFocus = document.activeElement;
    }
    $("#drawerTitle").textContent = title;
    $("#drawerEyebrow").textContent = eyebrow;
    $("#cartView").classList.toggle("hidden", view !== "cart");
    $("#accountView").classList.toggle("hidden", view !== "account");
    $("#checkoutForm").classList.toggle("hidden", view !== "checkout");
    $("#success").classList.toggle("hidden", view !== "success");
    $("#overlay").classList.remove("hidden");
    $("#closeBtn").focus();
  }

  function closeDrawer() {
    $("#overlay").classList.add("hidden");
    if (state.previousFocus instanceof HTMLElement) {
      state.previousFocus.focus();
    }
  }

  function openCart() {
    setDrawerView("Seu pedido", "Só falta finalizar", "cart");
  }

  function openAccount() {
    fillProfileFields("profile", state.profile);
    setDrawerView(
      "Minha conta",
      "Seus dados para a próxima entrega",
      "account"
    );
  }

  function openCheckout() {
    fillProfileFields("", state.profile);
    setDrawerView("Seu pedido", "Só falta finalizar", "checkout");
    $("#formTotal").textContent = money(getTotal());
  }

  function handleProductClick(event) {
    const addButton = event.target.closest("[data-add]");
    if (addButton) {
      const id = Number(addButton.dataset.add);
      const nextCart = { ...state.cart };
      nextCart[id] = (nextCart[id] || 0) + 1;
      if (updateCart(nextCart)) showToast("Item adicionado!");
      return;
    }

    const favoriteButton = event.target.closest("[data-favorite]");
    if (!favoriteButton) return;

    const id = Number(favoriteButton.dataset.favorite);
    const nextFavorites = new Set(state.favorites);
    if (nextFavorites.has(id)) nextFavorites.delete(id);
    else nextFavorites.add(id);
    updateFavorites(nextFavorites);
  }

  function handleCartClick(event) {
    const decreaseButton = event.target.closest("[data-minus]");
    const increaseButton = event.target.closest("[data-plus]");
    const button = decreaseButton || increaseButton;
    if (!button) return;

    const id = Number(button.dataset.minus || button.dataset.plus);
    const quantity = (state.cart[id] || 0) + (decreaseButton ? -1 : 1);
    const nextCart = { ...state.cart };
    if (quantity > 0) nextCart[id] = quantity;
    else delete nextCart[id];
    updateCart(nextCart);
  }

  function setCategory(category) {
    state.showFavorites = false;
    state.category = category;
    render();
  }

  function formatCepInput(input, statusId) {
    const value = input.value.replace(/\D/g, "").slice(0, 8);
    input.value = value.replace(/(\d{5})(\d)/, "$1-$2");
    cepLookupIds.set(input, (cepLookupIds.get(input) || 0) + 1);
    lastCepLookups.delete(input);
    $(`#${statusId}`).textContent = "";
  }

  async function completeAddressFromCep(input, prefix, statusId) {
    const digits = input.value.replace(/\D/g, "");
    const status = $(`#${statusId}`);
    if (digits.length !== 8) {
      status.textContent = "Digite 8 números.";
      return;
    }
    if (lastCepLookups.get(input) === digits) return;

    const lookupId = (cepLookupIds.get(input) || 0) + 1;
    cepLookupIds.set(input, lookupId);
    lastCepLookups.set(input, digits);
    status.textContent = "Buscando...";

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${digits}/json/`
      );
      if (!response.ok) {
        throw new Error(`Consulta ViaCEP falhou: ${response.status}`);
      }
      const address = await response.json();
      if (
        cepLookupIds.get(input) !== lookupId ||
        input.value.replace(/\D/g, "") !== digits
      ) {
        return;
      }
      if (address.erro) {
        status.textContent = "CEP não encontrado. Preencha manualmente.";
        return;
      }
      if (
        typeof address.cep !== "string" ||
        address.cep.replace(/\D/g, "") !== digits
      ) {
        status.textContent =
          "O endereço retornado não corresponde ao CEP informado. Confira o número e tente novamente.";
        return;
      }

      const addressFields = {
        street: address.logradouro,
        district: address.bairro,
        city: address.localidade,
        uf: address.uf,
        complement: address.complemento,
      };
      Object.entries(addressFields).forEach(([field, value]) => {
        const inputId = prefix
          ? `${prefix}${field[0].toUpperCase()}${field.slice(1)}`
          : field;
        $(`#${inputId}`).value = value || "";
      });
      status.textContent = "Endereço encontrado.";
    } catch (error) {
      if (cepLookupIds.get(input) !== lookupId) return;
      lastCepLookups.delete(input);
      console.error("Não foi possível consultar o CEP no ViaCEP.", error);
      status.textContent =
        "Não foi possível consultar o CEP. Preencha o endereço manualmente.";
    }
  }

  function handleCepInput(input, prefix, statusId) {
    formatCepInput(input, statusId);
    if (input.value.replace(/\D/g, "").length === 8) {
      completeAddressFromCep(input, prefix, statusId);
    }
  }

  function parseCash() {
    return Number($("#cashPaid").value.replace(".", "").replace(",", ".")) || 0;
  }

  function updateChange() {
    const change = parseCash() - getTotal();
    const changeElement = $("#change");
    changeElement.textContent = money(Math.max(0, change));
    changeElement.style.color = change < 0 ? "#b42318" : "#166534";
  }

  function formatOrderAddress() {
    const street = $("#street").value;
    const number = $("#number").value;
    const complement = $("#complement").value;
    const district = $("#district").value;
    const city = $("#city").value;
    const uf = $("#uf").value;
    const cep = $("#cep").value;
    return `${street}, ${number}${complement ? ` - ${complement}` : ""}, ${district}, ${city}/${uf}, CEP ${cep}`;
  }

  function createOrderSummary(payment) {
    const items = Object.entries(state.cart)
      .map(([id, quantity]) => {
        const product = productById.get(Number(id));
        return `${quantity}x ${product.name} - ${money(
          product.price * quantity
        )}`;
      })
      .join("\n");
    const paymentDetails =
      payment === "Dinheiro"
        ? `${payment}, paga ${money(parseCash())}, troco ${money(
            parseCash() - getTotal()
          )}`
        : payment;

    return `PEDIDO - SABOR DA CASA\n\n${items}\n\nTOTAL: ${money(
      getTotal()
    )}\nCLIENTE: ${$("#name").value}\nTELEFONE: ${
      $("#phone").value
    }\nENTREGA: ${formatOrderAddress()}\nPAGAMENTO: ${paymentDetails}\nOBSERVAÇÕES: ${
      $("#notes").value || "Nenhuma"
    }`;
  }

  function handleCheckoutSubmit(event) {
    event.preventDefault();
    const payment = $('[name="payment"]:checked')?.value;
    if (!payment) {
      showToast("Selecione uma forma de pagamento.");
      return;
    }
    if (payment === "Dinheiro" && parseCash() < getTotal()) {
      showToast("O valor em dinheiro é menor que o total.");
      $("#cashPaid").focus();
      return;
    }

    state.orderSummary = createOrderSummary(payment);
    const whatsappNumber = "5511925975097";
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      state.orderSummary
    )}`;
    $("#whatsappBtn").href = whatsappUrl;
    $("#orderText").textContent = state.orderSummary;
    $("#drawerTitle").textContent = "Seu pedido";
    $("#drawerEyebrow").textContent = "Só falta finalizar";
    $("#checkoutForm").classList.add("hidden");
    $("#success").classList.remove("hidden");
    $("#closeBtn").focus();
  }

  async function copyOrderSummary() {
    try {
      await navigator.clipboard.writeText(state.orderSummary);
      showToast("Resumo copiado!");
    } catch (error) {
      console.error("Não foi possível copiar o resumo do pedido.", error);
      showToast("Não foi possível copiar. Selecione e copie o resumo.");
    }
  }

  function resetOrder() {
    if (!updateCart({})) return;
    $("#checkoutForm").reset();
    $("#cashBox").classList.add("hidden");
    $("#cashPaid").required = false;
    $("#success").classList.add("hidden");
    $("#cartView").classList.remove("hidden");
    $("#drawerTitle").textContent = "Seu pedido";
    $("#drawerEyebrow").textContent = "Só falta finalizar";
  }

  function bindEvents() {
    $("#products").addEventListener("click", handleProductClick);
    $("#cartItems").addEventListener("click", handleCartClick);

    $("#filters").addEventListener("click", (event) => {
      const button = event.target.closest("#filters [data-cat]");
      if (button) setCategory(button.dataset.cat);
    });
    $("#bottomMenuBtn").addEventListener("click", () => {
      state.showFavorites = false;
      render();
    });
    $("#favoritesBtn").addEventListener("click", () => {
      state.showFavorites = true;
      render();
      $("#cardapio").scrollIntoView();
    });
    $("#cartBtn").addEventListener("click", openCart);
    $("#accountBtn").addEventListener("click", openAccount);
    $("#closeBtn").addEventListener("click", closeDrawer);
    $("#overlay").addEventListener("click", (event) => {
      if (event.target === $("#overlay")) closeDrawer();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !$("#overlay").classList.contains("hidden")) {
        closeDrawer();
      }
    });

    $("#checkoutBtn").addEventListener("click", openCheckout);
    $("#backBtn").addEventListener("click", openCart);
    $("#profileCep").addEventListener("input", (event) =>
      handleCepInput(event.target, "profile", "profileCepStatus")
    );
    $("#profileCep").addEventListener("blur", (event) =>
      completeAddressFromCep(
        event.target,
        "profile",
        "profileCepStatus"
      )
    );
    $("#cep").addEventListener("input", (event) =>
      handleCepInput(event.target, "", "cepStatus")
    );
    $("#cep").addEventListener("blur", (event) =>
      completeAddressFromCep(event.target, "", "cepStatus")
    );

    $("#accountView").addEventListener("submit", (event) => {
      event.preventDefault();
      const updatedProfile = collectProfileFields("profile");
      if (!writeStoredValue("cardapio-customer", updatedProfile)) return;
      state.profile = updatedProfile;
      showToast("Dados da conta salvos neste dispositivo.");
    });
    $$('[name="payment"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        const cashSelected = $('[name="payment"]:checked')?.value === "Dinheiro";
        $("#cashBox").classList.toggle("hidden", !cashSelected);
        $("#cashPaid").required = cashSelected;
        updateChange();
      });
    });
    $("#cashPaid").addEventListener("input", updateChange);
    $("#checkoutForm").addEventListener("submit", handleCheckoutSubmit);
    $("#copyBtn").addEventListener("click", copyOrderSummary);
    $("#newOrderBtn").addEventListener("click", resetOrder);
    $("#footerCartBtn").addEventListener("click", openCart);
    $("#installAppBtn").addEventListener("click", handleInstallClick);
  }

  function handleInstallPrompt(event) {
    event.preventDefault();
    state.installPrompt = event;
  }

  async function handleInstallClick() {
    if (!state.installPrompt) {
      const isAppleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent);
      showToast(
        isAppleMobile
          ? "Para instalar, toque em Compartilhar e depois em Adicionar à Tela de Início."
          : "A instalação não está disponível agora. Use a opção Instalar aplicativo no menu do navegador."
      );
      return;
    }

    const prompt = state.installPrompt;
    state.installPrompt = null;
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") showToast("Aplicativo instalado!");
    } catch (error) {
      console.error("Não foi possível abrir a instalação do aplicativo.", error);
      showToast("Não foi possível iniciar a instalação. Tente pelo menu do navegador.");
    }
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./service-worker.js")
        .catch((error) => {
          console.error("Não foi possível registrar o service worker.", error);
        });
    });
  }

  function initialize() {
    bindEvents();
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", () => {
      state.installPrompt = null;
      showToast("Aplicativo instalado!");
    });
    registerServiceWorker();
    render();
  }

  initialize();
})();
