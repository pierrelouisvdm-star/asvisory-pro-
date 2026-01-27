from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
from datetime import datetime
from typing import Dict, Any, List
import os


def generate_client_report(client: Dict, analysis: Dict, currency_symbol: str = "R") -> BytesIO:
    """Generate a professional PDF report for a client's financial plan analysis"""
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=50,
        bottomMargin=50
    )
    
    # Styles
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        textColor=colors.HexColor('#0f172a'),
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        spaceBefore=20,
        spaceAfter=10,
        textColor=colors.HexColor('#0f172a')
    )
    
    subheading_style = ParagraphStyle(
        'CustomSubheading',
        parent=styles['Heading3'],
        fontSize=12,
        spaceBefore=15,
        spaceAfter=8,
        textColor=colors.HexColor('#334155')
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=8,
        textColor=colors.HexColor('#475569')
    )
    
    # Build document content
    story = []
    
    # Header
    story.append(Paragraph("AdvisoryPro", ParagraphStyle(
        'Logo',
        parent=styles['Normal'],
        fontSize=14,
        textColor=colors.HexColor('#10b981'),
        alignment=TA_CENTER
    )))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Financial Plan Analysis Report", title_style))
    
    # Client Info
    client_name = f"{client.get('first_name', '')} {client.get('last_name', '')}"
    story.append(Paragraph(f"Prepared for: <b>{client_name}</b>", body_style))
    story.append(Paragraph(f"Date: {datetime.now().strftime('%B %d, %Y')}", body_style))
    story.append(Spacer(1, 20))
    
    # Executive Summary
    story.append(Paragraph("Executive Summary", heading_style))
    
    health_rating = analysis.get('health_rating', 'N/A')
    overall_score = analysis.get('overall_score', 0)
    total_shortfalls = analysis.get('total_shortfalls', 0)
    total_gap = analysis.get('total_gap_amount', 0)
    monthly_need = analysis.get('estimated_monthly_investment_needed', 0)
    
    # Summary table
    summary_data = [
        ['Financial Health Score', f"{overall_score:.0f}/100"],
        ['Health Rating', health_rating],
        ['Total Shortfalls Identified', str(total_shortfalls)],
        ['Total Gap Amount', f"{currency_symbol}{total_gap:,.0f}"],
        ['Estimated Monthly Investment Needed', f"{currency_symbol}{monthly_need:,.0f}"]
    ]
    
    summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#0f172a')),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0'))
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 20))
    
    # Top Recommendations
    if analysis.get('top_recommendations'):
        story.append(Paragraph("Top Recommendations", heading_style))
        for i, rec in enumerate(analysis['top_recommendations'][:5], 1):
            story.append(Paragraph(f"{i}. {rec}", body_style))
        story.append(Spacer(1, 15))
    
    # Shortfalls by Priority
    priority_sections = [
        ('critical_shortfalls', 'Critical Priority Issues', '#dc2626'),
        ('high_priority_shortfalls', 'High Priority Issues', '#ea580c'),
        ('medium_priority_shortfalls', 'Medium Priority Issues', '#d97706'),
        ('low_priority_shortfalls', 'Low Priority Issues', '#16a34a'),
    ]
    
    for key, title, color in priority_sections:
        shortfalls = analysis.get(key, [])
        if shortfalls:
            story.append(Paragraph(title, ParagraphStyle(
                'PriorityHeading',
                parent=heading_style,
                textColor=colors.HexColor(color)
            )))
            
            for shortfall in shortfalls:
                # Shortfall title
                story.append(Paragraph(
                    f"<b>{shortfall.get('title', 'N/A')}</b>",
                    subheading_style
                ))
                
                # Description
                story.append(Paragraph(shortfall.get('description', ''), body_style))
                
                # Gap details table
                gap_data = [
                    ['Current', 'Target', 'Gap'],
                    [
                        f"{currency_symbol}{shortfall.get('current_value', 0):,.0f}",
                        f"{currency_symbol}{shortfall.get('target_value', 0):,.0f}",
                        f"{currency_symbol}{shortfall.get('gap', 0):,.0f}"
                    ]
                ]
                gap_table = Table(gap_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch])
                gap_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
                    ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#0f172a')),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                    ('TOPPADDING', (0, 0), (-1, -1), 8),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0'))
                ]))
                story.append(gap_table)
                
                # Recommendation
                story.append(Paragraph(
                    f"<b>Recommendation:</b> {shortfall.get('recommendation', '')}",
                    body_style
                ))
                
                # Action items
                action_items = shortfall.get('action_items', [])
                if action_items:
                    story.append(Paragraph("<b>Action Items:</b>", body_style))
                    for item in action_items:
                        story.append(Paragraph(f"• {item}", body_style))
                
                # Monthly cost
                monthly_cost = shortfall.get('estimated_monthly_cost', 0)
                if monthly_cost > 0:
                    story.append(Paragraph(
                        f"<b>Estimated Monthly Investment:</b> {currency_symbol}{monthly_cost:,.0f}",
                        body_style
                    ))
                
                story.append(Spacer(1, 15))
    
    # Financial Data Summary
    story.append(PageBreak())
    story.append(Paragraph("Financial Data Summary", heading_style))
    
    financial_data = client.get('financial_data', {})
    if financial_data:
        sections = [
            ("Income & Budget", [
                ('Monthly Income', financial_data.get('monthly_income', 0)),
                ('Monthly Expenses', financial_data.get('monthly_expenses', 0)),
                ('Annual Income', financial_data.get('annual_income', 0)),
            ]),
            ("Assets", [
                ('Total Assets', financial_data.get('total_assets', 0)),
                ('Liquid Assets', financial_data.get('liquid_assets', 0)),
                ('Investments', financial_data.get('investments', 0)),
                ('Property Value', financial_data.get('property_value', 0)),
            ]),
            ("Liabilities", [
                ('Total Liabilities', financial_data.get('total_liabilities', 0)),
                ('Mortgage Balance', financial_data.get('mortgage_balance', 0)),
                ('Other Debt', financial_data.get('other_debt', 0)),
            ]),
            ("Insurance", [
                ('Life Insurance Coverage', financial_data.get('life_insurance_coverage', 0)),
                ('Life Insurance Needed', financial_data.get('life_insurance_needed', 0)),
                ('Disability Coverage', financial_data.get('disability_coverage', 0)),
            ]),
            ("Retirement", [
                ('Retirement Savings', financial_data.get('retirement_savings', 0)),
                ('Retirement Goal', financial_data.get('retirement_goal', 0)),
                ('Years to Retirement', financial_data.get('years_to_retirement', 0)),
            ]),
        ]
        
        for section_title, items in sections:
            story.append(Paragraph(section_title, subheading_style))
            data = [[item[0], f"{currency_symbol}{item[1]:,.0f}" if isinstance(item[1], (int, float)) and item[0] != 'Years to Retirement' else str(item[1])] for item in items]
            table = Table(data, colWidths=[2.5*inch, 2*inch])
            table.setStyle(TableStyle([
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#475569')),
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('LINEBELOW', (0, 0), (-1, -2), 0.5, colors.HexColor('#e2e8f0'))
            ]))
            story.append(table)
            story.append(Spacer(1, 10))
    
    # Footer
    story.append(Spacer(1, 30))
    story.append(Paragraph(
        "This report is for informational purposes only and does not constitute financial advice. "
        "Please consult with a qualified financial advisor before making any financial decisions.",
        ParagraphStyle(
            'Disclaimer',
            parent=body_style,
            fontSize=8,
            textColor=colors.HexColor('#94a3b8'),
            alignment=TA_CENTER
        )
    ))
    story.append(Paragraph(
        f"Generated by AdvisoryPro • {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        ParagraphStyle(
            'Footer',
            parent=body_style,
            fontSize=8,
            textColor=colors.HexColor('#94a3b8'),
            alignment=TA_CENTER
        )
    ))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer


def generate_goals_report(client: Dict, goals: List[Dict], currency_symbol: str = "R") -> BytesIO:
    """Generate a PDF report for client's financial goals"""
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=20, spaceAfter=20, textColor=colors.HexColor('#0f172a'), alignment=TA_CENTER)
    heading_style = ParagraphStyle('Heading', parent=styles['Heading2'], fontSize=14, spaceBefore=15, spaceAfter=10, textColor=colors.HexColor('#0f172a'))
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=10, spaceAfter=6, textColor=colors.HexColor('#475569'))
    
    story = []
    
    client_name = f"{client.get('first_name', '')} {client.get('last_name', '')}"
    story.append(Paragraph("Financial Goals Report", title_style))
    story.append(Paragraph(f"Prepared for: <b>{client_name}</b>", body_style))
    story.append(Paragraph(f"Date: {datetime.now().strftime('%B %d, %Y')}", body_style))
    story.append(Spacer(1, 20))
    
    if goals:
        for goal in goals:
            story.append(Paragraph(f"<b>{goal.get('name', 'Unnamed Goal')}</b>", heading_style))
            
            progress = (goal.get('current_amount', 0) / goal.get('target_amount', 1)) * 100 if goal.get('target_amount', 0) > 0 else 0
            
            data = [
                ['Category', goal.get('category', 'N/A').replace('_', ' ').title()],
                ['Target Amount', f"{currency_symbol}{goal.get('target_amount', 0):,.0f}"],
                ['Current Amount', f"{currency_symbol}{goal.get('current_amount', 0):,.0f}"],
                ['Progress', f"{progress:.1f}%"],
                ['Monthly Contribution', f"{currency_symbol}{goal.get('monthly_contribution', 0):,.0f}"],
                ['Target Date', goal.get('target_date', 'N/A')],
                ['Status', goal.get('status', 'N/A').replace('_', ' ').title()],
            ]
            
            table = Table(data, colWidths=[2*inch, 2.5*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8fafc')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#0f172a')),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0'))
            ]))
            story.append(table)
            story.append(Spacer(1, 15))
    else:
        story.append(Paragraph("No financial goals have been set yet.", body_style))
    
    doc.build(story)
    buffer.seek(0)
    return buffer
