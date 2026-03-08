/* =========================================
   SYSTEM: Event Bus
   Description: Custom event communication
   ========================================= */

/** ⚙️ Action: Emit custom event */
/** ?? Action */
export const emit = (eventName, detail = null, target = document) => {
    const event = new CustomEvent(eventName, {
        detail,
        bubbles: true,
        cancelable: true
    });
    target.dispatchEvent(event);
};

/** ⚙️ Action: Listen for custom event */
/** ?? Action */
export const listen = (eventName, handler, target = document) => {
    target.addEventListener(eventName, handler);
    return () => target.removeEventListener(eventName, handler);
};

/** 🔧 Core: Event Bus class */
export class EventBus {
    static emit = emit;
    static listen = listen;
}
