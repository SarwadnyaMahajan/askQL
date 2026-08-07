"""Automated evaluation script for the LangGraph pipeline."""

import json
import asyncio
import time
import os
import uuid
import pandas as pd
from typing import Any

from google import genai
from pydantic import BaseModel

from app.agents.graph import run_pipeline
from app.services.duckdb_service import duckdb_service
from app.config import settings


class EvalResult(BaseModel):
    question: str
    pass_status: bool
    latency_sec: float
    error: str | None = None
    generated_sql: str | None = None


async def run_evaluation():
    print("Starting evaluation pipeline...")
    
    # 1. Load test set
    with open("eval/test_set.json", "r") as f:
        test_data = json.load(f)
        
    # 2. Setup mock data
    session_id = str(uuid.uuid4())
    df = pd.read_csv("data/sample_sales.csv")
    duckdb_service.load_dataframe(session_id, "data", df)
    print(f"Loaded {len(df)} rows into session {session_id}")
    
    results: list[EvalResult] = []
    
    for item in test_data:
        question = item["question"]
        print(f"\nEvaluating: {question}")
        start_time = time.time()
        
        try:
            state = await run_pipeline(session_id, question)
            latency = time.time() - start_time
            
            error = state.get("error")
            sql = state.get("sql")
            narration = state.get("narration", "")
            
            if error:
                print(f"  ❌ Failed with error: {error}")
                results.append(EvalResult(question=question, pass_status=False, latency_sec=latency, error=error))
                continue
                
            # Perform LLM-as-a-judge scoring
            client = genai.Client(api_key=settings.gemini_api_key)
            prompt = f"""
            Evaluate the following AI assistant output against the expected answer.
            Question: {question}
            Expected Output/Concept: {item['expected_answer']}
            Actual Assistant Output: {narration}
            Actual SQL Used: {sql}
            
            Return 'PASS' if the assistant output is logically correct and addresses the expected output.
            Return 'FAIL' otherwise.
            """
            
            from app.services.llm_service import generate_llm
            judge_decision = generate_llm(
                client=client,
                contents=prompt,
            ).strip().upper()
            pass_status = "PASS" in judge_decision
            
            print(f"  {'✅ PASS' if pass_status else '❌ FAIL'} (Latency: {latency:.2f}s)")
            results.append(EvalResult(
                question=question, 
                pass_status=pass_status, 
                latency_sec=latency, 
                generated_sql=sql
            ))
            
        except Exception as e:
            print(f"  ❌ Exception: {e}")
            results.append(EvalResult(
                question=question, 
                pass_status=False, 
                latency_sec=time.time() - start_time, 
                error=str(e)
            ))
            
    # Cleanup
    duckdb_service.cleanup_expired()
    
    # Save report
    report = {
        "total_tests": len(results),
        "passed": sum(1 for r in results if r.pass_status),
        "avg_latency_sec": sum(r.latency_sec for r in results) / len(results) if results else 0,
        "results": [r.model_dump() for r in results]
    }
    
    with open("eval/eval_report.json", "w") as f:
        json.dump(report, f, indent=2)
        
    print(f"\nEvaluation complete! Report saved to eval/eval_report.json")
    print(f"Pass Rate: {report['passed']}/{report['total_tests']} ({(report['passed']/report['total_tests'])*100:.1f}%)")


if __name__ == "__main__":
    asyncio.run(run_evaluation())
