/*
  Tandem pair check.

  Everything here runs in the reader's browser. Nothing that is typed into the
  page is transmitted anywhere. The only network request the page makes is a
  same-origin GET of the repository's own published golden corpus, used to
  self-test these rules against the frozen vectors.

  The rules implemented below are transcribed from tandem.md. Each check names
  the numbered rule on docs/specification.html that it enforces and the stable
  reason code that a real parser emits when it fails.
*/

"use strict";

/* ------------------------------------------------------------------ SHA256 */
/* Implemented directly rather than through crypto.subtle so the page also
   works outside a secure context, for example when opened from a local file. */

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(x, n) {
  return (x >>> n) | (x << (32 - n));
}

function sha256(bytes) {
  const length = bytes.length;
  const withPadding = new Uint8Array((((length + 9) >> 6) + 1) << 6);
  withPadding.set(bytes);
  withPadding[length] = 0x80;
  const bitLength = length * 8;
  const view = new DataView(withPadding.buffer);
  view.setUint32(withPadding.length - 8, Math.floor(bitLength / 0x100000000));
  view.setUint32(withPadding.length - 4, bitLength >>> 0);

  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const w = new Uint32Array(64);

  for (let offset = 0; offset < withPadding.length; offset += 64) {
    for (let i = 0; i < 16; i += 1) w[i] = view.getUint32(offset + i * 4);
    for (let i = 16; i < 64; i += 1) {
      const a = w[i - 15];
      const b = w[i - 2];
      const s0 = rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3);
      const s1 = rotr(b, 17) ^ rotr(b, 19) ^ (b >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i += 1) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + s1 + ch + K[i] + w[i]) >>> 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (s0 + maj) >>> 0;
      hh = g; g = f; f = e;
      e = (d + t1) >>> 0;
      d = c; c = b; b = a;
      a = (t1 + t2) >>> 0;
    }

    h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0;
    h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0;
    h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  for (let i = 0; i < 8; i += 1) outView.setUint32(i * 4, h[i]);
  return out;
}

/* ------------------------------------------------------------------- bytes */

function toHex(bytes) {
  let out = "";
  for (const byte of bytes) out += byte.toString(16).padStart(2, "0");
  return out;
}

function fromHex(text) {
  const cleaned = String(text).replace(/[\s:]/g, "").toLowerCase();
  if (cleaned.length === 0) return { error: "empty" };
  if (cleaned.length % 2 !== 0) return { error: "odd number of hex digits" };
  if (!/^[0-9a-f]*$/.test(cleaned)) return { error: "contains a character that is not a hex digit" };
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = Number.parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  return { bytes };
}

function concat(parts) {
  let total = 0;
  for (const part of parts) total += part.length;
  const out = new Uint8Array(total);
  let at = 0;
  for (const part of parts) { out.set(part, at); at += part.length; }
  return out;
}

function ascii(text) {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i += 1) out[i] = text.charCodeAt(i) & 0xff;
  return out;
}

function domain(tag) {
  return concat([ascii(tag), new Uint8Array([0])]);
}

function u32le(value) {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value, true);
  return out;
}

function readU32le(bytes, at) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(at, true);
}

function compareBytes(a, b) {
  const shortest = Math.min(a.length, b.length);
  for (let i = 0; i < shortest; i += 1) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  if (a.length === b.length) return 0;
  return a.length < b.length ? -1 : 1;
}

function equalBytes(a, b) {
  return a.length === b.length && compareBytes(a, b) === 0;
}

function reverse(bytes) {
  return Uint8Array.from(bytes).reverse();
}

/* ------------------------------------------------------------- secp256k1 -- */

const FIELD_P = (2n ** 256n) - (2n ** 32n) - 977n;

function bytesToBig(bytes) {
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  return value;
}

function modPow(base, exponent, modulus) {
  let result = 1n;
  let b = base % modulus;
  let e = exponent;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % modulus;
    b = (b * b) % modulus;
    e >>= 1n;
  }
  return result;
}

/* A compressed point is on the curve when x is in the field and x^3 + 7 is a
   quadratic residue, so that some y exists with y^2 = x^3 + 7 (mod p). */
function isCompressedPointOnCurve(bytes) {
  if (bytes.length !== 33) return false;
  if (bytes[0] !== 0x02 && bytes[0] !== 0x03) return false;
  const x = bytesToBig(bytes.subarray(1));
  if (x >= FIELD_P) return false;
  const rhs = (modPow(x, 3n, FIELD_P) + 7n) % FIELD_P;
  if (rhs === 0n) return false;
  return modPow(rhs, (FIELD_P - 1n) / 2n, FIELD_P) === 1n;
}

/* ---------------------------------------------------------- Tandem tables -- */

const MAGIC = ascii("TNDM");

const NETWORKS = new Map([[0x00, "mainnet"], [0x01, "signet"], [0x02, "testnet4"], [0x03, "regtest"]]);

const OPCODES = new Map([
  [0x00, { name: "INIT", payload: 59, prefix: "6a 3b", script: 61, stateVout: null, hasSeq: false }],
  [0x01, { name: "CREATE", payload: 40, prefix: "6a 28", script: 42, stateVout: 0x01, hasSeq: false }],
  [0x02, { name: "MARK", payload: 78, prefix: "6a 4c 4e", script: 81, stateVout: 0x01, hasSeq: true }],
  [0x03, { name: "ROTATE", payload: 44, prefix: "6a 2c", script: 46, stateVout: 0x01, hasSeq: true }],
  [0x04, { name: "CLOSE", payload: 80, prefix: "6a 4c 50", script: 83, stateVout: 0xff, hasSeq: true }],
]);

const MARK_KINDS = new Map([
  [0x00, "note"], [0x01, "image"], [0x02, "audio"],
  [0x03, "milestone"], [0x04, "link"], [0x05, "opaque data"],
]);

const CLOSE_REASONS = new Map([
  [0x00, "mutual completion"], [0x01, "relationship ended"],
  [0x02, "migrate outside Tandem"], [0x03, "other"],
]);

const REASON = {
  VALID: ["0x0000", "VALID"],
  MULTIPLE_MARKERS: ["0x0001", "MULTIPLE_MARKERS"],
  ENCODING: ["0x0002", "BAD_MARKER_ENCODING_OR_LENGTH"],
  FORMAT: ["0x0003", "UNKNOWN_MARKER_FORMAT"],
  NETWORK: ["0x0004", "WRONG_NETWORK"],
  OPCODE: ["0x0005", "UNKNOWN_OPCODE"],
  NAMESPACE: ["0x0006", "WRONG_NAMESPACE"],
  RESERVED: ["0x0007", "UNSUPPORTED_OR_RESERVED_FIELD"],
  INPUT_SCRIPT: ["0x0014", "BAD_INPUT_SCRIPT"],
  KEYS: ["0x0015", "BAD_KEY_ORDER_OR_BINDING"],
  PREDECESSOR: ["0x001a", "PREDECESSOR_NOT_ACTIVE"],
  SEQUENCE: ["0x001b", "BAD_STATE_SEQUENCE"],
  SUCCESSOR: ["0x001c", "BAD_SUCCESSOR"],
  COMMITMENT: ["0x001d", "BAD_COMMITMENT"],
};

/* --------------------------------------------------------- marker parsing -- */

/*
  Accepts either a full marker script (starting with OP_RETURN) or a bare
  payload. Returns a record describing what was found plus every structural
  finding, in the order the specification evaluates them.
*/
function parseMarker(input) {
  const findings = [];
  const record = { ok: false, findings, fields: null };

  const decoded = fromHex(input);
  if (decoded.error) {
    findings.push(fail("input", "REC-1", "Input is readable hexadecimal", decoded.error, REASON.ENCODING));
    return record;
  }

  let bytes = decoded.bytes;
  let scriptBytes = null;

  if (bytes.length > 0 && bytes[0] === 0x6a) {
    scriptBytes = bytes;
    const framed = readPush(bytes);
    if (framed.error) {
      findings.push(fail("push", "REC-6", "Push prefix is complete and the payload is fully present", framed.error, REASON.ENCODING));
      return record;
    }
    findings.push(pass("push", "REC-1", "Script begins with OP_RETURN and one data push",
      `push opcode 0x${bytes[1].toString(16).padStart(2, "0")}, declared length ${framed.declared}`));
    if (framed.trailing > 0) {
      findings.push(fail("trailing", "REC-4", "No bytes follow the pushed payload", `${framed.trailing} trailing byte(s)`, REASON.ENCODING));
      return record;
    }
    findings.push(pass("trailing", "REC-4", "No bytes follow the pushed payload", "script ends with the payload"));
    if (!framed.minimal) {
      findings.push(fail("minimal", "REC-6", "Push uses the minimal encoding", framed.minimalNote, REASON.ENCODING));
      return record;
    }
    findings.push(pass("minimal", "REC-6", "Push uses the minimal encoding", framed.minimalNote));
    bytes = framed.payload;
  } else {
    findings.push(skip("push", "REC-1", "Script framing", "no OP_RETURN prefix supplied, treating the input as a bare payload"));
  }

  if (bytes.length < 4 || !equalBytes(bytes.subarray(0, 4), MAGIC)) {
    findings.push(fail("magic", "REC-1", "Payload begins with the magic bytes TNDM", `found ${toHex(bytes.subarray(0, Math.min(4, bytes.length))) || "nothing"}`, REASON.ENCODING));
    return record;
  }
  findings.push(pass("magic", "REC-1", "Payload begins with the magic bytes TNDM", "54 4e 44 4d"));

  if (bytes.length < 7 || bytes.length > 80) {
    findings.push(fail("length", "REC-6", "Payload length is between 7 and 80 bytes", `${bytes.length} bytes`, REASON.ENCODING));
    return record;
  }
  findings.push(pass("length", "REC-6", "Payload length is between 7 and 80 bytes", `${bytes.length} bytes`));

  const format = bytes[4];
  const network = bytes[5];
  const opcode = bytes[6];
  const spec = OPCODES.get(opcode);

  if (spec && bytes.length !== spec.payload) {
    findings.push(fail("exact", "REC-6", `Payload length is exactly ${spec.payload} bytes for ${spec.name}`, `${bytes.length} bytes`, REASON.ENCODING));
    return record;
  }
  if (spec) {
    findings.push(pass("exact", "REC-6", `Payload length is exactly ${spec.payload} bytes for ${spec.name}`, `${bytes.length} bytes`));
  }

  if (format !== 0x01) {
    findings.push(fail("format", "REC-7", "Marker format is 0x01", `0x${format.toString(16).padStart(2, "0")}`, REASON.FORMAT));
    return record;
  }
  findings.push(pass("format", "REC-7", "Marker format is 0x01", "0x01"));

  const networkName = NETWORKS.get(network);
  if (!networkName) {
    findings.push(fail("network", "ID-3", "Network byte is a defined Tandem network", `0x${network.toString(16).padStart(2, "0")}`, REASON.NETWORK));
    return record;
  }
  findings.push(pass("network", "ID-3", "Network byte is a defined Tandem network", networkName));

  if (!spec) {
    findings.push(fail("opcode", "REC-7", "Opcode is defined for Tandem", `0x${opcode.toString(16).padStart(2, "0")}`, REASON.OPCODE));
    return record;
  }
  findings.push(pass("opcode", "REC-7", "Opcode is defined for Tandem", spec.name));

  const fields = { operation: spec.name, opcode, format, network, networkName, payload: bytes, payloadBytes: bytes.length };
  if (scriptBytes) {
    fields.scriptBytes = scriptBytes.length;
    if (scriptBytes.length !== spec.script) {
      findings.push(fail("scriptlen", "REC-5", `Script length is exactly ${spec.script} bytes for ${spec.name}`, `${scriptBytes.length} bytes`, REASON.ENCODING));
      return record;
    }
    findings.push(pass("scriptlen", "REC-5", `Script length is exactly ${spec.script} bytes for ${spec.name}`, `${scriptBytes.length} bytes`));
  }

  if (spec.name === "INIT") {
    fields.hOpen = readU32le(bytes, 7);
    fields.hClose = readU32le(bytes, 11);
    fields.carrierValue = Number(new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getBigUint64(15, true));
    fields.refundDelay = readU32le(bytes, 23);
    fields.specHash = bytes.subarray(27, 59);

    check(findings, fields.carrierValue === 20000, "initcarrier", "OP-1", "INIT carrier value is 20,000", String(fields.carrierValue), REASON.RESERVED);
    check(findings, fields.refundDelay === 52560, "initrefund", "OP-1", "INIT refund delay is 52,560", String(fields.refundDelay), REASON.RESERVED);
    check(findings, fields.hOpen + 4320 === fields.hClose, "initwindow", "OP-1", "H_open plus 4,320 equals H_close",
      `${fields.hOpen} + 4320 = ${fields.hOpen + 4320}, declared ${fields.hClose}`, REASON.RESERVED);
  } else {
    fields.stateVout = bytes[7];
    fields.namespace = bytes.subarray(8, 40);
    check(findings, fields.stateVout === spec.stateVout, "statevout", "REC-8",
      `state_vout is 0x${spec.stateVout.toString(16).padStart(2, "0")} for ${spec.name}`,
      `0x${fields.stateVout.toString(16).padStart(2, "0")}`, REASON.RESERVED);

    if (spec.hasSeq) {
      fields.stateSeq = readU32le(bytes, 40);
      findings.push(pass("seqread", "REC-8", "state_seq decoded", String(fields.stateSeq)));
    }

    if (spec.name === "MARK") {
      fields.kind = bytes[44];
      fields.flags = bytes[45];
      fields.commitment = bytes.subarray(46, 78);
      check(findings, MARK_KINDS.has(fields.kind), "kind", "REC-9", "MARK kind is defined",
        MARK_KINDS.get(fields.kind) ?? `0x${fields.kind.toString(16).padStart(2, "0")}`, REASON.RESERVED);
      check(findings, fields.flags === 0, "flags", "REC-8", "MARK flags byte is zero",
        `0x${fields.flags.toString(16).padStart(2, "0")}`, REASON.RESERVED);
      check(findings, fields.commitment.some((byte) => byte !== 0), "commitment", "REC-8",
        "MARK chapter commitment is not all zero", toHex(fields.commitment), REASON.COMMITMENT);
    }

    if (spec.name === "CLOSE") {
      fields.reason = bytes[44];
      fields.reserved = bytes.subarray(45, 48);
      fields.commitment = bytes.subarray(48, 80);
      check(findings, CLOSE_REASONS.has(fields.reason), "closereason", "REC-9", "CLOSE reason is defined",
        CLOSE_REASONS.get(fields.reason) ?? `0x${fields.reason.toString(16).padStart(2, "0")}`, REASON.RESERVED);
      check(findings, fields.reserved.every((byte) => byte === 0), "reserved", "REC-8",
        "CLOSE reserved bytes are all zero", toHex(fields.reserved), REASON.RESERVED);
    }
  }

  record.fields = fields;
  record.ok = findings.every((finding) => finding.status !== "bad");
  return record;
}

function readPush(script) {
  if (script.length < 2) return { error: "script is too short to hold a push opcode" };
  const opcode = script[1];
  let declared;
  let headerLength;
  let minimal = true;
  let minimalNote = "";

  if (opcode >= 0x01 && opcode <= 0x4b) {
    declared = opcode;
    headerLength = 2;
    minimalNote = `direct push of ${declared} bytes`;
  } else if (opcode === 0x4c) {
    if (script.length < 3) return { error: "OP_PUSHDATA1 length byte is missing" };
    declared = script[2];
    headerLength = 3;
    minimal = declared > 0x4b;
    minimalNote = minimal ? "OP_PUSHDATA1 is required above 75 bytes" : "OP_PUSHDATA1 used where a direct push fits";
  } else if (opcode === 0x4d) {
    if (script.length < 4) return { error: "OP_PUSHDATA2 length bytes are missing" };
    declared = script[2] | (script[3] << 8);
    headerLength = 4;
    minimal = false;
    minimalNote = "OP_PUSHDATA2 is never minimal for a payload of at most 80 bytes";
  } else if (opcode === 0x4e) {
    if (script.length < 6) return { error: "OP_PUSHDATA4 length bytes are missing" };
    declared = script[2] | (script[3] << 8) | (script[4] << 16) | (script[5] << 24);
    headerLength = 6;
    minimal = false;
    minimalNote = "OP_PUSHDATA4 is never minimal for a payload of at most 80 bytes";
  } else {
    return { error: `byte after OP_RETURN is 0x${opcode.toString(16).padStart(2, "0")}, which is not a data push` };
  }

  const available = script.length - headerLength;
  if (available < declared) {
    return { error: `push declares ${declared} bytes but only ${available} are present` };
  }
  return {
    declared,
    minimal,
    minimalNote,
    payload: script.subarray(headerLength, headerLength + declared),
    trailing: available - declared,
  };
}

/* ------------------------------------------------------------- pair rules -- */

function checkRecordPair(a, b) {
  const findings = [];

  if (!a.ok || !b.ok) {
    findings.push(skip("pair", "PAIR-5", "Pairing checks", "both records must parse before they can be paired"));
    return findings;
  }

  const first = a.fields;
  const second = b.fields;

  if (first.operation === "INIT" || second.operation === "INIT") {
    findings.push(fail("initpair", "ID-1", "Neither record is an INIT",
      "INIT activates a protocol identifier and never forms a predecessor and successor pair with an object operation", REASON.PREDECESSOR));
    return findings;
  }

  check(findings, second.operation !== "CREATE", "createsecond", "OP-2",
    "The successor is not a CREATE", second.operation === "CREATE" ? "CREATE has no predecessor, it begins an object" : second.operation, REASON.PREDECESSOR);

  check(findings, first.operation !== "CLOSE", "closefirst", "ST-3",
    "The predecessor is not a CLOSE", first.operation === "CLOSE" ? "CLOSE is terminal and has no Tandem successor" : first.operation, REASON.PREDECESSOR);

  check(findings, first.network === second.network, "netmatch", "ID-3",
    "Both records name the same network",
    `${first.networkName} and ${second.networkName}`, REASON.NETWORK);

  const sameNamespace = equalBytes(first.namespace, second.namespace);
  check(findings, sameNamespace, "nsmatch", "ID-5",
    "Both records carry the same namespace commitment",
    sameNamespace ? toHex(first.namespace) : `${toHex(first.namespace)} and ${toHex(second.namespace)}`, REASON.NAMESPACE);

  const firstSeq = first.operation === "CREATE" ? 0 : first.stateSeq;
  if (second.stateSeq === undefined) {
    findings.push(skip("seq", "PAIR-5", "Successor sequence is predecessor plus one", "the successor carries no state_seq"));
  } else if (firstSeq === 0xffffffff) {
    findings.push(fail("seq", "PAIR-5", "Successor sequence is predecessor plus one",
      "a predecessor sequence of 0xffffffff cannot be incremented", REASON.SEQUENCE));
  } else {
    check(findings, second.stateSeq === firstSeq + 1, "seq", "PAIR-5",
      "Successor sequence is predecessor plus one",
      `predecessor ${firstSeq}, successor ${second.stateSeq}, expected ${firstSeq + 1}`, REASON.SEQUENCE);
  }

  if (second.operation === "MARK") {
    findings.push(note("carrier", "PAIR-6",
      "A MARK must reproduce the predecessor carrier script byte for byte at vout 1",
      "that comparison needs the two transactions, which this tool does not take"));
  } else if (second.operation === "ROTATE") {
    findings.push(note("carrier", "PAIR-6",
      "A ROTATE must derive its successor carrier from a pair that differs from the current one",
      "use the carrier panel below to derive and compare the two scripts"));
  }

  return findings;
}

/* --------------------------------------------------------- carrier rules -- */

function checkCarrier(inputA, inputB) {
  const findings = [];
  const result = { findings, derived: null };

  const parsedA = fromHex(inputA);
  const parsedB = fromHex(inputB);

  if (parsedA.error || parsedB.error) {
    findings.push(fail("hex", "PAIR-1", "Both keys are readable hexadecimal",
      `side A: ${parsedA.error ?? "ok"}, side B: ${parsedB.error ?? "ok"}`, REASON.INPUT_SCRIPT));
    return result;
  }

  const a = parsedA.bytes;
  const b = parsedB.bytes;

  const lengthOk = a.length === 33 && b.length === 33;
  check(findings, lengthOk, "len", "PAIR-1", "Both keys are exactly 33 bytes",
    `side A ${a.length} bytes, side B ${b.length} bytes`, REASON.INPUT_SCRIPT);
  if (!lengthOk) return result;

  const prefixOk = (a[0] === 0x02 || a[0] === 0x03) && (b[0] === 0x02 || b[0] === 0x03);
  check(findings, prefixOk, "prefix", "PAIR-1", "Both keys begin with 0x02 or 0x03",
    `side A 0x${a[0].toString(16).padStart(2, "0")}, side B 0x${b[0].toString(16).padStart(2, "0")}`, REASON.INPUT_SCRIPT);
  if (!prefixOk) return result;

  const onCurveA = isCompressedPointOnCurve(a);
  const onCurveB = isCompressedPointOnCurve(b);
  check(findings, onCurveA && onCurveB, "curve", "PAIR-1", "Both keys are valid secp256k1 points",
    `side A ${onCurveA ? "on curve" : "not on curve"}, side B ${onCurveB ? "on curve" : "not on curve"}`, REASON.KEYS);
  if (!onCurveA || !onCurveB) return result;

  const distinct = compareBytes(a, b) !== 0;
  check(findings, distinct, "distinct", "PAIR-1", "The two keys are distinct",
    distinct ? "the pair has two different halves" : "both halves are the same key", REASON.KEYS);
  if (!distinct) return result;

  const sorted = compareBytes(a, b) < 0;
  check(findings, sorted, "sorted", "PAIR-1", "key0 is below key1 by unsigned bytewise order",
    sorted ? "side A is key0, side B is key1" : "the two halves are in the wrong order, swap them", REASON.KEYS);

  const key0 = sorted ? a : b;
  const key1 = sorted ? b : a;

  const witnessScript = concat([
    new Uint8Array([0x52, 0x21]), key0,
    new Uint8Array([0x21]), key1,
    new Uint8Array([0x52, 0xae]),
  ]);

  check(findings, witnessScript.length === 71, "wslen", "PAIR-2", "The witness script is exactly 71 bytes",
    `${witnessScript.length} bytes`, REASON.INPUT_SCRIPT);

  const scriptHash = sha256(witnessScript);
  const scriptPubKey = concat([new Uint8Array([0x00, 0x20]), scriptHash]);

  findings.push(pass("spk", "PAIR-2", "The carrier scriptPubKey is fully determined by the pair", `${scriptPubKey.length} bytes`));

  result.derived = {
    sorted,
    key0: toHex(key0),
    key1: toHex(key1),
    witnessScript: toHex(witnessScript),
    scriptHash: toHex(scriptHash),
    scriptPubKey: toHex(scriptPubKey),
  };
  return result;
}

/* ------------------------------------------------------------- derivation -- */

function deriveIdentity(networkCode, initTxidDisplay, specHashHex, createTxidDisplay) {
  const init = fromHex(initTxidDisplay);
  const spec = fromHex(specHashHex);
  if (init.error || init.bytes.length !== 32) return { error: "the INIT txid must be 32 bytes of hexadecimal in display order" };
  if (spec.error || spec.bytes.length !== 32) return { error: "the specification digest must be 32 bytes of hexadecimal" };

  const namespace = sha256(concat([
    domain("TANDEM/NAMESPACE"),
    new Uint8Array([networkCode]),
    reverse(init.bytes),
    spec.bytes,
  ]));

  const out = { namespace: toHex(namespace) };

  if (createTxidDisplay && createTxidDisplay.trim() !== "") {
    const create = fromHex(createTxidDisplay);
    if (create.error || create.bytes.length !== 32) return { error: "the CREATE txid must be 32 bytes of hexadecimal in display order" };
    out.objectKey = toHex(sha256(concat([
      domain("TANDEM/OBJECT"),
      namespace,
      reverse(create.bytes),
      u32le(1),
    ])));
    out.protocolId = `tndm:${NETWORKS.get(networkCode)}:${toHex(init.bytes)}`;
    out.displayId = `tandem:${NETWORKS.get(networkCode)}:${toHex(init.bytes)}:${toHex(create.bytes)}:1`;
  } else {
    out.protocolId = `tndm:${NETWORKS.get(networkCode)}:${toHex(init.bytes)}`;
  }
  return out;
}

/* ------------------------------------------------------------- finding UI -- */

function pass(id, rule, label, detail) { return { id, rule, label, detail, status: "ok" }; }
function fail(id, rule, label, detail, reason) { return { id, rule, label, detail, status: "bad", reason }; }
function skip(id, rule, label, detail) { return { id, rule, label, detail, status: "skip" }; }
function note(id, rule, label, detail) { return { id, rule, label, detail, status: "skip" }; }

function check(findings, condition, id, rule, label, detail, reason) {
  findings.push(condition ? pass(id, rule, label, detail) : fail(id, rule, label, detail, reason));
}

function renderFindings(list, target) {
  target.textContent = "";
  for (const finding of list) {
    const item = document.createElement("li");
    item.className = finding.status;
    const mark = document.createElement("b");
    mark.textContent = finding.status === "ok" ? "OK" : finding.status === "bad" ? "NO" : "--";
    mark.setAttribute("aria-label", finding.status === "ok" ? "pass" : finding.status === "bad" ? "fail" : "not evaluated");
    const body = document.createElement("div");
    const label = document.createElement("span");
    label.textContent = finding.label;
    body.append(label);

    const ruleLine = document.createElement("span");
    ruleLine.className = "check-rule";
    ruleLine.textContent = finding.status === "bad" && finding.reason
      ? `rule ${finding.rule} → ${finding.reason[1]} (${finding.reason[0]})`
      : `rule ${finding.rule}`;
    body.append(ruleLine);

    if (finding.detail) {
      const detail = document.createElement("span");
      detail.className = "check-detail";
      detail.textContent = finding.detail;
      body.append(detail);
    }

    item.append(mark, body);
    target.append(item);
  }
}

function setVerdict(flagNode, noteNode, state, text) {
  flagNode.className = `verdict-flag ${state}`;
  flagNode.textContent = state === "pass" ? "PAIR VALID" : state === "fail" ? "NOT A PAIR" : "AWAITING INPUT";
  noteNode.textContent = text;
}

function renderDerived(target, entries) {
  target.textContent = "";
  for (const [term, value] of entries) {
    const row = document.createElement("div");
    const dt = document.createElement("dt");
    dt.textContent = term;
    const dd = document.createElement("dd");
    dd.textContent = value;
    row.append(dt, dd);
    target.append(row);
  }
}

/* --------------------------------------------------------------- wiring --- */

function byId(id) { return document.getElementById(id); }

function wireRecordPanel() {
  const inputA = byId("record-a");
  const inputB = byId("record-b");
  const listA = byId("record-a-checks");
  const listB = byId("record-b-checks");
  const listPair = byId("record-pair-checks");
  const flag = byId("record-verdict-flag");
  const noteNode = byId("record-verdict-note");

  function run() {
    if (inputA.value.trim() === "" && inputB.value.trim() === "") {
      listA.textContent = "";
      listB.textContent = "";
      listPair.textContent = "";
      setVerdict(flag, noteNode, "idle", "Paste a marker into each side, or load the published vectors below.");
      return;
    }

    const a = parseMarker(inputA.value);
    const b = parseMarker(inputB.value);
    renderFindings(a.findings, listA);
    renderFindings(b.findings, listB);

    const pairFindings = checkRecordPair(a, b);
    renderFindings(pairFindings, listPair);

    const structuralFailure = !a.ok || !b.ok;
    const pairFailure = pairFindings.some((finding) => finding.status === "bad");

    if (structuralFailure) {
      const side = !a.ok && !b.ok ? "Both halves are" : !a.ok ? "Side A is" : "Side B is";
      setVerdict(flag, noteNode, "fail", `${side} malformed, so there is nothing to pair. Fix the structural failures above first.`);
    } else if (pairFailure) {
      const first = pairFindings.find((finding) => finding.status === "bad");
      setVerdict(flag, noteNode, "fail",
        `Both halves are well formed on their own, but they do not belong together: ${first.label.toLowerCase()} failed. A real parser would emit ${first.reason ? first.reason[1] : "a rejection"}.`);
    } else {
      setVerdict(flag, noteNode, "pass",
        `${a.fields.operation} at sequence ${a.fields.operation === "CREATE" ? 0 : a.fields.stateSeq} pairs with ${b.fields.operation} at sequence ${b.fields.stateSeq}. Everything checkable from the markers alone agrees.`);
    }
  }

  inputA.addEventListener("input", run);
  inputB.addEventListener("input", run);
  byId("record-clear").addEventListener("click", () => {
    inputA.value = "";
    inputB.value = "";
    run();
  });

  return { inputA, inputB, run };
}

function wireCarrierPanel() {
  const inputA = byId("key-a");
  const inputB = byId("key-b");
  const list = byId("carrier-checks");
  const derived = byId("carrier-derived");
  const flag = byId("carrier-verdict-flag");
  const noteNode = byId("carrier-verdict-note");

  function run() {
    if (inputA.value.trim() === "" && inputB.value.trim() === "") {
      list.textContent = "";
      derived.textContent = "";
      setVerdict(flag, noteNode, "idle", "Paste a compressed public key into each side.");
      return;
    }
    const result = checkCarrier(inputA.value, inputB.value);
    renderFindings(result.findings, list);
    if (result.derived) {
      renderDerived(derived, [
        ["key0, side A", result.derived.key0],
        ["key1, side B", result.derived.key1],
        ["witness script", result.derived.witnessScript],
        ["SHA256(witnessScript)", result.derived.scriptHash],
        ["carrier scriptPubKey", result.derived.scriptPubKey],
      ]);
      const ordered = result.derived.sorted;
      setVerdict(flag, noteNode, result.findings.some((f) => f.status === "bad") ? "fail" : "pass",
        ordered
          ? "The two halves form one carrier. Both signatures will be required to spend it."
          : "The halves are valid but were supplied in the wrong order. The carrier below uses the required sorted order.");
    } else {
      derived.textContent = "";
      setVerdict(flag, noteNode, "fail", "These two halves cannot form a carrier. See the failing rule above.");
    }
  }

  inputA.addEventListener("input", run);
  inputB.addEventListener("input", run);
  byId("carrier-clear").addEventListener("click", () => {
    inputA.value = "";
    inputB.value = "";
    run();
  });

  return { inputA, inputB, run };
}

function wireDerivePanel() {
  const network = byId("derive-network");
  const init = byId("derive-init");
  const spec = byId("derive-spec");
  const create = byId("derive-create");
  const derived = byId("derive-output");
  const message = byId("derive-message");

  function run() {
    const result = deriveIdentity(Number(network.value), init.value, spec.value, create.value);
    if (result.error) {
      derived.textContent = "";
      message.textContent = result.error;
      return;
    }
    message.textContent = "";
    const rows = [["namespace commitment", result.namespace], ["protocol identifier", result.protocolId]];
    if (result.objectKey) {
      rows.push(["object key", result.objectKey], ["object display identifier", result.displayId]);
    }
    renderDerived(derived, rows);
  }

  for (const node of [network, init, spec, create]) node.addEventListener("input", run);
  network.addEventListener("change", run);
  return { run };
}

/* ----------------------------------------------------------- vector tests -- */

function merkleRoot(leaves, tag) {
  if (leaves.length === 0) return null;
  let level = leaves;
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] ?? level[i];
      next.push(sha256(concat([domain(tag), left, right])));
    }
    level = next;
  }
  return level[0];
}

function selfTest(corpus) {
  const results = [];
  const record = (ok, label, detail) => results.push({ ok, label, detail });

  record(corpus.schema === "urn:tandem:golden-fixtures", "fixture schema identifier", corpus.schema);

  for (const marker of corpus.markers) {
    const parsed = parseMarker(marker.scriptHex);
    const spec = parsed.fields ? OPCODES.get(parsed.fields.opcode) : null;
    const ok = parsed.ok
      && parsed.fields.operation === marker.operation
      && parsed.fields.payloadBytes === marker.payloadBytes
      && spec !== null && marker.scriptBytes === spec.script;
    record(ok, `${marker.operation} marker parses to its published shape`,
      `${marker.payloadBytes} payload bytes, ${marker.scriptBytes} script bytes`);
  }

  const carrier = checkCarrier(corpus.carrier.key0, corpus.carrier.key1);
  record(
    carrier.derived !== null
      && carrier.derived.witnessScript === corpus.carrier.witnessScript
      && carrier.derived.scriptPubKey === corpus.carrier.scriptPubKey,
    "carrier derivation reproduces the published script and address",
    corpus.carrier.scriptPubKey,
  );

  const identity = deriveIdentity(
    0x03,
    corpus.identity.protocolId.split(":")[2],
    corpus.specHash,
    corpus.identity.objectDisplayId.split(":")[3],
  );
  record(identity.namespace === corpus.identity.namespace, "namespace derivation matches the published namespace", identity.namespace);
  record(identity.objectKey === corpus.identity.objectKey, "object key derivation matches the published object key", identity.objectKey);

  let leafLength = null;
  let leavesOk = true;
  const eventLeaves = [];
  for (const event of corpus.roots.events) {
    const preimage = fromHex(event.preimageHex).bytes;
    leafLength = preimage.length;
    const leaf = sha256(preimage);
    if (toHex(leaf) !== event.leafHex) leavesOk = false;
    eventLeaves.push(leaf);
  }
  record(leavesOk, "every published event preimage hashes to its published leaf", `${corpus.roots.events.length} leaves checked`);
  record(leafLength === 371, "event leaf preimage length", `${leafLength} bytes, which is 13 domain bytes plus 358 field bytes`);

  const objectLeaves = [];
  let snapshotsOk = true;
  let snapshotLength = null;
  for (const snapshot of corpus.roots.snapshots) {
    const preimage = fromHex(snapshot.preimageHex).bytes;
    snapshotLength = preimage.length;
    const leaf = sha256(preimage);
    if (toHex(leaf) !== snapshot.leafHex) snapshotsOk = false;
    objectLeaves.push(leaf);
  }
  record(snapshotsOk, "every published object snapshot hashes to its published leaf", `${corpus.roots.snapshots.length} leaves checked`);
  record(snapshotLength === 204, "object-state leaf preimage length", `${snapshotLength} bytes, which is 20 domain bytes plus 184 field bytes`);

  const eventRoot = merkleRoot(eventLeaves, "TANDEM/EVENT-NODE");
  record(toHex(eventRoot) === corpus.roots.eventRoot, "recomputed event root matches", corpus.roots.eventRoot);

  const objectRoot = merkleRoot(objectLeaves, "TANDEM/OBJECT-NODE");
  record(toHex(objectRoot) === corpus.roots.objectStateRoot, "recomputed object-state root matches", corpus.roots.objectStateRoot);

  const namespaceBytes = fromHex(corpus.identity.namespace).bytes;
  const initialRoot = sha256(concat([domain("TANDEM/STATE-EMPTY"), namespaceBytes]));
  record(toHex(initialRoot) === corpus.roots.initialStateRoot, "recomputed pre-INIT state root matches", corpus.roots.initialStateRoot);

  return results;
}

function renderSelfTest(results, target, summaryNode) {
  target.textContent = "";
  for (const result of results) {
    const item = document.createElement("li");
    item.className = result.ok ? "ok" : "bad";
    const mark = document.createElement("b");
    mark.textContent = result.ok ? "OK" : "NO";
    const text = document.createElement("span");
    text.textContent = result.detail ? `${result.label}: ${result.detail}` : result.label;
    item.append(mark, text);
    target.append(item);
  }
  const failures = results.filter((result) => !result.ok).length;
  summaryNode.textContent = failures === 0
    ? `All ${results.length} checks passed against the repository's published vectors.`
    : `${failures} of ${results.length} checks failed. Do not trust this page until that is explained.`;
}

/* ------------------------------------------------------------------- boot -- */

document.addEventListener("DOMContentLoaded", () => {
  const recordPanel = wireRecordPanel();
  const carrierPanel = wireCarrierPanel();
  const derivePanel = wireDerivePanel();

  recordPanel.run();
  carrierPanel.run();
  derivePanel.run();

  const summary = byId("selftest-summary");
  const list = byId("selftest-list");

  fetch("../vectors/generated/golden.json")
    .then((response) => {
      if (!response.ok) throw new Error(`the published corpus returned status ${response.status}`);
      return response.json();
    })
    .then((corpus) => {
      renderSelfTest(selfTest(corpus), list, summary);

      byId("load-vectors").addEventListener("click", () => {
        const mark = corpus.markers.find((marker) => marker.operation === "MARK");
        const rotate = corpus.markers.find((marker) => marker.operation === "ROTATE");
        recordPanel.inputA.value = mark.scriptHex;
        recordPanel.inputB.value = rotate.scriptHex;
        recordPanel.run();

        carrierPanel.inputA.value = corpus.carrier.key0;
        carrierPanel.inputB.value = corpus.carrier.key1;
        carrierPanel.run();
      });
      byId("load-vectors").disabled = false;

      byId("break-pair").addEventListener("click", () => {
        const mark = corpus.markers.find((marker) => marker.operation === "MARK");
        const close = corpus.markers.find((marker) => marker.operation === "CLOSE");
        recordPanel.inputA.value = mark.scriptHex;
        recordPanel.inputB.value = close.scriptHex;
        recordPanel.run();
      });
      byId("break-pair").disabled = false;
    })
    .catch((error) => {
      summary.textContent = `The published corpus could not be loaded, so the self test did not run: ${error.message}. Open this page from the published site, or run node scripts/serve.mjs and visit it over http. The panels above still work.`;
    });
});
