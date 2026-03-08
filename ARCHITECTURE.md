# ÆTHER FORGE - Architecture Documentation

> Detailed architecture, design decisions, and naked logic principles for the v2 codebase.

---

## 🏛️ Laws of the Codebase

### Law #1: Naked Logic Mandate

**All code must follow naked logic principles - zero defensive programming.**

#### Forbidden Patterns
```javascript
// ❌ FORBIDDEN: try/catch blocks
try {
    doSomething();
} catch (error) {
    handleError(error);
}

// ❌ FORBIDDEN: Null checks
if (element) {
    element.classList.add('active');
}

// ❌ FORBIDDEN: Validation guards
if (!data || data.length === 0) return;

// ❌ FORBIDDEN: "Just in case" logic
const value = data?.property ?? defaultValue;
```

#### Required Patterns
```javascript
// ✅ REQUIRED: Direct execution
doSomething();

// ✅ REQUIRED: Trust elements exist
element.classList.add('active');

// ✅ REQUIRED: Assume valid data
data.forEach(item => process(item));

// ✅ REQUIRED: Direct access
const value = data.property;
```

### Law #2: Universal Comment Standards

**All functions must have emoji-prefixed descriptions.**

```javascript
/** ⚙️ Action: Perform operation */
/** 🔍 Query: Retrieve data */
/** 🎨 Render: Update UI */
/** 🔧 Core: System function */
/** 🪵 Logger: Log message */
/** 🌐 Query: Network request */
/** 🔒 Security: Auth check */
```

### Law #3: Module Organization

**Strict layer separation with clear responsibilities.**

1. **Core** - Foundation (state, config, logger, constants)
2. **Systems** - Cross-cutting (events, i18n, inventory, notifications)
3. **Services** - Business logic (auth, cart, checkout, points)
4. **Features** - UI components (panels, modals, cards)
5. **Utils** - Helpers (formatting, translation, modals)

### Law #4: Logger Integration

**All significant operations must be logged.**

```javascript
Logger.log('SYSTEM', 'Operation description', data);
Logger.warn('SYSTEM', 'Warning message', context);
Logger.error('SYSTEM', 'Error message', error);
```

---

## 🎯 Architectural Patterns

### State Management

**Centralized state with direct access.**

```javascript
// core/state.js
const appState = {
    user: null,
    cart: [],
    wishlist: [],
    // ...
};

export const getState = (key) => appState[key];
export const setState = (key, value) => {
    appState[key] = value;
};
```

**Usage:**
```javascript
import { getState, setState } from './core/state.js';

// Direct access - no null checks
const cart = getState('cart');
cart.push(item);
setState('cart', cart);
```

### Event Communication

**Event bus for cross-module communication.**

```javascript
// Publish event
EventBus.emit('cart:updated', { itemCount: 5 });

// Subscribe to event
EventBus.on('cart:updated', (data) => {
    updateCartBadge(data.itemCount);
});
```

### Service Layer Pattern

**Services encapsulate business logic.**

```javascript
// services/cart-service.js
export const CartService = {
    addItem(productId, quantity) {
        const cart = getState('cart');
        cart.push({ productId, quantity });
        setState('cart', cart);
        EventBus.emit('cart:updated');
        Logger.log('CART', 'Item added', { productId, quantity });
    }
};
```

### Feature Initialization

**Features initialize on DOMContentLoaded.**

```javascript
// features/cart-panel.js
export const initCartPanel = () => {
    const cartPanel = document.getElementById('cart-panel');
    const cartBtn = document.getElementById('cart-btn');
    
    cartBtn.addEventListener('click', () => {
        PanelManager.open('cart');
    });
    
    updateCartUI();
};
```

---

## 📊 Data Flow

### User Action → Service → State → UI Update

```
1. User clicks "Add to Cart"
   ↓
2. Event handler calls CartService.addItem()
   ↓
3. Service updates state via setState()
   ↓
4. Service emits 'cart:updated' event
   ↓
5. UI components listen and re-render
   ↓
6. Logger records operation
```

### Example Flow: Adding to Cart

```javascript
// 1. User clicks button (features/product-grid.js)
cartBtn.addEventListener('click', () => {
    addItemToCart(productId, cartBtn);
});

// 2. Feature calls service (features/cart-panel.js)
export const addItemToCart = (productId, button) => {
    CartService.addItem(productId, 1);
    NotificationSystem.showToast('Added to cart!', 'success');
};

// 3. Service updates state (services/cart-service.js)
addItem(productId, quantity) {
    const cart = getState('cart');
    cart.push({ productId, quantity, timestamp: Date.now() });
    setState('cart', cart);
    EventBus.emit('cart:updated');
    Logger.log('CART', 'Item added', { productId, quantity });
}

// 4. UI updates (features/cart-panel.js)
EventBus.on('cart:updated', () => {
    updateCartUI();
});
```

---

## 🎨 CSS Architecture

### Modular Structure

```
styles/
├── variables.css       # CSS custom properties
├── base.css            # Reset and base styles
├── layout.css          # Layout utilities
├── animations.css      # Animation definitions
├── z-index.css         # Z-index management
├── main.css            # Import orchestrator
└── components/         # Component-specific styles
    ├── navbar.css
    ├── buttons.css
    ├── cards.css
    ├── modals.css
    └── ... (14 total)
```

### Import Order (main.css)

```css
/* 1. Foundation Layer */
@import './variables.css';
@import './z-index.css';
@import './base.css';

/* 2. Layout Layer */
@import './layout.css';

/* 3. Component Layer */
@import './components/navbar.css';
@import './components/buttons.css';
/* ... */

/* 4. Utilities & Animations */
@import './animations.css';
```

### CSS Custom Properties

```css
:root {
    /* Colors */
    --accent-primary: #3b82f6;
    --accent-secondary: #8b5cf6;
    --bg-primary: #ffffff;
    --text-primary: #1f2937;
    
    /* Spacing */
    --spacing-sm: 0.8rem;
    --spacing-md: 1.6rem;
    --spacing-lg: 2.4rem;
    
    /* Transitions */
    --transition-fast: 0.15s ease;
    --transition-normal: 0.3s ease;
}
```

---

## 🔧 Core Systems

### Logger System

**Centralized logging with emoji categories.**

```javascript
// core/logger.js
export const Logger = {
    enabled: localStorage.getItem('AETHER_DEBUG') !== 'false',
    
    SYSTEMS: {
        CORE: 'CORE',
        AUTH: 'AUTH',
        CART: 'CART',
        POINTS: 'POINTS',
        UI: 'UI',
        NETWORK: 'NETWORK',
        INVENTORY: 'INVENTORY',
        CHECKOUT: 'CHECKOUT'
    },
    
    log(system, message, data) {
        if (!this.enabled) return;
        console.log(`%c[${system}] ${message}`, 'color: #3b82f6; font-weight: bold;', data);
    }
};
```

**Features:**
- ✅ localStorage persistence
- ✅ Interaction tracking (all clicks)
- ✅ Global API (window.AetherDebug)
- ✅ Color-coded output
- ✅ Grouped logs for complex data

### State Management

**Simple, direct state access.**

```javascript
// core/state.js
const appState = {
    user: null,
    cart: [],
    wishlist: [],
    favorites: [],
    inventorySource: [],
    language: 'en',
    currency: 'USD',
    theme: 'light'
};

export const getState = (key) => appState[key];
export const setState = (key, value) => {
    appState[key] = value;
    document.dispatchEvent(new CustomEvent(`state:${key}Changed`, { detail: value }));
};
```

### Event Bus

**Decoupled communication between modules.**

```javascript
// systems/event-bus.js
export const EventBus = {
    events: {},
    
    on(event, callback) {
        this.events[event] = this.events[event] || [];
        this.events[event].push(callback);
    },
    
    emit(event, data) {
        const callbacks = this.events[event];
        callbacks.forEach(cb => cb(data));
    }
};
```

---

## 🎯 Design Decisions

### Why Naked Logic?

1. **Clarity** - Code is easier to read without defensive clutter
2. **Performance** - No overhead from try/catch or null checks
3. **Debugging** - Errors surface immediately at their source
4. **Trust** - Forces proper architecture and data flow

### Why No Frameworks?

1. **Control** - Full control over every line of code
2. **Performance** - No framework overhead
3. **Learning** - Better understanding of web fundamentals
4. **Simplicity** - No build tools or complex setups

### Why Modular CSS?

1. **Maintainability** - Easy to find and update styles
2. **Performance** - Only load what's needed
3. **Organization** - Clear separation of concerns
4. **Scalability** - Easy to add new components

### Why Logger Integration?

1. **Debugging** - Comprehensive operation tracking
2. **Monitoring** - Production issue diagnosis
3. **Development** - Understanding data flow
4. **Documentation** - Self-documenting code behavior

---

## 📊 Module Dependencies

### Core Layer (No Dependencies)
- `state.js` - Foundation
- `config.js` - Constants
- `constants.js` - App constants
- `logger.js` - Logging
- `authguard.js` - Auth check

### Systems Layer (Depends on Core)
- `event-bus.js` → None
- `i18n-engine.js` → config, constants
- `inventory-engine.js` → state, logger
- `notification-engine.js` → logger

### Services Layer (Depends on Core + Systems)
- `auth-service.js` → state, storage, logger
- `cart-service.js` → state, storage, event-bus, logger
- `checkout-service.js` → state, cart, points, logger
- `points-service.js` → state, storage, logger
- `wishlist-service.js` → state, storage, event-bus, logger

### Features Layer (Depends on All)
- All features depend on services, systems, and core
- Features are independent of each other
- Communication via event-bus or global events

---

## 🚀 Performance Optimizations

1. **No Defensive Code** - Zero overhead from checks
2. **Direct DOM Access** - Assumes elements exist
3. **Event Delegation** - Efficient event handling
4. **Modular CSS** - Load only what's needed
5. **Lazy Loading** - Load data on demand
6. **No Framework** - No framework overhead

---

## 📝 Development Workflow

### Adding a New Feature

1. Create file in `features/`
2. Follow naked logic principles
3. Add emoji-prefixed comments
4. Use Logger for operations
5. Emit events for cross-feature communication
6. Initialize in `main.js`

### Adding a New Service

1. Create file in `services/`
2. Export service object with methods
3. Use state management for data
4. Emit events for updates
5. Add logger calls
6. Import in features that need it

### Adding Styles

1. Create file in `styles/components/`
2. Use CSS custom properties
3. Follow BEM naming if applicable
4. Import in `styles/main.css`
5. Test in both themes

---

## 🎯 Future Considerations

- **Logger Expansion** - Add to remaining 26 files
- **Testing** - Add unit tests (without breaking naked logic)
- **Performance Monitoring** - Track key metrics
- **Error Boundaries** - Strategic error handling at app level
- **Documentation** - Expand inline documentation

---

**Built with naked logic principles for maximum clarity and performance.**
