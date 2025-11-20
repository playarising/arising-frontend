import { PublicKey, SYSVAR_RENT_PUBKEY, SystemProgram, TransactionInstruction } from '@solana/web3.js'

export const ARISING_PROGRAM_ID = new PublicKey('arisrYLSKUei59PvwWzxtgkNTypLNKmd3u3jHeNQAn9')

export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
export const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
// Devnet USDC mint (provided by user)
export const USDC_MINT_DEVNET = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')

const DISCRIMINATORS: Record<string, Buffer> = {
  allocate_attributes: Buffer.from([85, 81, 107, 136, 183, 57, 94, 54]),
  allocate_core_stats: Buffer.from([103, 75, 20, 230, 236, 152, 23, 158]),
  buy_energy_pass: Buffer.from([138, 64, 93, 191, 86, 228, 104, 165]),
  choose_class: Buffer.from([163, 50, 90, 117, 95, 218, 218, 62]),
  claim_quest: Buffer.from([38, 197, 33, 123, 0, 108, 206, 161]),
  claim_recipe: Buffer.from([128, 133, 122, 77, 44, 116, 190, 19]),
  consume_energy: Buffer.from([72, 209, 198, 132, 177, 231, 77, 117]),
  equip_item: Buffer.from([38, 155, 16, 165, 146, 31, 4, 255]),
  get_character_metadata: Buffer.from([7, 71, 5, 14, 62, 249, 71, 45]),
  initialize: Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]),
  mint_character: Buffer.from([127, 29, 52, 229, 72, 194, 255, 67]),
  redeem_energy_pass: Buffer.from([138, 39, 219, 223, 169, 64, 108, 170]),
  refill_energy: Buffer.from([249, 210, 36, 106, 250, 196, 4, 176]),
  start_quest: Buffer.from([212, 181, 79, 44, 200, 242, 13, 105]),
  start_recipe: Buffer.from([240, 196, 13, 248, 172, 152, 182, 198]),
  unequip_item: Buffer.from([96, 192, 232, 54, 127, 191, 236, 128]),
  update_civilization_cap: Buffer.from([132, 42, 14, 83, 56, 239, 38, 244]),
  withdraw_usdc_treasury: Buffer.from([78, 177, 147, 108, 18, 251, 63, 233])
}

const CIVILIZATION = {
  Ard: 0,
  Hartenn: 1,
  Ikarans: 2,
  Zhand: 3,
  Shinkari: 4,
  Tarki: 5
} as const
const CHARACTER_CLASS = {
  ArdKnight: 0,
  ArdTemplar: 1,
  HartennEngineer: 2,
  HartennWarden: 3,
  IkaransRanger: 4,
  IkaransDruid: 5,
  ZhandSandblade: 6,
  ZhandSeer: 7,
  ShinkariSamurai: 8,
  ShinkariOnmyoji: 9,
  TarkiRaider: 10,
  TarkiSkald: 11
} as const
const GENDER = { Male: 0, Female: 1 } as const
const EQUIPMENT_SLOT = {
  LeftHand: 0,
  RightHand: 1,
  Chest: 2,
  Legs: 3,
  Boots: 4,
  Helmet: 5,
  RingOne: 6,
  RingTwo: 7,
  AmuletOne: 8,
  AmuletTwo: 9,
  Back: 10
} as const

export type Civilization = keyof typeof CIVILIZATION | number
export type CharacterClass = keyof typeof CHARACTER_CLASS | number
export type Gender = keyof typeof GENDER | number
export type EquipmentSlot = keyof typeof EQUIPMENT_SLOT | number

export type AttributesInput = {
  atk: number
  def: number
  mag_atk: number
  mag_def: number
  range: number
  rate: number
}

export type CoreStatsInput = {
  might: number
  speed: number
  intellect: number
}

type AccountsList = { pubkey: PublicKey; isWritable: boolean; isSigner: boolean }[]

const MINT_STATE_SEED = Buffer.from('character_mint_state')
const COLLECTION_MINT_SEED = Buffer.from('collection_mint')
const COLLECTION_TOKEN_SEED = Buffer.from('collection_token')
const CHARACTER_SEED = Buffer.from('character')
const CHARACTER_NFT_MINT_SEED = Buffer.from('character_nft_mint')
const CHARACTER_NFT_TOKEN_SEED = Buffer.from('character_nft_token')

export const findMintStatePda = (programId = ARISING_PROGRAM_ID) =>
  PublicKey.findProgramAddressSync([MINT_STATE_SEED], programId)[0]

export const findCollectionMintPda = (programId = ARISING_PROGRAM_ID) =>
  PublicKey.findProgramAddressSync([COLLECTION_MINT_SEED], programId)[0]

export const findCollectionTokenAccountPda = (programId = ARISING_PROGRAM_ID, owner?: PublicKey) => {
  if (!owner) {
    return PublicKey.findProgramAddressSync([COLLECTION_TOKEN_SEED], programId)[0]
  }
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), findCollectionMintPda(programId).toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )[0]
}

export const findCharacterPda = (
  civilizationIndex: number,
  characterId: number,
  programId: PublicKey = ARISING_PROGRAM_ID
) =>
  PublicKey.findProgramAddressSync([CHARACTER_SEED, Buffer.from([civilizationIndex]), u16(characterId)], programId)[0]

export const findCharacterMintPda = (
  civilizationIndex: number,
  characterId: number,
  programId: PublicKey = ARISING_PROGRAM_ID
) =>
  PublicKey.findProgramAddressSync(
    [CHARACTER_NFT_MINT_SEED, Buffer.from([civilizationIndex]), u16(characterId)],
    programId
  )[0]

export const findCharacterTokenPda = (
  civilizationIndex: number,
  characterId: number,
  programId: PublicKey = ARISING_PROGRAM_ID
) =>
  PublicKey.findProgramAddressSync(
    [CHARACTER_NFT_TOKEN_SEED, Buffer.from([civilizationIndex]), u16(characterId)],
    programId
  )[0]

const u8 = (value: number) => {
  const buf = Buffer.alloc(1)
  buf.writeUInt8(value)
  return buf
}

const u16 = (value: number) => {
  const buf = Buffer.alloc(2)
  buf.writeUInt16LE(value)
  return buf
}

const i16 = (value: number) => {
  const buf = Buffer.alloc(2)
  buf.writeInt16LE(value)
  return buf
}

const u64 = (value: bigint | number) => {
  const big = typeof value === 'bigint' ? value : BigInt(value)
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64LE(big)
  return buf
}

const resolveEnum = <T extends Record<string, number>>(table: T, value: keyof T | number) => {
  if (typeof value === 'number') return value
  const mapped = table[value]
  if (mapped === undefined) throw new Error(`Invalid enum variant: ${String(value)}`)
  return mapped
}

const encodeCivilization = (civilization: Civilization) => u8(resolveEnum(CIVILIZATION, civilization))
const encodeCharacterClass = (className: CharacterClass) => u8(resolveEnum(CHARACTER_CLASS, className))
const encodeGender = (gender: Gender) => u8(resolveEnum(GENDER, gender))
const encodeEquipmentSlot = (slot: EquipmentSlot) => u8(resolveEnum(EQUIPMENT_SLOT, slot))

const encodeAttributes = (attributes: AttributesInput) =>
  Buffer.concat([
    i16(attributes.atk),
    i16(attributes.def),
    i16(attributes.mag_atk),
    i16(attributes.mag_def),
    i16(attributes.range),
    i16(attributes.rate)
  ])

const encodeCoreStats = (stats: CoreStatsInput) =>
  Buffer.concat([u16(stats.might), u16(stats.speed), u16(stats.intellect)])

const makeInstruction = (
  discriminator: Buffer,
  data: Buffer,
  accounts: AccountsList,
  programId: PublicKey = ARISING_PROGRAM_ID
) =>
  new TransactionInstruction({
    programId,
    keys: accounts,
    data: Buffer.concat([discriminator, data])
  })

export const allocateAttributesIx = (
  args: { civilization: Civilization; characterId: number; allocation: AttributesInput },
  accounts: { character: PublicKey; authority: PublicKey }
) =>
  makeInstruction(
    DISCRIMINATORS.allocate_attributes,
    Buffer.concat([encodeCivilization(args.civilization), u16(args.characterId), encodeAttributes(args.allocation)]),
    [
      { pubkey: accounts.character, isWritable: true, isSigner: false },
      { pubkey: accounts.authority, isWritable: false, isSigner: true }
    ]
  )

export const allocateCoreStatsIx = (
  args: { civilization: Civilization; characterId: number; allocation: CoreStatsInput },
  accounts: { character: PublicKey; authority: PublicKey }
) =>
  makeInstruction(
    DISCRIMINATORS.allocate_core_stats,
    Buffer.concat([encodeCivilization(args.civilization), u16(args.characterId), encodeCoreStats(args.allocation)]),
    [
      { pubkey: accounts.character, isWritable: true, isSigner: false },
      { pubkey: accounts.authority, isWritable: false, isSigner: true }
    ]
  )

export const buyEnergyPassIx = (
  args: { civilization: Civilization; characterId: number; quantity: number },
  accounts: {
    character: PublicKey
    authority: PublicKey
    mintState?: PublicKey
    userUsdcAccount: PublicKey
    treasuryUsdcAccount: PublicKey
    tokenProgram?: PublicKey
  },
  programId: PublicKey = ARISING_PROGRAM_ID
) =>
  makeInstruction(
    DISCRIMINATORS.buy_energy_pass,
    Buffer.concat([encodeCivilization(args.civilization), u16(args.characterId), u8(args.quantity)]),
    [
      { pubkey: accounts.character, isWritable: true, isSigner: false },
      { pubkey: accounts.authority, isWritable: true, isSigner: true },
      { pubkey: accounts.mintState ?? findMintStatePda(programId), isWritable: false, isSigner: false },
      { pubkey: accounts.userUsdcAccount, isWritable: true, isSigner: false },
      { pubkey: accounts.treasuryUsdcAccount, isWritable: true, isSigner: false },
      { pubkey: accounts.tokenProgram ?? TOKEN_PROGRAM_ID, isWritable: false, isSigner: false }
    ],
    programId
  )

export const chooseClassIx = (
  args: { civilization: Civilization; characterId: number; className: CharacterClass },
  accounts: { character: PublicKey; authority: PublicKey }
) =>
  makeInstruction(
    DISCRIMINATORS.choose_class,
    Buffer.concat([encodeCivilization(args.civilization), u16(args.characterId), encodeCharacterClass(args.className)]),
    [
      { pubkey: accounts.character, isWritable: true, isSigner: false },
      { pubkey: accounts.authority, isWritable: false, isSigner: true }
    ]
  )

export const claimQuestIx = (
  args: { civilization: Civilization; characterId: number; questId: number },
  accounts: {
    character: PublicKey
    authority: PublicKey
    mintState?: PublicKey
    tokenProgram?: PublicKey
    tokenMetadataProgram?: PublicKey
    associatedTokenProgram?: PublicKey
    systemProgram?: PublicKey
    rent?: PublicKey
    remainingAccounts?: { pubkey: PublicKey; isWritable: boolean; isSigner: boolean }[]
  },
  programId: PublicKey = ARISING_PROGRAM_ID
) =>
  makeInstruction(
    DISCRIMINATORS.claim_quest,
    Buffer.concat([encodeCivilization(args.civilization), u16(args.characterId), u16(args.questId)]),
    [
      { pubkey: accounts.character, isWritable: true, isSigner: false },
      { pubkey: accounts.authority, isWritable: true, isSigner: true },
      { pubkey: accounts.mintState ?? findMintStatePda(programId), isWritable: false, isSigner: false },
      { pubkey: accounts.tokenProgram ?? TOKEN_PROGRAM_ID, isWritable: false, isSigner: false },
      {
        pubkey: accounts.tokenMetadataProgram ?? TOKEN_METADATA_PROGRAM_ID,
        isWritable: false,
        isSigner: false
      },
      {
        pubkey: accounts.associatedTokenProgram ?? ASSOCIATED_TOKEN_PROGRAM_ID,
        isWritable: false,
        isSigner: false
      },
      { pubkey: accounts.systemProgram ?? SystemProgram.programId, isWritable: false, isSigner: false },
      { pubkey: accounts.rent ?? SYSVAR_RENT_PUBKEY, isWritable: false, isSigner: false },
      ...(accounts.remainingAccounts ?? [])
    ],
    programId
  )

export const claimRecipeIx = (
  args: { civilization: Civilization; characterId: number; recipeId: number },
  accounts: {
    character: PublicKey
    authority: PublicKey
    mintState?: PublicKey
    tokenProgram?: PublicKey
    tokenMetadataProgram?: PublicKey
    associatedTokenProgram?: PublicKey
    systemProgram?: PublicKey
    rent?: PublicKey
    remainingAccounts?: { pubkey: PublicKey; isWritable: boolean; isSigner: boolean }[]
  },
  programId: PublicKey = ARISING_PROGRAM_ID
) =>
  makeInstruction(
    DISCRIMINATORS.claim_recipe,
    Buffer.concat([encodeCivilization(args.civilization), u16(args.characterId), u16(args.recipeId)]),
    [
      { pubkey: accounts.character, isWritable: true, isSigner: false },
      { pubkey: accounts.authority, isWritable: true, isSigner: true },
      { pubkey: accounts.mintState ?? findMintStatePda(programId), isWritable: false, isSigner: false },
      { pubkey: accounts.tokenProgram ?? TOKEN_PROGRAM_ID, isWritable: false, isSigner: false },
      {
        pubkey: accounts.tokenMetadataProgram ?? TOKEN_METADATA_PROGRAM_ID,
        isWritable: false,
        isSigner: false
      },
      {
        pubkey: accounts.associatedTokenProgram ?? ASSOCIATED_TOKEN_PROGRAM_ID,
        isWritable: false,
        isSigner: false
      },
      { pubkey: accounts.systemProgram ?? SystemProgram.programId, isWritable: false, isSigner: false },
      { pubkey: accounts.rent ?? SYSVAR_RENT_PUBKEY, isWritable: false, isSigner: false },
      ...(accounts.remainingAccounts ?? [])
    ],
    programId
  )

export const consumeEnergyIx = (
  args: { civilization: Civilization; characterId: number; amount: number },
  accounts: { character: PublicKey; authority: PublicKey }
) =>
  makeInstruction(
    DISCRIMINATORS.consume_energy,
    Buffer.concat([encodeCivilization(args.civilization), u16(args.characterId), u16(args.amount)]),
    [
      { pubkey: accounts.character, isWritable: true, isSigner: false },
      { pubkey: accounts.authority, isWritable: false, isSigner: true }
    ]
  )

export const equipItemIx = (
  args: {
    civilization: Civilization
    characterId: number
    slot: EquipmentSlot
    definitionIndex: number
  },
  accounts: {
    character: PublicKey
    authority: PublicKey
    mintState?: PublicKey
    tokenProgram?: PublicKey
    tokenMetadataProgram?: PublicKey
    associatedTokenProgram?: PublicKey
    systemProgram?: PublicKey
    rent?: PublicKey
  },
  programId: PublicKey = ARISING_PROGRAM_ID
) =>
  makeInstruction(
    DISCRIMINATORS.equip_item,
    Buffer.concat([
      encodeCivilization(args.civilization),
      u16(args.characterId),
      encodeEquipmentSlot(args.slot),
      u8(args.definitionIndex)
    ]),
    [
      { pubkey: accounts.character, isWritable: true, isSigner: false },
      { pubkey: accounts.authority, isWritable: true, isSigner: true },
      { pubkey: accounts.mintState ?? findMintStatePda(programId), isWritable: false, isSigner: false },
      { pubkey: accounts.tokenProgram ?? TOKEN_PROGRAM_ID, isWritable: false, isSigner: false },
      {
        pubkey: accounts.tokenMetadataProgram ?? TOKEN_METADATA_PROGRAM_ID,
        isWritable: false,
        isSigner: false
      },
      {
        pubkey: accounts.associatedTokenProgram ?? ASSOCIATED_TOKEN_PROGRAM_ID,
        isWritable: false,
        isSigner: false
      },
      { pubkey: accounts.systemProgram ?? SystemProgram.programId, isWritable: false, isSigner: false },
      { pubkey: accounts.rent ?? SYSVAR_RENT_PUBKEY, isWritable: false, isSigner: false }
    ],
    programId
  )

export const getCharacterMetadataIx = (
  args: { civilization: Civilization; characterId: number },
  accounts: { character: PublicKey }
) =>
  makeInstruction(
    DISCRIMINATORS.get_character_metadata,
    Buffer.concat([encodeCivilization(args.civilization), u16(args.characterId)]),
    [{ pubkey: accounts.character, isWritable: false, isSigner: false }]
  )

export const initializeIx = (
  accounts: {
    mintState?: PublicKey
    authority: PublicKey
    collectionMint?: PublicKey
    collectionTokenAccount?: PublicKey
    collectionMetadata: PublicKey
    collectionMasterEdition: PublicKey
    tokenMetadataProgram?: PublicKey
    tokenProgram?: PublicKey
    usdcMint: PublicKey
    usdcTreasury: PublicKey
    systemProgram?: PublicKey
    associatedTokenProgram?: PublicKey
    rent?: PublicKey
  },
  programId: PublicKey = ARISING_PROGRAM_ID
) =>
  makeInstruction(
    DISCRIMINATORS.initialize,
    Buffer.alloc(0),
    [
      { pubkey: accounts.mintState ?? findMintStatePda(programId), isWritable: true, isSigner: false },
      { pubkey: accounts.authority, isWritable: true, isSigner: true },
      { pubkey: accounts.collectionMint ?? findCollectionMintPda(programId), isWritable: true, isSigner: false },
      {
        pubkey: accounts.collectionTokenAccount ?? findCollectionTokenAccountPda(programId),
        isWritable: true,
        isSigner: false
      },
      { pubkey: accounts.collectionMetadata, isWritable: true, isSigner: false },
      { pubkey: accounts.collectionMasterEdition, isWritable: true, isSigner: false },
      { pubkey: accounts.tokenMetadataProgram ?? TOKEN_METADATA_PROGRAM_ID, isWritable: false, isSigner: false },
      { pubkey: accounts.tokenProgram ?? TOKEN_PROGRAM_ID, isWritable: false, isSigner: false },
      { pubkey: accounts.usdcMint, isWritable: false, isSigner: false },
      { pubkey: accounts.usdcTreasury, isWritable: true, isSigner: false },
      { pubkey: accounts.systemProgram ?? SystemProgram.programId, isWritable: false, isSigner: false },
      {
        pubkey: accounts.associatedTokenProgram ?? ASSOCIATED_TOKEN_PROGRAM_ID,
        isWritable: false,
        isSigner: false
      },
      { pubkey: accounts.rent ?? SYSVAR_RENT_PUBKEY, isWritable: false, isSigner: false }
    ],
    programId
  )

export const mintCharacterIx = (
  args: { civilization: Civilization; characterId: number; gender: Gender },
  accounts: {
    character?: PublicKey
    authority: PublicKey
    mintAuthority: PublicKey
    mintState?: PublicKey
    characterMint?: PublicKey
    characterTokenAccount?: PublicKey
    metadata: PublicKey
    masterEdition: PublicKey
    collectionMint: PublicKey
    collectionMetadata: PublicKey
    collectionMasterEdition: PublicKey
    tokenProgram?: PublicKey
    tokenMetadataProgram?: PublicKey
    rent?: PublicKey
    systemProgram?: PublicKey
  },
  programId: PublicKey = ARISING_PROGRAM_ID
) =>
  makeInstruction(
    DISCRIMINATORS.mint_character,
    Buffer.concat([encodeCivilization(args.civilization), u16(args.characterId), encodeGender(args.gender)]),
    [
      {
        pubkey:
          accounts.character ??
          findCharacterPda(
            typeof args.civilization === 'number' ? args.civilization : CIVILIZATION[args.civilization],
            args.characterId,
            programId
          ),
        isWritable: true,
        isSigner: false
      },
      { pubkey: accounts.authority, isWritable: true, isSigner: true },
      { pubkey: accounts.mintState ?? findMintStatePda(programId), isWritable: true, isSigner: false },
      { pubkey: accounts.mintAuthority, isWritable: false, isSigner: true },
      {
        pubkey:
          accounts.characterMint ??
          findCharacterMintPda(
            typeof args.civilization === 'number' ? args.civilization : CIVILIZATION[args.civilization],
            args.characterId,
            programId
          ),
        isWritable: true,
        isSigner: false
      },
      {
        pubkey:
          accounts.characterTokenAccount ??
          findCharacterTokenPda(
            typeof args.civilization === 'number' ? args.civilization : CIVILIZATION[args.civilization],
            args.characterId,
            programId
          ),
        isWritable: true,
        isSigner: false
      },
      { pubkey: accounts.metadata, isWritable: true, isSigner: false },
      { pubkey: accounts.masterEdition, isWritable: true, isSigner: false },
      { pubkey: accounts.collectionMint, isWritable: true, isSigner: false },
      { pubkey: accounts.collectionMetadata, isWritable: true, isSigner: false },
      { pubkey: accounts.collectionMasterEdition, isWritable: true, isSigner: false },
      { pubkey: accounts.tokenProgram ?? TOKEN_PROGRAM_ID, isWritable: false, isSigner: false },
      { pubkey: accounts.tokenMetadataProgram ?? TOKEN_METADATA_PROGRAM_ID, isWritable: false, isSigner: false },
      { pubkey: accounts.rent ?? SYSVAR_RENT_PUBKEY, isWritable: false, isSigner: false },
      { pubkey: accounts.systemProgram ?? SystemProgram.programId, isWritable: false, isSigner: false }
    ],
    programId
  )

export const redeemEnergyPassIx = (
  args: { civilization: Civilization; characterId: number },
  accounts: { character: PublicKey; authority: PublicKey }
) =>
  makeInstruction(
    DISCRIMINATORS.redeem_energy_pass,
    Buffer.concat([encodeCivilization(args.civilization), u16(args.characterId)]),
    [
      { pubkey: accounts.character, isWritable: true, isSigner: false },
      { pubkey: accounts.authority, isWritable: true, isSigner: true }
    ]
  )

export const refillEnergyIx = (
  args: { civilization: Civilization; characterId: number },
  accounts: { character: PublicKey; authority: PublicKey }
) =>
  makeInstruction(
    DISCRIMINATORS.refill_energy,
    Buffer.concat([encodeCivilization(args.civilization), u16(args.characterId)]),
    [
      { pubkey: accounts.character, isWritable: true, isSigner: false },
      { pubkey: accounts.authority, isWritable: false, isSigner: true }
    ]
  )

export const startQuestIx = (
  args: { civilization: Civilization; characterId: number; questId: number },
  accounts: { character: PublicKey; authority: PublicKey }
) =>
  makeInstruction(
    DISCRIMINATORS.start_quest,
    Buffer.concat([encodeCivilization(args.civilization), u16(args.characterId), u16(args.questId)]),
    [
      { pubkey: accounts.character, isWritable: true, isSigner: false },
      { pubkey: accounts.authority, isWritable: false, isSigner: true }
    ]
  )

export const startRecipeIx = (
  args: { civilization: Civilization; characterId: number; recipeId: number },
  accounts: {
    character: PublicKey
    authority: PublicKey
    mintState?: PublicKey
    tokenProgram?: PublicKey
    associatedTokenProgram?: PublicKey
    systemProgram?: PublicKey
    rent?: PublicKey
    remainingAccounts?: { pubkey: PublicKey; isWritable: boolean; isSigner: boolean }[]
  },
  programId: PublicKey = ARISING_PROGRAM_ID
) =>
  makeInstruction(
    DISCRIMINATORS.start_recipe,
    Buffer.concat([encodeCivilization(args.civilization), u16(args.characterId), u16(args.recipeId)]),
    [
      { pubkey: accounts.character, isWritable: true, isSigner: false },
      { pubkey: accounts.authority, isWritable: true, isSigner: true },
      { pubkey: accounts.mintState ?? findMintStatePda(programId), isWritable: false, isSigner: false },
      { pubkey: accounts.tokenProgram ?? TOKEN_PROGRAM_ID, isWritable: false, isSigner: false },
      {
        pubkey: accounts.associatedTokenProgram ?? ASSOCIATED_TOKEN_PROGRAM_ID,
        isWritable: false,
        isSigner: false
      },
      { pubkey: accounts.systemProgram ?? SystemProgram.programId, isWritable: false, isSigner: false },
      { pubkey: accounts.rent ?? SYSVAR_RENT_PUBKEY, isWritable: false, isSigner: false },
      ...(accounts.remainingAccounts ?? [])
    ],
    programId
  )

export const unequipItemIx = (
  args: { civilization: Civilization; characterId: number; slot: EquipmentSlot },
  accounts: {
    character: PublicKey
    authority: PublicKey
    mintState?: PublicKey
    tokenProgram?: PublicKey
    associatedTokenProgram?: PublicKey
    systemProgram?: PublicKey
    rent?: PublicKey
  },
  programId: PublicKey = ARISING_PROGRAM_ID
) =>
  makeInstruction(
    DISCRIMINATORS.unequip_item,
    Buffer.concat([encodeCivilization(args.civilization), u16(args.characterId), encodeEquipmentSlot(args.slot)]),
    [
      { pubkey: accounts.character, isWritable: true, isSigner: false },
      { pubkey: accounts.authority, isWritable: true, isSigner: true },
      { pubkey: accounts.mintState ?? findMintStatePda(programId), isWritable: false, isSigner: false },
      { pubkey: accounts.tokenProgram ?? TOKEN_PROGRAM_ID, isWritable: false, isSigner: false },
      {
        pubkey: accounts.associatedTokenProgram ?? ASSOCIATED_TOKEN_PROGRAM_ID,
        isWritable: false,
        isSigner: false
      },
      { pubkey: accounts.systemProgram ?? SystemProgram.programId, isWritable: false, isSigner: false },
      { pubkey: accounts.rent ?? SYSVAR_RENT_PUBKEY, isWritable: false, isSigner: false }
    ],
    programId
  )

export const updateCivilizationCapIx = (
  args: { civilization: Civilization; newCap: number },
  accounts: { mintState?: PublicKey; authority: PublicKey },
  programId: PublicKey = ARISING_PROGRAM_ID
) =>
  makeInstruction(
    DISCRIMINATORS.update_civilization_cap,
    Buffer.concat([encodeCivilization(args.civilization), u16(args.newCap)]),
    [
      { pubkey: accounts.mintState ?? findMintStatePda(programId), isWritable: true, isSigner: false },
      { pubkey: accounts.authority, isWritable: false, isSigner: true }
    ],
    programId
  )

export const withdrawUsdcTreasuryIx = (
  args: { amount: bigint | number },
  accounts: {
    mintState?: PublicKey
    mintAuthority: PublicKey
    treasuryUsdcAccount: PublicKey
    destination: PublicKey
    tokenProgram?: PublicKey
  },
  programId: PublicKey = ARISING_PROGRAM_ID
) =>
  makeInstruction(
    DISCRIMINATORS.withdraw_usdc_treasury,
    u64(args.amount),
    [
      { pubkey: accounts.mintState ?? findMintStatePda(programId), isWritable: true, isSigner: false },
      { pubkey: accounts.mintAuthority, isWritable: false, isSigner: true },
      { pubkey: accounts.treasuryUsdcAccount, isWritable: true, isSigner: false },
      { pubkey: accounts.destination, isWritable: true, isSigner: false },
      { pubkey: accounts.tokenProgram ?? TOKEN_PROGRAM_ID, isWritable: false, isSigner: false }
    ],
    programId
  )
