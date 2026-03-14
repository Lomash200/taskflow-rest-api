from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.services.task_service import TaskService
from app.core.security import get_current_user, get_current_active_admin
from app.models.user import User

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED,
             summary="Create a new task")
def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new task for the authenticated user."""
    return TaskService(db).create(task_data, current_user.id)


@router.get("/", response_model=List[TaskResponse], summary="Get all tasks (own tasks for users, all for admin)")
def get_tasks(
    status: Optional[str] = Query(None, description="Filter by status: todo, in_progress, done"),
    priority: Optional[str] = Query(None, description="Filter by priority: low, medium, high"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    - **Users** see only their own tasks
    - **Admins** see all tasks across all users
    - Supports filtering by status and priority
    """
    service = TaskService(db)
    if current_user.role == "admin":
        return service.get_all(skip=skip, limit=limit, status=status, priority=priority)
    return service.get_by_owner(current_user.id, skip=skip, limit=limit, status=status, priority=priority)


@router.get("/{task_id}", response_model=TaskResponse, summary="Get task by ID")
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific task. Users can only access their own tasks; admins can access any."""
    task = TaskService(db).get_by_id(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if current_user.role != "admin" and task.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this task")
    return task


@router.put("/{task_id}", response_model=TaskResponse, summary="Update a task")
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a task. Users can only update their own tasks; admins can update any."""
    service = TaskService(db)
    task = service.get_by_id(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if current_user.role != "admin" and task.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")
    return service.update(task, task_data)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a task")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a task. Users can only delete their own tasks; admins can delete any."""
    service = TaskService(db)
    task = service.get_by_id(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if current_user.role != "admin" and task.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this task")
    service.delete(task)
