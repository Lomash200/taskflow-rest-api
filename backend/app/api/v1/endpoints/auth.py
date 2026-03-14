from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.user import UserCreate, UserResponse, Token
from app.services.user_service import UserService
from app.core.security import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED,
             summary="Register a new user")
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user with:
    - **username**: unique alphanumeric username (3-50 chars)
    - **email**: valid email address
    - **password**: minimum 8 characters
    - **role**: 'user' (default) or 'admin'
    """
    service = UserService(db)
    if service.get_by_email(user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if service.get_by_username(user_data.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    return service.create(user_data)


@router.post("/login", response_model=Token, summary="Login and get JWT token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Login with username and password to receive a JWT Bearer token.
    Use this token in the Authorization header: `Bearer <token>`
    """
    service = UserService(db)
    user = service.get_by_username(form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")
    token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}
