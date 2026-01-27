from typing import List
from models.client import FinancialData
from models.financial_plan import (
    FinancialPlanAnalysis,
    Shortfall,
    ShortfallPriority,
    ShortfallCategory
)


def analyze_financial_plan(client_id: str, advisor_id: str, financial_data: FinancialData) -> FinancialPlanAnalysis:
    """
    Analyze a client's financial data and identify shortfalls/gaps in their financial plan.
    Returns a comprehensive analysis with prioritized recommendations.
    """
    shortfalls: List[Shortfall] = []
    total_score = 100  # Start with perfect score and deduct for shortfalls
    
    # 1. LIFE INSURANCE ANALYSIS
    if financial_data.life_insurance_needed and financial_data.life_insurance_needed > 0:
        coverage_gap = financial_data.life_insurance_needed - financial_data.life_insurance_coverage
        if coverage_gap > 0:
            gap_pct = (coverage_gap / financial_data.life_insurance_needed) * 100
            priority = ShortfallPriority.CRITICAL if gap_pct > 50 else (
                ShortfallPriority.HIGH if gap_pct > 25 else ShortfallPriority.MEDIUM
            )
            # Estimate monthly premium (rough: R5-10 per R1000 coverage)
            estimated_monthly = (coverage_gap / 1000) * 7
            
            shortfalls.append(Shortfall(
                category=ShortfallCategory.LIFE_INSURANCE,
                priority=priority,
                title="Life Insurance Coverage Gap",
                description=f"Current coverage is {gap_pct:.0f}% below the recommended amount based on DIME analysis.",
                current_value=financial_data.life_insurance_coverage,
                target_value=financial_data.life_insurance_needed,
                gap=coverage_gap,
                gap_percentage=gap_pct,
                recommendation="Increase life insurance coverage to protect family from financial hardship.",
                action_items=[
                    "Review current policy terms and beneficiaries",
                    "Get quotes for additional term life coverage",
                    "Consider income replacement for 10-15 years",
                    "Factor in debt payoff and children's education"
                ],
                estimated_monthly_cost=estimated_monthly
            ))
            total_score -= min(20, gap_pct * 0.4)
    
    # 2. EMERGENCY FUND ANALYSIS
    if financial_data.emergency_fund_needed and financial_data.emergency_fund_needed > 0:
        fund_gap = financial_data.emergency_fund_needed - financial_data.emergency_fund_current
        if fund_gap > 0:
            gap_pct = (fund_gap / financial_data.emergency_fund_needed) * 100
            priority = ShortfallPriority.CRITICAL if gap_pct > 75 else (
                ShortfallPriority.HIGH if gap_pct > 50 else ShortfallPriority.MEDIUM
            )
            # Save over 12 months
            estimated_monthly = fund_gap / 12
            
            shortfalls.append(Shortfall(
                category=ShortfallCategory.EMERGENCY_FUND,
                priority=priority,
                title="Emergency Fund Deficit",
                description=f"Emergency fund is {gap_pct:.0f}% below the recommended 3-6 months expenses.",
                current_value=financial_data.emergency_fund_current,
                target_value=financial_data.emergency_fund_needed,
                gap=fund_gap,
                gap_percentage=gap_pct,
                recommendation="Build emergency fund to cover unexpected expenses and job loss.",
                action_items=[
                    "Open a dedicated high-yield savings account",
                    "Set up automatic monthly transfers",
                    "Start with 1 month expenses, then build to 3-6 months",
                    "Keep funds liquid but separate from checking"
                ],
                estimated_monthly_cost=estimated_monthly
            ))
            total_score -= min(15, gap_pct * 0.3)
    
    # 3. RETIREMENT ANALYSIS
    if financial_data.retirement_goal and financial_data.retirement_goal > 0:
        retirement_gap = financial_data.retirement_goal - financial_data.retirement_savings
        if retirement_gap > 0:
            gap_pct = (retirement_gap / financial_data.retirement_goal) * 100
            years = financial_data.years_to_retirement or 20
            # Rough monthly savings needed (simplified)
            estimated_monthly = retirement_gap / (years * 12) if years > 0 else 0
            
            priority = ShortfallPriority.HIGH if gap_pct > 60 else (
                ShortfallPriority.MEDIUM if gap_pct > 30 else ShortfallPriority.LOW
            )
            
            shortfalls.append(Shortfall(
                category=ShortfallCategory.RETIREMENT,
                priority=priority,
                title="Retirement Savings Shortfall",
                description=f"Retirement savings are {gap_pct:.0f}% below target for comfortable retirement.",
                current_value=financial_data.retirement_savings,
                target_value=financial_data.retirement_goal,
                gap=retirement_gap,
                gap_percentage=gap_pct,
                recommendation=f"Increase retirement contributions to reach goal in {years} years.",
                action_items=[
                    "Maximize employer pension contributions",
                    "Consider additional retirement annuity (RA)",
                    "Review investment allocation based on time horizon",
                    "Take advantage of tax deductions on retirement contributions"
                ],
                estimated_monthly_cost=estimated_monthly
            ))
            total_score -= min(20, gap_pct * 0.3)
    
    # 4. DEBT ANALYSIS
    if financial_data.total_liabilities and financial_data.total_assets:
        debt_to_asset_ratio = (financial_data.total_liabilities / financial_data.total_assets) * 100 if financial_data.total_assets > 0 else 100
        
        if debt_to_asset_ratio > 50:  # High debt ratio
            priority = ShortfallPriority.CRITICAL if debt_to_asset_ratio > 80 else ShortfallPriority.HIGH
            # Suggest paying off debt over 3-5 years
            estimated_monthly = financial_data.other_debt / 36 if financial_data.other_debt else 0
            
            shortfalls.append(Shortfall(
                category=ShortfallCategory.DEBT,
                priority=priority,
                title="High Debt-to-Asset Ratio",
                description=f"Debt represents {debt_to_asset_ratio:.0f}% of total assets, limiting financial flexibility.",
                current_value=financial_data.total_liabilities,
                target_value=financial_data.total_assets * 0.3,  # Target 30% ratio
                gap=financial_data.total_liabilities - (financial_data.total_assets * 0.3),
                gap_percentage=debt_to_asset_ratio - 30,
                recommendation="Implement debt reduction strategy to improve financial health.",
                action_items=[
                    "List all debts with interest rates",
                    "Use avalanche method for highest interest debt first",
                    "Consider debt consolidation if rates are high",
                    "Avoid taking on new debt until ratio improves"
                ],
                estimated_monthly_cost=estimated_monthly
            ))
            total_score -= min(20, (debt_to_asset_ratio - 30) * 0.4)
    
    # 5. BUDGET ANALYSIS
    if financial_data.monthly_income and financial_data.monthly_expenses:
        savings_rate = ((financial_data.monthly_income - financial_data.monthly_expenses) / financial_data.monthly_income) * 100
        
        if savings_rate < 20:  # Should save at least 20%
            priority = ShortfallPriority.HIGH if savings_rate < 10 else ShortfallPriority.MEDIUM
            target_savings = financial_data.monthly_income * 0.2
            current_savings = financial_data.monthly_income - financial_data.monthly_expenses
            gap = target_savings - current_savings
            
            shortfalls.append(Shortfall(
                category=ShortfallCategory.BUDGET,
                priority=priority,
                title="Low Savings Rate",
                description=f"Current savings rate of {savings_rate:.0f}% is below the recommended 20%.",
                current_value=current_savings,
                target_value=target_savings,
                gap=gap,
                gap_percentage=((20 - savings_rate) / 20) * 100,
                recommendation="Reduce expenses or increase income to improve savings rate.",
                action_items=[
                    "Review and categorize all monthly expenses",
                    "Identify discretionary spending to cut",
                    "Follow 50/30/20 rule: needs/wants/savings",
                    "Automate savings transfers on payday"
                ],
                estimated_monthly_cost=gap
            ))
            total_score -= min(15, (20 - savings_rate) * 0.75)
    
    # 6. EDUCATION SAVINGS ANALYSIS
    if financial_data.education_savings_needed and financial_data.education_savings_needed > 0:
        education_gap = financial_data.education_savings_needed - financial_data.education_savings_current
        if education_gap > 0:
            gap_pct = (education_gap / financial_data.education_savings_needed) * 100
            # Save over 10 years (typical)
            estimated_monthly = education_gap / 120
            
            priority = ShortfallPriority.MEDIUM if gap_pct > 50 else ShortfallPriority.LOW
            
            shortfalls.append(Shortfall(
                category=ShortfallCategory.EDUCATION,
                priority=priority,
                title="Education Savings Gap",
                description=f"Education fund is {gap_pct:.0f}% below projected needs.",
                current_value=financial_data.education_savings_current,
                target_value=financial_data.education_savings_needed,
                gap=education_gap,
                gap_percentage=gap_pct,
                recommendation="Start or increase education savings to meet future costs.",
                action_items=[
                    "Open a tax-free savings account for education",
                    "Consider education-specific investment products",
                    "Factor in education inflation (typically 8-10% annually)",
                    "Research bursary and scholarship opportunities"
                ],
                estimated_monthly_cost=estimated_monthly
            ))
            total_score -= min(10, gap_pct * 0.2)
    
    # 7. ESTATE PLANNING ANALYSIS
    if financial_data.estate_value and financial_data.estate_value > 3500000:  # SA estate duty threshold
        if financial_data.estate_duty_estimated and financial_data.estate_duty_estimated > 0:
            liquid_coverage = financial_data.liquid_assets / financial_data.estate_duty_estimated if financial_data.estate_duty_estimated > 0 else 1
            
            if liquid_coverage < 1:  # Not enough liquid assets to cover estate duty
                shortfall_amount = financial_data.estate_duty_estimated - financial_data.liquid_assets
                
                shortfalls.append(Shortfall(
                    category=ShortfallCategory.ESTATE,
                    priority=ShortfallPriority.MEDIUM,
                    title="Estate Liquidity Shortfall",
                    description=f"Insufficient liquid assets to cover estimated estate duty and costs.",
                    current_value=financial_data.liquid_assets,
                    target_value=financial_data.estate_duty_estimated,
                    gap=shortfall_amount,
                    gap_percentage=((1 - liquid_coverage) * 100),
                    recommendation="Improve estate liquidity to prevent forced asset sales.",
                    action_items=[
                        "Consider life insurance to cover estate duty",
                        "Review and update your will",
                        "Explore trust structures for estate planning",
                        "Consult with estate planning specialist"
                    ],
                    estimated_monthly_cost=(shortfall_amount / 1000) * 5  # Insurance estimate
                ))
                total_score -= min(10, (1 - liquid_coverage) * 20)
    
    # 8. DISABILITY INSURANCE ANALYSIS
    if financial_data.monthly_income and financial_data.disability_coverage:
        income_replacement = (financial_data.disability_coverage / financial_data.monthly_income) * 100 if financial_data.monthly_income > 0 else 0
        
        if income_replacement < 75:  # Should cover at least 75% of income
            gap = (financial_data.monthly_income * 0.75) - financial_data.disability_coverage
            estimated_monthly = gap * 0.02  # Rough premium estimate
            
            shortfalls.append(Shortfall(
                category=ShortfallCategory.DISABILITY_INSURANCE,
                priority=ShortfallPriority.HIGH if income_replacement < 50 else ShortfallPriority.MEDIUM,
                title="Insufficient Disability Coverage",
                description=f"Disability coverage only replaces {income_replacement:.0f}% of income (target: 75%).",
                current_value=financial_data.disability_coverage,
                target_value=financial_data.monthly_income * 0.75,
                gap=gap,
                gap_percentage=75 - income_replacement,
                recommendation="Increase disability coverage to protect income during illness.",
                action_items=[
                    "Review current disability policy terms",
                    "Consider both short-term and long-term disability",
                    "Check waiting period and benefit period",
                    "Ensure own-occupation definition if possible"
                ],
                estimated_monthly_cost=estimated_monthly
            ))
            total_score -= min(15, (75 - income_replacement) * 0.3)
    
    # Categorize shortfalls by priority
    critical = [s for s in shortfalls if s.priority == ShortfallPriority.CRITICAL]
    high = [s for s in shortfalls if s.priority == ShortfallPriority.HIGH]
    medium = [s for s in shortfalls if s.priority == ShortfallPriority.MEDIUM]
    low = [s for s in shortfalls if s.priority == ShortfallPriority.LOW]
    
    # Calculate totals
    total_gap = sum(s.gap for s in shortfalls)
    total_monthly = sum(s.estimated_monthly_cost or 0 for s in shortfalls)
    
    # Determine health rating
    if total_score >= 85:
        health_rating = "Excellent"
    elif total_score >= 70:
        health_rating = "Good"
    elif total_score >= 50:
        health_rating = "Fair"
    else:
        health_rating = "Poor"
    
    # Generate top recommendations
    top_recommendations = []
    for s in sorted(shortfalls, key=lambda x: ["critical", "high", "medium", "low"].index(x.priority.value))[:5]:
        top_recommendations.append(s.recommendation)
    
    return FinancialPlanAnalysis(
        client_id=client_id,
        advisor_id=advisor_id,
        overall_score=max(0, total_score),
        health_rating=health_rating,
        critical_shortfalls=critical,
        high_priority_shortfalls=high,
        medium_priority_shortfalls=medium,
        low_priority_shortfalls=low,
        total_shortfalls=len(shortfalls),
        total_gap_amount=total_gap,
        estimated_monthly_investment_needed=total_monthly,
        top_recommendations=top_recommendations
    )
