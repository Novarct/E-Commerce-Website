# ÆTHER FORGE - E-Commerce Platform v2

> A modern, high-performance e-commerce platform built with naked logic principles and modular architecture.

---

## 🚀 Quick Start

```bash
# Open the application
open v2/index.html

# View component library
open v2/library.html

# Enable debug mode (in browser console)
window.AetherDebug.enable()
```

---

## 📁 Project Structure

```
v2/
├── core/               # Core systems (5 files)
│   ├── state.js        # Global state management
│   ├── config.js       # Configuration constants
│   ├── constants.js    # Application constants
│   ├── logger.js       # Centralized logging
│   └── authguard.js    # Authentication guard
│
├── systems/            # System engines (4 files)
│   ├── event-bus.js    # Event communication
│   ├── i18n-engine.js  # Internationalization
│   ├── inventory-engine.js  # Product inventory
│   └── notification-engine.js  # Toast notifications
│
├── services/           # Business logic (11 files)
│   ├── auth-service.js
│   ├── cart-service.js
│   ├── checkout-service.js
│   ├── localization-service.js
│   ├── panel-manager.js
│   ├── points-service.js
│   ├── product-service.js
│   ├── scroll-service.js
│   ├── storage-service.js
│   └── wishlist-service.js
│
├── features/           # UI components (18 files)
│   ├── account-panel.js
│   ├── auth-modal.js
│   ├── cart-panel.js
│   ├── checkout-modal.js
│   ├── favorites-panel.js
│   ├── hero-carousel.js
│   ├── history-panel.js
│   ├── mobile-menu.js
│   ├── product-card.js
│   ├── product-grid.js
│   ├── quick-view-modal.js
│   ├── scroll-animation.js
│   ├── search-filter.js
│   ├── theme-toggle.js
│   ├── top-bar.js
│   ├── trading-shop.js
│   ├── translation-manager.js
│   └── wishlist-panel.js
│
├── utils/              # Utilities (1 file)
│   └── helpers.js      # Common helper functions
│
├── styles/             # Modular CSS (20 files)
│   ├── variables.css   # CSS custom properties
│   ├── base.css        # Reset and base styles
│   ├── layout.css      # Layout utilities
│   ├── animations.css  # Animation definitions
│   ├── z-index.css     # Z-index management
│   ├── main.css        # Main import orchestrator
│   └── components/     # Component-specific styles (14 files)
│
├── assets/             # Static assets
├── index.html          # Main application
├── library.html        # Component showcase
└── main.js             # Application entry point
```

**Total:** 59 files (39 JS + 20 CSS)

---

## 🎯 Architecture Principles

### Naked Logic Philosophy

This codebase follows **naked logic** principles - a radical approach that eliminates defensive programming:

#### ✅ What We Do
- **Direct execution** - Code assumes valid states
- **Trust the flow** - No "just in case" checks
- **Fail fast** - Errors surface immediately
- **Clean code** - No clutter from defensive patterns

#### ❌ What We Don't Do
- ~~No try/catch blocks~~ (0 in entire codebase)
- ~~No null checks~~ (trust data exists)
- ~~No validation guards~~ (assume valid input)
- ~~No defensive conditionals~~ (direct access)

### Why Naked Logic?

1. **Cleaner Code** - Easier to read and maintain
2. **Better Debugging** - Errors are obvious and immediate
3. **Performance** - No overhead from defensive checks
4. **Trust** - Forces proper data flow design

---

## 🔧 Development Guidelines

### Comment Standards

All code uses **universal comment standards** with emoji markers:

```javascript
/* =========================================
   SYSTEM: Module Name
   Description: What this module does
   ========================================= */

/** ⚙️ Action: Perform operation */
function doSomething() { }

/** 🔍 Query: Get data */
function getData() { }

/** 🎨 Render: Update UI */
function renderUI() { }

/** 🔧 Core: System function */
function coreSystem() { }

/** 🪵 Logger: Log message */
Logger.log('SYSTEM', 'message');
```

### Logger Integration

Debug mode is **enabled by default**. Use the logger for all operations:

```javascript
import { Logger } from './core/logger.js';

// Log operations
Logger.log('CART', 'Item added', { productId, quantity });
Logger.warn('AUTH', 'Session expiring', { timeLeft });
Logger.error('CHECKOUT', 'Payment failed', error);

// Control logging
window.AetherDebug.enable();   // Turn on
window.AetherDebug.disable();  // Turn off
```

### Module Organization

1. **Core** - Foundation systems (state, config, logger)
2. **Systems** - Cross-cutting concerns (events, i18n, inventory)
3. **Services** - Business logic (auth, cart, checkout)
4. **Features** - UI components (panels, modals, cards)
5. **Utils** - Helper functions (formatting, translation)

---

## 🎨 Features

### E-Commerce Functionality
- ✅ Product catalog with search and filters
- ✅ Shopping cart with quantity management
- ✅ Wishlist / favorites system
- ✅ User authentication (login/signup)
- ✅ Checkout flow with shipping options
- ✅ Points/rewards system
- ✅ Order history tracking
- ✅ Coupon system

### UI/UX Features
- ✅ Dark/light theme switching
- ✅ Multi-language support (EN, FR, ES, DE, IT, PT, AR, ZH, JA)
- ✅ Multi-currency support (USD, EUR, GBP, JPY, CNY)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Smooth animations and transitions
- ✅ Toast notifications
- ✅ Hero carousel
- ✅ Quick view modals
- ✅ Scroll animations

---

## 📚 Component Library

View all UI components in isolation at `library.html`:

- **Cards:** Product, cart item, wishlist item, history item, order, coupon
- **Buttons:** Primary, secondary, icon buttons
- **Notifications:** Success, error, info toasts
- **Forms:** Text inputs, checkboxes, radios

---

## 🔍 Debugging

### Enable Debug Mode
```javascript
// In browser console
window.AetherDebug.enable();
```

### View Logs
All operations are logged with color-coded prefixes:
- `[AUTH]` - Authentication operations
- `[CART]` - Shopping cart operations
- `[CHECKOUT]` - Checkout flow
- `[POINTS]` - Points system
- `[INVENTORY]` - Product inventory
- `[INTERACTION]` - User clicks (purple)

### Disable Logging
```javascript
window.AetherDebug.disable();
```

---

## 🎯 Code Quality

- ✅ **0 try/catch blocks** (verified)
- ✅ **200+ emoji markers** for clarity
- ✅ **Universal comment standards** throughout
- ✅ **Modular CSS** with clear separation
- ✅ **33% logger coverage** (13/39 files)

---

## 📖 Documentation

- **README.md** - This file (quick start and overview)
- **ARCHITECTURE.md** - Detailed architecture and design decisions
- **library.html** - Visual component reference
- **task.md** - Development task tracking
- **walkthrough.md** - Complete development history

---

## 🚀 Performance

- **Naked logic** - No defensive overhead
- **Direct DOM access** - Assumes elements exist
- **Modular CSS** - Only load what's needed
- **Event delegation** - Efficient event handling
- **Lazy loading** - Load data on demand

---

## 🛠️ Tech Stack

- **Vanilla JavaScript** - No frameworks, pure ES6+
- **CSS3** - Modern CSS with custom properties
- **HTML5** - Semantic markup
- **Font Awesome** - Icon library
- **Google Fonts** - Typography (Be Vietnam Pro)

---

## 📝 License

Proprietary - ÆTHER FORGE E-Commerce Platform

---

## 👥 Development

Built with naked logic principles and modular architecture for maximum clarity and performance.

**Debug Mode:** Enabled by default  
**Logger Coverage:** 33% (13/39 files)  
**Code Quality:** Zero defensive coding