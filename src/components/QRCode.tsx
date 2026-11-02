import { QRCodeSVG } from 'qrcode.react'
import type { Company } from '../types'

export function companyUrl(baseUrl: string, company: Company) {
  return `${baseUrl.replace(/\/+$/, '')}/company/${company.id}`
}

export default function QRCode({ company, baseUrl, size = 180 }: { company: Company; baseUrl: string; size?: number }) {
  return (
    <QRCodeSVG
      value={companyUrl(baseUrl, company)}
      size={size}
      level="M"
      marginSize={2}
      title={`QR code for ${company.name}`}
    />
  )
}
