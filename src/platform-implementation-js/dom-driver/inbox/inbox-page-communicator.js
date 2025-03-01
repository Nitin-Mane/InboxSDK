/* @flow */

import Kefir from 'kefir';
import CommonPageCommunicator from '../../lib/common-page-communicator';

export default class InboxPageCommunicator extends CommonPageCommunicator {
  getDraftIDForComposeView(el: HTMLElement): string {
    const draftIDFound = el.hasAttribute('data-inboxsdk-draft-id');

    if (!draftIDFound) {
      el.dispatchEvent(
        new CustomEvent('inboxSDKgetDraftIDforComposeView', {
          bubbles: true,
          cancelable: false,
          detail: null,
        })
      );
    }

    const draftID = el.getAttribute('data-inboxsdk-draft-id');
    if (!draftID) throw new Error('could not find draft ID');

    return draftID;
  }
  notifyEmailSending(): void {
    document.dispatchEvent(
      new CustomEvent('inboxSDKcomposeViewIsSending', {
        bubbles: false,
        cancelable: false,
        detail: null,
      })
    );
  }
  notifyEmailSendCanceled(): void {
    document.dispatchEvent(
      new CustomEvent('inboxSDKcomposeViewSendCanceled', {
        bubbles: false,
        cancelable: false,
        detail: null,
      })
    );
  }

  clickAndGetNewIframeSrc(el: HTMLElement): Promise<string> {
    const pr = Kefir.fromEvents(el, 'inboxSDKclickAndGetNewIframeSrcResult')
      .take(1)
      .flatMap(({ detail }) =>
        detail.type === 'success'
          ? Kefir.constant(detail.src)
          : Kefir.constantError(
              Object.assign(new Error(detail.message), { stack: detail.stack })
            )
      )
      .toPromise();

    el.dispatchEvent(
      new CustomEvent('inboxSDKclickAndGetNewIframeSrc', {
        bubbles: true,
        cancelable: false,
        detail: null,
      })
    );
    return pr;
  }

  fakeWindowResize() {
    document.dispatchEvent(
      new CustomEvent('inboxSDKinboxFakeWindowResize', {
        bubbles: false,
        cancelable: false,
        detail: null,
      })
    );
  }
}
