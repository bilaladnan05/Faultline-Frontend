let show;

export function showToast(message) {
  show?.(message);
}

export function setToastHandler(handler) {
  show = handler;
}
