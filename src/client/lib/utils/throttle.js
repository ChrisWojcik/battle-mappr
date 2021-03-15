import debounce from './debounce';

// lodash's throttle function
function throttle(func, wait, options = {}) {
  let leading = true,
    trailing = true;

  leading = 'leading' in options ? !!options.leading : leading;
  trailing = 'trailing' in options ? !!options.trailing : trailing;

  return debounce(func, wait, {
    leading: leading,
    maxWait: wait,
    trailing: trailing,
  });
}

export default throttle;
