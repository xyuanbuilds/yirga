/* eslint-disable @typescript-eslint/no-explicit-any */
export function addEvent(
  el: Element,
  event: string,
  listener: EventListener,
  inputOptions?: EventListenerOptions,
): void {
  if (!el) return;
  const options = { capture: true, ...inputOptions };
  if (el.addEventListener) {
    el.addEventListener(event, listener, options);
    /* @ts-ignore */
  } else if (el.attachEvent) {
    /* @ts-ignore */
    el.attachEvent(`on${event}`, listener);
  } else {
    el[`on${event}`] = listener;
  }
}

export function removeEvent(
  el: Element,
  event: string,
  handler: EventListener,
  inputOptions?: EventListenerOptions,
): void {
  if (!el) return;
  const options = { capture: true, ...inputOptions };
  if (el.removeEventListener) {
    el.removeEventListener(event, handler, options);
    /* @ts-ignore */
  } else if (el.detachEvent) {
    /* @ts-ignore */
    el.detachEvent(`on${event}`, handler);
  } else {
    el[`on${event}`] = null;
  }
}

export function isNum(num: any): boolean {
  return typeof num === 'number' && !isNaN(num);
}

export function int(a: string): number {
  return parseInt(a, 10);
}

export function getOuterHeight(node: HTMLElement): number {
  // This is deliberately excluding margin for our calculations, since we are using
  // offsetTop which is including margin. See getBoundPosition
  let height = node.clientHeight;
  const computedStyle = window.getComputedStyle(node);
  height += int(computedStyle.borderTopWidth);
  height += int(computedStyle.borderBottomWidth);
  return height;
}

export function getOuterWidth(node: HTMLElement): number {
  // This is deliberately excluding margin for our calculations, since we are using
  // offsetLeft which is including margin. See getBoundPosition
  let width = node.clientWidth;
  const computedStyle = window.getComputedStyle(node);
  width += int(computedStyle.borderLeftWidth);
  width += int(computedStyle.borderRightWidth);
  return width;
}
export function getInnerHeight(node: HTMLElement): number {
  let height = node.clientHeight;
  const computedStyle = window.getComputedStyle(node);
  height -= int(computedStyle.paddingTop);
  height -= int(computedStyle.paddingBottom);
  return height;
}

export function getInnerWidth(node: HTMLElement): number {
  let width = node.clientWidth;
  const computedStyle = window.getComputedStyle(node);
  width -= int(computedStyle.paddingLeft);
  width -= int(computedStyle.paddingRight);
  return width;
}
