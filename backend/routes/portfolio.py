from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Dict, Any
from datetime import datetime, timezone
from models.tools import (
    Portfolio, PortfolioHolding, AssetClass,
    LoanComparison, LoanOption,
    FeeCalculation, FeeStructure
)
from utils.auth import get_current_user_id
import os
import math
import random

router = APIRouter(prefix="/portfolio", tags=["Portfolio & Loans"])

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]


# ==================== PORTFOLIO ====================

@router.post("/client/{client_id}", response_model=Portfolio)
async def create_or_update_portfolio(
    client_id: str,
    portfolio_data: Dict[str, Any],
    user_id: str = Depends(get_current_user_id)
):
    """Create or update client's investment portfolio"""
    client_doc = await db.clients.find_one({"id": client_id, "advisor_id": user_id})
    if not client_doc:
        raise HTTPException(status_code=404, detail="Client not found")
    
    holdings = [PortfolioHolding(**h) for h in portfolio_data.get('holdings', [])]
    
    # Calculate total value and allocations
    total_value = sum(h.value for h in holdings)
    for h in holdings:
        h.allocation_percentage = (h.value / total_value * 100) if total_value > 0 else 0
    
    # Calculate diversification score (0-100)
    asset_classes = {}
    for h in holdings:
        ac = h.asset_class.value
        asset_classes[ac] = asset_classes.get(ac, 0) + h.allocation_percentage
    
    # Penalize concentration - ideal is spread across multiple asset classes
    diversification_score = 100
    for ac, pct in asset_classes.items():
        if pct > 50:  # Heavily penalize >50% in one class
            diversification_score -= (pct - 50) * 1.5
        elif pct > 30:  # Slightly penalize >30%
            diversification_score -= (pct - 30) * 0.5
    
    # Bonus for having multiple asset classes
    diversification_score += min(len(asset_classes) * 5, 20)
    diversification_score = max(0, min(100, diversification_score))
    
    # Check if rebalancing needed (any class >5% off target)
    target_allocation = portfolio_data.get('target_allocation', {})
    rebalancing_needed = False
    for ac, target in target_allocation.items():
        current = asset_classes.get(ac, 0)
        if abs(current - target) > 5:
            rebalancing_needed = True
            break
    
    portfolio = Portfolio(
        client_id=client_id,
        advisor_id=user_id,
        name=portfolio_data.get('name', 'Main Portfolio'),
        holdings=holdings,
        total_value=total_value,
        target_allocation=target_allocation,
        diversification_score=diversification_score,
        rebalancing_needed=rebalancing_needed,
        last_rebalanced=portfolio_data.get('last_rebalanced')
    )
    
    portfolio_dict = portfolio.model_dump()
    portfolio_dict['created_at'] = portfolio_dict['created_at'].isoformat()
    portfolio_dict['updated_at'] = portfolio_dict['updated_at'].isoformat()
    portfolio_dict['holdings'] = [
        {**h, 'asset_class': h['asset_class'].value}
        for h in portfolio_dict['holdings']
    ]
    
    await db.portfolios.update_one(
        {"client_id": client_id},
        {"$set": portfolio_dict},
        upsert=True
    )
    
    return portfolio


@router.get("/client/{client_id}", response_model=Portfolio)
async def get_client_portfolio(
    client_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get client's portfolio"""
    portfolio = await db.portfolios.find_one(
        {"client_id": client_id, "advisor_id": user_id},
        {"_id": 0}
    )
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return portfolio


@router.get("/client/{client_id}/rebalance", response_model=Dict)
async def get_rebalancing_suggestions(
    client_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get rebalancing suggestions for portfolio"""
    portfolio = await db.portfolios.find_one(
        {"client_id": client_id, "advisor_id": user_id},
        {"_id": 0}
    )
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Calculate current allocations
    holdings = portfolio.get('holdings', [])
    total_value = portfolio.get('total_value', 0)
    target_allocation = portfolio.get('target_allocation', {})
    
    current_allocation = {}
    for h in holdings:
        ac = h.get('asset_class', 'other')
        current_allocation[ac] = current_allocation.get(ac, 0) + h.get('value', 0)
    
    # Convert to percentages
    for ac in current_allocation:
        current_allocation[ac] = (current_allocation[ac] / total_value * 100) if total_value > 0 else 0
    
    # Calculate trades needed
    suggestions = []
    for ac, target_pct in target_allocation.items():
        current_pct = current_allocation.get(ac, 0)
        diff = target_pct - current_pct
        diff_value = (diff / 100) * total_value
        
        if abs(diff) > 1:  # Only suggest if >1% off
            suggestions.append({
                'asset_class': ac,
                'current_percentage': round(current_pct, 1),
                'target_percentage': target_pct,
                'difference_percentage': round(diff, 1),
                'action': 'BUY' if diff > 0 else 'SELL',
                'amount': abs(round(diff_value, 2))
            })
    
    return {
        'total_value': total_value,
        'suggestions': sorted(suggestions, key=lambda x: abs(x['difference_percentage']), reverse=True),
        'summary': f"{len([s for s in suggestions if s['action'] == 'BUY'])} buys, {len([s for s in suggestions if s['action'] == 'SELL'])} sells needed"
    }


# ==================== LOAN COMPARISON ====================

@router.post("/loans/compare", response_model=LoanComparison)
async def create_loan_comparison(
    client_id: str,
    purpose: str,
    options: List[Dict[str, Any]],
    user_id: str = Depends(get_current_user_id)
):
    """Create a loan comparison for a client"""
    client_doc = await db.clients.find_one({"id": client_id, "advisor_id": user_id})
    if not client_doc:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Calculate loan details for each option
    calculated_options = []
    for opt in options:
        loan_amount = opt.get('loan_amount', 0)
        rate = opt.get('interest_rate', 0) / 100 / 12  # Monthly rate
        term = opt.get('term_months', 0)
        fees = opt.get('fees', 0)
        
        # Calculate monthly payment using amortization formula
        if rate > 0 and term > 0:
            monthly_payment = loan_amount * (rate * (1 + rate)**term) / ((1 + rate)**term - 1)
        else:
            monthly_payment = loan_amount / term if term > 0 else 0
        
        total_cost = (monthly_payment * term) + fees
        total_interest = total_cost - loan_amount - fees
        
        calculated_options.append(LoanOption(
            lender_name=opt.get('lender_name', 'Unknown'),
            loan_amount=loan_amount,
            interest_rate=opt.get('interest_rate', 0),
            term_months=term,
            monthly_payment=round(monthly_payment, 2),
            total_interest=round(total_interest, 2),
            total_cost=round(total_cost, 2),
            fees=fees,
            notes=opt.get('notes')
        ))
    
    # Recommend best option (lowest total cost)
    best_option = min(calculated_options, key=lambda x: x.total_cost) if calculated_options else None
    
    comparison = LoanComparison(
        client_id=client_id,
        advisor_id=user_id,
        purpose=purpose,
        options=calculated_options,
        recommended_option_id=best_option.id if best_option else None
    )
    
    comp_dict = comparison.model_dump()
    comp_dict['created_at'] = comp_dict['created_at'].isoformat()
    await db.loan_comparisons.insert_one(comp_dict)
    
    return comparison


@router.get("/loans/client/{client_id}", response_model=List[LoanComparison])
async def get_client_loan_comparisons(
    client_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get all loan comparisons for a client"""
    comparisons = await db.loan_comparisons.find(
        {"client_id": client_id, "advisor_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return comparisons


# ==================== FEE CALCULATOR ====================

@router.post("/fees/calculate", response_model=FeeCalculation)
async def calculate_advisor_fees(
    client_id: str,
    fee_data: Dict[str, Any],
    user_id: str = Depends(get_current_user_id)
):
    """Calculate advisor fees for a client"""
    client_doc = await db.clients.find_one({"id": client_id, "advisor_id": user_id})
    if not client_doc:
        raise HTTPException(status_code=404, detail="Client not found")
    
    fee_structure = FeeStructure(fee_data.get('fee_structure', 'aum'))
    aum = fee_data.get('assets_under_management', 0)
    aum_pct = fee_data.get('aum_percentage', 1.0)
    flat_fee = fee_data.get('flat_fee_annual', 0)
    hourly = fee_data.get('hourly_rate', 0)
    hours = fee_data.get('estimated_hours', 0)
    
    # Calculate based on structure
    if fee_structure == FeeStructure.AUM:
        annual_fee = aum * (aum_pct / 100)
    elif fee_structure == FeeStructure.FLAT:
        annual_fee = flat_fee
    elif fee_structure == FeeStructure.HOURLY:
        annual_fee = hourly * hours
    elif fee_structure == FeeStructure.HYBRID:
        annual_fee = (aum * (aum_pct / 100)) + flat_fee
    else:
        annual_fee = 0
    
    calculation = FeeCalculation(
        client_id=client_id,
        advisor_id=user_id,
        fee_structure=fee_structure,
        aum_percentage=aum_pct,
        flat_fee_annual=flat_fee,
        hourly_rate=hourly,
        estimated_hours=hours,
        assets_under_management=aum,
        calculated_annual_fee=round(annual_fee, 2),
        calculated_monthly_fee=round(annual_fee / 12, 2),
        notes=fee_data.get('notes')
    )
    
    calc_dict = calculation.model_dump()
    calc_dict['created_at'] = calc_dict['created_at'].isoformat()
    calc_dict['fee_structure'] = calc_dict['fee_structure'].value
    
    await db.fee_calculations.update_one(
        {"client_id": client_id},
        {"$set": calc_dict},
        upsert=True
    )
    
    return calculation


# ==================== MONTE CARLO SIMULATION ====================

@router.post("/monte-carlo/retirement")
async def run_monte_carlo_retirement(
    simulation_params: Dict[str, Any],
    user_id: str = Depends(get_current_user_id)
):
    """Run Monte Carlo simulation for retirement planning"""
    
    current_savings = simulation_params.get('current_savings', 0)
    monthly_contribution = simulation_params.get('monthly_contribution', 0)
    years_to_retirement = simulation_params.get('years_to_retirement', 20)
    retirement_years = simulation_params.get('retirement_years', 25)
    monthly_retirement_need = simulation_params.get('monthly_retirement_need', 0)
    expected_return = simulation_params.get('expected_return', 7) / 100  # Annual
    volatility = simulation_params.get('volatility', 15) / 100  # Annual std dev
    inflation = simulation_params.get('inflation', 3) / 100
    num_simulations = min(simulation_params.get('num_simulations', 1000), 5000)
    
    # Run simulations
    success_count = 0
    ending_balances = []
    
    for _ in range(num_simulations):
        balance = current_savings
        
        # Accumulation phase
        for month in range(years_to_retirement * 12):
            # Random monthly return with normal distribution
            monthly_return = random.gauss(expected_return / 12, volatility / math.sqrt(12))
            balance = balance * (1 + monthly_return) + monthly_contribution
        
        peak_balance = balance
        
        # Withdrawal phase
        annual_withdrawal = monthly_retirement_need * 12
        failed = False
        
        for year in range(retirement_years):
            if balance <= 0:
                failed = True
                break
            
            # Inflation-adjusted withdrawal
            withdrawal = annual_withdrawal * ((1 + inflation) ** year)
            
            # Random annual return
            annual_return = random.gauss(expected_return, volatility)
            balance = (balance - withdrawal) * (1 + annual_return)
        
        if not failed and balance > 0:
            success_count += 1
        
        ending_balances.append(max(0, balance))
    
    # Calculate percentiles
    ending_balances.sort()
    
    return {
        'success_rate': round((success_count / num_simulations) * 100, 1),
        'num_simulations': num_simulations,
        'projected_at_retirement': round(peak_balance, 0) if 'peak_balance' in dir() else 0,
        'ending_balance_percentiles': {
            '10th': round(ending_balances[int(num_simulations * 0.1)], 0),
            '25th': round(ending_balances[int(num_simulations * 0.25)], 0),
            '50th': round(ending_balances[int(num_simulations * 0.5)], 0),
            '75th': round(ending_balances[int(num_simulations * 0.75)], 0),
            '90th': round(ending_balances[int(num_simulations * 0.9)], 0),
        },
        'interpretation': _interpret_success_rate(success_count / num_simulations * 100)
    }


def _interpret_success_rate(rate):
    if rate >= 90:
        return "Excellent - High probability of success. Plan appears well-funded."
    elif rate >= 75:
        return "Good - Reasonable probability of success. Consider building additional buffer."
    elif rate >= 50:
        return "Fair - Some risk of shortfall. Consider increasing savings or adjusting goals."
    else:
        return "Poor - Significant risk of running out of money. Plan adjustments recommended."
