#!/usr/bin/env python3
"""
Simple test script for the Habit Tracker API
"""

import requests
import json
import time

BASE_URL = "http://localhost:5000"

def test_api():
    print("🧪 Testing Habit Tracker API...")
    
    # Test 1: Get initial habits (should be empty)
    print("\n1. Testing GET /api/habits (initial state)")
    response = requests.get(f"{BASE_URL}/api/habits")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Test 2: Create a new habit
    print("\n2. Testing POST /api/habits (create habit)")
    habit_data = {
        "name": "Morning Exercise",
        "description": "30 minutes of cardio workout",
        "category": "Health",
        "target_frequency": 1,
        "frequency_type": "daily"
    }
    response = requests.post(f"{BASE_URL}/api/habits", json=habit_data)
    print(f"Status: {response.status_code}")
    habit = response.json()
    print(f"Created habit: {habit}")
    habit_id = habit['id']
    
    # Test 3: Get habits after creation
    print("\n3. Testing GET /api/habits (after creation)")
    response = requests.get(f"{BASE_URL}/api/habits")
    print(f"Status: {response.status_code}")
    print(f"Habits: {response.json()}")
    
    # Test 4: Complete the habit
    print("\n4. Testing POST /api/habits/{id}/complete")
    response = requests.post(f"{BASE_URL}/api/habits/{habit_id}/complete", json={"notes": "Great workout!"})
    print(f"Status: {response.status_code}")
    print(f"Completion: {response.json()}")
    
    # Test 5: Get habit completions
    print("\n5. Testing GET /api/habits/{id}/completions")
    response = requests.get(f"{BASE_URL}/api/habits/{habit_id}/completions")
    print(f"Status: {response.status_code}")
    print(f"Completions: {response.json()}")
    
    # Test 6: Get stats
    print("\n6. Testing GET /api/stats")
    response = requests.get(f"{BASE_URL}/api/stats")
    print(f"Status: {response.status_code}")
    print(f"Stats: {response.json()}")
    
    # Test 7: Update habit
    print("\n7. Testing PUT /api/habits/{id}")
    update_data = {
        "name": "Morning Exercise (Updated)",
        "description": "45 minutes of cardio and strength training",
        "category": "Health & Fitness",
        "target_frequency": 1,
        "frequency_type": "daily"
    }
    response = requests.put(f"{BASE_URL}/api/habits/{habit_id}", json=update_data)
    print(f"Status: {response.status_code}")
    print(f"Updated habit: {response.json()}")
    
    # Test 8: Soft delete habit
    print("\n8. Testing DELETE /api/habits/{id}")
    response = requests.delete(f"{BASE_URL}/api/habits/{habit_id}")
    print(f"Status: {response.status_code}")
    print(f"Delete response: {response.json()}")
    
    # Test 9: Verify habit is soft deleted
    print("\n9. Testing GET /api/habits (after deletion)")
    response = requests.get(f"{BASE_URL}/api/habits")
    print(f"Status: {response.status_code}")
    print(f"Active habits: {response.json()}")
    
    print("\n✅ API tests completed successfully!")

if __name__ == "__main__":
    try:
        test_api()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to the Flask server.")
        print("Make sure the application is running with: python app.py")
    except Exception as e:
        print(f"❌ Error during testing: {e}")