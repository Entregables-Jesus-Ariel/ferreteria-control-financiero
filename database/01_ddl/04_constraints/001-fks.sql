ALTER TABLE movements
    ADD CONSTRAINT fk_movements_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    ADD CONSTRAINT fk_movements_category
        FOREIGN KEY (category_id) REFERENCES categories(id);

ALTER TABLE movement_audit
    ADD CONSTRAINT fk_movement_audit_movement
        FOREIGN KEY (movement_id) REFERENCES movements(id),
    ADD CONSTRAINT fk_movement_audit_user
        FOREIGN KEY (changed_by) REFERENCES users(id);