import RSVP from 'rsvp';
import {extractThreads} from '../gmail-response-processor';
import ajax from '../../../../common/ajax';

export default function getGmailThreadIdForRfcMessageId(driver, rfcMessageId) {
  const searchString = 'rfc822msgid:'+rfcMessageId;
  return ajax({
    method: 'GET',
    url: location.origin+location.pathname,
    data: {
      ik: driver.getPageCommunicator().getIkValue(),
      ui: 2,
      view: 'tl',
      start: 0,
      num: 1,
      rt: 'c',
      pcd: '1',
      mb: '0',
      search: 'apps',
      apps: 'apps',
      q: searchString
    }
  }).then(response => {
    const threads = extractThreads(response.text);
    if (threads.length !== 1) {
      throw new Error("Failed to find gmail thread id for rfc message id. Message may not exist in user's account.");
    }
    return threads[0].gmailThreadId;
  });
}
