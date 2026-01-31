import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Printer, Download, FileText, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PrintReport = ({ 
  title, 
  calculatorType,
  inputs,
  results,
  chartData,
  className 
}) => {
  const printRef = useRef(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - AdvisoryPro Report</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: 'Inter', -apple-system, sans-serif; 
              padding: 40px; 
              color: #1a2332;
              line-height: 1.6;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center;
              margin-bottom: 30px; 
              padding-bottom: 20px; 
              border-bottom: 2px solid #c9a227; 
            }
            .logo { 
              font-family: 'Playfair Display', Georgia, serif;
              font-size: 24px; 
              font-weight: 600; 
            }
            .logo span { color: #c9a227; }
            .date { color: #6b7280; font-size: 14px; }
            .title { 
              font-family: 'Playfair Display', Georgia, serif;
              font-size: 28px; 
              font-weight: 600; 
              margin-bottom: 8px; 
            }
            .subtitle { color: #6b7280; margin-bottom: 30px; }
            .section { margin-bottom: 30px; }
            .section-title { 
              font-size: 16px; 
              font-weight: 600; 
              color: #1a2332; 
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 1px solid #e5e7eb;
            }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
            .item { 
              padding: 15px; 
              background: #faf8f5; 
              border-radius: 8px;
              border-left: 3px solid #c9a227;
            }
            .item-label { 
              font-size: 12px; 
              color: #6b7280; 
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .item-value { 
              font-size: 18px; 
              font-weight: 600; 
              color: #1a2332; 
            }
            .result-item { border-left-color: #166534; background: #f0fdf4; }
            .footer { 
              margin-top: 40px; 
              padding-top: 20px; 
              border-top: 1px solid #e5e7eb; 
              font-size: 12px; 
              color: #6b7280; 
              text-align: center;
            }
            .disclaimer {
              background: #fef3c7;
              padding: 15px;
              border-radius: 8px;
              font-size: 12px;
              color: #92400e;
              margin-top: 30px;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline-gold" size="sm" className={cn("gap-2", className)}>
          <Printer className="h-4 w-4" />
          <span className="hidden sm:inline">Print Report</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FileText className="h-5 w-5 text-gold" />
            Client Report Preview
          </DialogTitle>
          <DialogDescription>
            Review the report before printing or sharing with your client
          </DialogDescription>
        </DialogHeader>
        
        {/* Print Preview */}
        <div 
          ref={printRef}
          className="bg-card rounded-lg p-6 border border-border"
        >
          {/* Header */}
          <div className="header flex justify-between items-center mb-6 pb-4 border-b-2 border-gold">
            <div className="logo font-display text-xl font-semibold">
              Advisory<span className="text-gold">Pro</span>
            </div>
            <div className="date text-sm text-muted-foreground">
              {currentDate}
            </div>
          </div>

          {/* Title */}
          <h1 className="title font-display text-2xl font-semibold mb-2">{title}</h1>
          <p className="subtitle text-muted-foreground mb-6">
            Professional calculation prepared using AdvisoryPro Financial Advisor Suite
          </p>

          {/* Inputs Section */}
          <div className="section mb-6">
            <h2 className="section-title text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Input Parameters
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {inputs.map((input, index) => (
                <div key={index} className="item p-4 bg-muted/30 rounded-lg border-l-4 border-gold/50">
                  <p className="item-label text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    {input.label}
                  </p>
                  <p className="item-value text-lg font-semibold text-foreground">
                    {input.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Results Section */}
          <div className="section mb-6">
            <h2 className="section-title text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Calculated Results
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {results.map((result, index) => (
                <div key={index} className="result-item p-4 bg-success/5 rounded-lg border-l-4 border-success/50">
                  <p className="item-label text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    {result.label}
                  </p>
                  <p className="item-value text-lg font-semibold text-foreground">
                    {result.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="disclaimer bg-gold/10 p-4 rounded-lg text-sm text-gold-dark border border-gold/20">
            <strong>Disclaimer:</strong> This calculation is for illustrative purposes only and should not be considered financial advice. 
            Actual results may vary based on market conditions, fees, and other factors. 
            Please consult with a qualified financial advisor before making investment decisions.
          </div>

          {/* Footer */}
          <div className="footer mt-6 pt-4 border-t border-border text-center text-xs text-muted-foreground">
            <p>Generated by AdvisoryPro Financial Advisor Suite</p>
            <p>© {new Date().getFullYear()} AdvisoryPro. All rights reserved.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print Report
          </Button>
          <Button variant="premium" onClick={handlePrint} className="gap-2">
            <Download className="h-4 w-4" />
            Save as PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
