/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

/**
 * Packets contain read / write functionality for the different packet types
 * supported by the debugging protocol, so that a transport can focus on
 * delivery and queue management without worrying too much about the specific
 * packet types.
 *
 * They are intended to be "one use only", so a new packet should be
 * instantiated for each incoming or outgoing packet.
 *
 * A complete Packet type should expose at least the following:
 *   * read(stream, scriptableStream)
 *     Called when the input stream has data to read
 *   * write(stream)
 *     Called when the output stream is ready to write
 *   * get done()
 *     Returns true once the packet is done being read / written
 *   * destroy()
 *     Called to clean up at the end of use
 */

const {StreamUtils} =
    ChromeUtils.import("chrome://juggler/content/server/stream-utils.js", {});

const unicodeConverter = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
    .createInstance(Ci.nsIScriptableUnicodeConverter);
unicodeConverter.charset = "UTF-8";

const defer = function() {
  let deferred = {
    promise: new Promise((resolve, reject) => {
      deferred.resolve = resolve;
      deferred.reject = reject;
    }),
  };
  return deferred;
};

this.EXPORTED_SYMBOLS = ["RawPacket", "Packet", "JSONPacket", "BulkPacket"];

// The transport's previous check ensured the header length did not
// exceed 20 characters.  Here, we opt for the somewhat smaller, but still
// large limit of 1 TiB.
const PACKET_LENGTH_MAX = Math.pow(2, 40);

/**
 * A generic Packet processing object (extended by two subtypes below).
 *
 * @class
 */
function Packet(transport) {
  this._transport = transport;
  this._length = 0;
}

/**
 * Attempt to initialize a new Packet based on the incoming packet header
 * we've received so far.  We try each of the types in succession, trying
 * JSON packets first since they are much more common.
 *
 * @param {string} header
 *     Packet header string to attempt parsing.
 * @param {DebuggerTransport} transport
 *     Transport instance that will own the packet.
 *
 * @return {Packet}
 *     Parsed packet of the matching type, or null if no types matched.
 */
Packet.fromHeader = function(header, transport) {
  return JSONPacket.fromHeader(header, transport) ||
         BulkPacket.fromHeader(header, transport);
};

Packet.prototype = {

  get length() {
    return this._length;
  },

  set length(length) {
    if (length > PACKET_LENGTH_MAX) {
      throw new Error("Packet length " + length +
                      " exceeds the max length of " + PACKET_LENGTH_MAX);
    }
    this._length = length;
  },

  destroy() {
    this._transport = null;
  },
};

/**
 * With a JSON packet (the typical packet type sent via the transport),
 * data is transferred as a JSON packet serialized into a string,
 * with the string length prepended to the packet, followed by a colon
 * ([length]:[packet]). The contents of the JSON packet are specified in
 * the Remote Debugging Protocol specification.
 *
 * @param {DebuggerTransport} transport
 *     Transport instance that will own the packet.
 */
function JSONPacket(transport) {
  Packet.call(this, transport);
  this._data = "";
  this._done = false;
}

/**
 * Attempt to initialize a new JSONPacket based on the incoming packet
 * header we've received so far.
 *
 * @param {string} header
 *     Packet header string to attempt parsing.
 * @param {DebuggerTransport} transport
 *     Transport instance that will own the packet.
 *
 * @return {JSONPacket}
 *     Parsed packet, or null if it's not a match.
 */
JSONPacket.fromHeader = function(header, transport) {
  let match = this.HEADER_PATTERN.exec(header);

  if (!match) {
    return null;
  }

  let packet = new JSONPacket(transport);
  packet.length = +match[1];
  return packet;
};

JSONPacket.HEADER_PATTERN = /^(\d+):$/;

JSONPacket.prototype = Object.create(Packet.prototype);

Object.defineProperty(JSONPacket.prototype, "object", {
  /**
   * Gets the object (not the serialized string) being read or written.
   */
  get() {
    return this._object;
  },

  /**
   * Sets the object to be sent when write() is called.
   */
  set(object) {
    this._object = object;
    let data = JSON.stringify(object);
    this._data = unicodeConverter.ConvertFromUnicode(data);
    this.length = this._data.length;
  },
});

JSONPacket.prototype.read = function(stream, scriptableStream) {

  // Read in more packet data.
  this._readData(stream, scriptableStream);

  if (!this.done) {
    // Don't have a complete packet yet.
    return;
  }

  let json = this._data;
  try {
    json = unicodeConverter.ConvertToUnicode(json);
    this._object = JSON.parse(json);
  } catch (e) {
    let msg = "Error parsing incoming packet: " + json + " (" + e +
              " - " + e.stack + ")";
    console.error(msg);
    dump(msg + "\n");
    return;
  }

  this._transport._onJSONObjectReady(this._object);
};

JSONPacket.prototype._readData = function(stream, scriptableStream) {
  let bytesToRead = Math.min(
      this.length - this._data.length,
      stream.available());
  this._data += scriptableStream.readBytes(bytesToRead);
  this._done = this._data.length === this.length;
};

JSONPacket.prototype.write = function(stream) {

  if (this._outgoing === undefined) {
    // Format the serialized packet to a buffer
    this._outgoing = this.length + ":" + this._data;
  }

  let written = stream.write(this._outgoing, this._outgoing.length);
  this._outgoing = this._outgoing.slice(written);
  this._done = !this._outgoing.length;
};

Object.defineProperty(JSONPacket.prototype, "done", {
  get() {
    return this._done;
  },
});

JSONPacket.prototype.toString = function() {
  return JSON.stringify(this._object, null, 2);
};

/**
 * With a bulk packet, data is transferred by temporarily handing over
 * the transport's input or output stream to the application layer for
 * writing data directly.  This can be much faster for large data sets,
 * and avoids various stages of copies and data duplication inherent in
 * the JSON packet type.  The bulk packet looks like:
 *
 *     bulk [actor] [type] [length]:[data]
 *
 * The interpretation of the data portion depends on the kind of actor and
 * the packet's type.  See the Remote Debugging Protocol Stream Transport
 * spec for more details.
 *
 * @param {DebuggerTransport} transport
 *     Transport instance that will own the packet.
 */
function BulkPacket(transport) {
  Packet.call(this, transport);
  this._done = false;
  this._readyForWriting = defer();
}

/**
 * Attempt to initialize a new BulkPacket based on the incoming packet
 * header we've received so far.
 *
 * @param {string} header
 *     Packet header string to attempt parsing.
 * @param {DebuggerTransport} transport
 *     Transport instance that will own the packet.
 *
 * @return {BulkPacket}
 *     Parsed packet, or null if it's not a match.
 */
BulkPacket.fromHeader = function(header, transport) {
  let match = this.HEADER_PATTERN.exec(header);

  if (!match) {
    return null;
  }

  let packet = new BulkPacket(transport);
  packet.header = {
    actor: match[1],
    type: match[2],
    length: +match[3],
  };
  return packet;
};

BulkPacket.HEADER_PATTERN = /^bulk ([^: ]+) ([^: ]+) (\d+):$/;

BulkPacket.prototype = Object.create(Packet.prototype);

BulkPacket.prototype.read = function(stream) {
  // Temporarily pause monitoring of the input stream
  this._transport.pauseIncoming();

  let deferred = defer();

  this._transport._onBulkReadReady({
    actor: this.actor,
    type: this.type,
    length: this.length,
    copyTo: (output) => {
      let copying = StreamUtils.copyStream(stream, output, this.length);
      deferred.resolve(copying);
      return copying;
    },
    stream,
    done: deferred,
  });

  // Await the result of reading from the stream
  deferred.promise.then(() => {
    this._done = true;
    this._transport.resumeIncoming();
  }, this._transport.close);

  // Ensure this is only done once
  this.read = () => {
    throw new Error("Tried to read() a BulkPacket's stream multiple times.");
  };
};

BulkPacket.prototype.write = function(stream) {
  if (this._outgoingHeader === undefined) {
    // Format the serialized packet header to a buffer
    this._outgoingHeader = "bulk " + this.actor + " " + this.type + " " +
                           this.length + ":";
  }

  // Write the header, or whatever's left of it to write.
  if (this._outgoingHeader.length) {
    let written = stream.write(this._outgoingHeader,
        this._outgoingHeader.length);
    this._outgoingHeader = this._outgoingHeader.slice(written);
    return;
  }

  // Temporarily pause the monitoring of the output stream
  this._transport.pauseOutgoing();

  let deferred = defer();

  this._readyForWriting.resolve({
    copyFrom: (input) => {
      let copying = StreamUtils.copyStream(input, stream, this.length);
      deferred.resolve(copying);
      return copying;
    },
    stream,
    done: deferred,
  });

  // Await the result of writing to the stream
  deferred.promise.then(() => {
    this._done = true;
    this._transport.resumeOutgoing();
  }, this._transport.close);

  // Ensure this is only done once
  this.write = () => {
    throw new Error("Tried to write() a BulkPacket's stream multiple times.");
  };
};

Object.defineProperty(BulkPacket.prototype, "streamReadyForWriting", {
  get() {
    return this._readyForWriting.promise;
  },
});

Object.defineProperty(BulkPacket.prototype, "header", {
  get() {
    return {
      actor: this.actor,
      type: this.type,
      length: this.length,
    };
  },

  set(header) {
    this.actor = header.actor;
    this.type = header.type;
    this.length = header.length;
  },
});

Object.defineProperty(BulkPacket.prototype, "done", {
  get() {
    return this._done;
  },
});

BulkPacket.prototype.toString = function() {
  return "Bulk: " + JSON.stringify(this.header, null, 2);
};

/**
 * RawPacket is used to test the transport's error handling of malformed
 * packets, by writing data directly onto the stream.
 * @param transport DebuggerTransport
 *        The transport instance that will own the packet.
 * @param data string
 *        The raw string to send out onto the stream.
 */
function RawPacket(transport, data) {
  Packet.call(this, transport);
  this._data = data;
  this.length = data.length;
  this._done = false;
}

RawPacket.prototype = Object.create(Packet.prototype);

RawPacket.prototype.read = function() {
  // this has not yet been needed for testing
  throw new Error("Not implemented");
};

RawPacket.prototype.write = function(stream) {
  let written = stream.write(this._data, this._data.length);
  this._data = this._data.slice(written);
  this._done = !this._data.length;
};

Object.defineProperty(RawPacket.prototype, "done", {
  get() {
    return this._done;
  },
});
