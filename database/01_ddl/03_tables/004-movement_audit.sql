CREATE TABLE movement_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    movement_id INT NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_by INT NOT NULL,
    old_amount DECIMAL(12,2) NULL,
    new_amount DECIMAL(12,2) NULL,
    old_note VARCHAR(500) NULL,
    new_note VARCHAR(500) NULL,
    action ENUM('create', 'update', 'delete') NOT NULL
);