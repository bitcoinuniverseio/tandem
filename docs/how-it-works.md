# How Tandem works

Tandem gives one Bitcoin transaction sequence a deterministic object meaning. Bitcoin controls the spendable outputs. Tandem classifies exact confirmed transaction shapes and derives the object's state.

## The shared carrier

An active Tandem is carried by an exact 20,000-sat native SegWit 2-of-2 P2WSH output. Its two compressed public keys are sorted deterministically. Both current keys are required for a cooperative spend.

The carrier is deliberately narrow. One active carrier represents one object. Tandem has no split, merge, unilateral transfer, or in-place administrator update.

## The object actions

### Create

Two participants use clean, confirmed inputs bound to their exact keys. A valid CREATE produces one active object at state sequence zero.

### Add a chapter

MARK advances the sequence and commits a chapter hash. The shared carrier and current key pair continue. Chapter content and its availability are presentation concerns, not consensus state.

### Rotate control

ROTATE advances the sequence and replaces one or both current keys with a successor pair authorized by the current pair. The Tandem remains the same object.

### Close

CLOSE advances the sequence, ends the carrier, and pays the pair equally under the exact transaction rules. The object becomes terminal.

### Recover

REFUND is a markerless, pre-signed recovery spend. It can become valid only after the required relative lock. Recovery ends the carrier without advancing the current object sequence.

## Independent verification

Tandem is deterministic. Given the same deployment binding, specification bytes, and authoritative Bitcoin blocks, independent implementations should produce identical events, object state, counters, and roots at every height.

Official state-dependent construction should fail closed when independent indexers do not agree at the same authoritative height. Raw Bitcoin data and clearly labeled diagnostics may remain available during disagreement.

## External content

A chapter or close commitment can describe content through a strict public manifest. The commitment authenticates exact bytes. It does not guarantee that a URI remains available, that encrypted content can be decrypted, or that a content host will continue operating.

## Read the exact contract

This guide is explanatory and not normative. The exact public contract is indexed in [the protocol artifact guide](../protocol/README.md).
