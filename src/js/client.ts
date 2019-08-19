import {ReportDialogOptions} from "@sentry/browser";
import { API, BaseClient, Scope } from '@sentry/core';
import { Event, EventHint } from '@sentry/types';
import { getGlobalObject, logger, SyncPromise } from '@sentry/utils';

import { CordovaBackend, CordovaOptions } from './backend';
import { SDK_NAME, SDK_VERSION } from './version';

/**
 * The Sentry Cordova SDK Client.
 *
 * @see CordovaOptions for documentation on configuration options.
 * @see SentryClient for usage documentation.
 */
export class CordovaClient extends BaseClient<CordovaBackend, CordovaOptions> {
  /**
   * Creates a new Cordova SDK instance.
   * @param options Configuration options for this SDK.
   */
  public constructor(options: CordovaOptions) {
    super(CordovaBackend, options);
  }

  /**
   * @inheritDoc
   */
  protected _prepareEvent(event: Event, scope?: Scope, hint?: EventHint): SyncPromise<Event | null> {
    event.platform = event.platform || 'javascript';
    event.sdk = {
      ...event.sdk,
      name: SDK_NAME,
      packages: [
        ...((event.sdk && event.sdk.packages) || []),
        {
          name: 'npm:sentry-cordova',
          version: SDK_VERSION,
        },
      ],
      version: SDK_VERSION,
    };

    return super._prepareEvent(event, scope, hint);
  }


  /**
   * Show a report dialog to the user to send feedback to a specific event.
   *
   * @param options Set individual options for the dialog
   */
  public showReportDialog(options: ReportDialogOptions = {}): void {
    // doesn't work without a document (React Native)
    const document = getGlobalObject<Window>().document;
    if (!document) {
      return;
    }

    if (!this._isEnabled()) {
      logger.error('Trying to call showReportDialog with Sentry Client is disabled');
      return;
    }

    const dsn = options.dsn || this.getDsn();

    if (!options.eventId) {
      logger.error('Missing `eventId` option in showReportDialog call');
      return;
    }

    if (!dsn) {
      logger.error('Missing `Dsn` option in showReportDialog call');
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = new API(dsn).getReportDialogEndpoint(options);

    if (options.onLoad) {
      script.onload = options.onLoad;
    }

    (document.head || document.body).appendChild(script);
  }
}
