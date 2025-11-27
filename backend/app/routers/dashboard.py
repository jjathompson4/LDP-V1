from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/api",
    tags=["dashboard"],
)

# --- Data Models ---

class Project(BaseModel):
    id: str
    name: str
    number: Optional[str] = None
    client: Optional[str] = None
    phase: Optional[str] = None # 'Concept' | 'SD' | 'DD' | 'CD' | 'CA'
    location: Optional[str] = None
    lightingLead: Optional[str] = None
    isPinned: Optional[bool] = False

class Task(BaseModel):
    id: str
    projectId: str
    title: str
    description: Optional[str] = None
    type: Optional[str] = None # 'Schedule' | 'Controls' | 'Canvas' | 'RevitSync' | 'Other'
    status: str # 'todo' | 'in-progress' | 'done'
    dueDate: Optional[str] = None
    toolSlug: Optional[str] = None
    deepLinkUrl: Optional[str] = None
    createdAt: str
    updatedAt: str

class Event(BaseModel):
    id: str
    projectId: str
    title: str
    type: str # 'Presentation' | 'Deliverable' | 'InternalReview' | 'SiteVisit' | 'Travel'
    startDateTime: str
    endDateTime: Optional[str] = None
    location: Optional[str] = None
    artifactUrl: Optional[str] = None
    notes: Optional[str] = None
    createdAt: str
    updatedAt: str

class InProgressArtifact(BaseModel):
    id: str
    projectId: str
    artifactType: str # 'Schedule' | 'Controls' | 'Canvas' | 'Analysis' | 'Other'
    name: str
    status: Optional[str] = None # 'Draft' | 'NeedsReview' | 'Ready'
    lastUpdatedAt: str
    lastUpdatedBy: Optional[str] = None
    deepLinkUrl: str

class BudgetSnapshot(BaseModel):
    projectId: str
    phase: str
    budgetHours: float
    spentHours: float
    lastUpdatedAt: str

class PlanSetStatus(BaseModel):
    projectId: str
    currentPlanSetName: str
    currentPlanSetDate: str
    lastModelExportDate: Optional[str] = None
    planSetUrl: Optional[str] = None

class ActivityEvent(BaseModel):
    id: str
    projectId: str
    actor: Optional[str] = None
    timestamp: str
    summary: str
    entityType: Optional[str] = None
    entityId: Optional[str] = None
    entityUrl: Optional[str] = None

class DashboardSummary(BaseModel):
    project: Optional[Project] = None
    tasks: List[Task] = []
    events: List[Event] = []
    artifacts: List[InProgressArtifact] = []
    budgetSnapshot: Optional[BudgetSnapshot] = None
    planSetStatus: Optional[PlanSetStatus] = None
    activity: List[ActivityEvent] = []

# --- Mock Data Store ---

MOCK_PROJECTS = [
    Project(
        id="p1",
        name="Lakeside Hospital - Main Tower",
        number="24-001",
        client="HKS Architects",
        phase="DD",
        location="Chicago, IL",
        lightingLead="Jeff Thompson",
        isPinned=True
    ),
    Project(
        id="p2",
        name="Tech Hub HQ",
        number="24-052",
        client="Gensler",
        phase="SD",
        location="Austin, TX",
        lightingLead="Sarah Chen",
        isPinned=True
    ),
    Project(
        id="p3",
        name="Riverfront Park Pavilion",
        number="23-118",
        client="Sasaki",
        phase="CA",
        location="Boston, MA",
        lightingLead="Mike Ross",
        isPinned=False
    )
]

# Helper to generate dates relative to now
def days_from_now(days: int) -> str:
    return (datetime.now() + timedelta(days=days)).isoformat()

MOCK_DATA = {
    "p1": DashboardSummary(
        project=MOCK_PROJECTS[0],
        tasks=[
            Task(id="t1", projectId="p1", title="Review equipment schedule v0.3", status="todo", type="Schedule", dueDate=days_from_now(2), createdAt=days_from_now(-1), updatedAt=days_from_now(-1)),
            Task(id="t2", projectId="p1", title="Update control zones L3", status="in-progress", type="Controls", createdAt=days_from_now(-2), updatedAt=days_from_now(0)),
            Task(id="t3", projectId="p1", title="Sync Revit model", status="done", type="RevitSync", createdAt=days_from_now(-5), updatedAt=days_from_now(-1)),
        ],
        events=[
            Event(id="e1", projectId="p1", title="DD Submission", type="Deliverable", startDateTime=days_from_now(5), createdAt=days_from_now(-10), updatedAt=days_from_now(-10)),
            Event(id="e2", projectId="p1", title="Client Review Meeting", type="Presentation", startDateTime=days_from_now(7), location="Zoom", createdAt=days_from_now(-3), updatedAt=days_from_now(-3)),
        ],
        artifacts=[
            InProgressArtifact(id="a1", projectId="p1", artifactType="Schedule", name="L3 Inpatient - Equip Schedule v0.3", status="Draft", lastUpdatedAt=days_from_now(0), lastUpdatedBy="Jeff", deepLinkUrl="/schedule-builder"),
            InProgressArtifact(id="a2", projectId="p1", artifactType="Analysis", name="Lobby Illuminance Study", status="NeedsReview", lastUpdatedAt=days_from_now(-1), lastUpdatedBy="System", deepLinkUrl="/luminance-analysis"),
        ],
        budgetSnapshot=BudgetSnapshot(projectId="p1", phase="DD", budgetHours=200, spentHours=120, lastUpdatedAt=days_from_now(0)),
        planSetStatus=PlanSetStatus(projectId="p1", currentPlanSetName="DD Progress Set", currentPlanSetDate=days_from_now(-10), lastModelExportDate=days_from_now(-2)),
        activity=[
            ActivityEvent(id="act1", projectId="p1", actor="Jeff", timestamp=days_from_now(0), summary="Updated equipment schedule"),
            ActivityEvent(id="act2", projectId="p1", actor="System", timestamp=days_from_now(-1), summary="Parsed 8 new cutsheets"),
            ActivityEvent(id="act3", projectId="p1", actor="Sarah", timestamp=days_from_now(-2), summary="Created canvas 'Lobby Concepts v2'"),
        ]
    ),
    "p2": DashboardSummary(
        project=MOCK_PROJECTS[1],
        tasks=[
            Task(id="t4", projectId="p2", title="Initial concept sketches", status="in-progress", type="Canvas", dueDate=days_from_now(1), createdAt=days_from_now(-2), updatedAt=days_from_now(0)),
        ],
        events=[
            Event(id="e3", projectId="p2", title="SD Kickoff", type="InternalReview", startDateTime=days_from_now(1), createdAt=days_from_now(-5), updatedAt=days_from_now(-5)),
        ],
        artifacts=[
             InProgressArtifact(id="a3", projectId="p2", artifactType="Canvas", name="Atrium Concepts", status="Draft", lastUpdatedAt=days_from_now(0), lastUpdatedBy="Sarah", deepLinkUrl="#"),
        ],
        budgetSnapshot=BudgetSnapshot(projectId="p2", phase="SD", budgetHours=80, spentHours=10, lastUpdatedAt=days_from_now(-1)),
        planSetStatus=PlanSetStatus(projectId="p2", currentPlanSetName="SD 50%", currentPlanSetDate=days_from_now(-5), lastModelExportDate=days_from_now(-5)),
        activity=[
             ActivityEvent(id="act4", projectId="p2", actor="Sarah", timestamp=days_from_now(0), summary="Started new concept board"),
        ]
    )
}

# --- Mutation Models ---

class CreateTaskRequest(BaseModel):
    title: str
    type: str
    dueDate: Optional[str] = None
    description: Optional[str] = None

class CreateEventRequest(BaseModel):
    title: str
    type: str
    startDateTime: str
    location: Optional[str] = None

class UpdateBudgetRequest(BaseModel):
    phase: str
    budgetHours: float
    spentHours: float

class UpdatePlanSetRequest(BaseModel):
    currentPlanSetName: str
    currentPlanSetDate: str

# --- Endpoints ---

@router.get("/projects", response_model=List[Project])
async def get_projects():
    return MOCK_PROJECTS

@router.get("/dashboard/summary", response_model=DashboardSummary)
async def get_dashboard_summary(projectId: str):
    if projectId in MOCK_DATA:
        return MOCK_DATA[projectId]
    
    project = next((p for p in MOCK_PROJECTS if p.id == projectId), None)
    if project:
        # Initialize empty summary for this project if not exists
        summary = DashboardSummary(project=project)
        MOCK_DATA[projectId] = summary
        return summary
    
    raise HTTPException(status_code=404, detail="Project not found")

@router.post("/projects/{projectId}/tasks", response_model=Task)
async def create_task(projectId: str, req: CreateTaskRequest):
    if projectId not in MOCK_DATA:
        # Ensure project exists in mock data
        await get_dashboard_summary(projectId)
    
    new_task = Task(
        id=f"t{len(MOCK_DATA[projectId].tasks) + 100}",
        projectId=projectId,
        title=req.title,
        type=req.type,
        status="todo",
        dueDate=req.dueDate,
        description=req.description,
        createdAt=datetime.now().isoformat(),
        updatedAt=datetime.now().isoformat()
    )
    MOCK_DATA[projectId].tasks.insert(0, new_task)
    return new_task

@router.post("/projects/{projectId}/events", response_model=Event)
async def create_event(projectId: str, req: CreateEventRequest):
    if projectId not in MOCK_DATA:
        await get_dashboard_summary(projectId)
        
    new_event = Event(
        id=f"e{len(MOCK_DATA[projectId].events) + 100}",
        projectId=projectId,
        title=req.title,
        type=req.type,
        startDateTime=req.startDateTime,
        location=req.location,
        createdAt=datetime.now().isoformat(),
        updatedAt=datetime.now().isoformat()
    )
    MOCK_DATA[projectId].events.append(new_event)
    # Sort by date
    MOCK_DATA[projectId].events.sort(key=lambda e: e.startDateTime)
    return new_event

@router.post("/projects/{projectId}/budget", response_model=BudgetSnapshot)
async def update_budget(projectId: str, req: UpdateBudgetRequest):
    if projectId not in MOCK_DATA:
        await get_dashboard_summary(projectId)
        
    snapshot = BudgetSnapshot(
        projectId=projectId,
        phase=req.phase,
        budgetHours=req.budgetHours,
        spentHours=req.spentHours,
        lastUpdatedAt=datetime.now().isoformat()
    )
    MOCK_DATA[projectId].budgetSnapshot = snapshot
    return snapshot

@router.post("/projects/{projectId}/planset", response_model=PlanSetStatus)
async def update_planset(projectId: str, req: UpdatePlanSetRequest):
    if projectId not in MOCK_DATA:
        await get_dashboard_summary(projectId)
    
    current = MOCK_DATA[projectId].planSetStatus
    last_export = current.lastModelExportDate if current else None
    
    new_status = PlanSetStatus(
        projectId=projectId,
        currentPlanSetName=req.currentPlanSetName,
        currentPlanSetDate=req.currentPlanSetDate,
        lastModelExportDate=last_export, # Preserve existing export date
        planSetUrl=current.planSetUrl if current else None
    )
    MOCK_DATA[projectId].planSetStatus = new_status
    return new_status
