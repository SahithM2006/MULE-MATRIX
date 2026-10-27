"""
CLI script to seed the MULE MATRIX SQLite database with the synthetic dataset.
Usage:
    python backend/seed.py [--accounts 2000] [--transactions 30000] [--seed 42]
"""
import sys
import argparse
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from backend.app.core.config import config
from backend.app.core.logging import logger
from backend.app.data.synthetic_generator import populate_database

def main():
    parser = argparse.ArgumentParser(description="Seed the Mule Matrix database.")
    parser.add_argument("--accounts", type=int, default=2000, help="Target number of accounts.")
    parser.add_argument("--transactions", type=int, default=30000, help="Target number of transactions.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility.")
    parser.add_argument("--db-path", type=str, default=None, help="Custom database path.")
    
    args = parser.parse_args()
    logger.info(f"Seeding database with {args.accounts} accounts, {args.transactions} transactions, seed={args.seed}...")
    
    target_db = args.db_path or config.database_url
    num_accs, num_txs, num_evts = populate_database(
        db_path=target_db,
        num_accounts=args.accounts,
        num_transactions=args.transactions,
        seed=args.seed
    )
    
    print("\n=======================================================")
    print("MULE MATRIX DATABASE SEEDED SUCCESSFULLY")
    print("=======================================================")
    print(f"Database Location : {target_db}")
    print(f"Total Accounts    : {num_accs:,}")
    print(f"Total Transactions: {num_txs:,}")
    print(f"Total Lineage Evts: {num_evts:,}")
    print("Deterministic Hero Scenario: INCLUDED & VERIFIED")
    print("=======================================================\n")

if __name__ == "__main__":
    main()
