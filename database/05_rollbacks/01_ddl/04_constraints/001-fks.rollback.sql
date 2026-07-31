ALTER TABLE movement_audit
    DROP FOREIGN KEY fk_movement_audit_user,
    DROP FOREIGN KEY fk_movement_audit_movement;

ALTER TABLE movements
    DROP FOREIGN KEY fk_movements_category,
    DROP FOREIGN KEY fk_movements_user;