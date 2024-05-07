# tdf.js

Library for reading and writing the TDF packet format used in many EA Games (Intended for Mirror's Edge: Catalyst server emulation)

## Usage

### Reading

TDF.js relies on Node's [Readable](https://nodejs.org/api/stream.html#readable-streams) to consume chunks of data of specific length

```js
const { Readable } = require('node:stream')
const { TDF, TDFString } = require('tdf.js')

const stream = new Readable({
  read() {}, // supresses errors in console when reading data
})

stream.push(tdfpayload)

const payload = []
while (stream.readableLength) {
  const tdf = TDF.readTDF(stream) // read and process any TDF type
  payload.push(tdf)
}

// manually parse a specific type
// note that in this case you need to provide the label
const specificTdf = TDFString.read('LABL', stream)
```

### Writing

```ts
const { TDFString, TDFInteger } = require('tdf.js')

const tdfString = new TDFString('VALU', 'Hello, World!')
const buffer = tdfString.write() // <Buffer da 1b 35 01 0e 48 65 6c 6c 6f 2c 20 57 6f 72 6c 64 21 00>

const payload: TDF[] = [new TDFString('HLLO', 'world'), new TDFInteger('INT1', 43)]

const buffer2 = Buffer.concat(payload.map((tdf) => tdf.write())) // <Buffer a2 cb 2f 01 06 77 6f 72 6c 64 00 a6 ed 11 00 2b>
```

### Creating complex packets

```ts
const payload = [
  new TDFString('ASRC', '308903'),
  new TDFList(
    'CIDS',
    TDFType.Integer,
    20,
    [
      30728, 24, 1, 30729, 25, 30730, 27, 9, 10, 33, 63490, 15, 30720, 30722, 30723, 30724, 21,
      30726, 2000, 30727,
    ]
  ),
  new TDFString('CLID', 'MirrorsEdgeCatalyst-SERVER-PC'),
  new TDFStruct('CONF', [
    new TDFDictionary('CONF', TDFType.String, TDFType.String, 17, {
      associationListSkipInitialSet: '1',
      autoReconnectEnabled: '0',
      bytevaultHostname: 'bytevault.gameservices.ea.com',
      bytevaultPort: '42210',
      bytevaultSecure: 'true',
      connIdleTimeout: '40s',
      defaultRequestTimeout: '20s',
      nucleusConnect: 'https://accounts.ea.com',
      nucleusConnectTrusted: 'https://accounts2s.ea.com',
      nucleusPortal: 'https://signin.ea.com',
      nucleusProxy: 'https://gateway.ea.com',
      pingPeriod: '20s',
      userManagerMaxCachedUsers: '0',
      voipHeadsetUpdateRate: '1000',
      xblTokenUrn: 'accounts.ea.com',
      xboxOneStringValidationUri: 'client-strings.xboxlive.com',
      xlspConnectionIdleTimeout: '300',
    }),
  ]),
  new TDFString('ESRC', '308903'),
  new TDFString('INST', 'mirrorsedgecatalyst-2016-pc'),
  new TDFInteger('MAID', 1129238128),
  new TDFInteger('MINR', 0),
  new TDFString('NASP', 'cem_ea_id'),
  new TDFString('PILD', ''),
  new TDFString('PLAT', 'pc'),
  new TDFStruct('QOSS', [
    new TDFStruct('BWPS', [
      new TDFString('PSA ', ''),
      new TDFInteger('PSP ', 0),
      new TDFString('SNA ', ''),
    ]),
    new TDFInteger('LNP ', 10),
    new TDFDictionary('LTPS', TDFType.String, TDFType.Struct, 6, {
      'bio-dub': [
        new TDFString('PSA ', 'qos-prod-bio-dub-common-common.gos.ea.com'),
        new TDFInteger('PSP ', 17504),
        new TDFString('SNA ', 'bio-dub-prod'),
      ],
      'bio-iad': [
        new TDFString('PSA ', 'qos-prod-bio-iad-common-common.gos.ea.com'),
        new TDFInteger('PSP ', 17504),
        new TDFString('SNA ', 'bio-iad-prod'),
      ],
      'bio-sjc': [
        new TDFString('PSA ', 'qos-prod-bio-sjc-common-common.gos.ea.com'),
        new TDFInteger('PSP ', 17504),
        new TDFString('SNA ', 'bio-sjc-prod'),
      ],
      'bio-syd': [
        new TDFString('PSA ', 'qos-prod-bio-syd-common-common.gos.ea.com'),
        new TDFInteger('PSP ', 17504),
        new TDFString('SNA ', 'bio-syd-prod'),
      ],
      'm3d-brz': [
        new TDFString('PSA ', 'qos-prod-m3d-brz-common-common.gos.ea.com'),
        new TDFInteger('PSP ', 17504),
        new TDFString('SNA ', 'm3d-brz-prod'),
      ],
      'm3d-nrt': [
        new TDFString('PSA ', 'qos-prod-m3d-nrt-common-common.gos.ea.com'),
        new TDFInteger('PSP ', 17504),
        new TDFString('SNA ', 'm3d-nrt-prod'),
      ],
    }),
    new TDFInteger('SVID', 1161889797),
    new TDFInteger('TIME', 5000000),
  ]),
  new TDFString('RSRC', '308903'),
  new TDFString('SVER', 'Blaze 15.1.1.0.5 (CL# 1893137)\n'),
]
```
## Credits
Big thanks to
- [WarrantyVoider](https://github.com/zeroKilo) for their intesive, public research, open-source materials and personal help
- [The Beat Revival](https://discord.gg/jbnNzA6Uk9) for the help with gathering packets and in-game knowledge