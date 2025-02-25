import TdfDecoder from './lib/decoder'
import TdfEncoder from './lib/encoder'
import {
  TdfBlazeObjectId,
  TdfInteger,
  TdfList,
  TdfString,
  TdfStruct,
} from './types'

// const file = readFileSync('15.tdf')
// const skip = file.subarray(16)
// const decoder = new TdfDecoder(skip)
// const decoded = decoder.payload
// console.log(inspect(decoded, { depth: null, colors: true }))

// [
//   TdfList {
//     tag: -1294438400n,
//     type: 4,
//     value: [
//       [
//         TdfStruct {
//           tag: -1494634752n,
//           type: 3,
//           value: [
//             TdfBlazeObjectId {
//               tag: -1963301888n,
//               type: 9,
//               value: { componentId: 25, typeId: 1, entityId: 1003715994725 }
//             },
//             TdfInteger { tag: -1698041088n, type: 0, value: 4n },
//             TdfStruct {
//               tag: -1298595840n,
//               type: 3,
//               value: [
//                 TdfString {
//                   tag: -1293205504n,
//                   type: 1,
//                   value: 'friendList'
//                 },
//                 TdfInteger { tag: -744741632n, type: 0, value: 1n }
//               ]
//             },
//             TdfInteger { tag: -1294155776n, type: 0, value: 2000n },
//             TdfString { tag: -1024955136n, type: 1, value: '' },
//             TdfInteger { tag: -1020632064n, type: 0, value: 0n },
//             TdfInteger { tag: -1020562688n, type: 0, value: 0n }
//           ]
//         },
//         TdfList {
//           tag: -1235522560n,
//           type: 4,
//           value: [
//             [
//               TdfStruct {
//                 tag: -1294310400n,
//                 type: 3,
//                 value: [
//                   TdfInteger { tag: -2024984064n, type: 0, value: 0n },
//                   TdfInteger { tag: -1027050496n, type: 0, value: 4n },
//                   TdfStruct {
//                     tag: -684101120n,
//                     type: 3,
//                     value: [
//                       TdfBinary {
//                         tag: -1752653312n,
//                         type: 2,
//                         value: <Buffer >
//                       },
//                       TdfInteger {
//                         tag: -1752538112n,
//                         type: 0,
//                         value: 2809387553n
//                       },
//                       TdfInteger {
//                         tag: -1505755136n,
//                         type: 0,
//                         value: 809663717n
//                       },
//                       TdfString {
//                         tag: -1172609792n,
//                         type: 1,
//                         value: 'CodeNameMeteor'
//                       },
//                       TdfString {
//                         tag: -1172508672n,
//                         type: 1,
//                         value: 'cem_ea_id'
//                       }
//                     ]
//                   }
//                 ]
//               },
//               TdfInteger {
//                 tag: -761568000n,
//                 type: 0,
//                 value: 1700257741n
//               }
//             ]
//           ],
//           listType: 3
//         },
//         TdfInteger { tag: -1100176640n, type: 0, value: 0n },
//         TdfInteger { tag: -755436544n, type: 0, value: 1n }
//       ],
//       [
//         TdfStruct {
//           tag: -1494634752n,
//           type: 3,
//           value: [
//             TdfBlazeObjectId {
//               tag: -1963301888n,
//               type: 9,
//               value: { componentId: 25, typeId: 5, entityId: 1003715994725 }
//             },
//             TdfInteger { tag: -1698041088n, type: 0, value: 2n },
//             TdfStruct {
//               tag: -1298595840n,
//               type: 3,
//               value: [
//                 TdfString {
//                   tag: -1293205504n,
//                   type: 1,
//                   value: 'followList'
//                 },
//                 TdfInteger { tag: -744741632n, type: 0, value: 5n }
//               ]
//             },
//             TdfInteger { tag: -1294155776n, type: 0, value: 200n },
//             TdfString {
//               tag: -1024955136n,
//               type: 1,
//               value: 'followerList'
//             },
//             TdfInteger { tag: -1020632064n, type: 0, value: 6n },
//             TdfInteger { tag: -1020562688n, type: 0, value: 50000n }
//           ]
//         },
//         TdfInteger { tag: -1100176640n, type: 0, value: 0n },
//         TdfInteger { tag: -755436544n, type: 0, value: 0n }
//       ],
//       [
//         TdfStruct {
//           tag: -1494634752n,
//           type: 3,
//           value: [
//             TdfBlazeObjectId {
//               tag: -1963301888n,
//               type: 9,
//               value: { componentId: 25, typeId: 4, entityId: 1003715994725 }
//             },
//             TdfInteger { tag: -1698041088n, type: 0, value: 0n },
//             TdfStruct {
//               tag: -1298595840n,
//               type: 3,
//               value: [
//                 TdfString {
//                   tag: -1293205504n,
//                   type: 1,
//                   value: 'communicationBlockList'
//                 },
//                 TdfInteger { tag: -744741632n, type: 0, value: 4n }
//               ]
//             },
//             TdfInteger { tag: -1294155776n, type: 0, value: 100n },
//             TdfString { tag: -1024955136n, type: 1, value: '' },
//             TdfInteger { tag: -1020632064n, type: 0, value: 0n },
//             TdfInteger { tag: -1020562688n, type: 0, value: 0n }
//           ]
//         },
//         TdfInteger { tag: -1100176640n, type: 0, value: 0n },
//         TdfInteger { tag: -755436544n, type: 0, value: 0n }
//       ]
//     ],
//     listType: 3
//   }
// ]


const payload = [
  new TdfList(-1294438400n, 3, [
    [
      new TdfStruct(-1494634752n, [
        new TdfBlazeObjectId(-1963301888n, {
          componentId: 25,
          typeId: 1,
          entityId: 1003715994725,
        }),
        new TdfInteger(-1698041088n, 4),
        new TdfStruct(-1298595840n, [
          new TdfString(-1293205504n, 'friendList'),
          new TdfInteger(-744741632n, 1),
        ]),
        new TdfInteger(-1294155776n, 2000),
        new TdfString(-1024955136n, ''),
        new TdfInteger(-1020632064n, 0),
        new TdfInteger(-1020562688n, 0),
      ]),
      new TdfList(-1235522560n, 3, [
        [
          new TdfStruct(-1294310400n, [
            new TdfInteger(-2024984064n, 0),
            new TdfInteger(-1027050496n, 4),
            new TdfStruct(-684101120n, [
              new TdfString(-1172609792n, 'CodeNameMeteor'),
              new TdfString(-1172508672n, 'cem_ea_id'),
            ]),
          ]),
          new TdfInteger(-761568000n, 1700257741),
        ],
      ]),
    ],
    [
      new TdfStruct(-1494634752n, [
        new TdfBlazeObjectId(-1963301888n, {
          componentId: 25,
          typeId: 5,
          entityId: 1003715994725,
        }),
        new TdfInteger(-1698041088n, 2),
        new TdfStruct(-1298595840n, [
          new TdfString(-1293205504n, 'followList'),
          new TdfInteger(-744741632n, 5),
        ]),
        new TdfInteger(-1294155776n, 200),
        new TdfString(-1024955136n, 'followerList'),
        new TdfInteger(-1020632064n, 6),
        new TdfInteger(-1020562688n, 50000),
      ]),
      new TdfInteger(-1100176640n, 0),
      new TdfInteger(-755436544n, 0),
    ],
    [
      new TdfStruct(-1494634752n, [
        new TdfBlazeObjectId(-1963301888n, {
          componentId: 25,
          typeId: 4,
          entityId: 1003715994725,
        }),
        new TdfInteger(-1698041088n, 0),
        new TdfStruct(-1298595840n, [
          new TdfString(-1293205504n, 'communicationBlockList'),
          new TdfInteger(-744741632n, 4),
        ]),
        new TdfInteger(-1294155776n, 100),
        new TdfString(-1024955136n, ''),
        new TdfInteger(-1020632064n, 0),
        new TdfInteger(-1020562688n, 0),
      ]),
      new TdfInteger(-1100176640n, 0),
      new TdfInteger(-755436544n, 0),
    ],
  ]),
]
