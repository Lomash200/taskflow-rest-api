from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.schemas.user import UserResponse, UserUpdate
from app.services.user_service import UserService
from app.core.security import get_current_user, get_current_active_admin
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse, summary="Get current user profile")
def get_me(current_user: User = Depends(get_current_user)):
    """Get the profile of the currently authenticated user."""
    return current_user


@router.get("/", response_model=List[UserResponse], summary="List all users (admin only)")
def list_users(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_admin)
):
    """**Admin only**: List all registered users."""
    return UserService(db).get_all(skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserResponse, summary="Get user by ID (admin only)")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_admin)
):
    """**Admin only**: Get any user by their ID."""
    user = UserService(db).get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserResponse, summary="Update user (admin only)")
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_admin)
):
    """**Admin only**: Update a user's role, email, or active status."""
    service = UserService(db)
    user = service.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return service.update(user, user_data)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete user (admin only)")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin)
):
    """**Admin only**: Delete a user and all their tasks."""
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    service = UserService(db)
    user = service.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    service.delete(user)
