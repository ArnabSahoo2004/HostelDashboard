import { jsPDF } from 'jspdf';

export function amountToWords(amount: number): string {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (amount === 0) return 'Zero Only';

  function convertHundreds(n: number): string {
    let result = '';
    if (n >= 100) { result += ones[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
    if (n >= 20)  { result += tens[Math.floor(n / 10)] + ' '; n %= 10; }
    if (n > 0)    result += ones[n] + ' ';
    return result.trim();
  }

  let num = Math.floor(amount);
  let result = '';
  if (num >= 10000000) { result += convertHundreds(Math.floor(num / 10000000)) + ' Crore '; num %= 10000000; }
  if (num >= 100000)   { result += convertHundreds(Math.floor(num / 100000))   + ' Lakh ';  num %= 100000;   }
  if (num >= 1000)     { result += convertHundreds(Math.floor(num / 1000))     + ' Thousand '; num %= 1000; }
  if (num > 0)           result += convertHundreds(num);
  return result.trim() + ' Only';
}

export function fmtDate(dateStr?: string | null): string {
  if (!dateStr) return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function fmtMonth(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

import { toJpeg } from 'html-to-image';

export async function generateHTMLInvoicePDF(element: HTMLElement, filename: string) {
  // Capture the element using html-to-image which supports modern CSS (unlike html2canvas)
  const imgData = await toJpeg(element, {
    quality: 1.0,
    pixelRatio: 2, // Higher scale for better resolution
    backgroundColor: '#ffffff'
  });
  
  // A4 size: 210mm x 297mm
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  // Using fixed dimensions from our template aspect ratio (794x1123)
  const pdfHeight = (1123 * pdfWidth) / 794;

  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(filename);
}
