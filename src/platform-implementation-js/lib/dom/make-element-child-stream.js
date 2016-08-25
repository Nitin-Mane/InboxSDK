/* @flow */

import _ from 'lodash';
import asap from 'asap';
import logger from '../logger';
import Kefir from 'kefir';
import kefirStopper from 'kefir-stopper';

export type ItemWithLifetime<T> = {el: T, removalStream: Kefir.Stream<any>};
export type ElementWithLifetime = ItemWithLifetime<HTMLElement>;

// Emits events whenever the given element has any children added or removed.
// Also when first listened to, it emits events for existing children.
export default function makeElementChildStream(element: HTMLElement): Kefir.Stream<ElementWithLifetime> {
  if (!element || !element.nodeType) {
    throw new Error("Expected element, got "+String(element));
  }

  return Kefir.stream((emitter) => {
    const removalStreams: Map<HTMLElement, Object> = new Map();
    let ended = false;

    function newEl(el: HTMLElement) {
      if (el.nodeType !== 1) return;
      const removalStream = kefirStopper();
      removalStreams.set(el, removalStream);
      emitter.emit({el, removalStream});
    }

    function removedEl(el: HTMLElement) {
      if (el.nodeType !== 1) return;
      const removalStream = removalStreams.get(el);
      removalStreams.delete(el);

      if(removalStream){
        removalStream.destroy();
      } else {
        logger.error(new Error("Could not find removalStream for element with class "+el.className));
      }
    }

    const observer = new MutationObserver(mutations => {
      // Some elements might have been added and removed in the same mutations
      // set, so we want to ignore the elements that were already re-added or
      // removed.
      for (let i=0, len=mutations.length; i<len; i++) {
        const mutation = mutations[i];
        for (let i=0, len=mutation.addedNodes.length; i<len; i++) {
          const el: HTMLElement = (mutation.addedNodes[i]:any);
          if (el.parentElement === element && !removalStreams.has(el)) {
            newEl(el);
          }
        }
        for (let i=0, len=mutation.removedNodes.length; i<len; i++) {
          const el: HTMLElement = (mutation.removedNodes[i]:any);
          if (el.parentElement !== element && removalStreams.has(el)) {
            removedEl(el);
          }
        }
      }
    });

    // We don't want to emit the start children synchronously before all
    // stream listeners are subscribed.
    asap(() => {
      if (!ended) {
        observer.observe(element, ({childList: true}: any));
        // Clone child list first because it can change
        Array.prototype.slice.call(element.children).forEach(newEl);
      }
    });

    return function() {
      ended = true;
      observer.disconnect();
      asap(() => {
        removalStreams.forEach((removalStream, el) => {
          removalStream.destroy();
        });
      });
    };
  });
}
