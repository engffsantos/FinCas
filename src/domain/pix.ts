/**
 * Domain: Pix Payment Integration (Padrão EMVCo / BR Code do BACEN)
 * 
 * Regra Arquitetural:
 * 1. Cálculo do acerto (determinação dos valores a pagar/receber)
 * 2. Geração de payload Pix Copia e Cola oficial e QR Code
 * 3. Execução do pagamento no banco do usuário
 * 4. Confirmação explícita de liquidação (nunca assumir automático antes da confirmação)
 */

import { fromCents } from './money';

/**
 * Calcula o CRC-16 (Polinômio 0x1021, valor inicial 0xFFFF) exigido pelo Banco Central do Brasil
 */
function crc16(str: string): string {
  let crc = 0xffff;
  const strlen = str.length;
  for (let c = 0; c < strlen; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  const hex = (crc & 0xffff).toString(16).toUpperCase();
  return hex.padStart(4, '0');
}

function emvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export interface PixPayloadParams {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amountCents: number;
  txId?: string;
  description?: string;
}

/**
 * Gera a string Pix Copia e Cola no padrão oficial do Banco Central
 */
export function generatePixPayload({
  pixKey,
  merchantName,
  merchantCity,
  amountCents,
  txId = 'FINCAS',
  description = 'Acerto FinCas',
}: PixPayloadParams): string {
  const cleanKey = pixKey.trim();
  const cleanName = merchantName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 25).trim();
  const cleanCity = merchantCity.normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 15).trim() || 'SAO PAULO';
  const cleanTxId = txId.substring(0, 25).replace(/[^a-zA-Z0-9]/g, '') || 'FINCAS';

  // 00: Payload Format Indicator
  let payload = emvField('00', '01');

  // 01: Point of Initiation (12 = dinâmico ou 11 = estático)
  payload += emvField('01', '12');

  // 26: Merchant Account Information - Pix
  const gui = emvField('00', 'br.gov.bcb.pix');
  const key = emvField('01', cleanKey);
  const desc = description ? emvField('02', description.substring(0, 40)) : '';
  payload += emvField('26', `${gui}${key}${desc}`);

  // 52: Merchant Category Code (0000 = default)
  payload += emvField('52', '0000');

  // 53: Transaction Currency (986 = Real BRL)
  payload += emvField('53', '986');

  // 54: Transaction Amount
  if (amountCents > 0) {
    const formattedAmount = fromCents(amountCents).toFixed(2);
    payload += emvField('54', formattedAmount);
  }

  // 58: Country Code
  payload += emvField('58', 'BR');

  // 59: Merchant Name
  payload += emvField('59', cleanName || 'MORADOR CREDOR');

  // 60: Merchant City
  payload += emvField('60', cleanCity);

  // 62: Additional Data Field (TxID)
  const txIdField = emvField('05', cleanTxId);
  payload += emvField('62', txIdField);

  // 63: CRC16 prefix
  payload += '6304';
  const checksum = crc16(payload);

  return `${payload}${checksum}`;
}
