# Frequently asked questions

## Is Tandem live on mainnet?

No. The protocol is finalized, but mainnet is not active. Activation requires completed verification and safety evidence plus an explicit launch decision.

## Who owns a Tandem?

The active Bitcoin carrier requires both current keys for a cooperative spend. Tandem does not define legal ownership or resolve disputes between participants.

## Can one person change the object alone?

Not through a valid cooperative Tandem action. CREATE begins with two keys, and MARK, ROTATE, and CLOSE require the current pair. A prepared REFUND follows its own exact relative-lock rules.

## Can the key pair change?

Yes. ROTATE lets the current pair authorize a successor pair, replacing one or both keys while preserving the same object.

## What happens if one participant disappears?

A fully signed refund prepared before the parent transaction can become valid after its relative lock matures. Recovery depends on correct preparation, export, restore testing, fee conditions, maturity, and access to the participant's own material.

## Does Tandem store files on Bitcoin?

No. A chapter or close can commit to exact content bytes through a hash. The content itself is presentation data retrieved from declared URIs. Availability does not affect protocol validity.

## Is Tandem an NFT or token?

No. Tandem defines one jointly controlled object and exact state transitions. It has no token issuance, marketplace, royalty, rarity, price, yield, governance, or ranking rules.

## Can an administrator edit or recover the object?

No Tandem rule grants an administrator, service, indexer, issuer, or content host authority to change object keys or state.

## Does independent indexing make Tandem trustless?

Independent implementations reduce the risk of one parser or service silently presenting incorrect state. Users still depend on Bitcoin consensus, correct software, secure signing, sound key management, and honest presentation of verification status.

## Where is the exact specification?

The authoritative bytes are in [`tandem.md`](../tandem.md), with hash and byte metadata in [`release/spec.json`](../release/spec.json). Start with [the protocol artifact guide](../protocol/README.md).

## Can I build an integration now?

You can inspect the public contracts and build controlled prototypes. Do not enable mainnet construction or broadcast. Read the [integration guide](integrations.md) and [safety guide](safety.md) first.
