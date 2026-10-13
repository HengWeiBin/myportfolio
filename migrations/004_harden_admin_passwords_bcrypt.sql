-- Migration 004: Harden Admin Passwords with Bcrypt

ALTER TABLE admins 
ALTER COLUMN password TYPE VARCHAR(255);
