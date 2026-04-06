import { QRCodeSVG } from 'qrcode.react'

/**
 * PrintQR — shown only in @media print.
 * Renders an SVG QR code + label + URL in the bottom-right corner of the page.
 *
 * Props:
 *   url   {string} — full URL to encode
 *   label {string} — short caption above the URL
 */
export default function PrintQR({ url, label }) {
  if (!url) return null

  return (
    <>
      <style>{`
        .print-qr { display: none; }
        @media print {
          .print-qr {
            display: block;
            position: fixed;
            bottom: 12mm;
            right: 12mm;
            text-align: center;
            width: 110px;
          }
          .print-qr svg {
            display: block !important;
            width: 90px !important;
            height: 90px !important;
            margin: 0 auto;
          }
          .print-qr-label {
            font-family: Arial, sans-serif;
            font-size: 8pt;
            font-weight: bold;
            color: #000;
            margin: 4px 0 2px;
          }
          .print-qr-url {
            font-family: Arial, sans-serif;
            font-size: 6.5pt;
            color: #555;
            word-break: break-all;
            margin: 0;
          }
        }
      `}</style>
      <div className="print-qr">
        <QRCodeSVG
          value={url}
          size={90}
          level="M"
          includeMargin={false}
        />
        <p className="print-qr-label">{label}</p>
        <p className="print-qr-url">{url.replace('https://', '')}</p>
      </div>
    </>
  )
}
