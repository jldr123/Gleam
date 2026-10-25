/**
 * Everything about buying Gleam Plus lives here, so the App Store build can
 * swap the prototype for StoreKit, and a subscription can replace the
 * one-time unlock, without touching the screens.
 */

export interface PlusProduct {
  /** The store's own price string, already localised (e.g. "£4.49"). */
  price: string
  /** The words under the button, which depend on how Plus is sold. */
  terms: string
}

export type PurchaseResult = { ok: true } | { ok: false; message: string | null }
export type RestoreResult = { restored: boolean; message: string }

export interface PurchaseProvider {
  product: () => Promise<PlusProduct>
  purchase: () => Promise<PurchaseResult>
  restore: () => Promise<RestoreResult>
}

/** Shown before the store answers, and in the prototype. */
export const DEFAULT_PRODUCT: PlusProduct = { price: 'US$4.99', terms: 'One payment, yours to keep. No subscription.' }

/** The web prototype: unlocking is free, and there is never anything to restore. */
export const prototypeProvider: PurchaseProvider = {
  product: async () => DEFAULT_PRODUCT,
  purchase: async () => ({ ok: true }),
  restore: async () => ({ restored: false, message: 'Nothing to restore in the prototype.' }),
}

let provider: PurchaseProvider = prototypeProvider

/** The native build calls this at start-up with its StoreKit provider. */
export function setPurchaseProvider(next: PurchaseProvider): void {
  provider = next
}

export const getProduct = () => provider.product()
export const purchasePlus = () => provider.purchase()
export const restorePlus = () => provider.restore()

/** True while this is the web prototype, so the screens can say unlocking is free here. */
export const isPrototypePurchase = () => provider === prototypeProvider
