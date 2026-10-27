import os
import sys
from pathlib import Path

# Fix Windows OpenMP duplicate runtime abort
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# Add repository root to sys.path so 'backend' is importable
repo_root = str(Path(__file__).resolve().parent.parent.parent)
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)
