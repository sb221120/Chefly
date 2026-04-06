#!/usr/bin/env python3
"""
CHEFLY API Backend Testing Suite
Tests all core backend endpoints for the AI sommelier application
"""

import requests
import json
import uuid
from datetime import datetime
import sys
import os

# Backend URL from environment
BACKEND_URL = "https://chefly-fixes.preview.emergentagent.com/api"

class CHEFLYAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_user_id = None
        self.chat_user_id = None  # For chat-specific user
        self.test_session_id = None
        self.results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }
    
    def log_result(self, test_name, success, message="", response_data=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if message:
            print(f"   {message}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        
        if success:
            self.results["passed"] += 1
        else:
            self.results["failed"] += 1
            self.results["errors"].append(f"{test_name}: {message}")
        print()
    
    def test_health_check(self):
        """Test GET /api/health endpoint"""
        print("🔍 Testing Health Check Endpoint...")
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "status" in data and data["status"] == "healthy":
                    self.log_result("Health Check", True, f"Status: {data['status']}")
                    return True
                else:
                    self.log_result("Health Check", False, f"Invalid response format: {data}")
                    return False
            else:
                self.log_result("Health Check", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Health Check", False, f"Request failed: {str(e)}")
            return False
    
    def test_create_user(self):
        """Test POST /api/users endpoint"""
        print("🔍 Testing User Creation Endpoint...")
        try:
            # Generate unique device ID for testing
            device_id = f"test_device_{uuid.uuid4().hex[:8]}"
            
            user_data = {
                "device_id": device_id,
                "preferred_language": "UK",
                "preferred_currency": "UAH",
                "budget_limit": 1000
            }
            
            response = requests.post(
                f"{self.base_url}/users",
                json=user_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "device_id", "preferred_language", "preferred_currency", "budget_limit"]
                
                if all(field in data for field in required_fields):
                    self.test_user_id = data["id"]  # Store for later tests
                    self.log_result("User Creation", True, f"Created user ID: {self.test_user_id}")
                    return True
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_result("User Creation", False, f"Missing fields: {missing}", data)
                    return False
            else:
                self.log_result("User Creation", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("User Creation", False, f"Request failed: {str(e)}")
            return False
    
    def test_get_user(self):
        """Test GET /api/users/{user_id} endpoint"""
        print("🔍 Testing Get User Endpoint...")
        
        if not self.test_user_id:
            self.log_result("Get User", False, "No test user ID available (user creation failed)")
            return False
        
        try:
            response = requests.get(f"{self.base_url}/users/{self.test_user_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "device_id", "preferred_language", "preferred_currency", "budget_limit"]
                
                if all(field in data for field in required_fields):
                    if data["id"] == self.test_user_id:
                        self.log_result("Get User", True, f"Retrieved user: {data['device_id']}")
                        return True
                    else:
                        self.log_result("Get User", False, f"User ID mismatch: expected {self.test_user_id}, got {data['id']}")
                        return False
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_result("Get User", False, f"Missing fields: {missing}", data)
                    return False
            elif response.status_code == 404:
                self.log_result("Get User", False, "User not found (404)")
                return False
            else:
                self.log_result("Get User", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Get User", False, f"Request failed: {str(e)}")
            return False
    
    def test_update_user(self):
        """Test PUT /api/users/{user_id} endpoint"""
        print("🔍 Testing Update User Endpoint...")
        
        if not self.test_user_id:
            self.log_result("Update User", False, "No test user ID available (user creation failed)")
            return False
        
        try:
            update_data = {
                "preferred_language": "EN",
                "budget_limit": 1500
            }
            
            response = requests.put(
                f"{self.base_url}/users/{self.test_user_id}",
                json=update_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("preferred_language") == "EN" and data.get("budget_limit") == 1500:
                    self.log_result("Update User", True, f"Updated preferences: language={data['preferred_language']}, budget={data['budget_limit']}")
                    return True
                else:
                    self.log_result("Update User", False, f"Update not reflected in response: {data}")
                    return False
            elif response.status_code == 404:
                self.log_result("Update User", False, "User not found (404)")
                return False
            else:
                self.log_result("Update User", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Update User", False, f"Request failed: {str(e)}")
            return False
    
    def test_chat_with_ai(self):
        """Test POST /api/chat endpoint with Ukrainian sommelier"""
        print("🔍 Testing AI Chat Endpoint...")
        
        # Create a fresh user with Ukrainian language for this test
        # (since the main test user was updated to English in the update test)
        try:
            device_id = f"chat_test_device_{uuid.uuid4().hex[:8]}"
            user_data = {
                "device_id": device_id,
                "preferred_language": "UK",
                "preferred_currency": "UAH",
                "budget_limit": 1000
            }
            
            user_response = requests.post(
                f"{self.base_url}/users",
                json=user_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if user_response.status_code != 200:
                self.log_result("AI Chat", False, f"Failed to create test user: {user_response.status_code}")
                return False
            
            self.chat_user_id = user_response.json()["id"]  # Store for session test
            
            chat_data = {
                "user_id": self.chat_user_id,
                "message": "Що підібрати до сиру?"
            }
            
            response = requests.post(
                f"{self.base_url}/chat",
                json=chat_data,
                headers={"Content-Type": "application/json"},
                timeout=30  # Longer timeout for AI response
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["session_id", "response", "timestamp"]
                
                if all(field in data for field in required_fields):
                    self.test_session_id = data["session_id"]  # Store for session tests
                    response_text = data["response"]
                    
                    # Check if response is meaningful (not empty and contains Ukrainian text)
                    if len(response_text) > 10 and any(char in response_text for char in "абвгдеєжзийклмнопрстуфхцчшщьюя"):
                        self.log_result("AI Chat", True, f"AI responded in Ukrainian (length: {len(response_text)} chars)")
                        print(f"   Sample response: {response_text[:100]}...")
                        return True
                    else:
                        self.log_result("AI Chat", False, f"Response seems invalid or not in Ukrainian: {response_text[:100]}")
                        return False
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_result("AI Chat", False, f"Missing fields: {missing}", data)
                    return False
            else:
                self.log_result("AI Chat", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("AI Chat", False, f"Request failed: {str(e)}")
            return False
    
    def test_get_chat_sessions(self):
        """Test GET /api/chat/sessions/{user_id} endpoint"""
        print("🔍 Testing Get Chat Sessions Endpoint...")
        
        # Use the chat user ID if available, otherwise fall back to main test user
        user_id_to_test = getattr(self, 'chat_user_id', self.test_user_id)
        
        if not user_id_to_test:
            self.log_result("Get Chat Sessions", False, "No test user ID available")
            return False
        
        try:
            response = requests.get(f"{self.base_url}/chat/sessions/{user_id_to_test}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    if len(data) > 0:
                        # Check if we have the session from the chat test
                        session_found = any(s.get("id") == self.test_session_id for s in data) if self.test_session_id else True
                        
                        if session_found:
                            self.log_result("Get Chat Sessions", True, f"Found {len(data)} session(s)")
                            return True
                        else:
                            self.log_result("Get Chat Sessions", False, f"Expected session {self.test_session_id} not found in {len(data)} sessions")
                            return False
                    else:
                        # Empty list is valid if no chat was made
                        if not self.test_session_id:
                            self.log_result("Get Chat Sessions", True, "No sessions found (expected if chat failed)")
                            return True
                        else:
                            self.log_result("Get Chat Sessions", False, "No sessions found but chat was made")
                            return False
                else:
                    self.log_result("Get Chat Sessions", False, f"Expected list, got: {type(data)}", data)
                    return False
            else:
                self.log_result("Get Chat Sessions", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Get Chat Sessions", False, f"Request failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests in sequence"""
        print("🚀 Starting CHEFLY API Backend Tests")
        print(f"🌐 Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Test in logical order
        tests = [
            self.test_health_check,
            self.test_create_user,
            self.test_get_user,
            self.test_update_user,
            self.test_chat_with_ai,
            self.test_get_chat_sessions
        ]
        
        for test in tests:
            test()
        
        # Summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        print(f"📈 Success Rate: {(self.results['passed'] / (self.results['passed'] + self.results['failed']) * 100):.1f}%")
        
        if self.results['errors']:
            print("\n🚨 FAILED TESTS:")
            for error in self.results['errors']:
                print(f"   • {error}")
        
        return self.results['failed'] == 0

if __name__ == "__main__":
    tester = CHEFLYAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)