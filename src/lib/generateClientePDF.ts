import jsPDF from 'jspdf';
import { Cliente, ClienteActivity } from '@/types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface PropertyMatch {
  id: string;
  property_title: string;
  property_price: number | null;
  property_location: string | null;
  reaction: string | null;
  suggested_at: string | null;
}

interface GeneratePDFOptions {
  cliente: Cliente;
  activities: ClienteActivity[];
  propertyMatches: PropertyMatch[];
  agentName?: string;
}

export async function generateClientePDF({
  cliente,
  activities,
  propertyMatches,
  agentName,
}: GeneratePDFOptions): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  const addText = (text: string, x: number, yPos: number, options?: { 
    fontSize?: number; 
    fontStyle?: 'normal' | 'bold';
    color?: [number, number, number];
    maxWidth?: number;
  }) => {
    const { fontSize = 10, fontStyle = 'normal', color = [0, 0, 0], maxWidth } = options || {};
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.setTextColor(...color);
    if (maxWidth) {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, yPos);
      return lines.length * (fontSize * 0.4);
    }
    doc.text(text, x, yPos);
    return fontSize * 0.4;
  };

  const addLine = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  const checkPageBreak = (neededSpace: number) => {
    if (y + neededSpace > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // === HEADER ===
  addText(`${cliente.emoji} ${cliente.nome}`, margin, y, { fontSize: 18, fontStyle: 'bold' });
  y += 8;
  
  if (cliente.paese) {
    addText(`🌍 ${cliente.paese}`, margin, y, { fontSize: 11, color: [100, 100, 100] });
    y += 5;
  }
  
  addText(`Report generato il ${format(new Date(), 'dd MMMM yyyy', { locale: it })}`, margin, y, { 
    fontSize: 9, 
    color: [150, 150, 150] 
  });
  y += 10;
  addLine();

  // === DATI PERSONALI ===
  checkPageBreak(30);
  addText('DATI PERSONALI', margin, y, { fontSize: 12, fontStyle: 'bold' });
  y += 7;

  const personalData = [
    ['Telefono', cliente.telefono || 'Non specificato'],
    ['Email', cliente.email || 'Non specificato'],
    ['Paese', cliente.paese || 'Non specificato'],
    ['Agente', agentName || 'Non assegnato'],
    ['Status', cliente.status],
  ];

  personalData.forEach(([label, value]) => {
    addText(`${label}:`, margin, y, { fontSize: 10, fontStyle: 'bold' });
    addText(value, margin + 40, y, { fontSize: 10 });
    y += 5;
  });
  y += 5;
  addLine();

  // === PREFERENZE RICERCA ===
  checkPageBreak(50);
  addText('PREFERENZE RICERCA', margin, y, { fontSize: 12, fontStyle: 'bold' });
  y += 7;

  const formatBudget = (budget: number | null) => {
    if (!budget) return 'Non specificato';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(budget);
  };

  const preferences = [
    ['Budget max', formatBudget(cliente.budget_max)],
    ['Regioni', cliente.regioni.length > 0 ? cliente.regioni.join(', ') : 'Non specificate'],
    ['Tipologia', cliente.tipologia.length > 0 ? cliente.tipologia.join(', ') : 'Non specificata'],
    ['Contesto', cliente.contesto.length > 0 ? cliente.contesto.join(', ') : 'Non specificato'],
    ['Camere', cliente.camere || 'Non specificato'],
    ['Bagni', cliente.bagni?.toString() || 'Non specificato'],
    ['Piscina', cliente.piscina || 'Non specificato'],
    ['Terreno', cliente.terreno || 'Non specificato'],
    ['Mutuo', cliente.mutuo || 'Non specificato'],
    ['Tempistiche', cliente.tempo_ricerca || 'Non specificate'],
    ['Uso', cliente.uso || 'Non specificato'],
  ];

  preferences.forEach(([label, value]) => {
    addText(`${label}:`, margin, y, { fontSize: 10, fontStyle: 'bold' });
    const height = addText(value, margin + 40, y, { fontSize: 10, maxWidth: pageWidth - margin * 2 - 40 });
    y += Math.max(5, height + 2);
  });
  y += 5;
  addLine();

  // === NOTE ===
  if (cliente.descrizione || cliente.note_extra) {
    checkPageBreak(30);
    addText('NOTE', margin, y, { fontSize: 12, fontStyle: 'bold' });
    y += 7;

    if (cliente.descrizione) {
      addText('Descrizione:', margin, y, { fontSize: 10, fontStyle: 'bold' });
      y += 5;
      const height = addText(cliente.descrizione, margin, y, { fontSize: 10, maxWidth: pageWidth - margin * 2 });
      y += height + 3;
    }

    if (cliente.note_extra) {
      addText('Note aggiuntive:', margin, y, { fontSize: 10, fontStyle: 'bold' });
      y += 5;
      const height = addText(cliente.note_extra, margin, y, { fontSize: 10, maxWidth: pageWidth - margin * 2 });
      y += height + 3;
    }
    y += 5;
    addLine();
  }

  // === STORICO ATTIVITÀ ===
  if (activities.length > 0) {
    checkPageBreak(40);
    addText('STORICO ATTIVITÀ (ultime 10)', margin, y, { fontSize: 12, fontStyle: 'bold' });
    y += 7;

    const recentActivities = activities.slice(0, 10);
    recentActivities.forEach(activity => {
      checkPageBreak(15);
      const date = format(new Date(activity.created_at), 'dd/MM/yyyy HH:mm', { locale: it });
      addText(`• ${date}`, margin, y, { fontSize: 9 });
      addText(activity.title, margin + 35, y, { fontSize: 9, fontStyle: 'bold' });
      y += 4;
      if (activity.description) {
        addText(activity.description, margin + 35, y, { fontSize: 9, color: [100, 100, 100] });
        y += 4;
      }
      y += 2;
    });
    y += 5;
    addLine();
  }

  // === PROPOSTE IMMOBILIARI ===
  if (propertyMatches.length > 0) {
    checkPageBreak(40);
    addText('PROPOSTE IMMOBILIARI', margin, y, { fontSize: 12, fontStyle: 'bold' });
    y += 7;

    propertyMatches.forEach(match => {
      checkPageBreak(15);
      const reaction = match.reaction === 'interested' ? '👍' : 
                       match.reaction === 'not_interested' ? '👎' : 
                       match.reaction === 'maybe' ? '🤔' : '•';
      
      addText(reaction, margin, y, { fontSize: 10 });
      addText(match.property_title, margin + 8, y, { fontSize: 10, fontStyle: 'bold', maxWidth: pageWidth - margin * 2 - 50 });
      
      if (match.property_price) {
        const price = new Intl.NumberFormat('it-IT', {
          style: 'currency',
          currency: 'EUR',
          maximumFractionDigits: 0,
        }).format(match.property_price);
        addText(price, pageWidth - margin - 30, y, { fontSize: 9 });
      }
      y += 5;
      
      if (match.property_location) {
        addText(`📍 ${match.property_location}`, margin + 8, y, { fontSize: 9, color: [100, 100, 100] });
        y += 4;
      }
      y += 2;
    });
  }

  // === FOOTER ===
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Cortesi Luxury Real Estate - Pagina ${i} di ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save
  const fileName = `cliente_${cliente.nome.replace(/\s+/g, '_').toLowerCase()}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
}
