from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List
from datetime import datetime, timezone
from models.tools import (
    FinancialGoal, GoalCreate, GoalUpdate, GoalStatus,
    MeetingNote, MeetingNoteCreate, ActionItem,
    ReviewSchedule, ReviewScheduleCreate
)
from models.client import FinancialData
from utils.auth import get_current_user_id
from utils.pdf_generator import generate_client_report, generate_goals_report
from utils.financial_analyzer import analyze_financial_plan
import os

router = APIRouter(prefix="/tools", tags=["Advisor Tools"])

# Get database connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'test_database')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]


# ==================== GOALS ====================

@router.post("/goals", response_model=FinancialGoal)
async def create_goal(
    goal_data: GoalCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new financial goal for a client"""
    # Verify client belongs to advisor
    client_doc = await db.clients.find_one({"id": goal_data.client_id, "advisor_id": user_id})
    if not client_doc:
        raise HTTPException(status_code=404, detail="Client not found")
    
    goal = FinancialGoal(**goal_data.model_dump(), advisor_id=user_id)
    
    # Calculate status based on progress
    if goal.current_amount >= goal.target_amount:
        goal.status = GoalStatus.COMPLETED
    elif goal.current_amount > 0:
        progress = goal.current_amount / goal.target_amount
        goal.status = GoalStatus.ON_TRACK if progress >= 0.5 else GoalStatus.IN_PROGRESS
    
    goal_dict = goal.model_dump()
    goal_dict['created_at'] = goal_dict['created_at'].isoformat()
    goal_dict['updated_at'] = goal_dict['updated_at'].isoformat()
    goal_dict['category'] = goal_dict['category'].value
    goal_dict['status'] = goal_dict['status'].value
    await db.goals.insert_one(goal_dict)
    
    return goal


@router.get("/goals/client/{client_id}", response_model=List[FinancialGoal])
async def get_client_goals(
    client_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get all goals for a client"""
    goals = await db.goals.find(
        {"client_id": client_id, "advisor_id": user_id},
        {"_id": 0}
    ).sort("priority", 1).to_list(100)
    return goals


@router.put("/goals/{goal_id}", response_model=FinancialGoal)
async def update_goal(
    goal_id: str,
    update_data: GoalUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update a goal"""
    existing = await db.goals.find_one({"id": goal_id, "advisor_id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if 'category' in update_dict:
        update_dict['category'] = update_dict['category'].value
    if 'status' in update_dict:
        update_dict['status'] = update_dict['status'].value
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.goals.update_one({"id": goal_id}, {"$set": update_dict})
    updated = await db.goals.find_one({"id": goal_id}, {"_id": 0})
    return FinancialGoal(**updated)


@router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, user_id: str = Depends(get_current_user_id)):
    """Delete a goal"""
    result = await db.goals.delete_one({"id": goal_id, "advisor_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted"}


# ==================== MEETING NOTES ====================

@router.post("/meetings", response_model=MeetingNote)
async def create_meeting_note(
    meeting_data: MeetingNoteCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Create a meeting note with action items"""
    client_doc = await db.clients.find_one({"id": meeting_data.client_id, "advisor_id": user_id})
    if not client_doc:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Convert action items
    action_items = [ActionItem(**item) for item in meeting_data.action_items]
    
    meeting = MeetingNote(
        client_id=meeting_data.client_id,
        advisor_id=user_id,
        meeting_type=meeting_data.meeting_type,
        meeting_date=meeting_data.meeting_date,
        duration_minutes=meeting_data.duration_minutes,
        attendees=meeting_data.attendees,
        summary=meeting_data.summary,
        discussion_points=meeting_data.discussion_points,
        action_items=action_items,
        next_meeting_date=meeting_data.next_meeting_date
    )
    
    meeting_dict = meeting.model_dump()
    meeting_dict['created_at'] = meeting_dict['created_at'].isoformat()
    meeting_dict['meeting_type'] = meeting_dict['meeting_type'].value
    meeting_dict['action_items'] = [
        {**item, 'status': item['status'].value} 
        for item in meeting_dict['action_items']
    ]
    await db.meetings.insert_one(meeting_dict)
    
    return meeting


@router.get("/meetings/client/{client_id}", response_model=List[MeetingNote])
async def get_client_meetings(
    client_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get all meeting notes for a client"""
    meetings = await db.meetings.find(
        {"client_id": client_id, "advisor_id": user_id},
        {"_id": 0}
    ).sort("meeting_date", -1).to_list(100)
    return meetings


@router.get("/meetings/action-items", response_model=List[dict])
async def get_pending_action_items(user_id: str = Depends(get_current_user_id)):
    """Get all pending action items across all clients"""
    meetings = await db.meetings.find(
        {"advisor_id": user_id},
        {"_id": 0}
    ).to_list(1000)
    
    # Batch fetch all clients to avoid N+1 queries
    client_ids = list(set(m['client_id'] for m in meetings if m.get('client_id')))
    clients = await db.clients.find(
        {"id": {"$in": client_ids}},
        {"_id": 0, "id": 1, "first_name": 1, "last_name": 1}
    ).to_list(len(client_ids))
    client_map = {c['id']: c for c in clients}
    
    pending_items = []
    for meeting in meetings:
        client = client_map.get(meeting.get('client_id'), {})
        for item in meeting.get('action_items', []):
            if item.get('status') in ['pending', 'in_progress']:
                pending_items.append({
                    **item,
                    'client_id': meeting['client_id'],
                    'client_name': f"{client.get('first_name', '')} {client.get('last_name', '')}".strip(),
                    'meeting_date': meeting['meeting_date']
                })
    
    return sorted(pending_items, key=lambda x: x.get('due_date', '9999-99-99'))


# ==================== REVIEW SCHEDULER ====================

@router.post("/reviews", response_model=ReviewSchedule)
async def create_review_schedule(
    review_data: ReviewScheduleCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Create or update review schedule for a client"""
    client_doc = await db.clients.find_one({"id": review_data.client_id, "advisor_id": user_id})
    if not client_doc:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Default checklist if not provided
    default_checklist = [
        "Review investment performance",
        "Update risk profile",
        "Check insurance coverage",
        "Review goals progress",
        "Update financial data",
        "Discuss life changes",
        "Review fees and costs",
        "Update beneficiaries"
    ]
    
    review = ReviewSchedule(
        client_id=review_data.client_id,
        advisor_id=user_id,
        frequency=review_data.frequency,
        next_review_date=review_data.next_review_date,
        checklist=review_data.checklist if review_data.checklist else default_checklist,
        reminder_days_before=review_data.reminder_days_before,
        notes=review_data.notes
    )
    
    review_dict = review.model_dump()
    review_dict['created_at'] = review_dict['created_at'].isoformat()
    review_dict['frequency'] = review_dict['frequency'].value
    
    # Upsert - one review schedule per client
    await db.reviews.update_one(
        {"client_id": review_data.client_id},
        {"$set": review_dict},
        upsert=True
    )
    
    return review


@router.get("/reviews/client/{client_id}", response_model=ReviewSchedule)
async def get_client_review(
    client_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get review schedule for a client"""
    review = await db.reviews.find_one(
        {"client_id": client_id, "advisor_id": user_id},
        {"_id": 0}
    )
    if not review:
        raise HTTPException(status_code=404, detail="Review schedule not found")
    return ReviewSchedule(**review)


@router.get("/reviews/upcoming", response_model=List[dict])
async def get_upcoming_reviews(
    days: int = 30,
    user_id: str = Depends(get_current_user_id)
):
    """Get upcoming reviews in the next X days"""
    from datetime import timedelta
    today = datetime.now(timezone.utc).date()
    end_date = today + timedelta(days=days)
    
    reviews = await db.reviews.find(
        {"advisor_id": user_id},
        {"_id": 0}
    ).to_list(1000)
    
    upcoming = []
    for review in reviews:
        next_date = datetime.strptime(review['next_review_date'], '%Y-%m-%d').date()
        if today <= next_date <= end_date:
            client = await db.clients.find_one({"id": review['client_id']}, {"_id": 0, "first_name": 1, "last_name": 1})
            upcoming.append({
                **review,
                'client_name': f"{client.get('first_name', '')} {client.get('last_name', '')}",
                'days_until': (next_date - today).days
            })
    
    return sorted(upcoming, key=lambda x: x['next_review_date'])


# ==================== PDF REPORTS ====================

@router.get("/reports/client/{client_id}/analysis")
async def download_analysis_report(
    client_id: str,
    currency: str = "ZAR",
    user_id: str = Depends(get_current_user_id)
):
    """Download PDF report of client's financial plan analysis"""
    # Get client
    client_doc = await db.clients.find_one(
        {"id": client_id, "advisor_id": user_id},
        {"_id": 0}
    )
    if not client_doc:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Generate analysis
    financial_data = FinancialData(**client_doc.get('financial_data', {}))
    analysis = analyze_financial_plan(client_id, user_id, financial_data)
    
    # Generate PDF
    currency_symbol = "R" if currency == "ZAR" else "$"
    pdf_buffer = generate_client_report(client_doc, analysis.model_dump(), currency_symbol)
    
    client_name = f"{client_doc.get('first_name', '')}_{client_doc.get('last_name', '')}"
    filename = f"financial_analysis_{client_name}_{datetime.now().strftime('%Y%m%d')}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/reports/client/{client_id}/goals")
async def download_goals_report(
    client_id: str,
    currency: str = "ZAR",
    user_id: str = Depends(get_current_user_id)
):
    """Download PDF report of client's financial goals"""
    client_doc = await db.clients.find_one(
        {"id": client_id, "advisor_id": user_id},
        {"_id": 0}
    )
    if not client_doc:
        raise HTTPException(status_code=404, detail="Client not found")
    
    goals = await db.goals.find(
        {"client_id": client_id, "advisor_id": user_id},
        {"_id": 0}
    ).to_list(100)
    
    currency_symbol = "R" if currency == "ZAR" else "$"
    pdf_buffer = generate_goals_report(client_doc, goals, currency_symbol)
    
    client_name = f"{client_doc.get('first_name', '')}_{client_doc.get('last_name', '')}"
    filename = f"goals_report_{client_name}_{datetime.now().strftime('%Y%m%d')}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
