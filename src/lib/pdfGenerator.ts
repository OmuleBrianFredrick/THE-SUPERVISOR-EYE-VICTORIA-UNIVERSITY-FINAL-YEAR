import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function generateReportPDF(report: any) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('Supervisor Eye - Audit Report', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
  
  // Divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(14, 32, 196, 32);
  
  // Report Details
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text('Task Information', 14, 42);
  
  autoTable(doc, {
    startY: 46,
    theme: 'plain',
    head: [],
    body: [
      ['Task Title', report.task?.title || 'N/A'],
      ['Report Type', report.reportType || 'N/A'],
      ['Status', report.status || 'N/A'],
      ['Submitted By', `${report.submitter?.firstName || ''} ${report.submitter?.lastName || ''}`.trim() || 'N/A'],
      ['Submitted At', report.submittedAt ? new Date(report.submittedAt).toLocaleString() : 'N/A'],
      ['GPS Location', (report.gpsLat && report.gpsLng) ? `${report.gpsLat}, ${report.gpsLng}` : 'Not Available'],
    ],
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 40 },
      1: { textColor: [30, 41, 59] }
    }
  });
  
  // Field Notes
  const finalY = (doc as any).lastAutoTable.finalY || 80;
  
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text('Field Notes', 14, finalY + 15);
  
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const notesLines = doc.splitTextToSize(report.notes || 'No notes provided.', 180);
  doc.text(notesLines, 14, finalY + 23);
  
  // Evidence
  if (report.evidence && report.evidence.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('Attached Evidence', 14, 20);
    
    let yPos = 30;
    
    for (let i = 0; i < report.evidence.length; i++) {
      const item = report.evidence[i];
      if (item.mediaType === 'PHOTO' && item.mediaUrl) {
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }
        
        try {
          // Add image
          // Using try-catch as image loading might fail due to CORS or format issues depending on the URL
          doc.addImage(item.mediaUrl, 'JPEG', 14, yPos, 80, 60);
          
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.text(`Uploaded: ${new Date(item.uploadedAt).toLocaleString()}`, 100, yPos + 10);
          
          if (item.capturedLat && item.capturedLng) {
             doc.text(`Location: ${item.capturedLat}, ${item.capturedLng}`, 100, yPos + 16);
          }
          
          yPos += 70;
        } catch (e) {
          console.error('Failed to add image to PDF', e);
          doc.setFontSize(10);
          doc.setTextColor(239, 68, 68);
          doc.text(`[Image could not be loaded into PDF: ${item.mediaUrl}]`, 14, yPos);
          yPos += 15;
        }
      }
    }
  }
  
  // Save the PDF
  const filename = `Audit_Report_${report.id?.substring(0, 8) || 'Export'}.pdf`;
  doc.save(filename);
}

export async function getReportPDFBase64(report: any): Promise<string> {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('Supervisor Eye - Audit Report', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
  
  // Divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(14, 32, 196, 32);
  
  // Report Details
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text('Task Information', 14, 42);
  
  autoTable(doc, {
    startY: 46,
    theme: 'plain',
    head: [],
    body: [
      ['Task Title', report.task?.title || 'N/A'],
      ['Report Type', report.reportType || 'N/A'],
      ['Status', report.status || 'N/A'],
      ['Submitted By', `${report.submitter?.firstName || ''} ${report.submitter?.lastName || ''}`.trim() || 'N/A'],
      ['Submitted At', report.submittedAt ? new Date(report.submittedAt).toLocaleString() : 'N/A'],
      ['GPS Location', (report.gpsLat && report.gpsLng) ? `${report.gpsLat}, ${report.gpsLng}` : 'Not Available'],
    ],
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 40 },
      1: { textColor: [30, 41, 59] }
    }
  });
  
  // Field Notes
  const finalY = (doc as any).lastAutoTable.finalY || 80;
  
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text('Field Notes', 14, finalY + 15);
  
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const notesLines = doc.splitTextToSize(report.notes || 'No notes provided.', 180);
  doc.text(notesLines, 14, finalY + 23);
  
  // Return as base64
  return doc.output('datauristring').split(',')[1];
}
