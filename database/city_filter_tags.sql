-- Optional: add explicit location choices to Admin > hotel amenities.
-- Does not assign locations to any hotel or overwrite existing data.
INSERT INTO amenities(code,label,icon) VALUES
('location_center','Gần trung tâm / chợ','location_city'),
('location_forest','Ven rừng / gần Hồ Tuyền Lâm','forest'),
('location_beach','Gần biển / bãi biển','beach_access')
ON DUPLICATE KEY UPDATE code=VALUES(code);
