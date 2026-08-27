import "server-only"

import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto"
import { promisify } from "node:util"

// promisify() collapses scrypt's overloads and drops the options argument,
// so the options-taking signature is restored here.
const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: ScryptOptions
) => Promise<Buffer>

// scrypt is in Node's standard library, so there is no native module to build.
// N=16384 keeps a single hash in the ~50-100ms range on modern hardware.
const COST = 16_384
const BLOCK_SIZE = 8
const PARALLELISM = 1
const KEY_LENGTH = 64

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const derived = (await scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELISM,
  }))

  return [
    "scrypt",
    COST,
    BLOCK_SIZE,
    PARALLELISM,
    salt.toString("hex"),
    derived.toString("hex"),
  ].join("$")
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [scheme, cost, blockSize, parallelism, saltHex, hashHex] =
    stored.split("$")

  if (scheme !== "scrypt" || !saltHex || !hashHex) {
    return false
  }

  const expected = Buffer.from(hashHex, "hex")
  const derived = (await scrypt(
    password.normalize("NFKC"),
    Buffer.from(saltHex, "hex"),
    expected.length,
    { N: Number(cost), r: Number(blockSize), p: Number(parallelism) }
  ))

  return timingSafeEqual(derived, expected)
}
