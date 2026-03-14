from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "todo"
    priority: Optional[str] = "medium"
    due_date: Optional[datetime] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Title cannot be empty")
        if len(v) > 200:
            raise ValueError("Title must be 200 characters or less")
        return v.strip()

    @field_validator("status")
    @classmethod
    def status_valid(cls, v):
        if v not in ("todo", "in_progress", "done"):
            raise ValueError("Status must be 'todo', 'in_progress', or 'done'")
        return v

    @field_validator("priority")
    @classmethod
    def priority_valid(cls, v):
        if v not in ("low", "medium", "high"):
            raise ValueError("Priority must be 'low', 'medium', or 'high'")
        return v


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None

    @field_validator("status")
    @classmethod
    def status_valid(cls, v):
        if v is not None and v not in ("todo", "in_progress", "done"):
            raise ValueError("Status must be 'todo', 'in_progress', or 'done'")
        return v

    @field_validator("priority")
    @classmethod
    def priority_valid(cls, v):
        if v is not None and v not in ("low", "medium", "high"):
            raise ValueError("Priority must be 'low', 'medium', or 'high'")
        return v


class TaskResponse(TaskBase):
    id: int
    owner_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
