"""
Unit tests for Section 10: Evaluation & Benchmarking.
"""
import pytest
import tempfile
import os
import json
from backend.app.data.synthetic_generator import populate_database
from backend.app.evaluation.benchmark import run_benchmark_evaluation, BENCHMARK_FILE

def test_benchmark_evaluation_execution():
    """Verify benchmark evaluation runs on synthetic data and produces valid comparison metrics."""
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    try:
        # Populate small test database
        populate_database(db_path=path, num_accounts=120, num_transactions=600, seed=42)

        results = run_benchmark_evaluation(db_path=path)
        
        assert results["benchmark_name"] == "SYNTHETIC BENCHMARK"
        assert results["status"] == "COMPLETED"
        assert "rules_only_baseline" in results
        assert "combined_pipeline" in results

        # Verify metrics fields
        for key in ["rules_only_baseline", "combined_pipeline"]:
            m = results[key]
            assert "precision" in m
            assert "recall" in m
            assert "f1_score" in m
            assert "false_positive_rate" in m
            assert "true_positives" in m
            assert "false_positives" in m
            assert "dataset_time_latency_sec" in m
            assert "processing_execution_latency_ms" in m

        # Verify file artifact was written
        assert BENCHMARK_FILE.exists()
        with open(BENCHMARK_FILE, "r", encoding="utf-8") as f:
            file_data = json.load(f)
            assert file_data["benchmark_name"] == "SYNTHETIC BENCHMARK"
    finally:
        if os.path.exists(path):
            try:
                os.remove(path)
            except PermissionError:
                pass
