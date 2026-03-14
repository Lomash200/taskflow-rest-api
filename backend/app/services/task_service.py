from sqlalchemy.orm import Session
from typing import Optional, List

from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate


class TaskService:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, task_id: int) -> Optional[Task]:
        return self.db.query(Task).filter(Task.id == task_id, Task.is_active == True).first()

    def get_by_owner(
        self, owner_id: int, skip: int = 0, limit: int = 20,
        status: Optional[str] = None, priority: Optional[str] = None
    ) -> List[Task]:
        q = self.db.query(Task).filter(Task.owner_id == owner_id, Task.is_active == True)
        if status:
            q = q.filter(Task.status == status)
        if priority:
            q = q.filter(Task.priority == priority)
        return q.order_by(Task.created_at.desc()).offset(skip).limit(limit).all()

    def get_all(
        self, skip: int = 0, limit: int = 20,
        status: Optional[str] = None, priority: Optional[str] = None
    ) -> List[Task]:
        q = self.db.query(Task).filter(Task.is_active == True)
        if status:
            q = q.filter(Task.status == status)
        if priority:
            q = q.filter(Task.priority == priority)
        return q.order_by(Task.created_at.desc()).offset(skip).limit(limit).all()

    def create(self, task_data: TaskCreate, owner_id: int) -> Task:
        task = Task(**task_data.model_dump(), owner_id=owner_id)
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task

    def update(self, task: Task, task_data: TaskUpdate) -> Task:
        update_fields = task_data.model_dump(exclude_unset=True)
        for field, value in update_fields.items():
            setattr(task, field, value)
        self.db.commit()
        self.db.refresh(task)
        return task

    def delete(self, task: Task) -> None:
        task.is_active = False
        self.db.commit()
