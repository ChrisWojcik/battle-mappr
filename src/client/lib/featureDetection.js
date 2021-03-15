let passiveEventListeners = false;

try {
  const options = {
    get passive() {
      // This function will be called when the browser
      //   attempts to access the passive property.
      passiveEventListeners = true;
      return false;
    },
  };

  window.addEventListener('test', null, options);
  window.removeEventListener('test', null, options);
} catch (err) {
  passiveEventListeners = false;
}

const SUPPORTS = {
  passiveEventListeners,
};

export default SUPPORTS;
