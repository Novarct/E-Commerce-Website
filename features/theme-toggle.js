/* =========================================
   FEATURE: Theme Toggle
   Description: Dark/light theme switching
   ========================================= */

let isInitialized = false;
const elements = {};

/** ⚙️ Action: Initialize theme toggle */
/** ?? Action */
/** ?? Core */
export const initThemeToggle = () => {
    if (isInitialized) return;

    elements.toggleBtn = document.getElementById('theme-toggle');
    elements.logoLight = document.getElementById('logo-light');
    elements.logoDark = document.getElementById('logo-dark');

    const currentTheme = localStorage.getItem('theme') || 'light';
    applyTheme(currentTheme);

    bindEvents();

    isInitialized = true;
};

/** 🔧 Core: Bind events */
const bindEvents = () => {
    elements.toggleBtn.addEventListener('click', handleToggleClick);
};

/** 🔧 Core: Handle toggle click */
const handleToggleClick = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
};

/** ⚙️ Action: Apply theme */
const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);

    elements.toggleBtn.innerHTML = theme === 'dark'
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';

    elements.logoLight.style.display = theme === 'dark' ? 'none' : 'block';
    elements.logoDark.style.display = theme === 'dark' ? 'block' : 'none';
};
