// VietQR/NAPAS QRIBFTTA TLV payload. QR is encoded locally; no bank information is sent to an image service.
const tlv = (tag: string, value: string) => {
  if (Buffer.byteLength(value, 'utf8') > 99)
    throw new Error('QR field too long');
  return (
    tag + String(Buffer.byteLength(value, 'utf8')).padStart(2, '0') + value
  );
};
export function crc16(value: string) {
  let crc = 0xffff;
  for (const b of Buffer.from(value, 'utf8')) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i++)
      crc = ((crc << 1) ^ (crc & 0x8000 ? 0x1021 : 0)) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
export function bankQrPayload(
  bankBin: string,
  account: string,
  amount: number,
  reference: string,
) {
  if (
    !/^\d{6}$/.test(bankBin) ||
    !/^[A-Za-z0-9]{3,19}$/.test(account) ||
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    amount > 50000000 ||
    !/^[A-Z0-9]{8,24}$/.test(reference)
  )
    throw new Error('Invalid bank transfer QR data');
  const network =
    tlv('00', 'A000000727') +
    tlv('01', tlv('00', bankBin) + tlv('01', account)) +
    tlv('02', 'QRIBFTTA');
  const data =
    tlv('00', '01') +
    tlv('01', '12') +
    tlv('38', network) +
    tlv('53', '704') +
    tlv('54', String(amount)) +
    tlv('58', 'VN') +
    tlv('62', tlv('08', reference)) +
    '6304';
  return data + crc16(data);
}
