from typing import Optional, List

from passlib.hash import bcrypt
from sqlalchemy import literal
from sqlalchemy.orm import Session
from sqlalchemy_pagination import paginate

from app.core import config
from app.enums.role import RoleEnum
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.services.email import send_activation_email, send_password_reset_notification_email
from app.services.jwt import create_jwt_for_account_activation


def retrieve_user(db: Session, user_id: int, role: Optional[RoleEnum] = None) -> User:
    """
    Retrieve a user from the database based off their id and role (if not None).
    :param db: The sqlalchemy database session.
    :param user_id: ID of the user.
    :param role: Also query by role. If none, then don't query by role.
    :return: The user.
    """
    if role:
        return db.query(User).filter_by(id=user_id).filter(User.role == role).first()
    return db.query(User).filter_by(id=user_id).first()


def retrieve_user_by_email(db: Session, email: str, role: Optional[RoleEnum] = None) -> User:
    """
    Retrieve a user from the database based off their email address and role (if not None).
    :param db: The sqlalchemy database session.
    :param email: Email address (acts as a primary key) of the user.
    :param role: Also query by role. If none, then don't query by role.
    :return: The user.
    """
    if role:
        return db.query(User).filter_by(email=email).filter(User.role == role).first()
    return db.query(User).filter_by(email=email).first()


def list_users(
    db: Session,
    page: int = 1,
    page_size: int = config.PAGE_SIZE_DEFAULT,
    role: Optional[RoleEnum] = None,
    first_name: str = None,
    last_name: str = None,
    email: str = None
) -> List[User]:
    """
    Lists out users from the database with pagination.
    :param db: The sqlalchemy database session.
    :param page: The page number starting at 1, and defaults to 1.
    :param page_size: THe size per page, and defaults to 10.
    :param role: Filter by role (exact). If None, filter does not apply.
    :param first_name: Filter by first name (contains). If None, filter does not apply.
    :param last_name: Filter by last name (contains). If None, filter does not apply.
    :param email: Filter by email address (contains). If None, filter does not apply.
    :return: Users by query.
    """
    res = db.query(User)
    if role:
        res = res.filter(User.role == role)
    if first_name:
        res = res.filter(User.first_name.ilike(f"%{first_name}%"))
    if last_name:
        res = res.filter(User.last_name.ilike(f"%{last_name}%"))
    if email:
        res = res.filter(User.email.ilike(f"%{email}%"))
    # Quickly use paginate to calculate limit w/ offset part of sqlalchemy
    return paginate(res, page, page_size)


def count_users(
    db: Session,
    role: Optional[RoleEnum],
    first_name: str = None,
    last_name: str = None,
    email: str = None
) -> int:
    """
    Counts the number of users in the database.
    :param db: The sqlalchemy database session.
    :param role: Filter by role (exact). If None, filter does not apply.
    :param first_name: Filter by first name (contains). If None, filter does not apply.
    :param last_name: Filter by last name (contains). If None, filter does not apply.
    :param email: Filter by email address (contains). If None, filter does not apply.
    :return: Count by query.
    """
    res = db.query(User)
    if role:
        res = res.filter(User.role == role)
    if first_name:
        res = res.filter(User.first_name.ilike(f"%{first_name}%"))
    if last_name:
        res = res.filter(User.last_name.ilike(f"%{last_name}%"))
    if email:
        res = res.filter(User.email.ilike(f"%{email}%"))
    return res.count()


def create_user(db: Session, user: UserCreate, role: RoleEnum, ignore_activation: bool = False) -> User:
    """
    Creates a user in the database.
    :param db: The sqlalchemy database session.
    :param user: User object to create.
    :param role: The role of the new user.
    :param ignore_activation: Whether or not to ignore sending activation e-mail. Default is False.
    :return: The user.
    """
    db_user = User(**user.dict(), role=role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    if not ignore_activation:
        # Send activation email
        token = create_jwt_for_account_activation(user.email)
        send_activation_email(db_user, token)

    return db_user


def update_user(db: Session, user_id: int, user: UserUpdate) -> User:
    """
    Updates a user in the database.
    :param db: The sqlalchemy database session.
    :param user_id: Id of user to update.
    :param user: User object to update with.
    :return: The user.
    """
    db_user = retrieve_user(db, user_id)
    db_user.email = user.email
    db_user.first_name = user.first_name
    db_user.last_name = user.last_name
    db_user.is_active = user.is_active
    db.commit()
    return db_user


def set_password(db: Session, db_user: User, password: str, ignore_notification: bool = False):
    """
    Returns the user upon setting a password for a User.
    :param db: The sqlalchemy database session.
    :param db_user: The user.
    :param password: The password being set for user.
    :param ignore_notification: Whether or not to ignore send a notification email of password reset. Defaults to false.
    :return: The user.
    """
    db_user.hashed_password = bcrypt.hash(password)
    db.commit()
    db.refresh(db_user)
    if not ignore_notification:
        send_password_reset_notification_email(db_user)
    return db_user


def activate_user(db: Session, db_user: User, password: str, ignore_notification: bool = False):
    """
    Returns the user upon activating the user.
    :param db: The sqlalchemy database session.
    :param db_user: The user.
    :param password: The password being set for user.
    :param ignore_notification: Whether or not to ignore send a notification email of password reset. Defaults to false.
    :return: The user.
    """
    db_user.is_active = True
    db_user.is_activated = True
    set_password(db, db_user, password, ignore_notification)
