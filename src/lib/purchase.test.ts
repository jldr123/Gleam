import { DEFAULT_PRODUCT, getProduct, isPrototypePurchase, prototypeProvider, purchasePlus, restorePlus, setPurchaseProvider } from './purchase'

describe('purchase module', () => {
  afterEach(() => setPurchaseProvider(prototypeProvider))

  it('unlocks for free in the prototype, with nothing to restore', async () => {
    expect(await getProduct()).toEqual(DEFAULT_PRODUCT)
    expect(await purchasePlus()).toEqual({ ok: true })
    expect(await restorePlus()).toEqual({ restored: false, message: 'Nothing to restore in the prototype.' })
    expect(isPrototypePurchase()).toBe(true)
  })

  it('takes the price and results from whichever provider is set', async () => {
    setPurchaseProvider({
      product: async () => ({ price: '£4.49', terms: 'One payment.' }),
      purchase: async () => ({ ok: false, message: null }),
      restore: async () => ({ restored: true, message: 'Gleam Plus is back.' }),
    })
    expect((await getProduct()).price).toBe('£4.49')
    expect(await purchasePlus()).toEqual({ ok: false, message: null })
    expect((await restorePlus()).restored).toBe(true)
    expect(isPrototypePurchase()).toBe(false)
  })
})
