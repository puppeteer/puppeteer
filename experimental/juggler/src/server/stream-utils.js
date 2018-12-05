/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const CC = Components.Constructor;

ChromeUtils.import("resource://gre/modules/EventEmitter.jsm");
ChromeUtils.import("resource://gre/modules/Services.jsm");

const IOUtil = Cc["@mozilla.org/io-util;1"].getService(Ci.nsIIOUtil);
const ScriptableInputStream = CC("@mozilla.org/scriptableinputstream;1",
    "nsIScriptableInputStream", "init");

this.EXPORTED_SYMBOLS = ["StreamUtils"];

const BUFFER_SIZE = 0x8000;

/**
 * This helper function (and its companion object) are used by bulk
 * senders and receivers to read and write data in and out of other streams.
 * Functions that make use of this tool are passed to callers when it is
 * time to read or write bulk data.  It is highly recommended to use these
 * copier functions instead of the stream directly because the copier
 * enforces the agreed upon length. Since bulk mode reuses an existing
 * stream, the sender and receiver must write and read exactly the agreed
 * upon amount of data, or else the entire transport will be left in a
 * invalid state.  Additionally, other methods of stream copying (such as
 * NetUtil.asyncCopy) close the streams involved, which would terminate
 * the debugging transport, and so it is avoided here.
 *
 * Overall, this *works*, but clearly the optimal solution would be
 * able to just use the streams directly.  If it were possible to fully
 * implement nsIInputStream/nsIOutputStream in JS, wrapper streams could
 * be created to enforce the length and avoid closing, and consumers could
 * use familiar stream utilities like NetUtil.asyncCopy.
 *
 * The function takes two async streams and copies a precise number
 * of bytes from one to the other.  Copying begins immediately, but may
 * complete at some future time depending on data size.  Use the returned
 * promise to know when it's complete.
 *
 * @param {nsIAsyncInputStream} input
 *     Stream to copy from.
 * @param {nsIAsyncOutputStream} output
 *        Stream to copy to.
 * @param {number} length
 *        Amount of data that needs to be copied.
 *
 * @return {Promise}
 *     Promise is resolved when copying completes or rejected if any
 *     (unexpected) errors occur.
 */
function copyStream(input, output, length) {
  let copier = new StreamCopier(input, output, length);
  return copier.copy();
}

/** @class */
function StreamCopier(input, output, length) {
  EventEmitter.decorate(this);
  this._id = StreamCopier._nextId++;
  this.input = input;
  // Save off the base output stream, since we know it's async as we've
  // required
  this.baseAsyncOutput = output;
  if (IOUtil.outputStreamIsBuffered(output)) {
    this.output = output;
  } else {
    this.output = Cc["@mozilla.org/network/buffered-output-stream;1"]
                  .createInstance(Ci.nsIBufferedOutputStream);
    this.output.init(output, BUFFER_SIZE);
  }
  this._length = length;
  this._amountLeft = length;
  this._deferred = {
    promise: new Promise((resolve, reject) => {
      this._deferred.resolve = resolve;
      this._deferred.reject = reject;
    }),
  };

  this._copy = this._copy.bind(this);
  this._flush = this._flush.bind(this);
  this._destroy = this._destroy.bind(this);

  // Copy promise's then method up to this object.
  //
  // Allows the copier to offer a promise interface for the simple succeed
  // or fail scenarios, but also emit events (due to the EventEmitter)
  // for other states, like progress.
  this.then = this._deferred.promise.then.bind(this._deferred.promise);
  this.then(this._destroy, this._destroy);

  // Stream ready callback starts as |_copy|, but may switch to |_flush|
  // at end if flushing would block the output stream.
  this._streamReadyCallback = this._copy;
}
StreamCopier._nextId = 0;

StreamCopier.prototype = {

  copy() {
    // Dispatch to the next tick so that it's possible to attach a progress
    // event listener, even for extremely fast copies (like when testing).
    Services.tm.currentThread.dispatch(() => {
      try {
        this._copy();
      } catch (e) {
        this._deferred.reject(e);
      }
    }, 0);
    return this;
  },

  _copy() {
    let bytesAvailable = this.input.available();
    let amountToCopy = Math.min(bytesAvailable, this._amountLeft);
    this._debug("Trying to copy: " + amountToCopy);

    let bytesCopied;
    try {
      bytesCopied = this.output.writeFrom(this.input, amountToCopy);
    } catch (e) {
      if (e.result == Cr.NS_BASE_STREAM_WOULD_BLOCK) {
        this._debug("Base stream would block, will retry");
        this._debug("Waiting for output stream");
        this.baseAsyncOutput.asyncWait(this, 0, 0, Services.tm.currentThread);
        return;
      }
      throw e;
    }

    this._amountLeft -= bytesCopied;
    this._debug("Copied: " + bytesCopied +
                ", Left: " + this._amountLeft);
    this._emitProgress();

    if (this._amountLeft === 0) {
      this._debug("Copy done!");
      this._flush();
      return;
    }

    this._debug("Waiting for input stream");
    this.input.asyncWait(this, 0, 0, Services.tm.currentThread);
  },

  _emitProgress() {
    this.emit("progress", {
      bytesSent: this._length - this._amountLeft,
      totalBytes: this._length,
    });
  },

  _flush() {
    try {
      this.output.flush();
    } catch (e) {
      if (e.result == Cr.NS_BASE_STREAM_WOULD_BLOCK ||
          e.result == Cr.NS_ERROR_FAILURE) {
        this._debug("Flush would block, will retry");
        this._streamReadyCallback = this._flush;
        this._debug("Waiting for output stream");
        this.baseAsyncOutput.asyncWait(this, 0, 0, Services.tm.currentThread);
        return;
      }
      throw e;
    }
    this._deferred.resolve();
  },

  _destroy() {
    this._destroy = null;
    this._copy = null;
    this._flush = null;
    this.input = null;
    this.output = null;
  },

  // nsIInputStreamCallback
  onInputStreamReady() {
    this._streamReadyCallback();
  },

  // nsIOutputStreamCallback
  onOutputStreamReady() {
    this._streamReadyCallback();
  },

  _debug() {
  },

};

/**
 * Read from a stream, one byte at a time, up to the next
 * <var>delimiter</var> character, but stopping if we've read |count|
 * without finding it.  Reading also terminates early if there are less
 * than <var>count</var> bytes available on the stream.  In that case,
 * we only read as many bytes as the stream currently has to offer.
 *
 * @param {nsIInputStream} stream
 *     Input stream to read from.
 * @param {string} delimiter
 *     Character we're trying to find.
 * @param {number} count
 *     Max number of characters to read while searching.
 *
 * @return {string}
 *     Collected data.  If the delimiter was found, this string will
 *     end with it.
 */
// TODO: This implementation could be removed if bug 984651 is fixed,
// which provides a native version of the same idea.
function delimitedRead(stream, delimiter, count) {
  let scriptableStream;
  if (stream instanceof Ci.nsIScriptableInputStream) {
    scriptableStream = stream;
  } else {
    scriptableStream = new ScriptableInputStream(stream);
  }

  let data = "";

  // Don't exceed what's available on the stream
  count = Math.min(count, stream.available());

  if (count <= 0) {
    return data;
  }

  let char;
  while (char !== delimiter && count > 0) {
    char = scriptableStream.readBytes(1);
    count--;
    data += char;
  }

  return data;
}

this.StreamUtils = {
  copyStream,
  delimitedRead,
};
