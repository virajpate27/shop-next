// src/utils/tax.js

export const TAX_RATES = [
    { label: 'No tax (0%)', value: 0 },
    { label: 'GST 3%', value: 3 },
    { label: 'GST 5%', value: 5 },
    { label: 'GST 12%', value: 12 },
    { label: 'GST 18%', value: 18 },
    { label: 'GST 28%', value: 28 },
    { label: 'Custom', value: 'custom' },
  ]
  
  export const TAX_TYPES = [
    {
      value: 'inclusive',
      label: 'Tax inclusive',
      desc: 'Tax is included in the listed price. ₹999 already contains GST.',
    },
    {
      value: 'exclusive',
      label: 'Tax exclusive',
      desc: 'Tax is added on top of the listed price. ₹999 + 18% GST = ₹1,179.',
    },
  ]
  
  /**
   * Calculate tax details for a single line item.
   *
   * @param {number} price       - Listed price per unit (as shown to customer)
   * @param {number} taxRate     - Tax rate in percent (e.g. 18 for 18%)
   * @param {string} taxType     - 'inclusive' | 'exclusive'
   * @param {number} quantity    - Number of units
   * @returns {{ basePrice, taxAmount, totalPrice, taxRate, taxType }}
   */
  export function calculateTax(price, taxRate = 0, taxType = 'inclusive', quantity = 1) {
    const rate = Number(taxRate) || 0
    const qty = Number(quantity) || 1
    const unitPrice = Number(price) || 0
  
    if (rate === 0) {
      return {
        basePrice: unitPrice,
        taxAmount: 0,
        totalPrice: unitPrice,
        taxPerUnit: 0,
        taxRate: 0,
        taxType,
      }
    }
  
    let basePrice, taxPerUnit, totalPrice
  
    if (taxType === 'inclusive') {
      // Tax is baked into the price — extract it
      basePrice = unitPrice / (1 + rate / 100)
      taxPerUnit = unitPrice - basePrice
      totalPrice = unitPrice // price already includes tax
    } else {
      // Tax is added on top
      basePrice = unitPrice
      taxPerUnit = unitPrice * (rate / 100)
      totalPrice = unitPrice + taxPerUnit
    }
  
    return {
      basePrice: round2(basePrice),
      taxAmount: round2(taxPerUnit * qty),
      taxPerUnit: round2(taxPerUnit),
      totalPrice: round2(totalPrice),
      totalWithQty: round2(totalPrice * qty),
      taxRate: rate,
      taxType,
    }
  }
  
  /**
   * Calculate tax totals across all cart items.
   * Each item carries its own taxRate + taxType from the product.
   */
  export function calculateCartTax(items) {
    let subtotalBeforeTax = 0
    let totalTaxAmount = 0
    let totalAmount = 0
  
    const breakdown = items.map((item) => {
      const tax = calculateTax(
        item.price,
        item.taxRate || 0,
        item.taxType || 'inclusive',
        item.quantity
      )
  
      subtotalBeforeTax += tax.basePrice * item.quantity
      totalTaxAmount += tax.taxAmount
      totalAmount += tax.totalWithQty
  
      return { ...item, tax }
    })
  
    return {
      breakdown,
      subtotalBeforeTax: round2(subtotalBeforeTax),
      totalTaxAmount: round2(totalTaxAmount),
      totalAmount: round2(totalAmount),
    }
  }
  
  /**
   * Group tax amounts by rate for the GST invoice breakdown
   * (required for proper GST invoicing in India: CGST + SGST or IGST)
   */
  export function getTaxBreakdown(items) {
    const groups = {}
  
    items.forEach((item) => {
      const rate = item.taxRate || 0
      const taxType = item.taxType || 'inclusive'
      if (rate === 0) return
  
      const tax = calculateTax(item.price, rate, taxType, item.quantity)
      const key = `${rate}`
  
      if (!groups[key]) {
        groups[key] = { rate, taxAmount: 0, baseAmount: 0 }
      }
      groups[key].taxAmount += tax.taxAmount
      groups[key].baseAmount += tax.basePrice * item.quantity
    })
  
    return Object.values(groups).map((g) => ({
      ...g,
      taxAmount: round2(g.taxAmount),
      baseAmount: round2(g.baseAmount),
      // In India: split into CGST + SGST (intra-state) each at rate/2
      cgst: round2(g.taxAmount / 2),
      sgst: round2(g.taxAmount / 2),
    }))
  }
  
  /** Format a tax rate for display */
  export function formatTaxRate(rate) {
    if (!rate || rate === 0) return 'No tax'
    return `GST ${rate}%`
  }
  
  function round2(n) {
    return Math.round(n * 100) / 100
  }