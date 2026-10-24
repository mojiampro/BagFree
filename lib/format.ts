const bahtFormatter = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 });

export function formatBaht(amount: number) {
  return `${bahtFormatter.format(amount)} ฿`;
}

export function normalizePhone(value: string) {
  return value.replace(/[\s-]/g, "");
}

/** Thai phone: 10 digits starting with 0. */
export function isValidThaiPhone(value: string) {
  return /^0\d{9}$/.test(normalizePhone(value));
}
