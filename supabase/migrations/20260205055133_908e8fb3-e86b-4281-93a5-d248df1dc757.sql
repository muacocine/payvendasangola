-- Drop the old check constraint and add updated one with bonus type
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check CHECK (type = ANY (ARRAY['deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'bonus', 'pdf_purchase', 'wallet_activation', 'trading_win', 'trading_loss', 'referral_commission']));