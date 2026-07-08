from sqlalchemy.orm import Session
from app.models.alert import Alert

def get_all_alerts(db: Session):
    return db.query(Alert).all()

def resolve_alert(db: Session, alert_id: int):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    alert.is_resolved = True
    db.commit()
    db.refresh(alert)
    return alert
