# Tandem Normative Specification

## 1. Status and byte contract

This file is the complete normative artifact for Tandem. An implementation conforms only when it applies the rules in this file exactly.

The protocol name `Tandem`, wire magic `TNDM`, human identifiers, and every `TANDEM/...` domain tag in this file are fixed protocol bytes. A user interface may use additional descriptive text, but it MUST NOT substitute another name in any wire value, identifier, hash preimage, or protocol calculation.

The bytes committed by `INIT.spec_hash` are the complete raw bytes of this file. The byte contract is:

1. UTF-8 without a byte order mark.
2. LF line endings, with byte `0x0a` as the only line separator.
3. No trailing horizontal whitespace on any line.
4. Exactly one final LF.

The SHA256 digest is computed externally and is not embedded in this file. Network-specific INIT transaction IDs and network-specific opening and closing heights are selected only after these bytes are frozen. Those deployment values do not alter or delay computation of `spec_hash` and are not part of this file.

The words MUST, MUST NOT, REQUIRED, SHALL, SHALL NOT, SHOULD, SHOULD NOT, and MAY describe conformance requirements. All bytes, scripts, transactions, blocks, and state transitions are interpreted under Bitcoin consensus rules in addition to this specification.

## 2. Primitive encodings

All integers are unsigned and little-endian unless a rule states otherwise. Arithmetic is performed as mathematical integer arithmetic with explicit bounds checks. Arithmetic MUST NOT wrap. A value is invalid if it does not fit its field or if an intermediate needed for validation cannot be computed exactly.

The following notation is used:

| Notation | Meaning |
|---|---|
| `u8` | One unsigned byte |
| `u16le` | Two-byte unsigned little-endian integer |
| `u32le` | Four-byte unsigned little-endian integer |
| `u64le` | Eight-byte unsigned little-endian integer |
| `SHA256(x)` | The 32 raw output bytes of SHA256 over byte string `x` |
| `HASH160(x)` | `RIPEMD160(SHA256(x))`, as 20 raw bytes |
| `a || b` | Byte concatenation |
| `zeroN` | Exactly `N` zero bytes |
| `txid_wire32` | A transaction hash in Bitcoin wire serialization order |
| `wtxid_wire32` | A witness transaction hash in Bitcoin wire serialization order |
| `block_hash_wire32` | A block hash in Bitcoin wire serialization order |
| `outpoint36` | `txid_wire32 || vout_u32le` |

Human-readable transaction IDs and block hashes use the conventional lowercase 64-character hexadecimal display order used by Bitcoin Core. Conversion from a displayed hash to a wire hash reverses the 32 displayed bytes exactly once. A raw SHA256 digest such as `spec_hash`, a namespace commitment, an object key, or a content commitment is never byte-reversed.

Every quoted domain string is encoded as its displayed ASCII bytes. A displayed `\0` in a domain string contributes one literal byte `0x00`.

Absent fixed-width values are all zero bytes except that an absent `state_seq` and an event without a marker use `0xffffffff`. In particular, an absent outpoint is `zero36`, not a null txid followed by `0xffffffff`.

## 3. Protocol identity and external binding

A deployment binding consists of exactly:

1. One Bitcoin network from the network table below.
2. One configured INIT txid on that network.
3. The SHA256 digest of the raw bytes of this file.

The binding is immutable for one protocol identifier. An implementation MUST NOT select an INIT by first-seen order, lowest txid, block order, or marker discovery. An alternate INIT txid defines an alternate protocol identifier even if its payload fields are identical.

Actual INIT txids and actual height values are external deployment values. This specification contains no network-specific txid or height. `H_open` and `H_close` are read from the configured INIT payload after it confirms and passes validation.

The network codes and labels are:

| Code | Label |
|---:|---|
| `0x00` | `mainnet` |
| `0x01` | `signet` |
| `0x02` | `testnet4` |
| `0x03` | `regtest` |

The protocol identifier is:

```text
tndm:<network_label>:<configured_init_txid_display>
```

The object display identifier is:

```text
tandem:<network_label>:<configured_init_txid_display>:<create_txid_display>:1
```

The final `1` is decimal vout 1.

The namespace commitment is:

```text
namespace_commitment =
  SHA256("TANDEM/NAMESPACE\0" ||
         network_u8 ||
         configured_init_txid_wire32 ||
         spec_hash32)
```

The namespace can be derived before INIT validation because the expected network, configured txid, and frozen `spec_hash` are known. Only a valid confirmed configured INIT activates state under that namespace.

For a valid CREATE at vout 1, the binary object key is:

```text
object_key =
  SHA256("TANDEM/OBJECT\0" ||
         namespace_commitment ||
         create_txid_wire32 ||
         uint32_le(1))
```

Binary object keys, not display identifiers, are used for equality, ordering, database keys, event roots, and object-state roots.

## 4. Normative constants

| Constant | Value |
|---|---|
| Magic | ASCII `TNDM`, hex `54 4e 44 4d` |
| Marker format | `0x01` |
| INIT opcode | `0x00` |
| CREATE opcode | `0x01` |
| MARK opcode | `0x02` |
| ROTATE opcode | `0x03` |
| CLOSE opcode | `0x04` |
| Active state vout field | `0x01` |
| Terminal state vout field | `0xff` |
| Carrier value | 20,000 satoshis |
| Refund delay | 52,560 blocks, numeric sequence `0x0000cd50` |
| Founding window length | 4,320 blocks |
| INIT lead | 1,008 blocks |
| P2WPKH change floor | 1,000 satoshis |
| Transaction version | 2 |
| Transaction locktime | 0 |
| Replaceable input sequence | `0xfffffffd` |
| INIT input sequence | `0xffffffff` |
| Signature hash type | ECDSA `SIGHASH_ALL`, byte `0x01` |
| Maximum marker payload | 80 bytes |
| Maximum marker script | 83 bytes |

The MARK kinds are:

| Value | Kind |
|---:|---|
| `0x00` | note |
| `0x01` | image |
| `0x02` | audio |
| `0x03` | milestone |
| `0x04` | link |
| `0x05` | opaque data |

The CLOSE reasons are:

| Value | Reason |
|---:|---|
| `0x00` | mutual completion |
| `0x01` | relationship ended |
| `0x02` | migrate outside Tandem |
| `0x03` | other |

No other opcode, kind, reason, flag, marker format, network byte, state vout value, or reserved value is defined in Tandem.

## 5. Bitcoin scripts and signatures

### 5.1 Native P2WPKH

For a compressed public key `key`, the required native P2WPKH scriptPubKey is:

```text
OP_0 PUSH20 HASH160(key)
```

Its serialized bytes are `00 14 <20-byte HASH160>`. A required P2WPKH input has an empty scriptSig and exactly two witness elements:

```text
<DER_signature_plus_01> <compressed_public_key>
```

The public key MUST be a valid compressed secp256k1 point of exactly 33 bytes beginning with `0x02` or `0x03`. Its HASH160 MUST equal the witness program in the spent prevout. The signature excluding its final sighash byte MUST be strict DER and low-S. Its final byte MUST be `0x01`, and it MUST verify for that input using SegWit v0 signature hashing and the exact prevout amount.

### 5.2 Tandem carrier

The two carrier keys are valid, distinct compressed secp256k1 points sorted by unsigned bytewise lexicographic order, with `key0 < key1`.

The witness script is exactly:

```text
OP_2 PUSH33 key0 PUSH33 key1 OP_2 OP_CHECKMULTISIG
```

Its serialized bytes are:

```text
52 21 <key0_33> 21 <key1_33> 52 ae
```

The witness script is exactly 71 bytes. Its native P2WSH scriptPubKey is:

```text
OP_0 PUSH32 SHA256(witnessScript)
```

Its serialized length is 34 bytes. A carrier input has an empty scriptSig and exactly four witness elements:

```text
<empty> <signature_for_key0_plus_01> <signature_for_key1_plus_01> <witnessScript>
```

The first witness element MUST be empty. Both signatures MUST satisfy the same strict DER, low-S, `SIGHASH_ALL`, SegWit v0 amount, and exact-input requirements as section 5.1. The first signature MUST verify for key0 and the second for key1.

### 5.3 Confirmation provenance

Every predecessor carrier and every noncarrier funding input required by a valid operation MUST have been confirmed in a block strictly earlier than the block containing the operation. A prevout created earlier in the same block fails this rule. Mempool presence, first-seen time, and transaction arrival order never establish confirmation provenance.

## 6. Marker script grammar

### 6.1 Marker candidate detection

An output is a Tandem marker candidate when all of the following can be established from its script bytes:

1. The first opcode is `OP_RETURN` (`0x6a`).
2. The next opcode is a direct data push from `0x01` through `0x4b`, or one of `OP_PUSHDATA1`, `OP_PUSHDATA2`, or `OP_PUSHDATA4`.
3. The declared pushed data is at least four bytes long.
4. At least its first four declared data bytes are physically present.
5. Those four bytes are `54 4e 44 4d`.

Candidate status does not require a minimal push, a complete declared payload, a known marker format, a known opcode, an exact operation length, zero output value, or absence of trailing script bytes. Those are validation conditions. This broad candidate rule makes malformed Tandem markers deterministic and prevents a second malformed marker from evading `MULTIPLE_MARKERS`.

If byte offset 6 of a candidate payload is physically present and equals `0x00`, the candidate is an INIT candidate. An INIT candidate in any transaction other than the configured INIT txid is foreign to this protocol identifier and is removed before marker counting. It emits no event by itself. If that transaction also spends an active carrier, processing continues as though the foreign INIT candidate were absent.

### 6.2 Valid marker script

A valid marker output has value zero and its script contains exactly `OP_RETURN`, one minimal data push, and one exact payload, with no trailing opcode or byte.

The only valid encodings are:

| Operation | Payload bytes | Exact script prefix | Script bytes |
|---|---:|---|---:|
| INIT | 59 | `6a 3b` | 61 |
| CREATE | 40 | `6a 28` | 42 |
| MARK | 78 | `6a 4c 4e` | 81 |
| ROTATE | 44 | `6a 2c` | 46 |
| CLOSE | 80 | `6a 4c 50` | 83 |

For a structurally readable candidate, the parser first enforces:

1. A complete push-length prefix.
2. No payload shorter than seven bytes or longer than 80 bytes.
3. Declared push length equal to physically present payload length.
4. No bytes after the pushed payload.
5. Minimal push encoding.
6. If opcode byte 6 is defined, the exact payload length for that opcode, regardless of the marker-format byte.

Failure of any item is `BAD_MARKER_ENCODING_OR_LENGTH`. A structurally valid payload with an undefined opcode can have any length from 7 through 80 and reaches marker-format and opcode validation.

Every valid operation has exactly one marker candidate, at vout 0, and no other OP_RETURN output.

## 7. Payload grammar

Fields are byte ranges `[start,end)`. All integer fields use the primitive encoding in section 2.

### 7.1 INIT

INIT is exactly 59 payload bytes:

| Range | Size | Field | Required value |
|---|---:|---|---|
| `[0,4)` | 4 | magic | `TNDM` |
| `[4,5)` | 1 | marker format | `0x01` |
| `[5,6)` | 1 | network | bound network code |
| `[6,7)` | 1 | opcode | `0x00` |
| `[7,11)` | 4 | `H_open` | validated in section 9.1 |
| `[11,15)` | 4 | `H_close` | validated in section 9.1 |
| `[15,23)` | 8 | `carrier_value` | 20,000 |
| `[23,27)` | 4 | `refund_delay` | 52,560 |
| `[27,59)` | 32 | `spec_hash` | SHA256 of the exact bytes of this file |

### 7.2 CREATE

CREATE is exactly 40 payload bytes:

| Range | Size | Field | Required value |
|---|---:|---|---|
| `[0,4)` | 4 | magic | `TNDM` |
| `[4,5)` | 1 | marker format | `0x01` |
| `[5,6)` | 1 | network | bound network code |
| `[6,7)` | 1 | opcode | `0x01` |
| `[7,8)` | 1 | `state_vout` | `0x01` |
| `[8,40)` | 32 | namespace | configured namespace commitment |

CREATE keys are not duplicated in the payload. They are the keys revealed by vin 0 and vin 1.

### 7.3 MARK

MARK is exactly 78 payload bytes:

| Range | Size | Field | Required value |
|---|---:|---|---|
| `[0,4)` | 4 | magic | `TNDM` |
| `[4,5)` | 1 | marker format | `0x01` |
| `[5,6)` | 1 | network | bound network code |
| `[6,7)` | 1 | opcode | `0x02` |
| `[7,8)` | 1 | `state_vout` | `0x01` |
| `[8,40)` | 32 | namespace | configured namespace commitment |
| `[40,44)` | 4 | `state_seq` | predecessor sequence plus one |
| `[44,45)` | 1 | kind | one defined MARK kind |
| `[45,46)` | 1 | flags | `0x00` |
| `[46,78)` | 32 | chapter commitment | any nonzero 32-byte value |

### 7.4 ROTATE

ROTATE is exactly 44 payload bytes:

| Range | Size | Field | Required value |
|---|---:|---|---|
| `[0,4)` | 4 | magic | `TNDM` |
| `[4,5)` | 1 | marker format | `0x01` |
| `[5,6)` | 1 | network | bound network code |
| `[6,7)` | 1 | opcode | `0x03` |
| `[7,8)` | 1 | `state_vout` | `0x01` |
| `[8,40)` | 32 | namespace | configured namespace commitment |
| `[40,44)` | 4 | `state_seq` | predecessor sequence plus one |

The successor keys are not duplicated in the payload. They are the keys revealed by vin 1 and vin 2.

### 7.5 CLOSE

CLOSE is exactly 80 payload bytes:

| Range | Size | Field | Required value |
|---|---:|---|---|
| `[0,4)` | 4 | magic | `TNDM` |
| `[4,5)` | 1 | marker format | `0x01` |
| `[5,6)` | 1 | network | bound network code |
| `[6,7)` | 1 | opcode | `0x04` |
| `[7,8)` | 1 | `state_vout` | `0xff` |
| `[8,40)` | 32 | namespace | configured namespace commitment |
| `[40,44)` | 4 | `state_seq` | predecessor sequence plus one |
| `[44,45)` | 1 | reason | one defined CLOSE reason |
| `[45,48)` | 3 | reserved | `00 00 00` |
| `[48,80)` | 32 | close commitment | any 32-byte value, including zero |

REFUND has no marker and no payload.

## 8. Content commitment domains

Content availability is not required for transaction validity. A parser validates the on-chain commitment rules without fetching, interpreting, or trusting content.

For a MARK, an optional manifest is represented by its 32-byte `manifest_sha256`. Its expected chapter commitment is:

```text
SHA256("TANDEM/CHAPTER\0" ||
       namespace_commitment ||
       genesis_outpoint36 ||
       predecessor_outpoint36 ||
       state_seq_u32le ||
       kind_u8 ||
       manifest_sha256)
```

For a CLOSE with a nonzero marker commitment, an optional close manifest is represented by `close_manifest_sha256`. Its expected close commitment is:

```text
SHA256("TANDEM/CLOSE\0" ||
       namespace_commitment ||
       genesis_outpoint36 ||
       predecessor_outpoint36 ||
       state_seq_u32le ||
       reason_u8 ||
       close_manifest_sha256)
```

`genesis_outpoint36` is the object's CREATE outpoint. `predecessor_outpoint36` is the active carrier spent by the MARK or CLOSE. A MARK is protocol-valid when its on-chain commitment is nonzero even if no manifest is available or a supplied manifest does not match. A CLOSE may use zero to indicate no close manifest. Manifest matching is a presentation verification result and never changes an on-chain event's validity or authoritative state.

## 9. Operation validation

All transaction counts are exact. An output amount is a satoshi integer. A positive fee means strictly greater than zero. Except for REFUND, failures are assigned through the precedence rules in section 11.

### 9.1 INIT

The configured INIT transaction is valid only when all of the following hold:

1. Its txid is the externally configured INIT txid and it is confirmed on the bound network.
2. Transaction version is 2 and locktime is 0.
3. It has exactly one input and two outputs.
4. Vin 0 sequence is `0xffffffff`.
5. Vin 0 spends a native P2WPKH prevout confirmed in an earlier block, reveals its bound compressed key, and has a valid `SIGHASH_ALL` signature.
6. Vout 0 is the exact zero-value INIT marker.
7. Vout 1 is native P2WPKH to the vin 0 key and is at least 1,000 satoshis.
8. The input value minus vout 1 value is the complete transaction fee and is positive.
9. The marker network is the bound network.
10. `carrier_value` is 20,000 and `refund_delay` is 52,560.
11. `spec_hash` is SHA256 of the exact bytes of this file.
12. `H_open + 4320` fits `u32` and equals `H_close`.
13. `INIT_confirmation_height + 1008` is computed without overflow and is less than or equal to `H_open`.

The configured INIT uses no in-place protocol replacement. If it is absent, orphaned, conflicted away, or invalid, this protocol identifier is not activated. Another txid is another protocol identifier.

### 9.2 CREATE

A CREATE is valid only when all of the following hold:

1. The configured INIT is valid and authoritative.
2. Transaction version is 2 and locktime is 0.
3. It has exactly two inputs and four outputs.
4. Vin 0 and vin 1 each have sequence `0xfffffffd`.
5. Each input spends a native P2WPKH prevout confirmed in an earlier block and satisfies section 5.1.
6. The key revealed by vin 0 is `key0`; the key revealed by vin 1 is `key1`; both are valid and distinct; and `key0 < key1` by unsigned bytewise lexicographic order.
7. Vout 0 is the exact zero-value CREATE marker.
8. Vout 1 is exactly 20,000 satoshis to the exact carrier P2WSH derived from key0 and key1.
9. Vout 2 is native P2WPKH to key0 and is at least 1,000 satoshis.
10. Vout 3 is native P2WPKH to key1 and is at least 1,000 satoshis.
11. There is no extra data, payment, marker, input, or output.
12. Let `D0 = input0_value - output2_value` and `D1 = input1_value - output3_value`. Both differences MUST be computable without underflow.
13. Let `F = D0 + D1 - 20000`. `F` MUST be computable and positive.
14. `D0 = 10000 + ceil(F / 2)` and `D1 = 10000 + floor(F / 2)`.
15. The CREATE confirmation height `h` satisfies `h >= H_open`.

A valid CREATE at height `h` creates sequence 0. It is founding exactly when `H_open <= h < H_close`. A valid CREATE at or after `H_close` creates an ordinary, nonfounding object. A CREATE before `H_open` is invalid.

### 9.3 MARK

A MARK is valid only when all of the following hold:

1. Transaction version is 2 and locktime is 0.
2. It has exactly two inputs and three outputs.
3. Both inputs have sequence `0xfffffffd`.
4. Vin 0 spends the one active predecessor carrier, which was confirmed in an earlier block, and satisfies section 5.2 with the current key pair.
5. Vin 1 spends one native P2WPKH fee-sponsor prevout confirmed in an earlier block and satisfies section 5.1.
6. The sponsor key equals current key0 or current key1.
7. Vout 0 is the exact zero-value MARK marker.
8. The marker `state_seq` equals predecessor `state_seq + 1`. A predecessor sequence of `0xffffffff` cannot be incremented and fails.
9. The marker kind is defined, flags is zero, and chapter commitment is not all zero.
10. Vout 1 is exactly 20,000 satoshis to a P2WSH script identical byte-for-byte to the predecessor carrier scriptPubKey.
11. Vout 2 is native P2WPKH to the sponsor key and is at least 1,000 satoshis.
12. Let `F = sponsor_input_value - output2_value`. `F` MUST be computable and positive.
13. Since predecessor and successor carrier values are identical, `F` is the entire transaction fee. No carrier value pays the fee.

A valid MARK appends exactly one chapter, increments sequence by one, retains the current keys, and makes `(txid,1)` the active carrier.

### 9.4 ROTATE

A ROTATE is valid only when all of the following hold:

1. Transaction version is 2 and locktime is 0.
2. It has exactly three inputs and four outputs.
3. All inputs have sequence `0xfffffffd`.
4. Vin 0 spends the one active predecessor carrier, which was confirmed in an earlier block, and satisfies section 5.2 with the old current key pair.
5. Vin 1 and vin 2 each spend a native P2WPKH prevout confirmed in an earlier block and satisfy section 5.1.
6. The key revealed by vin 1 is successor key0; the key revealed by vin 2 is successor key1; both are valid and distinct; and successor key0 is bytewise less than successor key1.
7. At least one successor key differs from the corresponding old key, so the successor pair is not identical to the old pair.
8. Vout 0 is the exact zero-value ROTATE marker.
9. The marker `state_seq` equals predecessor `state_seq + 1`. A predecessor sequence of `0xffffffff` cannot be incremented and fails.
10. Vout 1 is exactly 20,000 satoshis to the exact carrier P2WSH derived from successor key0 and successor key1.
11. Vout 2 is native P2WPKH to successor key0 and is at least 1,000 satoshis.
12. Vout 3 is native P2WPKH to successor key1 and is at least 1,000 satoshis.
13. Let `D0 = input1_value - output2_value` and `D1 = input2_value - output3_value`. Both differences MUST be computable without underflow.
14. Let `F = D0 + D1`. `F` MUST be computable and positive.
15. `D0 = ceil(F / 2)` and `D1 = floor(F / 2)`.

A valid ROTATE increments sequence by one, replaces the current keys with the successor keys, preserves chapter count, and makes `(txid,1)` the active carrier.

### 9.5 CLOSE

A CLOSE is valid only when all of the following hold:

1. Transaction version is 2 and locktime is 0.
2. It has exactly one input and three outputs.
3. Vin 0 has sequence `0xfffffffd`.
4. Vin 0 spends the one active predecessor carrier, which was confirmed in an earlier block, and satisfies section 5.2 with the current key pair.
5. Vout 0 is the exact zero-value CLOSE marker.
6. The marker `state_seq` equals predecessor `state_seq + 1`. A predecessor sequence of `0xffffffff` cannot be incremented and fails.
7. The reason is defined and all three reserved bytes are zero.
8. Vout 1 is native P2WPKH to current key0.
9. Vout 2 is native P2WPKH to current key1.
10. Vout 1 and vout 2 have exactly equal, strictly positive values.
11. Let `F = 20000 - output1_value - output2_value`. `F` MUST be computable and positive and is the complete transaction fee.

A valid CLOSE increments sequence by one, creates no successor, retains the last current keys, and terminates the object with status `CLOSED`.

### 9.6 REFUND

REFUND is recognized only through the markerless dispatch branch in section 11. A REFUND is valid only when all of the following hold:

1. Transaction version is 2 and locktime is 0.
2. It has exactly one input and two outputs.
3. It has no OP_RETURN output.
4. Vin 0 spends the one active carrier and satisfies section 5.2 with the current key pair.
5. Vin 0 sequence is exactly decimal 52,560, numeric value `0x0000cd50`, serialized as `50 cd 00 00`. The BIP68 disable and type flags are clear.
6. Vout 0 is native P2WPKH to current key0.
7. Vout 1 is native P2WPKH to current key1.
8. Vout 0 and vout 1 have exactly equal, strictly positive values.
9. Let `F = 20000 - output0_value - output1_value`. `F` MUST be computable and positive and is the complete transaction fee.
10. Bitcoin consensus relative-locktime rules consider the input mature in the containing block.

The relative delay starts at the confirmation height of the exact carrier being spent. Every confirmed MARK or ROTATE replaces the carrier and restarts the delay. A valid REFUND does not increment `state_seq`; it records the current sequence, creates no successor, retains the current keys, and terminates the object with status `REFUNDED`.

Every REFUND validation failure is represented by the single stable reason `BAD_REFUND_SHAPE_OR_MATURITY`.

## 10. Authoritative state machine

Object statuses are:

| Value | Status |
|---:|---|
| `0x00` | `ACTIVE` |
| `0x01` | `CLOSED` |
| `0x02` | `REFUNDED` |
| `0x03` | `EXITED_NONCANONICAL` |

The complete state transitions are:

```text
no object --valid CREATE--> ACTIVE sequence 0
ACTIVE --valid MARK--> ACTIVE sequence + 1, chapter_count + 1
ACTIVE --valid ROTATE--> ACTIVE sequence + 1, successor keys
ACTIVE --valid CLOSE--> CLOSED sequence + 1
ACTIVE --valid REFUND--> REFUNDED, sequence unchanged
ACTIVE --any other confirmed carrier spend--> EXITED_NONCANONICAL, sequence unchanged
```

Terminal objects never become active again except by authoritative-chain reorganization that removes their terminal spend. CLOSED, REFUNDED, and EXITED_NONCANONICAL have no Tandem successor operation.

Any confirmed transaction that consumes an active carrier but does not validate as one allowed operation MUST atomically terminate that object as `EXITED_NONCANONICAL`. The spend is not ignored because the active UTXO no longer exists. If one transaction consumes several active carriers, every consumed object terminates. Tandem never combines, splits, or forks objects.

For each object:

1. The genesis outpoint is permanently its valid CREATE outpoint `(create_txid,1)`.
2. Sequence starts at 0.
3. MARK, ROTATE, and CLOSE require and record exactly predecessor sequence plus one.
4. REFUND and nonauthoritative exit retain the predecessor sequence.
5. An active object has exactly one current outpoint, one sorted current key pair, carrier value 20,000, and the greatest valid state sequence.
6. A valid MARK alone increments `chapter_count`.
7. A terminal object has no current outpoint, retains its last key pair and sequence, and records its terminal txid.
8. Invalid no-state events never mutate an object or a counter.

A valid CREATE is founding exactly when its authoritative confirmation height lies in `[H_open,H_close)`. Founding status is immutable while that CREATE remains at that authoritative height. A reorganization can remove the CREATE or change its height and therefore its founding status.

The post-block counters are:

1. `founding_created`: all authoritative valid CREATE objects whose CREATE height is in `[H_open,H_close)`, including terminal objects.
2. `all_objects`: every authoritative valid CREATE at or after `H_open`, including founding, ordinary, active, and terminal objects.
3. `active_objects`: every object whose post-block status is ACTIVE.

CLOSE, REFUND, and nonauthoritative exit reduce only `active_objects`. A reorganization may change any counter. Mempool transactions never change authoritative state or counters.

## 11. Deterministic detection and rejection precedence

### 11.1 Block scope

The configured INIT transaction is located by exact txid in the authoritative chain. Blocks before its authoritative confirmation block are outside this namespace's rooted history.

When the configured txid confirms, an indexer first validates that transaction as the configured INIT. If valid, its payload supplies `H_open` and `H_close`, and the indexer classifies every transaction in that block in transaction-index order, including transactions before and after the INIT transaction. The configured transaction itself is classified as INIT. No CREATE in that block can be valid because the INIT lead rule places `H_open` at least 1,008 blocks later.

If the configured transaction is invalid, the indexer records its deterministic invalid event, sets the protocol identifier to `FAILED_INIT`, and classifies no other transaction under this namespace while that invalid INIT remains authoritative. It still computes the roots specified in section 14 from the INIT block onward with an empty object set and zero counters. Later blocks have empty event sets. A reorganization that disconnects the configured transaction rolls back this result. If the same configured txid later confirms on the new authoritative branch, validation starts again using its new confirmation context.

### 11.2 Top-level dispatch

For each confirmed transaction in scope, perform these steps in order:

1. Find all marker candidates by section 6.1.
2. Remove foreign INIT candidates whose payload byte 6 is `0x00` and whose transaction txid is not the configured INIT txid.
3. If this is the configured INIT txid and no marker remains, emit one class 0 event with reason `BAD_MARKER_ENCODING_OR_LENGTH`, use event type `INVALID`, set `event_index` to `0xffffffff`, and stop. This result makes the INIT fail.
4. Join every input prevout against the active object state as it exists immediately before this transaction in authoritative transaction order. The matches are `carrier_spends`.
5. If more than one marker remains, stop ordinary validation. If `carrier_spends` is empty, emit one class 0 event with reason `MULTIPLE_MARKERS`. Otherwise emit one class 2 terminal event for every carrier spend, all with reason `MULTIPLE_MARKERS`, and terminate those objects.
6. If more than one active carrier is spent, emit one class 2 terminal event per carrier with reason `MULTIPLE_CARRIERS` and terminate them. This step applies whether zero or one marker remains.
7. If no marker remains and exactly one carrier is spent, inspect transaction shape. If it has exactly one input and two outputs, dispatch only to REFUND recognition. A valid match emits REFUND. Any failure emits one terminal event with reason `BAD_REFUND_SHAPE_OR_MATURITY`. If it does not have exactly one input and two outputs, emit one terminal event with reason `UNMARKED_CARRIER_SPEND`.
8. If no marker remains and no carrier is spent, emit no event.
9. If exactly one marker remains, parse and validate it. The configured INIT txid requires opcode INIT. A different defined opcode is a fixed-field failure; an undefined opcode remains `UNKNOWN_OPCODE`. Every opcode INIT in another transaction was already removed as foreign.
10. A valid operation emits its valid event and applies its exact state delta.
11. An invalid single-marker transaction with no carrier spend emits one class 0 event and no state delta.
12. An invalid single-marker transaction with one carrier spend emits one class 2 `EXITED_NONCANONICAL` event, records the selected validation reason, and terminates the consumed object.

Top-level steps 5 through 7 take precedence over numeric reason-code order. Therefore a transaction with multiple markers and multiple carriers receives `MULTIPLE_MARKERS`, while a transaction with one or zero markers and multiple carriers receives `MULTIPLE_CARRIERS`.

### 11.3 Single-marker validation order

Within a selected single-marker operation, evaluate safely testable conditions in ascending reason-code order and return the lowest failing code. A parser MUST NOT guess a field that cannot be decoded. A state-dependent comparison that cannot be made because no active predecessor exists is deferred to `PREDECESSOR_NOT_ACTIVE`; independent earlier checks remain testable.

The ordered validation groups are:

| Code | Validation group |
|---:|---|
| `0x0002` | Push prefix, completeness, minimality, script termination, maximum size, and exact known-opcode payload length |
| `0x0003` | Marker format |
| `0x0004` | Network |
| `0x0005` | Opcode |
| `0x0006` | Non-INIT namespace |
| `0x0007` | Fixed payload fields, supported kind or reason, flags, reserved bytes, INIT constants and `spec_hash`, and required INIT opcode at the configured txid |
| `0x0010` | Transaction version and locktime |
| `0x0011` | Input count, fixed input roles, input order, and fixed sequences |
| `0x0012` | Output count, fixed output roles, marker position, and absence of another OP_RETURN output |
| `0x0013` | Earlier-block confirmation provenance |
| `0x0014` | Required prevout script types, scriptSig shapes, witness shapes, and carrier witness script shape |
| `0x0015` | Curve validity, distinctness, sorting, HASH160 binding, sponsor membership, current carrier binding, and requirement that a ROTATE pair differs |
| `0x0016` | Signature validity, signature order, strict DER, low-S, and `SIGHASH_ALL` |
| `0x0017` | Marker output value, fixed carrier value, CREATE carrier script, and non-successor change or payout scripts and destinations |
| `0x0018` | Positive exact fee and checked fee arithmetic |
| `0x0019` | Participant fee split, equal payout, sponsor arithmetic, and 1,000-satoshi change floors |
| `0x001a` | Active authoritative predecessor existence |
| `0x001b` | Exact state sequence increment and overflow prevention |
| `0x001c` | MARK successor script preservation or ROTATE successor derivation |
| `0x001d` | Nonzero MARK commitment |
| `0x001e` | INIT height relations or CREATE opening height |

For MARK and ROTATE, a vout 1 amount other than 20,000 is `BAD_OUTPUT_SCRIPT_OR_VALUE`; after that amount is valid, a wrong vout 1 successor script is `BAD_SUCCESSOR`. For CREATE, a wrong vout 1 carrier script is `BAD_OUTPUT_SCRIPT_OR_VALUE`. CLOSE and REFUND equality failures are fee-split failures after their output destinations and positive fee are established.

An INIT whose height addition overflows is `BAD_HEIGHT_OR_PHASE`. A marked transition whose predecessor sequence is `0xffffffff`, or whose marker sequence is not predecessor plus one, is `BAD_STATE_SEQUENCE`. REFUND and nonauthoritative exit may terminate a carrier at sequence `0xffffffff` because neither increments it.

## 12. Stable reason registry and event classes

The exhaustive Tandem reason registry is:

| Code | Stable name | Meaning |
|---:|---|---|
| `0x0000` | `VALID` | Exact recognized INIT, CREATE, MARK, ROTATE, CLOSE, or REFUND |
| `0x0001` | `MULTIPLE_MARKERS` | More than one remaining Tandem marker candidate |
| `0x0002` | `BAD_MARKER_ENCODING_OR_LENGTH` | Nonminimal push, malformed script, incomplete push, trailing script data, oversized payload, or wrong exact payload length |
| `0x0003` | `UNKNOWN_MARKER_FORMAT` | Marker format is not `0x01` |
| `0x0004` | `WRONG_NETWORK` | Marker network differs from the bound chain |
| `0x0005` | `UNKNOWN_OPCODE` | Opcode is not defined for Tandem |
| `0x0006` | `WRONG_NAMESPACE` | A non-INIT namespace commitment differs from the configured INIT namespace |
| `0x0007` | `UNSUPPORTED_OR_RESERVED_FIELD` | A fixed field, constant, supported kind or reason, flag, reserved byte, configured INIT opcode, or INIT `spec_hash` differs |
| `0x0010` | `BAD_TX_VERSION_OR_LOCKTIME` | Transaction version or locktime differs from the exact template |
| `0x0011` | `BAD_INPUT_COUNT_OR_ORDER` | Input count, position, role, or required sequence differs |
| `0x0012` | `BAD_OUTPUT_COUNT_OR_ORDER` | Output count, position, role, marker position, or only-OP_RETURN requirement differs |
| `0x0013` | `UNCONFIRMED_OR_SAME_BLOCK_PREVOUT` | A required prior output was not confirmed in an earlier block |
| `0x0014` | `BAD_INPUT_SCRIPT` | A prevout, scriptSig, witness stack, or revealed witness script has the wrong required form |
| `0x0015` | `BAD_KEY_ORDER_OR_BINDING` | A key is invalid, duplicate, unsorted, unchanged when rotation is required, or not bound to its required input, output, sponsor, or carrier role |
| `0x0016` | `BAD_SIGNATURE_OR_SIGHASH` | A required signature is invalid, wrongly ordered, non-DER, high-S, or not `SIGHASH_ALL` |
| `0x0017` | `BAD_OUTPUT_SCRIPT_OR_VALUE` | Marker value, fixed carrier value, CREATE carrier script, or a required non-successor destination script or key differs |
| `0x0018` | `NONPOSITIVE_OR_INVALID_FEE` | Fee is zero, negative, overflowed, underflowed, or cannot be computed exactly |
| `0x0019` | `BAD_FEE_SPLIT_OR_CHANGE` | A debit split, equal payout, sponsor change equation, or 1,000-satoshi change floor differs after fee positivity is established |
| `0x001a` | `PREDECESSOR_NOT_ACTIVE` | The operation does not reference the active authoritative predecessor required for it |
| `0x001b` | `BAD_STATE_SEQUENCE` | State sequence is not predecessor plus one or cannot be incremented |
| `0x001c` | `BAD_SUCCESSOR` | MARK does not preserve the carrier script or ROTATE does not derive the proposed successor carrier script |
| `0x001d` | `BAD_COMMITMENT` | MARK chapter commitment is all zero |
| `0x001e` | `BAD_HEIGHT_OR_PHASE` | INIT lead or window relation fails, arithmetic overflows, or CREATE confirms before `H_open` |
| `0x001f` | `BAD_REFUND_SHAPE_OR_MATURITY` | A markerless one-carrier, one-input, two-output candidate fails any exact REFUND rule |
| `0x0020` | `MULTIPLE_CARRIERS` | A transaction spends more than one active Tandem carrier |
| `0x0030` | `UNMARKED_CARRIER_SPEND` | An active carrier is spent without a remaining Tandem marker and the transaction is not dispatched as REFUND |

`VALID` is used only for a recognized valid operation. Names and numeric values are permanent within Tandem.

Event types are:

| Value | Type |
|---:|---|
| `0x00` | `INIT` |
| `0x01` | `CREATE` |
| `0x02` | `MARK` |
| `0x03` | `ROTATE` |
| `0x04` | `CLOSE` |
| `0x05` | `REFUND` |
| `0x06` | `EXITED_NONCANONICAL` |
| `0x07` | `INVALID` |

Validity classes are:

| Value | Class |
|---:|---|
| `0x00` | `INVALID_NO_STATE` |
| `0x01` | `VALID_OPERATION` |
| `0x02` | `TERMINAL_NONCANONICAL` |

A class 0 event uses the attempted operation type only when exactly one marker exposes marker format `0x01` and a defined opcode. Otherwise it uses type `INVALID`. A class 2 event always uses type `EXITED_NONCANONICAL`, even when its reason came from an attempted marked operation.

## 13. Event construction

### 13.1 Event cardinality and ordering fields

For exactly one remaining marker, `event_index` is that marker's actual vout as `u32`. For multiple markers it is the lowest candidate vout. For an event with no marker, including a missing configured INIT marker, REFUND, or markerless exit, it is `0xffffffff`.

`sub_index` is zero for an ordinary single event. If one transaction consumes multiple active carriers, emit one terminal event per carrier. Order those events by unsigned lexicographic binary `object_key` and assign consecutive `sub_index` values starting at zero.

A multiple-marker transaction with no active carrier emits one class 0 event. Thus one transaction emits zero or one ordinary event, or one terminal event for each active carrier it consumes.

### 13.2 Event leaf

Each event leaf is exactly:

```text
SHA256("TANDEM/EVENT\0" ||
  namespace32 ||
  block_hash_wire32 ||
  height_u64le ||
  tx_index_u32le ||
  event_index_u32le ||
  sub_index_u32le ||
  event_type_u8 ||
  validity_class_u8 ||
  reason_u16le ||
  txid_wire32 ||
  wtxid_wire32 ||
  object_key32 ||
  state_seq_u32le ||
  predecessor_outpoint36 ||
  successor_outpoint36 ||
  key0_33 ||
  key1_33 ||
  commitment32)
```

The preimage after the 16-byte domain tag is exactly 358 bytes, and the complete preimage is exactly 374 bytes. `height` is the containing block height. `tx_index` is the zero-based transaction index including coinbase. `reason` is encoded as `u16le`.

### 13.3 Valid operation field population

All valid operation events have class `VALID_OPERATION` and reason `VALID`. Their operation-specific fields are exactly:

| Type | namespace | object key | state sequence | predecessor | successor | key0 and key1 | commitment |
|---|---|---|---|---|---|---|---|
| INIT | configured namespace | `zero32` | `0xffffffff` | `zero36` | `zero36` | `zero33`, `zero33` | INIT payload `spec_hash` |
| CREATE | configured namespace | derived CREATE object key | `0` | `zero36` | `(create_txid_wire32,1)` | sorted keys revealed by vin 0 and vin 1 | `zero32` |
| MARK | configured namespace | predecessor object's key | marker sequence | consumed active outpoint | `(mark_txid_wire32,1)` | predecessor current key0 and key1 | marker chapter commitment |
| ROTATE | configured namespace | predecessor object's key | marker sequence | consumed active outpoint | `(rotate_txid_wire32,1)` | sorted successor keys revealed by vin 1 and vin 2 | `zero32` |
| CLOSE | configured namespace | predecessor object's key | marker sequence | consumed active outpoint | `zero36` | predecessor current key0 and key1 | marker close commitment |
| REFUND | configured namespace | predecessor object's key | predecessor current sequence | consumed active outpoint | `zero36` | predecessor current key0 and key1 | `zero32` |

The INIT commitment field is `spec_hash`, not a marker-independent zero. CREATE has no payload commitment and therefore uses `zero32`. MARK uses its chapter commitment. ROTATE commits successor keys through its inputs and successor script but uses `zero32` in the event commitment field. CLOSE uses its marker commitment, including `zero32` when the marker commitment is zero. REFUND uses the current, nonincremented sequence and current keys, and uses `zero32` as commitment.

### 13.4 Invalid no-state field population

For class `INVALID_NO_STATE`:

1. `object_key32`, both outpoints, both keys, and `commitment32` are absent zero values.
2. `state_seq` is `0xffffffff`.
3. The namespace is the configured namespace for the configured INIT transaction, including a malformed or missing marker.
4. Otherwise, the namespace is the observed 32-byte namespace only when exactly one remaining marker has a complete structurally decodable Tandem non-INIT payload of the exact length for its defined opcode. Minimal-push and other validity failures do not prevent this population-only extraction if the complete exact payload bytes are present.
5. In every other case, including unknown marker format, unknown opcode, incomplete payload, no marker, or multiple markers, namespace is `zero32`.

Population-only extraction never changes the selected reason or validity.

### 13.5 Terminal nonauthoritative field population

For class `TERMINAL_NONCANONICAL`:

1. `object_key32` is the consumed object's binary key.
2. `state_seq` is the consumed object's current sequence and is not incremented.
3. `predecessor_outpoint36` is its consumed active outpoint.
4. `successor_outpoint36` and `commitment32` are absent zero values.
5. `key0_33` and `key1_33` are its current keys before termination.
6. With exactly one remaining marker, namespace is its observed namespace only when that marker has a complete structurally decodable Tandem non-INIT payload of the exact length for its defined opcode. Otherwise namespace is `zero32`.
7. With no remaining marker, namespace is the configured namespace.
8. With multiple remaining markers, namespace is `zero32`.

The same transaction, block, event-index, and reason fields are repeated for each per-carrier terminal event; only `sub_index` and the consumed object's state fields differ.

## 14. Authoritative roots

All roots use only SHA256 and the fixed-width encodings in this file. They use authoritative confirmed state only. Mempool observations are never included.

### 14.1 Event root

Order event leaves by the tuple `(tx_index,event_index,sub_index)`, comparing each unsigned integer numerically.

For two child hashes, the parent is:

```text
SHA256("TANDEM/EVENT-NODE\0" || left32 || right32)
```

At every Merkle level, duplicate an unpaired final hash and hash it with itself. Repeat until one hash remains. One event leaf is its own event root without an additional node hash.

A block with no events has event root:

```text
SHA256("TANDEM/EVENT-EMPTY\0" || namespace_commitment)
```

### 14.2 Object-state root

After applying all transactions in a block, every authoritative object contributes exactly one snapshot leaf:

```text
SHA256("TANDEM/OBJECT-STATE\0" ||
  object_key32 ||
  founding_u8 ||
  status_u8 ||
  create_height_u64le ||
  state_seq_u32le ||
  current_outpoint36 ||
  key0_33 ||
  key1_33 ||
  terminal_txid_wire32 ||
  chapter_count_u32le)
```

`founding_u8` is exactly 0 or 1. Status uses section 10. `create_height` is the authoritative CREATE block height. Active objects use their active carrier as `current_outpoint36` and `zero32` as `terminal_txid_wire32`. Terminal objects use `zero36` as current outpoint, retain their last keys and sequence, and use the txid of CLOSE, REFUND, or the nonauthoritative carrier spend as terminal txid.

Order object leaves by unsigned bytewise lexicographic `object_key32`. Object Merkle parents are:

```text
SHA256("TANDEM/OBJECT-NODE\0" || left32 || right32)
```

Use the same odd-leaf duplication and one-leaf rules as the event tree. An empty object set has root:

```text
SHA256("TANDEM/OBJECT-EMPTY\0" || namespace_commitment)
```

### 14.3 Chained block root

The root immediately before the configured INIT confirmation block is:

```text
R_prev = SHA256("TANDEM/STATE-EMPTY\0" || namespace_commitment)
```

For every authoritative block from the configured INIT confirmation block onward, including a block with no Tandem event, compute post-block counters and:

```text
R_h = SHA256("TANDEM/BLOCKROOT\0" ||
             namespace_commitment ||
             R_prev ||
             block_hash_wire32 ||
             height_u64le ||
             event_root32 ||
             object_state_root32 ||
             founding_created_u64le ||
             all_objects_u64le ||
             active_objects_u64le)
```

`R_h` becomes `R_prev` for the next authoritative block. Each counter is the post-block value encoded as `u64le`.

### 14.4 Reorganization behavior

Connecting a block applies transactions in transaction-index order, records events, applies state deltas atomically, computes both component roots and counters, and then computes the chained root. Disconnecting a block reverses its state mutations and roots in exact reverse order before a replacement branch is applied.

A reorganization can change INIT validity, CREATE founding status, active outpoints, terminal status, counters, and every subsequent chained root. Results depend only on the configured binding, the bytes of this specification, and the authoritative Bitcoin blocks. Arrival time, API order, cache contents, content availability, and any other implementation's parsed output have no role.

## 15. Authoritative invariants

A conforming implementation MUST preserve all of these invariants:

1. One binary object key maps to exactly one valid CREATE outpoint and one active or terminal status.
2. An active object has exactly one active outpoint, one sorted current key pair, carrier value 20,000, and its greatest sequence.
3. A valid authoritative outpoint is consumed at most once.
4. A state sequence starts at 0 and increments by one only on MARK, ROTATE, or CLOSE.
5. A chapter exists only for a valid MARK and is unique by `(object_key,state_seq)`.
6. A carrier represents one jointly controlled object and is counted once, not once per key.
7. Founding status depends only on authoritative CREATE confirmation height.
8. Invalid no-state events do not mutate state or counters.
9. A confirmed invalid active-carrier spend terminates every consumed object because its UTXO is gone.
10. CREATE never creates more than one object, and no Tandem transaction combines, splits, or creates multiple successors for an object.
11. `founding_created` equals the number of founding objects across ACTIVE, CLOSED, REFUNDED, and EXITED_NONCANONICAL statuses on the authoritative chain.
12. Given the same deployment binding, exact specification bytes, and authoritative blocks, independent implementations produce identical events, reason codes, state, counters, event roots, object-state roots, and chained roots at every height.

## 16. Protocol boundary

Tandem is immutable. Unknown marker formats, opcodes, kinds, reasons, nonzero flags, nonzero reserved bytes, extension bytes, nonminimal pushes, and oversized payloads are invalid. A distinct protocol requires a different specification hash, INIT, namespace, and protocol identifier. A parser for a distinct protocol MUST NOT reinterpret Tandem events or state.

No Tandem rule grants an administrator, coordinator, content host, indexer, wallet, or issuer authority to change keys, sequence, commitments, founding status, object status, roots, or supply. Bitcoin script controls the carrier satoshis. This deterministic parser controls only Tandem classification and state.
