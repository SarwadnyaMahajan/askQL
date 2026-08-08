"""Automated multi-tenant test script for authentication, CSV datasets, and history retrieval."""

import requests

BASE_URL = "http://127.0.0.1:8000/api"

def run_test():
    print("[1] Registering User C with name 'Alice Analyst'...")
    import uuid
    email_c = f"user_c_{uuid.uuid4().hex[:6]}@company.com"
    reg_c = requests.post(f"{BASE_URL}/auth/register", json={"email": email_c, "password": "password123", "name": "Alice Analyst"})
    assert reg_c.status_code == 201, f"User C registration failed: {reg_c.text}"
    user_c_data = reg_c.json()
    assert user_c_data.get("name") == "Alice Analyst", f"Expected name 'Alice Analyst', got {user_c_data.get('name')}"

    print("[2] Logging in User C...")
    login_c = requests.post(f"{BASE_URL}/auth/login", data={"username": email_c, "password": "password123"})
    token_c = login_c.json()["access_token"]
    headers_c = {"Authorization": f"Bearer {token_c}"}

    me_c = requests.get(f"{BASE_URL}/auth/me", headers=headers_c).json()
    assert me_c.get("name") == "Alice Analyst", f"Expected /auth/me to return name 'Alice Analyst', got {me_c.get('name')}"
    print(f"   Successfully verified /auth/me returned name: '{me_c.get('name')}'")

    print("[3] Registering User A (userA@company.com)...")
    reg_a = requests.post(f"{BASE_URL}/auth/register", json={"email": "userA@company.com", "password": "password123", "name": "User A"})
    if reg_a.status_code not in (201, 400): # 400 if already registered
        print("User A registration error:", reg_a.text)
    
    print("[4] Logging in User A...")
    login_a = requests.post(f"{BASE_URL}/auth/login", data={"username": "userA@company.com", "password": "password123"})
    token_a = login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    print("[5] Registering User B (userB@company.com)...")
    reg_b = requests.post(f"{BASE_URL}/auth/register", json={"email": "userB@company.com", "password": "password123", "name": "User B"})
    if reg_b.status_code not in (201, 400):
        print("User B registration error:", reg_b.text)
    
    print("[6] Logging in User B...")
    login_b = requests.post(f"{BASE_URL}/auth/login", data={"username": "userB@company.com", "password": "password123"})
    token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}


    # Upload file for User A
    print("[5] Uploading sample_sales_A.csv for User A...")
    csv_a_content = "order_id,region,revenue\nORD-001,North,500\nORD-002,South,750\n"
    files_a = {"files": ("sample_sales_A.csv", csv_a_content, "text/csv")}
    upload_a = requests.post(f"{BASE_URL}/upload", files=files_a, headers=headers_a)
    print("   Upload status:", upload_a.status_code, upload_a.text)
    session_a = upload_a.json()["session_id"]
    print(f"   User A session created: {session_a}")


    # Upload file for User B
    print("[6] Uploading sample_sales_B.csv for User B...")
    csv_b_content = "product,cost,quantity\nLaptop,300,10\nMonitor,150,5\n"
    files_b = {"files": ("sample_sales_B.csv", csv_b_content, "text/csv")}
    upload_b = requests.post(f"{BASE_URL}/upload", files=files_b, headers=headers_b)
    session_b = upload_b.json()["session_id"]
    print(f"   User B session created: {session_b}")

    # Fetch sessions for User A
    print("[7] Fetching sessions for User A...")
    sess_a_res = requests.get(f"{BASE_URL}/sessions", headers=headers_a).json()
    files_user_a = [s["files"][0]["filename"] for s in sess_a_res]
    print(f"   User A sessions datasets: {files_user_a}")

    # Fetch sessions for User B
    print("[8] Fetching sessions for User B...")
    sess_b_res = requests.get(f"{BASE_URL}/sessions", headers=headers_b).json()
    files_user_b = [s["files"][0]["filename"] for s in sess_b_res]
    print(f"   User B sessions datasets: {files_user_b}")

    # Verify isolation
    assert "sample_sales_A.csv" in files_user_a, "User A should see sample_sales_A.csv"
    assert "sample_sales_B.csv" not in files_user_a, "User A should NOT see sample_sales_B.csv"
    assert "sample_sales_B.csv" in files_user_b, "User B should see sample_sales_B.csv"
    assert "sample_sales_A.csv" not in files_user_b, "User B should NOT see sample_sales_A.csv"

    print("\n[SUCCESS] MULTI-TENANT ACCOUNT DATASET & HISTORY ISOLATION TEST PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    run_test()
